import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme, type Theme } from '../../theme/ThemeProvider';
import { AnimatedPressable } from '../AnimatedPressable';

export type ProfileTab = 'posts' | 'projects';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

/**
 * Tab bar con indicador deslizante: translateX animado entre 0% y 100% del
 * ancho de la barra (cada tab ocupa la mitad) — transform numérico, no un
 * height/width en porcentaje vía Reanimated (ese patrón tiene un bug de
 * resolución conocido en Android/Fabric, ver FeedItem.tsx).
 */
export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [barWidth, setBarWidth] = useState(0);
  const position = useSharedValue(activeTab === 'posts' ? 0 : 1);

  useEffect(() => {
    position.value = withTiming(activeTab === 'posts' ? 0 : 1, { duration: 220 });
  }, [activeTab, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: barWidth / 2,
    transform: [{ translateX: position.value * (barWidth / 2) }],
  }));

  const handleLayout = (event: LayoutChangeEvent): void => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {barWidth > 0 && <Animated.View style={[styles.indicator, indicatorStyle]} />}

      <AnimatedPressable style={styles.tab} onPress={() => onChange('posts')}>
        <Text style={[styles.tabLabel, activeTab === 'posts' && styles.tabLabelActive]}>Publicaciones</Text>
      </AnimatedPressable>

      <AnimatedPressable style={styles.tab} onPress={() => onChange('projects')}>
        <Text style={[styles.tabLabel, activeTab === 'projects' && styles.tabLabelActive]}>Proyectos</Text>
      </AnimatedPressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: 'relative',
    },
    indicator: {
      position: 'absolute',
      bottom: -1,
      height: 2,
      backgroundColor: colors.accentPrimary,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    tabLabel: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    tabLabelActive: {
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textPrimary,
    },
  });
}
