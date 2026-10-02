import { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { useAmbientBackground } from '../src/hooks/useAmbientBackground';
import { useNotificationStore } from '../src/store/notificationStore';
import { useTheme, type Theme } from '../src/theme/ThemeProvider';
import type { AppNotification, NotificationType } from '../src/types/notification';
import { formatRelativeTime } from '../src/utils/relativeTime';

function dotColor(theme: Theme, type: NotificationType): string {
  switch (type) {
    case 'like':
      return theme.colors.accentPink;
    case 'follow':
      return theme.colors.accentSecondary;
    case 'comment':
      return theme.colors.accentPrimary;
    case 'collaboration_request':
      return theme.colors.accentCoral;
  }
}

export default function NotificationsScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Sin imagen relevante (lista de texto) — fondo ambiental de escritorio
  // cae al color sólido del theme.
  useAmbientBackground(null);

  const notifications = useNotificationStore((state) => state.notifications);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const load = useNotificationStore((state) => state.load);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: AppNotification }): React.JSX.Element => (
    <Pressable
      style={[styles.row, !item.is_read && styles.rowUnread]}
      onPress={() => !item.is_read && markRead(item.id)}
    >
      <View style={[styles.dot, { backgroundColor: dotColor(theme, item.type) }]} />
      <View style={styles.rowContent}>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
      </View>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notificaciones',
          headerBackTitle: 'Atrás',
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={() => markAllRead()} hitSlop={8}>
                <Text style={styles.headerAction}>Marcar todas</Text>
              </Pressable>
            ) : null,
        }}
      />

      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accentPrimary} />
        </View>
      ) : (
        <FlatList
          style={styles.flex}
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Todavía no tenés notificaciones.</Text>}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    emptyContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    rowUnread: {
      backgroundColor: colors.surfaceElevated,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    rowContent: {
      flex: 1,
      gap: 4,
    },
    message: {
      ...typography.body,
      color: colors.textPrimary,
    },
    time: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 20,
    },
    headerAction: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.accentPrimary,
    },
  });
}
