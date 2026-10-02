import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Imports profundos: ver la nota en FeedItem.tsx sobre por qué no se importa
// desde el barrel `lucide-react-native` (evita empaquetar ~1000 íconos).
import Bell from 'lucide-react-native/icons/bell';
import Compass from 'lucide-react-native/icons/compass';
import House from 'lucide-react-native/icons/house';
import Menu from 'lucide-react-native/icons/menu';
import Plus from 'lucide-react-native/icons/plus';
import Users from 'lucide-react-native/icons/users';
import UserIcon from 'lucide-react-native/icons/user';
import X from 'lucide-react-native/icons/x';

import { useAuthModalStore } from '../store/authModalStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useTheme, type Theme } from '../theme/ThemeProvider';
import { AnimatedPressable } from './AnimatedPressable';
import { FanOutSatellite, type FanOutSatelliteConfig } from './FanOutSatellite';

const FAB_SIZE = 40;
const BELL_SIZE = 40;
const BELL_GAP = 10;
const SATELLITE_SIZE = 40;
const SATELLITE_SIZE_LARGE = 46;
const STAGGER_MS = 30;

interface LucideIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

interface SatelliteConfig {
  key: string;
  href: Href;
  icon: ComponentType<LucideIconProps>;
  x: number;
  y: number;
  requiresAuth: boolean;
  large?: boolean;
}

const SATELLITES: SatelliteConfig[] = [
  { key: 'inicio', href: '/(tabs)', icon: House, x: 100, y: 0, requiresAuth: false },
  { key: 'descubrir', href: '/(tabs)/discover', icon: Compass, x: 92, y: 38, requiresAuth: false },
  { key: 'crear', href: '/(tabs)/create', icon: Plus, x: 71, y: 71, requiresAuth: true, large: true },
  { key: 'colaborar', href: '/(tabs)/collaborate', icon: Users, x: 38, y: 92, requiresAuth: true },
  { key: 'perfil', href: '/(tabs)/profile', icon: UserIcon, x: 0, y: 100, requiresAuth: true },
];

/**
 * Menú de navegación circular: reemplaza la tab bar inferior. Vive montado
 * en la esquina superior izquierda de cada una de las 5 pantallas
 * principales — siempre a un tap, sin necesidad de un botón "atrás"
 * adicional. Al tocar el FAB despliega 5 satélites en arco de cuarto de
 * círculo (no en línea recta) con stagger + spring, corriendo en el hilo
 * nativo vía Reanimated.
 */
export function RadialMenu(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openAuthModal = useAuthModalStore((state) => state.open);

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loadNotifications = useNotificationStore((state) => state.load);

  const [isOpen, setIsOpen] = useState(false);
  const rotation = useSharedValue(0);

  // Se dispara desde acá (no desde la pantalla de notificaciones) porque
  // este componente vive montado en las 5 pantallas principales — así el
  // punto de "sin leer" en la campana refleja el estado real apenas hay
  // sesión, sin depender de haber visitado esa pantalla antes. `load()` ya
  // ignora llamadas concurrentes (ver notificationStore), así que no importa
  // que cada instancia de RadialMenu la dispare por su cuenta.
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  const handleBellPress = (): void => {
    if (!isAuthenticated) {
      openAuthModal(() => router.push('/notifications'));
      return;
    }

    router.push('/notifications');
  };

  const satelliteColor = (satelliteKey: string): string => {
    switch (satelliteKey) {
      case 'inicio':
        return theme.colors.accentPrimary;
      case 'descubrir':
        return theme.colors.accentPurple;
      case 'colaborar':
        return theme.colors.accentCoral;
      case 'perfil':
        return theme.colors.accentAmber;
      default:
        return theme.colors.accentPrimary;
    }
  };

  const closeMenu = (): void => {
    setIsOpen(false);
    rotation.value = withTiming(0, { duration: 220 });
  };

  const toggleMenu = (): void => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    rotation.value = withTiming(nextOpen ? 1 : 0, { duration: 220 });
  };

  const handleSatellitePress = (satellite: SatelliteConfig): void => {
    // Cierra el menú (los satélites vuelven al FAB en reversa) sin esperar
    // a que termine para navegar — ambas animaciones corren en paralelo.
    closeMenu();

    if (satellite.requiresAuth && !isAuthenticated) {
      openAuthModal(() => router.push(satellite.href));
      return;
    }

    router.push(satellite.href);
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 135}deg` }],
  }));

  const toFanOutConfig = (satellite: SatelliteConfig): FanOutSatelliteConfig => {
    const color = satelliteColor(satellite.key);

    return {
      key: satellite.key,
      icon: satellite.icon,
      x: satellite.x,
      y: satellite.y,
      size: satellite.large ? SATELLITE_SIZE_LARGE : SATELLITE_SIZE,
      iconSize: satellite.large ? 22 : 18,
      backgroundColor: satellite.large ? theme.colors.accentSecondary : theme.colors.surface,
      // Ícono oscuro fijo sobre el fondo verde sólido del satélite "Crear"
      // (el más destacado del arco) — no un token del theme, a propósito,
      // porque debe contrastar contra ese verde sin importar si la app está
      // en modo oscuro o claro.
      iconColor: satellite.large ? '#0B0E14' : color,
      borderColor: color,
    };
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <AnimatedPressable style={[styles.fab, fabAnimatedStyle]} onPress={toggleMenu}>
        {isOpen ? (
          <X size={20} color={theme.colors.accentSecondary} strokeWidth={2} />
        ) : (
          <Menu size={20} color={theme.colors.accentSecondary} strokeWidth={2} />
        )}
      </AnimatedPressable>

      <AnimatedPressable style={styles.bell} onPress={handleBellPress}>
        <Bell size={18} color={theme.colors.accentPink} strokeWidth={2} />
        {unreadCount > 0 && <View style={styles.bellDot} />}
      </AnimatedPressable>

      {SATELLITES.map((satellite, index) => (
        <FanOutSatellite
          key={satellite.key}
          satellite={toFanOutConfig(satellite)}
          index={index}
          totalCount={SATELLITES.length}
          isOpen={isOpen}
          staggerMs={STAGGER_MS}
          onPress={() => handleSatellitePress(satellite)}
        />
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 70,
      left: 14,
      zIndex: 50,
      elevation: 50,
    },
    fab: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      borderWidth: 2,
      borderColor: theme.colors.accentSecondary,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bell: {
      position: 'absolute',
      top: 0,
      left: FAB_SIZE + BELL_GAP,
      width: BELL_SIZE,
      height: BELL_SIZE,
      borderRadius: BELL_SIZE / 2,
      borderWidth: 2,
      borderColor: theme.colors.accentPink,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellDot: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.accentPink,
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
    },
  });
}
