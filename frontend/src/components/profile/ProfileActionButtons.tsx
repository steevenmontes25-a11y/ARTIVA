import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Import profundo: ver la nota en FeedItem.tsx sobre por qué no se importa
// desde el barrel `lucide-react-native`.
import MessageCircle from 'lucide-react-native/icons/message-circle';

import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';

interface ProfileActionButtonsProps {
  isOwnProfile: boolean;
  username: string;
  isFollowing: boolean;
  isFollowLoading: boolean;
  onToggleFollow: (event: GestureResponderEvent) => void;
}

export function ProfileActionButtons({
  isOwnProfile,
  username,
  isFollowing,
  isFollowLoading,
  onToggleFollow,
}: ProfileActionButtonsProps): React.JSX.Element {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isOwnProfile) {
    return (
      <AnimatedPressable style={styles.primaryButtonFull} onPress={() => router.push('/profile/edit')}>
        <Text style={styles.primaryButtonText}>Editar perfil</Text>
      </AnimatedPressable>
    );
  }

  return (
    <View style={styles.row}>
      <FollowButton
        isFollowing={isFollowing}
        isFollowLoading={isFollowLoading}
        onPress={onToggleFollow}
        theme={theme}
        styles={styles}
      />

      <AnimatedPressable
        style={styles.messageButton}
        onPress={(event) =>
          requireAuth(() => router.push(`/messages/${username}`), {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          })
        }
      >
        <MessageCircle size={18} strokeWidth={1.75} color={theme.colors.textPrimary} />
      </AnimatedPressable>

      <AnimatedPressable
        style={styles.collaborateButton}
        onPress={(event) =>
          requireAuth(() => router.push('/(tabs)/collaborate'), {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          })
        }
      >
        <Text style={styles.collaborateButtonText}>Colaborar</Text>
      </AnimatedPressable>
    </View>
  );
}

interface FollowButtonProps {
  isFollowing: boolean;
  isFollowLoading: boolean;
  onPress: (event: GestureResponderEvent) => void;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}

/**
 * Botón Seguir/Siguiendo con morph (color de fondo + crossfade de texto, sin
 * salto brusco) y un pulso discreto de accentSecondary cuando se completa un
 * follow (no al dejar de seguir, ni en el estado inicial).
 */
function FollowButton({ isFollowing, isFollowLoading, onPress, theme, styles }: FollowButtonProps): React.JSX.Element {
  const progress = useSharedValue(isFollowing ? 1 : 0);
  const pulseScale = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  const wasFollowing = useRef(isFollowing);

  useEffect(() => {
    progress.value = withTiming(isFollowing ? 1 : 0, { duration: 220 });

    if (isFollowing && !wasFollowing.current) {
      pulseScale.value = 0;
      pulseOpacity.value = 0.55;
      pulseScale.value = withTiming(1.7, { duration: 550 });
      pulseOpacity.value = withTiming(0, { duration: 550 });
    }

    wasFollowing.current = isFollowing;
  }, [isFollowing, progress, pulseScale, pulseOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.accentPrimary, theme.colors.surfaceElevated]
    ),
    borderColor: interpolateColor(progress.value, [0, 1], [theme.colors.accentPrimary, theme.colors.border]),
  }));

  const seguirTextStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const siguiendoTextStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.followButton, containerStyle]}
      onPress={onPress}
      disabled={isFollowLoading}
    >
      <Animated.View style={[styles.pulseCircle, pulseStyle]} pointerEvents="none" />

      {isFollowLoading ? (
        <ActivityIndicator color={theme.colors.onAccent} size="small" />
      ) : (
        <View style={styles.followTextWrapper}>
          <Animated.Text style={[styles.followButtonText, styles.followTextAbsolute, seguirTextStyle]}>
            Seguir
          </Animated.Text>
          <Animated.Text
            style={[
              styles.followButtonText,
              styles.followTextAbsolute,
              styles.followingText,
              siguiendoTextStyle,
            ]}
          >
            Siguiendo
          </Animated.Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
    },
    followButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      overflow: 'hidden',
    },
    followTextWrapper: {
      minWidth: 76,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    followTextAbsolute: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
    },
    followButtonText: {
      ...typography.bodySmall,
      fontFamily: typography.button.fontFamily,
      color: colors.onAccent,
    },
    followingText: {
      color: colors.accentSecondary,
    },
    pulseCircle: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.accentSecondary,
    },
    messageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collaborateButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accentSecondary,
    },
    collaborateButtonText: {
      ...typography.bodySmall,
      fontFamily: typography.button.fontFamily,
      color: colors.accentSecondary,
    },
    primaryButtonFull: {
      backgroundColor: colors.accentPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      width: '100%',
    },
    primaryButtonText: {
      ...typography.bodySmall,
      fontFamily: typography.button.fontFamily,
      color: colors.onAccent,
    },
  });
}
