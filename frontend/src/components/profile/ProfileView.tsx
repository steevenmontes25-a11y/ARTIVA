import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { fetchArtistPosts, fetchArtistProfile, toggleFollow } from '../../api/artists';
import { extractErrorMessage } from '../../api/errors';
import { useAmbientBackground } from '../../hooks/useAmbientBackground';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuthStore } from '../../store/authStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';
import type { ArtistProfile } from '../../types/artist';
import type { PostThumbnail } from '../../types/postThumbnail';
import { PostThumbnailCell } from './PostThumbnailCell';
import { ProfileGridSkeleton } from './ProfileGridSkeleton';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs, type ProfileTab } from './ProfileTabs';
import { ProjectsEmptyState } from './ProjectsEmptyState';

interface ProfileViewProps {
  username: string;
}

const GRID_COLUMNS = 3;
const GRID_GAP = 2;

export function ProfileView({ username }: ProfileViewProps): React.JSX.Element {
  // Ancho REAL del contenedor (medido con onLayout), no el de la ventana:
  // en web, <WebFrame> puede centrar la app en un contenedor angosto (ver
  // WebFrame.tsx) cuando la ventana es más ancha que un celular — usar
  // useWindowDimensions() ahí calculaba celdas de grilla gigantes, más
  // anchas que el propio contenedor. windowWidth queda solo de fallback
  // para el primer render, antes de que onLayout mida algo.
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const width = measuredWidth > 0 ? measuredWidth : windowWidth;
  const cellSize = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const authUser = useAuthStore((state) => state.user);
  const isOwnProfile = authUser?.username === username;
  const requireAuth = useRequireAuth();

  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const [posts, setPosts] = useState<PostThumbnail[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadProfile = useCallback((): void => {
    setIsLoadingProfile(true);
    setProfileError(null);

    fetchArtistProfile(username)
      .then(setProfile)
      .catch((error: unknown) => setProfileError(extractErrorMessage(error)))
      .finally(() => setIsLoadingProfile(false));
  }, [username]);

  const loadInitialPosts = useCallback((): void => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);

    fetchArtistPosts(username, null)
      .then((page) => {
        setPosts(page.posts);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        // La grilla puede quedar vacía sin romper el resto del perfil.
      });
  }, [username]);

  // useFocusEffect (no un useEffect simple) para que el perfil se refresque
  // al volver a esta pantalla — p. ej. tras publicar un post nuevo desde el
  // tab Crear, donde el tab Perfil sigue montado de fondo y no se remonta.
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadInitialPosts();
    }, [loadProfile, loadInitialPosts])
  );

  // Mantiene el perfil propio sincronizado tras editarlo (avatar/bio/etc. se
  // actualizan en el authStore global desde la pantalla de edición).
  useEffect(() => {
    if (!isOwnProfile || !authUser) {
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            name: authUser.name,
            avatar_url: authUser.avatar_url,
            bio: authUser.bio,
            primary_discipline: authUser.artist_profile?.primary_discipline ?? current.primary_discipline,
            location: authUser.artist_profile?.location ?? current.location,
            external_links: authUser.artist_profile?.external_links ?? current.external_links,
          }
        : current
    );
  }, [isOwnProfile, authUser]);

  const loadMorePosts = useCallback((): void => {
    if (isLoadingMore || !hasMore || cursor === null) {
      return;
    }

    setIsLoadingMore(true);

    fetchArtistPosts(username, cursor)
      .then((page) => {
        setPosts((current) => [...current, ...page.posts]);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        // Si falla la siguiente página, el usuario sigue viendo lo ya cargado.
      })
      .finally(() => setIsLoadingMore(false));
  }, [cursor, hasMore, isLoadingMore, username]);

  const handleToggleFollow = (event: GestureResponderEvent): void => {
    if (!profile || isOwnProfile) {
      return;
    }

    requireAuth(
      () => {
        const previous = profile;

        setProfile({
          ...profile,
          is_following: !profile.is_following,
          counts: {
            ...profile.counts,
            followers: profile.counts.followers + (profile.is_following ? -1 : 1),
          },
        });
        setIsFollowLoading(true);

        toggleFollow(username)
          .catch(() => setProfile(previous))
          .finally(() => setIsFollowLoading(false));
      },
      { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
    );
  };

  const handleScreenLayout = (event: LayoutChangeEvent): void => {
    setMeasuredWidth(event.nativeEvent.layout.width);
  };

  // Fondo ambiental de escritorio (solo tiene efecto en web ancho, ver
  // WebFrame.tsx): el avatar del perfil, o la primera publicación de la
  // grilla si no hay avatar — nunca la miniatura de un post de video/audio
  // (PostThumbnail.thumbnail_url solo aplica a imágenes).
  const firstImagePost = posts.find((post) => post.media_type === 'image' && post.thumbnail_url);
  const ambientImageUrl = profile?.avatar_url ?? firstImagePost?.thumbnail_url ?? null;
  useAmbientBackground(ambientImageUrl);

  if (isLoadingProfile) {
    return (
      <View style={styles.screen} onLayout={handleScreenLayout}>
        <ProfileGridSkeleton cellSize={cellSize} gap={GRID_GAP} />
      </View>
    );
  }

  if (profileError || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.messageText}>{profileError ?? 'No se pudo cargar el perfil.'}</Text>
      </View>
    );
  }

  // Header + tabs se renderizan una vez por cada FlatList (uno por tab) —
  // ambas quedan montadas siempre (ver display:none abajo) para no perder
  // la posición de scroll ni los datos ya cargados al alternar entre
  // Publicaciones y Proyectos.
  const renderHeader = (): React.JSX.Element => (
    <>
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowLoading={isFollowLoading}
        onToggleFollow={handleToggleFollow}
      />
      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
    </>
  );

  return (
    <View style={styles.screen} onLayout={handleScreenLayout}>
      <FlatList
        style={[styles.flex, activeTab !== 'posts' && styles.hidden]}
        data={posts}
        keyExtractor={(item) => String(item.id)}
        numColumns={GRID_COLUMNS}
        renderItem={({ item }) => <PostThumbnailCell post={item} size={cellSize} />}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.emptyGridText}>Todavía no hay publicaciones.</Text>}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.6}
        // Las celdas de video montan su propio VideoView/player (ver
        // PostThumbnailCell) para mostrar el primer frame real — acotar
        // cuántas filas fuera de pantalla quedan montadas evita acumular
        // muchos decoders de video simultáneos en perfiles con varios posts
        // de video (los defaults de FlatList son generosos, pensados para
        // celdas livianas de solo texto/imagen).
        windowSize={5}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator color={theme.colors.accentPrimary} style={styles.footerLoader} /> : null
        }
      />

      <FlatList
        style={[styles.flex, styles.absoluteFill, activeTab !== 'projects' && styles.hidden]}
        data={[]}
        keyExtractor={() => 'projects-empty'}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<ProjectsEmptyState />}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
    },
    // La lista de "Proyectos" se superpone en el mismo espacio que la de
    // "Publicaciones" (position absolute) para que ninguna empuje a la otra
    // cuando ambas están montadas — solo una es visible (display) a la vez.
    absoluteFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    hidden: {
      display: 'none',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    messageText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    gridRow: {
      gap: GRID_GAP,
    },
    gridContent: {
      gap: GRID_GAP,
    },
    emptyGridText: {
      ...theme.typography.bodySmall,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      paddingVertical: 24,
    },
    footerLoader: {
      paddingVertical: 24,
    },
  });
}
