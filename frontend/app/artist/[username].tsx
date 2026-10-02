import { Stack, useLocalSearchParams } from 'expo-router';

import { ProfileView } from '../../src/components/profile/ProfileView';

export default function ArtistProfileScreen(): React.JSX.Element {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: `@${username}`, headerBackTitle: 'Atrás' }} />
      <ProfileView username={username} />
    </>
  );
}
