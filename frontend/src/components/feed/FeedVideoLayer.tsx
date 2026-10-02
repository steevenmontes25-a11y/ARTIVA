import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { VideoView, type VideoPlayer } from 'expo-video';

interface FeedVideoLayerProps {
  player: VideoPlayer;
  isActive: boolean;
}

const LETTERBOX_BLUR_INTENSITY = 90;

/**
 * Video del feed: mientras está activo (el único que realmente reproduce,
 * ver FeedItem), se ve COMPLETO sin recortar (contentFit="contain") sobre
 * un fondo de la MISMA toma recortada y difuminada (contentFit="cover" +
 * blur) — estilo Reels/Shorts. Así un video horizontal no pierde contenido
 * de los costados en vez de forzarlo a llenar el slot vertical del feed
 * (que sí le pasa a "cover" solo, el mismo criterio que usan las fotos).
 *
 * Ambas vistas comparten el MISMO `player`: expo-video soporta varias
 * VideoView sobre un mismo player (no hay doble decode/doble reproducción,
 * solo dos "ventanas" renderizando la misma salida).
 *
 * Mientras NO está activo (pausado, solo el último frame congelado detrás
 * de items vecinos del FlatList) se queda con el simple contentFit="cover"
 * de antes — el letterbox de más costaría una vista y un blur extra por
 * cada item cercano sin beneficio visual real: el feed pagina de a un item
 * a la vez (pagingEnabled + snapToInterval), nunca se ve un item a medias.
 *
 * blurMethod="dimezisBlurViewSdk31Plus" (no el default 'none' de Android,
 * que solo pone una vista semitransparente): blur real en Android 12+
 * (SDK 31, la enorme mayoría de equipos activos), cae a semitransparente
 * en versiones más viejas en vez de fallar — evita el costo de blur en
 * vivo sobre un video reproduciéndose en hardware limitado.
 */
export function FeedVideoLayer({ player, isActive }: FeedVideoLayerProps): React.JSX.Element {
  const backdropRef = useRef<View>(null);

  if (!isActive) {
    return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
  }

  return (
    <>
      <BlurTargetView ref={backdropRef} style={StyleSheet.absoluteFill}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      </BlurTargetView>

      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={LETTERBOX_BLUR_INTENSITY}
        tint="dark"
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={backdropRef}
        pointerEvents="none"
      />

      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
    </>
  );
}
