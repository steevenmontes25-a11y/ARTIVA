import { useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

// Import profundo: ver la nota en FeedItem.tsx sobre por qué no se importa
// desde el barrel `lucide-react-native` (evita empaquetar ~1000 íconos).
import PlayIcon from 'lucide-react-native/icons/play';

import { useTheme, type Theme } from '../../theme/ThemeProvider';
import type { PostThumbnail } from '../../types/postThumbnail';

interface PostThumbnailCellProps {
  post: PostThumbnail;
  size: number;
}

export function PostThumbnailCell({ post, size }: PostThumbnailCellProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const cellStyle = { width: size, height: size };

  if (post.thumbnail_url && post.media_type === 'image') {
    return (
      <View style={cellStyle}>
        <Image source={{ uri: post.thumbnail_url }} style={styles.image} contentFit="cover" />
      </View>
    );
  }

  // El backend todavía no genera un poster/thumbnail real para posts de
  // video (PostThumbnailResource devuelve la URL del propio .mp4 en
  // `thumbnail_url`, ver backend) — en vez de un ícono de claqueta sin
  // relación con el contenido real, mostramos el primer frame REAL del
  // video (expo-video lo decodifica y lo deja congelado ahí sin llamar
  // play()) con un badge de "play" superpuesto para que se note que es un
  // video y no una foto.
  if (post.thumbnail_url && post.media_type === 'video') {
    return <VideoThumbnail uri={post.thumbnail_url} size={size} theme={theme} />;
  }

  return (
    <View style={[cellStyle, styles.fallback]}>
      <Text style={styles.fallbackIcon}>{post.media_type === 'audio' ? '🎵' : '🖼️'}</Text>
    </View>
  );
}

interface VideoThumbnailProps {
  uri: string;
  size: number;
  theme: Theme;
}

function VideoThumbnail({ uri, size, theme }: VideoThumbnailProps): React.JSX.Element {
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Sin loop ni play(): el player se queda pausado en su posición inicial
  // (frame 0), que es exactamente lo que necesitamos como "poster" — no
  // reproduce audio ni consume batería/datos de más que decodificar ese
  // primer frame.
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
  });

  return (
    <View style={{ width: size, height: size }}>
      <VideoView player={player} style={styles.image} contentFit="cover" nativeControls={false} />
      <View style={styles.playBadge} pointerEvents="none">
        <PlayIcon size={14} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    image: {
      width: '100%',
      height: '100%',
    },
    fallback: {
      backgroundColor: theme.colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fallbackIcon: {
      fontSize: 28,
    },
    playBadge: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(11,14,20,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
