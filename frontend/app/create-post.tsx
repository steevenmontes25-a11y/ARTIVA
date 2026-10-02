import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { extractErrorMessage } from '../src/api/errors';
import { fetchCategories } from '../src/api/categories';
import { createPost } from '../src/api/posts';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { AuthActionButton } from '../src/components/AuthActionButton';
import { createAuthFormStyles } from '../src/components/authFormStyles';
import { CategoryChip } from '../src/components/CategoryChip';
import { useAmbientBackground } from '../src/hooks/useAmbientBackground';
import { useTheme, type Theme } from '../src/theme/ThemeProvider';
import type { Category } from '../src/types/category';
import type { PostType } from '../src/types/post';

export default function ComposePostScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const formStyles = useMemo(() => createAuthFormStyles(theme), [theme]);

  const router = useRouter();
  const params = useLocalSearchParams<{
    type: PostType;
    uri?: string;
    name?: string;
    mimeType?: string;
  }>();

  // Formulario de composición — fondo ambiental de escritorio cae al color
  // sólido del theme.
  useAmbientBackground(null);

  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoUri = params.type === 'video' ? (params.uri ?? null) : null;
  const audioUri = params.type === 'audio' ? (params.uri ?? null) : null;

  const videoPlayer = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
  });

  const audioPlayer = useAudioPlayer(audioUri);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const handleToggleAudioPreview = (): void => {
    if (audioStatus.playing) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        // Si falla, igual se puede publicar sin categoría.
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Llenado suave de la barra (no a saltos): el % real que reporta el
  // upload sigue siendo la fuente de verdad, esto solo interpola la
  // transición visual entre un valor y el siguiente.
  const animatedProgress = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 250 });

    if (progress >= 100) {
      checkScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 220 })
      );
    } else {
      checkScale.value = 0;
    }
  }, [progress, animatedProgress, checkScale]);

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkScale.value > 0 ? 1 : 0,
    transform: [{ scale: checkScale.value }],
  }));

  const handlePublish = (): void => {
    setError(null);
    setIsPublishing(true);
    setProgress(0);

    const hashtags = hashtagsInput
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    createPost(
      {
        type: params.type,
        caption: caption.trim().length > 0 ? caption.trim() : null,
        categoryId: selectedCategoryId,
        hashtags,
        media:
          params.uri && params.name && params.mimeType
            ? { uri: params.uri, name: params.name, mimeType: params.mimeType }
            : null,
      },
      setProgress
    )
      .then(() => {
        router.replace('/(tabs)/profile');
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setIsPublishing(false));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Nueva publicación', headerBackTitle: 'Atrás' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {params.type === 'image' && params.uri && (
            <Image source={{ uri: params.uri }} style={styles.preview} contentFit="cover" />
          )}

          {videoUri && (
            <VideoView player={videoPlayer} style={styles.preview} contentFit="cover" nativeControls />
          )}

          {audioUri && (
            <View style={[styles.preview, styles.audioPreview]}>
              <AnimatedPressable onPress={handleToggleAudioPreview}>
                <Text style={styles.audioIcon}>{audioStatus.playing ? '⏸️' : '▶️'}</Text>
              </AnimatedPressable>
              <Text style={styles.audioName} numberOfLines={1}>
                {params.name}
              </Text>
            </View>
          )}

          <TextInput
            style={[formStyles.input, styles.captionInput]}
            placeholder="Escribe una descripción..."
            placeholderTextColor={formStyles.placeholderColor}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2000}
            editable={!isPublishing}
          />

          <Text style={styles.label}>Categoría</Text>
          {categoriesLoading ? (
            <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
          ) : (
            <View style={styles.chipGrid}>
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  label={category.name}
                  selected={selectedCategoryId === category.id}
                  onPress={() =>
                    setSelectedCategoryId((current) => (current === category.id ? null : category.id))
                  }
                />
              ))}
            </View>
          )}

          <Text style={styles.label}>Hashtags</Text>
          <TextInput
            style={formStyles.input}
            placeholder="arte fotografia bnw"
            placeholderTextColor={formStyles.placeholderColor}
            autoCapitalize="none"
            value={hashtagsInput}
            onChangeText={setHashtagsInput}
            editable={!isPublishing}
          />

          {error && <Text style={formStyles.error}>{error}</Text>}

          {isPublishing && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressFillStyle]} />
              </View>
              <View style={styles.progressEnd}>
                {progress >= 100 ? (
                  <Animated.Text style={[styles.progressCheck, checkStyle]}>✓</Animated.Text>
                ) : (
                  <Text style={styles.progressLabel}>{progress}%</Text>
                )}
              </View>
            </View>
          )}

          <AuthActionButton label="Publicar" isLoading={isPublishing} onPress={handlePublish} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    container: {
      padding: 24,
      gap: 10,
    },
    preview: {
      width: '100%',
      height: 260,
      borderRadius: 12,
      backgroundColor: colors.surfaceElevated,
      marginBottom: 8,
    },
    audioPreview: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    audioIcon: {
      fontSize: 40,
    },
    audioName: {
      ...typography.bodySmall,
      color: colors.textPrimary,
    },
    captionInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    label: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      marginTop: 8,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.accentPrimary,
    },
    progressEnd: {
      minWidth: 32,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    progressLabel: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    progressCheck: {
      color: colors.accentSecondary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
