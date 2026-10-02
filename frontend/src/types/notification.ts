// Mismos valores que el campo `type` del modelo Notification del backend
// (ver backend/database/factories/NotificationFactory.php) — el módulo 11
// todavía no expone los endpoints reales, pero el contrato de datos ya está
// definido por el modelo/migración existentes.
export type NotificationType = 'like' | 'comment' | 'follow' | 'collaboration_request';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}
