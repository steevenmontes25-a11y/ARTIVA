import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Image } from 'expo-image';
// Import profundo: ver la nota en FeedItem.tsx sobre por qué no se importa
// desde el barrel `lucide-react-native`.
import Send from 'lucide-react-native/icons/send';

import { createComment, fetchComments } from '../../api/comments';
import { extractErrorMessage } from '../../api/errors';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuthStore } from '../../store/authStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import type { Comment } from '../../types/comment';
import { AnimatedPressable } from '../AnimatedPressable';
import { CommentRow } from './CommentRow';

interface CommentsPanelProps {
  postId: number;
  /** Solo carga los comentarios cuando el panel está realmente visible. */
  active: boolean;
  onCommentAdded: () => void;
}

/**
 * Contenido de comentarios embebido inline (sin Modal ni backdrop propios) —
 * pensado para vivir dentro del panel que el feed abre debajo del video al
 * achicarse (ver FeedItem), ocupando el espacio que le da su contenedor
 * (flex) en vez de flotar sobre el contenido.
 */
export function CommentsPanel({ postId, active, onCommentAdded }: CommentsPanelProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requireAuth = useRequireAuth();
  const currentUser = useAuthStore((state) => state.user);
  const canSend = draft.trim().length > 0 && !isSubmitting;

  const loadFirstPage = useCallback((): void => {
    setIsLoading(true);
    setLoadError(null);

    fetchComments(postId, 1)
      .then((result) => {
        setComments(result.comments);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
      })
      .catch((error: unknown) => setLoadError(extractErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [postId]);

  useEffect(() => {
    if (active) {
      loadFirstPage();
    }
  }, [active, loadFirstPage]);

  const loadMore = (): void => {
    if (isLoadingMore || page >= lastPage) {
      return;
    }

    setIsLoadingMore(true);

    fetchComments(postId, page + 1)
      .then((result) => {
        setComments((current) => [...current, ...result.comments]);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
      })
      .catch(() => {
        // Si falla la siguiente página, el usuario sigue viendo lo ya cargado.
      })
      .finally(() => setIsLoadingMore(false));
  };

  const handleSubmit = (event: GestureResponderEvent): void => {
    const content = draft.trim();

    if (content.length === 0 || isSubmitting) {
      return;
    }

    requireAuth(() => {
      setIsSubmitting(true);

      createComment(postId, content, replyTo?.id ?? null)
        .then((newComment) => {
          setDraft('');
          setReplyTo(null);
          onCommentAdded();

          setComments((current) => {
            if (newComment.parent_id === null) {
              return [newComment, ...current];
            }

            return current.map((comment) =>
              comment.id === newComment.parent_id
                ? { ...comment, replies: [...comment.replies, newComment] }
                : comment
            );
          });
        })
        .catch(() => {
          // Dejamos el texto tal cual para que el usuario pueda reintentar.
        })
        .finally(() => setIsSubmitting(false));
    }, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.accentPrimary} />
      ) : loadError ? (
        <Text style={styles.errorText}>{loadError}</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CommentRow comment={item} onReply={(id, username) => setReplyTo({ id, username })} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Text style={styles.emptyText}>Sé el primero en comentar.</Text>}
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator color={theme.colors.accentPrimary} style={styles.footerLoader} /> : null
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {replyTo && (
        <View style={styles.replyBanner}>
          <Text style={styles.replyBannerText}>Respondiendo a @{replyTo.username}</Text>
          <Pressable onPress={() => setReplyTo(null)}>
            <Text style={styles.replyCancel}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      {/* Barra de input fija, separada del listado de arriba con su propio
          fondo + borde superior (no queda "pegada" sin separación). */}
      <View style={styles.inputBar}>
        {currentUser?.avatar_url ? (
          <Image source={{ uri: currentUser.avatar_url }} style={styles.inputAvatar} contentFit="cover" />
        ) : (
          <View style={[styles.inputAvatar, styles.inputAvatarPlaceholder]} />
        )}

        <TextInput
          style={styles.input}
          placeholder="Escribe un comentario..."
          placeholderTextColor={theme.colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          editable={!isSubmitting}
          multiline
        />

        <AnimatedPressable style={styles.sendButton} onPress={handleSubmit} disabled={!canSend}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
          ) : (
            <Send
              size={18}
              strokeWidth={2}
              color={canSend ? theme.colors.accentPrimary : theme.colors.textSecondary}
            />
          )}
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
    },
    loader: {
      marginVertical: 24,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginVertical: 16,
    },
    list: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
    },
    emptyText: {
      ...typography.bodySmall,
      textAlign: 'center',
      color: colors.textSecondary,
      paddingVertical: 24,
    },
    footerLoader: {
      paddingVertical: 12,
    },
    replyBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 8,
    },
    replyBannerText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    replyCancel: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.error,
    },
    // Barra fija, claramente diferenciada del listado de arriba: fondo propio
    // (surfaceElevated, distinto del `surface` del panel) + borde superior.
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginTop: 10,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    inputAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginBottom: 3,
    },
    inputAvatarPlaceholder: {
      backgroundColor: colors.accentPrimary,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxHeight: 100,
      backgroundColor: colors.background,
      color: colors.textPrimary,
      ...typography.body,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
  });
}
