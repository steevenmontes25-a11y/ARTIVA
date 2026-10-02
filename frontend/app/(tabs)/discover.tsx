import { StyleSheet, View } from 'react-native';

import { RadialMenu } from '../../src/components/RadialMenu';
import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';

export default function DiscoverScreen(): React.JSX.Element {
  // Sin imagen relevante todavía (placeholder) — fondo ambiental de
  // escritorio cae al color sólido del theme.
  useAmbientBackground(null);

  return (
    <View style={styles.flex}>
      <ScreenPlaceholder title="Descubrir" />
      <RadialMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
