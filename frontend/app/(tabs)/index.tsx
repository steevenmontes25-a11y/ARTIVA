import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';

import { extractErrorMessage } from '../../src/api/errors';
import { fetchFeed } from '../../src/api/feed';
import { FeedItem } from '../../src/components/feed/FeedItem';
import { FeedSkeleton } from '../../src/components/feed/FeedSkeleton';
import { RadialMenu } from '../../src/components/RadialMenu';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useTheme, type Theme } from '../../src/theme/ThemeProvider';
import type { Post } from '../../src/types/post';

const EXIT_CONFIRMATION_WINDOW_MS = 2000;

export default function FeedScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // En algunos entornos web, onLayout puede no medir una altura > 0 si algún
  // ancestro no participa del flujo flex hasta el <body> (p. ej. el wrapper
  // de tabs en react-native-web). Sin este fallback, el FlatList se quedaba
  // detrás de `containerHeight > 0` para siempre y nunca montaba ningún
  // <Video>/<Image> — eso, no expo-av, era la causa del feed vacío en web.
  const { height: windowHeight } = useWindowDimensions();
  const itemHeight = measuredHeight > 0 ? measuredHeight : windowHeight;

  const loadInitial = useCallback((): void => {
    setIsInitialLoading(true);
    setError(null);

    fetchFeed(null)
      .then((page) => {
        setPosts(page.posts);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setIsInitialLoading(false));
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const handleRefresh = useCallback((): void => {
    setIsRefreshing(true);
    setError(null);

    fetchFeed(null)
      .then((page) => {
        setPosts(page.posts);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setActiveIndex(0);
      })
      .catch((err: unknown) => setError(extractErrorMessage(err)))
      .finally(() => setIsRefreshing(false));
  }, []);

  const loadMore = useCallback((): void => {
    if (isLoadingMore || !hasMore || cursor === null) {
      return;
    }

    setIsLoadingMore(true);

    fetchFeed(cursor)
      .then((page) => {
        setPosts((current) => [...current, ...page.posts]);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        // Si falla la siguiente página, el usuario sigue viendo lo ya cargado.
      })
      .finally(() => setIsLoadingMore(false));
  }, [cursor, hasMore, isLoadingMore]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }): void => {
    const firstVisible = viewableItems[0];

    if (firstVisible && firstVisible.index !== null) {
      setActiveIndex(firstVisible.index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  // Fondo ambiental de escritorio (solo tiene efecto en web ancho, ver
  // WebFrame.tsx): sigue al post activo, no al scroll — activeIndex ya solo
  // cambia en onViewableItemsChanged de arriba, nunca por scroll-pixel. Los
  // posts de video/audio/texto caen a null (color sólido del theme): no hay
  // un poster/thumbnail real para esos tipos en el feed, y forzar la
  // primera imagen de otro tipo de contenido sería justamente el tipo de
  // dato inventado que este proyecto evita.
  const activePrimaryMedia = posts[activeIndex]?.media[0];
  const ambientImageUrl = activePrimaryMedia?.type === 'image' ? activePrimaryMedia.url : null;
  useAmbientBackground(ambientImageUrl);

  // Doble-back-para-salir, solo en Inicio y solo en Android (BackHandler no
  // existe en iOS/web). useFocusEffect (no useEffect simple) porque las
  // pantallas del Tabs navigator no se desmontan al cambiar de tab — con un
  // useEffect normal el listener seguiría activo interceptando "atrás" en
  // Descubrir/Perfil/etc. useFocusEffect limpia al perder foco, no solo al
  // desmontar, así que queda activo únicamente mientras Inicio está visible.
  const lastBackPressRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return;
      }

      const handleBackPress = (): boolean => {
        const now = Date.now();

        if (now - lastBackPressRef.current < EXIT_CONFIRMATION_WINDOW_MS) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressRef.current = now;
        ToastAndroid.show('Presiona de nuevo para salir', ToastAndroid.SHORT);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => subscription.remove();
    }, [])
  );

  // Precarga la imagen del siguiente post para evitar loading visible al hacer scroll.
  useEffect(() => {
    const nextPost = posts[activeIndex + 1];

    nextPost?.media.forEach((media) => {
      if (media.type === 'image') {
        Image.prefetch(media.url).catch(() => {
          // Precarga best-effort: si falla, la imagen igual se carga al mostrarse.
        });
      }
    });
  }, [activeIndex, posts]);

  // El FAB del menú circular debe estar presente sin importar el estado de
  // carga (nunca se queda sin forma de navegar), así que se monta una sola
  // vez al final envolviendo cualquiera de los estados de abajo.
  let content: React.JSX.Element;
  let isCenteredMessage = false;

  if (isInitialLoading) {
    content = <FeedSkeleton height={itemHeight} />;
  } else if (error && posts.length === 0) {
    content = <Text style={styles.messageText}>{error}</Text>;
    isCenteredMessage = true;
  } else if (posts.length === 0) {
    content = <Text style={styles.messageText}>Todavía no hay publicaciones en tu feed.</Text>;
    isCenteredMessage = true;
  } else {
    content = (
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <FeedItem post={item} height={itemHeight} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        // Desactivado: en pruebas reales causaba warnings recurrentes de
        // Reanimated ("synchronouslyUpdateUIProps failed") en cada scroll —
        // las vistas animadas de FeedItem (AnimatedPressable, heart burst)
        // quedaban recicladas por el clipping mientras Reanimated todavía
        // les apuntaba. windowSize/initialNumToRender/maxToRenderPerBatch ya
        // acotados arriba mantienen la memoria bajo control sin esto.
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accentPrimary}
            colors={[theme.colors.accentPrimary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={theme.colors.accentPrimary} style={styles.footerLoader} />
          ) : null
        }
      />
    );
  }

  return (
    <View style={styles.flex} onLayout={(event) => setMeasuredHeight(event.nativeEvent.layout.height)}>
      {isCenteredMessage ? <View style={styles.centered}>{content}</View> : content}
      <RadialMenu />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      padding: 24,
    },
    messageText: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    footerLoader: {
      paddingVertical: 24,
    },
  });
}
