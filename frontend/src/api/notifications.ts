import type { AppNotification } from '../types/notification';

// TODO(backend módulo 11 — Notifications): todavía no existen
// GET /api/notifications, PUT /api/notifications/{id}/read ni
// PUT /api/notifications/read-all — en el backend, app/Domain/Notifications
// solo tiene el modelo Notification y su migración (tabla `notifications`
// con user_id/type/data/is_read); Controllers/Actions/Resources siguen
// vacíos (.gitkeep). Esta capa simula esos 3 endpoints en memoria con la
// MISMA forma que el modelo real (ver NotificationFactory.php: type ∈
// {like, comment, follow, collaboration_request}, data.message) para que
// conectar el backend real después sea solo reemplazar el cuerpo de estas
// funciones por llamadas a `apiClient` — nada que las consuma (store, UI)
// debería necesitar cambios.
let mockNotifications: AppNotification[] = [
  {
    id: 1,
    type: 'like',
    message: 'A Mariana Ríos le gustó tu publicación.',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'follow',
    message: 'Diego Fuentes empezó a seguirte.',
    is_read: false,
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'comment',
    message: 'Camila Ortiz comentó tu publicación: "Increíble trabajo de luz."',
    is_read: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'collaboration_request',
    message: 'Bruno Salas te invitó a colaborar en "Mural Colectivo".',
    is_read: true,
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  return simulateLatency([...mockNotifications]);
}

export async function markNotificationRead(id: number): Promise<void> {
  mockNotifications = mockNotifications.map((notification) =>
    notification.id === id ? { ...notification, is_read: true } : notification
  );
  return simulateLatency(undefined);
}

export async function markAllNotificationsRead(): Promise<void> {
  mockNotifications = mockNotifications.map((notification) => ({ ...notification, is_read: true }));
  return simulateLatency(undefined);
}
