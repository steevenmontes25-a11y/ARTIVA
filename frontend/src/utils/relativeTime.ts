const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Formato relativo simple en español ("hace 5 min", "hace 3 h", "hace 2 d")
 * — no se usa una librería de fechas para esto solo, ya que el proyecto no
 * tiene otra necesidad de manejo de fechas más elaborado todavía.
 */
export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();

  if (diffMs < MINUTE_MS) {
    return 'ahora';
  }

  if (diffMs < HOUR_MS) {
    return `hace ${Math.floor(diffMs / MINUTE_MS)} min`;
  }

  if (diffMs < DAY_MS) {
    return `hace ${Math.floor(diffMs / HOUR_MS)} h`;
  }

  return `hace ${Math.floor(diffMs / DAY_MS)} d`;
}
