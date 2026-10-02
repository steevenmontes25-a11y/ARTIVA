import axios from 'axios';

import type { ApiErrorResponse } from '../types/api';

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // TODO(debug-temporal): quitar este bloque una vez confirmada la conectividad
    // en Android real. Sin esto, un error de red (sin response) y un error real
    // de credenciales caían en el mismo mensaje genérico de abajo, haciendo
    // imposible distinguirlos desde la UI.
    if (!error.response) {
      const baseURL = error.config?.baseURL ?? '(sin baseURL configurada)';

      if (error.code === 'ECONNABORTED') {
        return `[DEBUG] Timeout conectando a ${baseURL}. El servidor no respondió a tiempo.`;
      }

      return `[DEBUG] No se pudo conectar a ${baseURL} (${error.code ?? error.message}). Verifica que el backend esté corriendo y accesible desde la red del celular.`;
    }

    const data = error.response.data as ApiErrorResponse | undefined;
    const firstFieldErrors = data?.errors ? Object.values(data.errors)[0] : undefined;

    if (firstFieldErrors?.[0]) {
      return firstFieldErrors[0];
    }

    if (data?.message) {
      return data.message;
    }

    // TODO(debug-temporal): quitar junto con el bloque de arriba.
    return `[DEBUG] El servidor respondió ${error.response.status} sin mensaje reconocible.`;
  }

  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
