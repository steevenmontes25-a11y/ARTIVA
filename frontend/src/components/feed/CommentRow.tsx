import { useMemo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '../../theme/ThemeProvider';
import type { Comment } from '../../types/comment';

interface CommentRowProps {
  comment: Comment;
  onReply: (commentId: number, username: string) => void;
  isReply?: boolean;
}

export function CommentRow({ comment, onReply, isReply = false }: CommentRowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <View style={styles.row}>
        {comment.user.avatar_url ? (
          <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}

        <View style={styles.bubble}>
          <Text
            style={styles.username}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            @{comment.user.username}
          </Text>
          <Text style={styles.content}>{comment.content}</Text>

          {!isReply && (
            <Pressable onPress={() => onReply(comment.id, comment.user.username)}>
              <Text style={styles.replyLink}>Responder</Text>
            </Pressable>
          )}
        </View>
      </View>

      {comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} onReply={onReply} isReply />
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      paddingVertical: 8,
    },
    replyContainer: {
      paddingVertical: 6,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    avatarPlaceholder: {
      backgroundColor: colors.accentPrimary,
    },
    bubble: {
      flex: 1,
      gap: 2,
    },
    username: {
      ...typography.username,
      fontSize: 13,
      color: colors.textPrimary,
    },
    content: {
      ...typography.body,
      color: colors.textPrimary,
    },
    replyLink: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.accentPrimary,
      marginTop: 2,
    },
    repliesContainer: {
      marginLeft: 42,
      marginTop: 4,
    },
  });
}
