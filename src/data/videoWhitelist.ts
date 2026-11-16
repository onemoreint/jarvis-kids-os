import type { CategoryId } from './categories';

/**
 * Lista blanca de videos (FASE 2).
 *
 * Solo los videos de esta lista podrán reproducirse mediante la YouTube IFrame
 * API, embebidos desde youtube-nocookie.com, sin búsqueda, sin comentarios y
 * sin enlaces externos. En fases siguientes la lista vivirá en almacenamiento
 * local cifrado y se editará desde el panel de padres (protegido por PIN).
 */
export interface ApprovedVideo {
  /** ID interno estable. */
  id: string;
  /** ID de YouTube de 11 caracteres (validar con /^[A-Za-z0-9_-]{11}$/). */
  youtubeId: string;
  title: string;
  category: CategoryId;
  minAge: 3 | 4 | 5 | 6;
  /** Fecha ISO en la que un adulto aprobó el video. */
  approvedAt: string;
}

export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// Vacía a propósito en la fase 1: ningún video se añade sin revisión adulta.
export const APPROVED_VIDEOS: readonly ApprovedVideo[] = [];
