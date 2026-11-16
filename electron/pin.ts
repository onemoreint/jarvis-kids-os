import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { PinStatus, SimpleResult, VerifyResult } from './ipc-contract';
import { readJson, writeJson } from './store';

// PIN parental: nunca se guarda en claro. Se deriva con scrypt (sal aleatoria
// de 16 bytes) y se compara en tiempo constante. Archivo: pin.json.
// Borrar pin.json (con la cuenta adulta) restablece el PIN; ver RECUPERACION.md.

const FILE = 'pin.json';
const PIN_PATTERN = /^\d{4,6}$/;
const PARAMS = { N: 32768, r: 8, p: 1, keylen: 32 } as const;
const MAX_ATTEMPTS = 5;
const SESSION_MS = 10 * 60 * 1000; // el panel se bloquea tras 10 min sin uso

interface PinRecord {
  v: 1;
  salt: string;
  hash: string;
  N: number;
  r: number;
  p: number;
  keylen: number;
}

let failures = 0;
let lockedUntil = 0;
let unlockedUntil = 0;

function derive(pin: string, salt: Buffer, rec: Pick<PinRecord, 'N' | 'r' | 'p' | 'keylen'>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(pin, salt, rec.keylen, { N: rec.N, r: rec.r, p: rec.p, maxmem: 128 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

function getRecord(): PinRecord | null {
  const rec = readJson<PinRecord | null>(FILE, null);
  if (!rec || rec.v !== 1 || typeof rec.salt !== 'string' || typeof rec.hash !== 'string') return null;
  return rec;
}

async function writeRecord(pin: string): Promise<void> {
  const salt = randomBytes(16);
  const hash = await derive(pin, salt, PARAMS);
  const rec: PinRecord = { v: 1, salt: salt.toString('base64'), hash: hash.toString('base64'), ...PARAMS };
  writeJson(FILE, rec);
}

async function matches(pin: string): Promise<boolean> {
  const rec = getRecord();
  if (!rec || !PIN_PATTERN.test(pin)) return false;
  const expected = Buffer.from(rec.hash, 'base64');
  const actual = await derive(pin, Buffer.from(rec.salt, 'base64'), rec);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function lockedSeconds(): number {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}

export function status(): PinStatus {
  return { isSet: getRecord() !== null, lockedForSeconds: lockedSeconds() };
}

export async function create(pin: string): Promise<SimpleResult> {
  if (getRecord()) return { ok: false, error: 'Ya existe un PIN.' };
  if (!PIN_PATTERN.test(pin)) return { ok: false, error: 'El PIN debe tener de 4 a 6 números.' };
  await writeRecord(pin);
  unlockedUntil = Date.now() + SESSION_MS;
  return { ok: true };
}

export async function verify(pin: string): Promise<VerifyResult> {
  const wait = lockedSeconds();
  if (wait > 0) return { ok: false, lockedForSeconds: wait, attemptsLeft: 0 };

  if (await matches(pin)) {
    failures = 0;
    unlockedUntil = Date.now() + SESSION_MS;
    return { ok: true };
  }

  failures += 1;
  if (failures >= MAX_ATTEMPTS) {
    // 30 s, 60 s, 120 s… hasta 15 min.
    const penalty = Math.min(30_000 * 2 ** (failures - MAX_ATTEMPTS), 15 * 60_000);
    lockedUntil = Date.now() + penalty;
  }
  return { ok: false, lockedForSeconds: lockedSeconds(), attemptsLeft: Math.max(0, MAX_ATTEMPTS - failures) };
}

export async function change(current: string, next: string): Promise<SimpleResult> {
  if (!PIN_PATTERN.test(next)) return { ok: false, error: 'El PIN nuevo debe tener de 4 a 6 números.' };
  if (!(await matches(current))) return { ok: false, error: 'El PIN actual no es correcto.' };
  await writeRecord(next);
  return { ok: true };
}

export function isUnlocked(): boolean {
  return Date.now() < unlockedUntil;
}

/** Cada acción del panel prolonga la sesión. */
export function touch(): void {
  if (isUnlocked()) unlockedUntil = Date.now() + SESSION_MS;
}

export function lock(): void {
  unlockedUntil = 0;
}
