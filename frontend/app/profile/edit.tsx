import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';

import { fetchCategories } from '../../src/api/categories';
import { extractErrorMessage } from '../../src/api/errors';
import { updateProfile } from '../../src/api/profile';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AuthActionButton } from '../../src/components/AuthActionButton';
import { createAuthFormStyles } from '../../src/components/authFormStyles';
import { CategoryChip } from '../../src/components/CategoryChip';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme, type Theme } from '../../src/theme/ThemeProvider';
import type { Category } from '../../src/types/category';

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((existing) => existing !== id) : [...list, id];
}

const AVATAR_MAX_DIMENSION = 800;
const AVATAR_COMPRESS_QUALITY = 0.8;

/**
 * Redimensiona y comprime la foto ANTES de subirla — el picker (con
 * allowsEditing + aspect [1,1]) recorta a cuadrado pero no reduce la
 * resolución: una foto de cámara sale típicamente en 3000px+ de lado
 * (varios MB), lo que hacía lento el guardado y podía fallar al
 * decodificarse como avatar de 72px en dispositivos con poca memoria.
 */
async function resizeAvatarForUpload(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: AVATAR_MAX_DIMENSION, height: AVATAR_MAX_DIMENSION });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: AVATAR_COMPRESS_QUALITY });

  return result.uri;
}

export default function EditProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const formStyles = useMemo(() => createAuthFormStyles(theme), [theme]);

  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  // Formulario de edición — fondo ambiental de escritorio cae al color
  // sólido del theme.
  useAmbientBackground(null);

  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.artist_profile?.location ?? '');
  const [website, setWebsite] = useState(user?.artist_profile?.external_links?.website ?? '');
  const [instagram, setInstagram] = useState(user?.artist_profile?.external_links?.instagram ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    user?.categories.map((category) => category.id) ?? []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback((): void => {
    setCategoriesLoading(true);

    fetchCategories()
      .then(setCategories)
      .catch(() => {
        // Si falla, el usuario igual puede guardar el resto del formulario.
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handlePickAvatar = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Necesitamos acceso a tus fotos para cambiar el avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setError(null);
      setIsProcessingAvatar(true);

      try {
        const resizedUri = await resizeAvatarForUpload(result.assets[0].uri);
        setAvatarUri(resizedUri);
      } catch {
        // Si el resize falla por algún motivo, subimos el original tal cual
        // en vez de bloquear al usuario — sigue siendo mejor que nada.
        setAvatarUri(result.assets[0].uri);
      } finally {
        setIsProcessingAvatar(false);
      }
    }
  };

  const handleSave = (): void => {
    setError(null);
    setIsSaving(true);

    updateProfile({
      bio,
      location,
      categoryIds: selectedCategoryIds,
      externalLinks: { website, instagram },
      avatarUri,
    })
      .then((updatedUser) => {
        setUser(updatedUser);
        router.back();
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setIsSaving(false));
  };

  const avatarPreviewUri = avatarUri ?? user?.avatar_url ?? null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar perfil', headerBackTitle: 'Atrás' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AnimatedPressable style={styles.avatarPicker} onPress={handlePickAvatar} disabled={isProcessingAvatar}>
          {avatarPreviewUri ? (
            <Image source={{ uri: avatarPreviewUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isProcessingAvatar && (
            <View style={[styles.avatar, styles.avatarProcessingOverlay]}>
              <ActivityIndicator color={theme.colors.onAccent} />
            </View>
          )}
          <Text style={styles.avatarHint}>{isProcessingAvatar ? 'Procesando...' : 'Cambiar foto'}</Text>
        </AnimatedPressable>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[formStyles.input, styles.bioInput]}
          placeholder="Contanos sobre tu trabajo"
          placeholderTextColor={formStyles.placeholderColor}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={500}
          editable={!isSaving}
        />

        <Text style={styles.label}>Especialidades</Text>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={theme.colors.accentPrimary} style={styles.categoriesLoading} />
        ) : (
          <View style={styles.chipGrid}>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                selected={selectedCategoryIds.includes(category.id)}
                onPress={() => setSelectedCategoryIds((prev) => toggleId(prev, category.id))}
              />
            ))}
          </View>
        )}

        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          style={formStyles.input}
          placeholder="Ciudad, país"
          placeholderTextColor={formStyles.placeholderColor}
          value={location}
          onChangeText={setLocation}
          editable={!isSaving}
        />

        <Text style={styles.label}>Sitio web</Text>
        <TextInput
          style={formStyles.input}
          placeholder="https://..."
          placeholderTextColor={formStyles.placeholderColor}
          autoCapitalize="none"
          keyboardType="url"
          value={website}
          onChangeText={setWebsite}
          editable={!isSaving}
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          style={formStyles.input}
          placeholder="tu.usuario"
          placeholderTextColor={formStyles.placeholderColor}
          autoCapitalize="none"
          value={instagram}
          onChangeText={setInstagram}
          editable={!isSaving}
        />

        {error && <Text style={formStyles.error}>{error}</Text>}

        <AuthActionButton
          label="Guardar cambios"
          isLoading={isSaving}
          disabled={isProcessingAvatar}
          onPress={handleSave}
        />

        <AnimatedPressable style={styles.logoutLink} onPress={() => logout()} disabled={isSaving}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </AnimatedPressable>
      </ScrollView>
    </>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      padding: 24,
      gap: 10,
      backgroundColor: theme.colors.background,
    },
    avatarPicker: {
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      backgroundColor: colors.accentPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarProcessingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: 'rgba(11,14,20,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholderText: {
      ...typography.h1,
      color: colors.onAccent,
    },
    avatarHint: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.accentPrimary,
    },
    label: {
      ...typography.bodySmall,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      marginTop: 8,
    },
    bioInput: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoriesLoading: {
      marginVertical: 8,
    },
    logoutLink: {
      alignItems: 'center',
      marginTop: 20,
    },
    logoutText: {
      ...typography.body,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.error,
    },
  });
}
