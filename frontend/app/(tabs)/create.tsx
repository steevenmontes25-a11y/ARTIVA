import { useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CreateFanMenu } from '../../src/components/CreateFanMenu';
import { RadialMenu } from '../../src/components/RadialMenu';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useTheme, type Theme } from '../../src/theme/ThemeProvider';

export default function CreateMenuScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  // Sin imagen relevante (menú de opciones) — fondo ambiental de escritorio
  // cae al color sólido del theme.
  useAmbientBackground(null);

  const openCompose = (params: { type: string; uri?: string; name?: string; mimeType?: string }): void => {
    router.push({ pathname: '/create-post', params });
  };

  const handlePickImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset) {
      openCompose({
        type: 'image',
        uri: asset.uri,
        name: asset.fileName ?? 'image.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const handlePickVideo = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset) {
      openCompose({
        type: 'video',
        uri: asset.uri,
        name: asset.fileName ?? 'video.mp4',
        mimeType: asset.mimeType ?? 'video/mp4',
      });
    }
  };

  const handlePickAudio = async (): Promise<void> => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    const asset = result.assets?.[0];

    if (!result.canceled && asset) {
      openCompose({
        type: 'audio',
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'audio/mpeg',
      });
    }
  };

  const handleCreateText = (): void => {
    openCompose({ type: 'text' });
  };

  const handleComposeChords = (): void => {
    router.push('/chord-composer');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Crear</Text>

      <View style={styles.centerArea}>
        <CreateFanMenu
          onPickVideo={handlePickVideo}
          onPickImage={handlePickImage}
          onPickAudio={handlePickAudio}
          onCreateText={handleCreateText}
          onComposeChords={handleComposeChords}
        />
      </View>

      <RadialMenu />
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      paddingTop: 78,
      // El FAB del menú circular (40px, left:14) y la campana de
      // notificaciones (40px, junto a él) viven en la esquina superior
      // izquierda de esta misma pantalla — el título necesita despejarlos en
      // vez de solaparse (bug reportado). left:14 + 40 (FAB) + 10 (gap) + 40
      // (campana) + 16 (aire) = 120.
      paddingLeft: 120,
      paddingRight: 24,
      paddingBottom: 12,
    },
    centerArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
