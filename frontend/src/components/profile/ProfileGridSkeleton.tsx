import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '../SkeletonBlock';

interface ProfileGridSkeletonProps {
  columns?: number;
  cellSize: number;
  gap?: number;
}

/** Placeholder de la grilla de posts de un perfil mientras carga. */
export function ProfileGridSkeleton({
  columns = 3,
  cellSize,
  gap = 2,
}: ProfileGridSkeletonProps): React.JSX.Element {
  const cellCount = columns * 3;

  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: cellCount }, (_, index) => (
        <SkeletonBlock key={index} width={cellSize} height={cellSize} borderRadius={0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
