import { useState } from 'react';
import type { AddResult, ContentItem } from '../../electron/ipc-contract';
import { CATEGORIES, type CategoryId } from '../data/categories';

interface Props {
  items: ContentItem[];
  onChanged: () => Promise<void>;
  /** La sesión de padres caducó: volver a pedir el PIN. */
  onSessionExpired: () => void;
  onClose: () => void;
}

const isLocked = (e: unknown) => String(e).includes('LOCKED');

export function ParentPanel({ items, onChanged, onSessionExpired, onClose }: Props) {
  const [category, setCategory] = useState<CategoryId>('matematicas');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<AddResult | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const api = window.jarvis;

  async function run<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(label);
    try {
      return await fn();
    } catch (e) {
      if (isLocked(e)) onSessionExpired();
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  const add = async () => {
    if (!api || !text.trim()) return;
    const res = await run('add', () => api.addContent(text, category));
    if (res) {
      setResult(res);
      if (res.added.length) setText('');
      await onChanged();
    }
  };

  const addStarter = async () => {
    if (!api) return;
    const res = await run('starter', () => api.addStarterPack());
    if (res) {
      setResult(res);
      await onChanged();
    }
  };

  const remove = async (id: string) => {
    if (!api) return;
    await run('remove', () => api.removeContent(id));
    await onChanged();
  };

  const move = async (id: string, to: CategoryId) => {
    if (!api) return;
    await run('move', () => api.moveContent(id, to));
    await onChanged();
  };

  const quit = async () => {
    if (!api) return;
    await run('quit', () => api.quitApp());
  };

  return (
    <main className="flex h-full flex-col bg-[#0b1026]">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-10 py-5">
        <div className="flex items-center gap-3">
          <span className="emoji text-4xl">⚙️</span>
          <h1 className="text-3xl font-black">Panel de padres</h1>
        </div>
        <div className="flex gap-3">
          {confirmQuit ? (
            <>
              <span className="self-center font-semibold text-white/70">¿Salir y cerrar la app?</span>
              <PanelButton tone="danger" onClick={quit} disabled={busy !== null}>
                Sí, cerrar
              </PanelButton>
              <PanelButton onClick={() => setConfirmQuit(false)}>No</PanelButton>
            </>
          ) : (
            <PanelButton tone="ghost" onClick={() => setConfirmQuit(true)}>
              ⏻ Salir de la app y finalizar
            </PanelButton>
          )}
          <PanelButton tone="primary" onClick={onClose}>
            ✓ Listo, volver a JARVIS
          </PanelButton>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-8 overflow-hidden px-10 py-6">
        {/* Columna izquierda: añadir */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          <Card title="Añadir videos">
            <p className="text-sm text-white/60">Pega uno o varios enlaces (uno por línea). Se aceptan:</p>
            <ul className="-mt-1 list-disc pl-5 text-sm text-white/60">
              <li>
                Videos de <b>YouTube</b> o <b>YouTube Kids</b> (Compartir → Copiar enlace)
              </li>
              <li>
                <b>Listas de reproducción</b> (youtube.com/playlist?list=…)
              </li>
              <li>
                <b>Canales completos</b> (youtube.com/@nombre)
              </li>
            </ul>
            <p className="text-xs text-white/40">Todo queda guardado en este equipo, también al actualizar la app.</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={'https://www.youtubekids.com/watch?v=…\nhttps://www.youtube.com/@canal'}
              className="w-full resize-none rounded-xl bg-white/10 p-3 font-mono text-sm ring-1 ring-white/20 outline-none select-text focus:ring-2 focus:ring-cyan-300"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition ${
                    category === c.id ? 'bg-white text-indigo-900 ring-white' : 'bg-white/5 ring-white/20 hover:bg-white/15'
                  }`}
                >
                  <span className="emoji">{c.emoji}</span> {c.name}
                </button>
              ))}
            </div>
            <PanelButton tone="primary" onClick={add} disabled={busy !== null || !text.trim()}>
              {busy === 'add' ? 'Comprobando…' : 'Añadir a ' + CATEGORIES.find((c) => c.id === category)?.name}
            </PanelButton>
          </Card>

          <Card title="Configuración rápida">
            <p className="text-sm text-white/60">
              Añade con un toque una selección de canales educativos en español e inglés para todas las categorías.
              Puedes quitar lo que no te guste.
            </p>
            <PanelButton onClick={addStarter} disabled={busy !== null}>
              {busy === 'starter' ? 'Añadiendo…' : '✨ Añadir paquete sugerido'}
            </PanelButton>
          </Card>

          {result && (
            <Card title="Resultado">
              <p className="font-semibold text-emerald-300">
                {result.added.length} añadido{result.added.length === 1 ? '' : 's'}
              </p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-amber-300">
                  <span className="break-all font-mono text-white/50">{err.input}</span>
                  <br />
                  {err.reason}
                </p>
              ))}
            </Card>
          )}

          <ChangePin onSessionExpired={onSessionExpired} />
        </div>

        {/* Columna derecha: lista */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          <h2 className="text-xl font-black">Videos aprobados ({items.length})</h2>
          {CATEGORIES.map((c) => {
            const list = items.filter((i) => i.category === c.id);
            return (
              <section key={c.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <h3 className="mb-2 font-black">
                  <span className="emoji">{c.emoji}</span> {c.name}{' '}
                  <span className="font-semibold text-white/40">({list.length})</span>
                </h3>
                {list.length === 0 && <p className="text-sm text-white/40">Sin videos.</p>}
                <ul className="flex flex-col gap-2">
                  {list.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="h-12 w-20 shrink-0 rounded-lg bg-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {item.kind === 'playlist' && '📺 '}
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-white/50">{item.author}</p>
                      </div>
                      <select
                        value={item.category}
                        onChange={(e) => move(item.id, e.target.value as CategoryId)}
                        disabled={busy !== null}
                        aria-label={`Mover ${item.title} a otra categoría`}
                        className="rounded-lg bg-white/10 px-2 py-2 text-sm font-semibold ring-1 ring-white/20 outline-none [&>option]:text-black"
                      >
                        {CATEGORIES.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        disabled={busy !== null}
                        aria-label={`Quitar ${item.title}`}
                        className="rounded-lg px-3 py-2 text-sm font-bold text-rose-300 hover:bg-rose-500/20"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function ChangePin({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    try {
      const res = await window.jarvis?.changePin(current, next);
      if (!res) return;
      setMsg(res.ok ? { ok: true, text: 'PIN cambiado.' } : { ok: false, text: res.error ?? 'Error' });
      if (res.ok) {
        setCurrent('');
        setNext('');
      }
    } catch (e) {
      if (isLocked(e)) onSessionExpired();
    }
  };

  const input =
    'w-full rounded-xl bg-white/10 p-3 text-lg tracking-[0.4em] ring-1 ring-white/20 outline-none select-text focus:ring-2 focus:ring-cyan-300';

  return (
    <Card title="Cambiar PIN">
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="Actual"
        value={current}
        onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ''))}
        className={input}
      />
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="Nuevo (4–6)"
        value={next}
        onChange={(e) => setNext(e.target.value.replace(/\D/g, ''))}
        className={input}
      />
      <PanelButton onClick={submit} disabled={current.length < 4 || next.length < 4}>
        Cambiar PIN
      </PanelButton>
      {msg && <p className={msg.ok ? 'text-emerald-300' : 'text-amber-300'}>{msg.text}</p>}
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <h2 className="text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function PanelButton({
  children,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger' | 'ghost';
}) {
  const tones = {
    default: 'bg-white/10 ring-1 ring-white/20 hover:bg-white/20',
    primary: 'bg-cyan-300 text-indigo-950 hover:bg-cyan-200',
    danger: 'bg-rose-500 text-white hover:bg-rose-400',
    ghost: 'text-white/70 ring-1 ring-white/20 hover:bg-white/10',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-5 py-3 font-bold transition active:scale-[0.98] disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
