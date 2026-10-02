import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '../SkeletonBlock';
import { useTheme } from '../../theme/ThemeProvider';

interface FeedSkeletonProps {
  height: number;
}

/** Placeholder de un slide del feed mientras carga la primera página. */
export function FeedSkeleton({ height }: FeedSkeletonProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { height, backgroundColor: colors.background }]}>
      <SkeletonBlock width="100%" height="100%" borderRadius={0} />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.infoColumn}>
          <View style={styles.authorRow}>
            <SkeletonBlock width={40} height={40} borderRadius={20} />
            <View style={styles.authorLines}>
              <SkeletonBlock width={120} height={14} />
              <SkeletonBlock width={80} height={11} />
            </View>
          </View>
          <SkeletonBlock width="70%" height={13} />
        </View>

        <View style={styles.actionsColumn}>
          <SkeletonBlock width={32} height={32} borderRadius={16} />
          <SkeletonBlock width={32} height={32} borderRadius={16} />
          <SkeletonBlock width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  infoColumn: {
    flex: 1,
    gap: 10,
    marginRight: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorLines: {
    gap: 6,
  },
  actionsColumn: {
    alignItems: 'center',
    gap: 18,
  },
});
