import { create } from 'zustand';

export interface AuthGateOrigin {
  x: number;
  y: number;
}

interface AuthModalState {
  isVisible: boolean;
  /** Acción a reintentar automáticamente si el login (no el registro) tiene éxito. */
  pendingAction: (() => void) | null;
  /** Punto de la pantalla (coordenadas absolutas) donde se tocó el elemento
   *  que disparó el gate — el revelado circular crece desde acá. Si no se
   *  pasa uno (p. ej. al abrir desde el menú circular sin un tap puntual),
   *  el componente que lo consume cae al centro de la pantalla. */
  origin: AuthGateOrigin | null;
  /** Abre el modal. `pendingAction` y `origin` son opcionales. */
  open: (pendingAction?: () => void, origin?: AuthGateOrigin) => void;
  /** Cierra el modal sin ejecutar la acción pendiente (el usuario canceló). */
  close: () => void;
  /** Se llama tras un login exitoso: cierra el modal y reintenta la acción que lo disparó, si había una. */
  resolveWithLoginSuccess: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set, get) => ({
  isVisible: false,
  pendingAction: null,
  origin: null,

  open: (pendingAction, origin) =>
    set({ isVisible: true, pendingAction: pendingAction ?? null, origin: origin ?? null }),

  // No limpia `origin` acá a propósito: la animación de cierre (revelado en
  // reversa) necesita saber a qué punto volver mientras isVisible ya pasó a
  // false — queda "stale" hasta el próximo open(), que siempre lo pisa.
  close: () => set({ isVisible: false, pendingAction: null }),

  resolveWithLoginSuccess: () => {
    const { pendingAction } = get();
    set({ isVisible: false, pendingAction: null });
    pendingAction?.();
  },
}));
