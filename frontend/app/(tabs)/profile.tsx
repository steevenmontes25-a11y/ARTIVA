import { StyleSheet, View } from 'react-native';

import { RadialMenu } from '../../src/components/RadialMenu';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { useAuthStore } from '../../src/store/authStore';

export default function OwnProfileScreen(): React.JSX.Element {
  const username = useAuthStore((state) => state.user?.username);

  return (
    <View style={styles.flex}>
      {username && <ProfileView username={username} />}
      <RadialMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
