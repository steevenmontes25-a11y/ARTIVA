import type { ArtistCounts } from '../types/artist';

export type ReputationLevel = 'emergente' | 'artista' | 'destacado' | 'reconocido' | 'referente';

export interface ReputationInfo {
  level: ReputationLevel;
  label: string;
}

/**
 * Heurístico v1 (no hay todavía un sistema de reputación definido en el
 * backend): score = seguidores + posts*2 + colaboraciones*5 — las
 * colaboraciones pesan más a propósito, igual que la fila de stats del
 * perfil. Umbrales elegidos para una plataforma nueva (la mayoría de
 * artistas reales van a caer en Emergente/Artista al principio, eso es
 * esperado, no un bug). Ajustable después sin tocar el resto del perfil.
 */
export function getReputationInfo(counts: ArtistCounts): ReputationInfo {
  const score = counts.followers + counts.posts * 2 + counts.collaborations * 5;

  if (score >= 500) {
    return { level: 'referente', label: 'Referente' };
  }

  if (score >= 200) {
    return { level: 'reconocido', label: 'Reconocido' };
  }

  if (score >= 80) {
    return { level: 'destacado', label: 'Destacado' };
  }

  if (score >= 20) {
    return { level: 'artista', label: 'Artista' };
  }

  return { level: 'emergente', label: 'Emergente' };
}

interface ReputationColors {
  background: string;
  text: string;
}

// Colores fijos por nivel (iguales en modo oscuro/claro, como el chip de
// disciplina) — es una escala propia de "badge de reputación", no derivada
// de los acentos del theme.
const REPUTATION_COLORS: Record<ReputationLevel, ReputationColors> = {
  emergente: { background: '#0F2F27', text: '#5DCAA5' },
  artista: { background: '#042C53', text: '#85B7EB' },
  destacado: { background: '#412402', text: '#FAC775' },
  reconocido: { background: '#4A1B0C', text: '#F5C4B3' },
  referente: { background: '#4B1528', text: '#ED93B1' },
};

/** Colores del badge por nivel de reputación. */
export function getReputationColors(level: ReputationLevel): ReputationColors {
  return REPUTATION_COLORS[level];
}
