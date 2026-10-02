import type { AuthGateOrigin } from '../store/authModalStore';
import { useAuthModalStore } from '../store/authModalStore';
import { useAuthStore } from '../store/authStore';

/**
 * Envuelve cualquier acción que requiera sesión (like, save, follow,
 * comentar, etc.). Si ya hay sesión, ejecuta la acción de inmediato. Si no,
 * abre el gate de login (revelado circular) y, si el usuario se loguea con
 * éxito, reintenta la acción automáticamente sin que tenga que repetirla.
 *
 * `origin` es el punto de pantalla (coordenadas absolutas, típicamente
 * `event.nativeEvent.pageX/pageY` del Pressable que disparó la acción) desde
 * donde crece el círculo — opcional: si no se pasa, el gate cae al centro.
 */
export function useRequireAuth(): (action: () => void, origin?: AuthGateOrigin) => void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openAuthModal = useAuthModalStore((state) => state.open);

  return (action: () => void, origin?: AuthGateOrigin): void => {
    if (isAuthenticated) {
      action();
      return;
    }

    openAuthModal(action, origin);
  };
}
