import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme, type Theme } from '../theme/ThemeProvider';

interface OnboardingProgressBarProps {
  step: number;
  totalSteps: number;
}

export function OnboardingProgressBar({
  step,
  totalSteps,
}: OnboardingProgressBarProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const progress = Math.min(step / totalSteps, 1) * 100;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300 });
  }, [progress, animatedProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={styles.label}>
        {step}/{totalSteps}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    track: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.accentPrimary,
    },
    label: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.textSecondary,
      minWidth: 28,
      textAlign: 'right',
    },
  });
}
