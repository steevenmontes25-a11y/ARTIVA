import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
// Imports "profundos" (no el barrel `lucide-react-native`) para que Metro
// solo empaquete estos íconos y no la librería completa (~1000 íconos) —
// el import con nombre desde el paquete raíz infla el bundle varios MB
// porque Metro no hace tree-shaking de ese barrel file.
import Bookmark from 'lucide-react-native/icons/bookmark';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import Heart from 'lucide-react-native/icons/heart';
import Share2 from 'lucide-react-native/icons/share-2';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';

import { likePost, savePost, unlikePost, unsavePost } from '../../api/postInteractions';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import type { Post } from '../../types/post';
import { AnimatedPressable } from '../AnimatedPressable';
import { CommentsPanel } from './CommentsPanel';
import { FeedVideoLayer } from './FeedVideoLayer';

interface FeedItemProps {
  post: Post;
  height: number;
  isActive: boolean;
}

const DOUBLE_TAP_DELAY_MS = 300;
const HEART_HOLD_MS = 450;
const HEART_FADE_MS = 200;
const ICON_SIZE = 24;
const ICON_STROKE_WIDTH = 1.75;
const MEDIA_HEIGHT_FULL = 100;
const MEDIA_HEIGHT_SHRUNK = 57;
const MEDIA_CORNER_RADIUS = 24;

/**
 * Rediseño del feed: el video/imagen tiene su propia altura animable (100%
 * por defecto). El chip de usuario, los 3 botones de interacción y la barra
 * de comentarios viven anclados al borde inferior de ESE contenedor (no de
 * la pantalla completa), así que se mueven junto con él si se achica. Al
 * tocar la barra de comentarios, el media se achica a ~57% (con esquinas
 * inferiores redondeadas apareciendo) y el panel de comentarios sube a
 * ocupar el espacio que quedó libre — nunca se superpone al video.
 */
export function FeedItem({ post, height, isActive }: FeedItemProps): React.JSX.Element {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [liked, setLiked] = useState(post.viewer_has_liked);
  const [likesCount, setLikesCount] = useState(post.counts.likes);
  const [saved, setSaved] = useState(post.viewer_has_saved);
  const [commentsCount, setCommentsCount] = useState(post.counts.comments);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  const lastTapRef = useRef(0);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const mediaHeightPercent = useSharedValue(MEDIA_HEIGHT_FULL);

  const primaryMedia = post.media[0] as Post['media'][number] | undefined;
  const videoUri = primaryMedia?.type === 'video' ? primaryMedia.url : null;
  const audioUri = primaryMedia?.type === 'audio' ? primaryMedia.url : null;

  // Los hooks de expo-video/expo-audio se llaman siempre (reglas de hooks),
  // pasando null cuando este post no es de ese tipo — ambas libs aceptan
  // una fuente nula como no-op.
  const videoPlayer = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  const audioPlayer = useAudioPlayer(audioUri);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    if (!videoUri) {
      return;
    }

    if (isActive) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [isActive, videoUri, videoPlayer]);

  useEffect(() => {
    if (!audioUri) {
      return;
    }

    if (isActive) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  }, [isActive, audioUri, audioPlayer]);

  const runLikeToggle = (nextLiked: boolean): void => {
    const previousLiked = liked;
    const previousCount = likesCount;

    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));

    const request = nextLiked ? likePost(post.id) : unlikePost(post.id);

    request.catch(() => {
      setLiked(previousLiked);
      setLikesCount(previousCount);
    });
  };

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value }],
  }));

  // Feedback visual instantáneo (no bloquea el like real, que ya se disparó
  // en runLikeToggle antes de llamar a esto): bounce elástico 0 -> 1.2 -> 1,
  // y desaparece solo — nunca queda flotando sobre el contenido.
  const playHeartAnimation = (): void => {
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 220 })
    );
    heartOpacity.value = withDelay(HEART_HOLD_MS, withTiming(0, { duration: HEART_FADE_MS }));
  };

  const handleContentTap = (): void => {
    const now = Date.now();

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY_MS) {
      if (liked) {
        // Ya le dio like: el burst es solo cosmético, no hace falta sesión.
        playHeartAnimation();
      } else {
        requireAuth(() => {
          runLikeToggle(true);
          playHeartAnimation();
        });
      }
    }

    lastTapRef.current = now;
  };

  const handleLikePress = (event: GestureResponderEvent): void =>
    requireAuth(() => runLikeToggle(!liked), { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });

  const handleViewProfile = (): void => {
    router.push(`/artist/${post.author.username}`);
  };

  const handleSavePress = (event: GestureResponderEvent): void => {
    requireAuth(
      () => {
        const previousSaved = saved;
        const nextSaved = !saved;
        setSaved(nextSaved);

        const request = nextSaved ? savePost(post.id) : unsavePost(post.id);

        request.catch(() => setSaved(previousSaved));
      },
      { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
    );
  };

  const handleCommentAdded = (): void => {
    setCommentsCount((count) => count + 1);
  };

  const toggleComments = (): void => {
    const next = !isCommentsExpanded;
    setIsCommentsExpanded(next);
    mediaHeightPercent.value = withTiming(next ? MEDIA_HEIGHT_SHRUNK : MEDIA_HEIGHT_FULL, { duration: 350 });
  };

  // Altura en PÍXELES numéricos, no un string "N%": animar `height` como
  // porcentaje vía Reanimated tiene un bug conocido en Android/Fabric — el
  // valor lógico llega a 100% pero la vista nativa puede quedar resuelta a
  // 0 en el primer commit si el padre todavía no midió su propio alto (no
  // pasaba en web, donde la resolución de porcentajes es distinta). Como
  // `height` (el prop, en px) ya es un número fijo por item, convertir el
  // % a píxeles acá evita depender de esa resolución contra el padre.
  const mediaAnimatedStyle = useAnimatedStyle(() => {
    const radius = interpolate(
      mediaHeightPercent.value,
      [MEDIA_HEIGHT_SHRUNK, MEDIA_HEIGHT_FULL],
      [MEDIA_CORNER_RADIUS, 0],
      Extrapolation.CLAMP
    );

    return {
      height: (mediaHeightPercent.value / 100) * height,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };
  });

  return (
    <View style={[styles.container, { height }]}>
      {/* height numérico también acá (no solo en el animated style): si por
          cualquier motivo el primer frame nativo se pinta antes de que
          Reanimated aplique su valor, esto es el fallback — nunca 'auto'
          ni undefined. */}
      <Animated.View style={[styles.mediaWrapper, { height }, mediaAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleContentTap}>
          {primaryMedia?.type === 'video' ? (
            <FeedVideoLayer player={videoPlayer} isActive={isActive} />
          ) : primaryMedia?.type === 'image' ? (
            <Image source={{ uri: primaryMedia.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : primaryMedia?.type === 'audio' ? (
            <View style={[StyleSheet.absoluteFill, styles.audioBackground]}>
              <Text style={styles.audioIcon}>{audioStatus.playing ? '🔊' : '🎵'}</Text>
            </View>
          ) : post.caption ? (
            // Post de solo texto (sin media): mostramos el texto grande y
            // centrado en vez de una caja vacía.
            <View style={[StyleSheet.absoluteFill, styles.textPostBackground]}>
              <Text style={styles.textPostContent} numberOfLines={10}>
                {post.caption}
              </Text>
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]} />
          )}
        </Pressable>

        {/* Burst del doble-tap: aparece centrado y momentáneo, nunca
            permanente. Blanco fijo (no un token del theme) a propósito: se
            dibuja directo sobre foto/video arbitrario. */}
        <Animated.View pointerEvents="none" style={[styles.heartOverlay, heartAnimatedStyle]}>
          <Heart size={96} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1} />
        </Animated.View>

        {/* Cluster anclado al borde inferior DEL MEDIA (no de la pantalla) —
            se mueve junto con él cuando se achica. Fondo semitransparente
            fijo (no un token del theme) para legibilidad sobre cualquier
            contenido, sin el costo de un blur en vivo. */}
        <View style={styles.mediaBottomCluster} pointerEvents="box-none">
          <View style={styles.userChipRow}>
            <AnimatedPressable style={styles.userChip} onPress={handleViewProfile}>
              {post.author.avatar_url ? (
                <Image source={{ uri: post.author.avatar_url }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <Text style={styles.username} numberOfLines={1}>
                @{post.author.username}
              </Text>
            </AnimatedPressable>

            <View style={styles.actionsRow}>
              <AnimatedPressable style={styles.actionButton} onPress={handleLikePress}>
                <Heart
                  size={ICON_SIZE}
                  strokeWidth={ICON_STROKE_WIDTH}
                  color={theme.colors.accentPink}
                  fill={liked ? theme.colors.accentPink : 'none'}
                />
              </AnimatedPressable>

              <AnimatedPressable style={styles.actionButton} onPress={handleSavePress}>
                <Bookmark
                  size={ICON_SIZE}
                  strokeWidth={ICON_STROKE_WIDTH}
                  color={theme.colors.accentPrimary}
                  fill={saved ? theme.colors.accentPrimary : 'none'}
                />
              </AnimatedPressable>

              <AnimatedPressable style={styles.actionButton} onPress={() => {}}>
                <Share2 size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} color={theme.colors.accentAmber} />
              </AnimatedPressable>
            </View>
          </View>

          {post.caption && primaryMedia && (
            <Text style={styles.caption} numberOfLines={2}>
              {post.caption}
            </Text>
          )}

          <AnimatedPressable style={styles.commentsBar} onPress={toggleComments}>
            <Text style={styles.commentsBarText}>
              {commentsCount} {commentsCount === 1 ? 'comentario' : 'comentarios'}
            </Text>
            {isCommentsExpanded ? (
              <ChevronUp size={18} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color="#FFFFFF" strokeWidth={2} />
            )}
          </AnimatedPressable>
        </View>
      </Animated.View>

      <View style={styles.commentsPanelArea}>
        <CommentsPanel postId={post.id} active={isCommentsExpanded} onCommentAdded={handleCommentAdded} />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  // El cluster de controles se apoya sobre foto/video arbitrario, no sobre
  // una superficie del theme — texto blanco fijo y fondo semitransparente
  // fijo en los dos modos, igual que Instagram/TikTok, para garantizar
  // contraste sea cual sea el contenido de fondo.
  const overlayText = '#FFFFFF';

  return StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: colors.background,
      flexDirection: 'column',
    },
    mediaWrapper: {
      width: '100%',
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    mediaFallback: {
      backgroundColor: colors.surfaceElevated,
    },
    audioBackground: {
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textPostBackground: {
      backgroundColor: colors.accentPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingBottom: 140,
    },
    textPostContent: {
      ...typography.h2,
      color: colors.onAccent,
      textAlign: 'center',
    },
    audioIcon: {
      fontSize: 64,
    },
    heartOverlay: {
      position: 'absolute',
      top: '38%',
      left: '50%',
      marginLeft: -48,
      marginTop: -48,
    },
    mediaBottomCluster: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11,14,20,0.45)',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 8,
    },
    userChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    userChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.7)',
    },
    avatarPlaceholder: {
      backgroundColor: colors.accentPrimary,
    },
    username: {
      ...typography.username,
      color: overlayText,
      flexShrink: 1,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    actionButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    caption: {
      ...typography.bodySmall,
      color: overlayText,
    },
    commentsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    commentsBarText: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: overlayText,
    },
    commentsPanelArea: {
      flex: 1,
    },
  });
}
