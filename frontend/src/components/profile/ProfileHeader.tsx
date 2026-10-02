import { useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { useTheme, type Theme } from '../../theme/ThemeProvider';
import type { ArtistProfile } from '../../types/artist';
import { getReputationColors, getReputationInfo } from '../../utils/reputation';
import { ProfileActionButtons } from './ProfileActionButtons';

interface ProfileHeaderProps {
  profile: ArtistProfile;
  isOwnProfile: boolean;
  isFollowLoading: boolean;
  onToggleFollow: (event: GestureResponderEvent) => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowLoading,
  onToggleFollow,
}: ProfileHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const reputation = getReputationInfo(profile.counts);
  const reputationColors = getReputationColors(reputation.level);

  return (
    <View style={styles.container}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.username}>@{profile.username}</Text>

      {/* El chip de disciplina usa coral fijo por defecto — no hay todavía un
          mapeo categoría→color en el backend (Category no tiene campo de
          color), así que "coral" es el único caso implementado por ahora. */}
      <View style={styles.badgeRow}>
        {profile.primary_discipline && (
          <View style={styles.disciplineChip}>
            <Text style={styles.disciplineChipText}>{profile.primary_discipline}</Text>
          </View>
        )}

        <View style={[styles.reputationChip, { backgroundColor: reputationColors.background }]}>
          <Text style={[styles.reputationChipText, { color: reputationColors.text }]}>
            {reputation.label}
          </Text>
        </View>
      </View>

      {profile.bio && (
        <Text style={styles.bio} numberOfLines={3}>
          {profile.bio}
        </Text>
      )}

      <View style={styles.statsRow}>
        <StatItem label="Posts" value={profile.counts.posts} theme={theme} />
        <StatItem
          label="Colabs"
          value={profile.counts.collaborations}
          theme={theme}
          highlighted
        />
        <StatItem label="Seguidores" value={profile.counts.followers} theme={theme} />
        <StatItem label="Proyectos" value={profile.counts.projects} theme={theme} />
      </View>

      <View style={styles.actionsWrapper}>
        <ProfileActionButtons
          isOwnProfile={isOwnProfile}
          username={profile.username}
          isFollowing={profile.is_following}
          isFollowLoading={isFollowLoading}
          onToggleFollow={onToggleFollow}
        />
      </View>
    </View>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  theme: Theme;
  highlighted?: boolean;
}

// La columna "Colaboraciones" pesa más visualmente a propósito (fondo +
// número en accentSecondary) — la reputación por colaboración importa más
// que el conteo de seguidores, ver spec del rediseño de perfil.
function StatItem({ label, value, theme, highlighted = false }: StatItemProps): React.JSX.Element {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.statItem, highlighted && styles.statItemHighlighted]}>
      <Text style={[styles.statValue, highlighted && styles.statValueHighlighted]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 24,
      gap: 6,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      marginBottom: 8,
    },
    avatarPlaceholder: {
      backgroundColor: colors.accentPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      ...typography.h2,
      color: colors.onAccent,
    },
    name: {
      ...typography.profileName,
      color: colors.textPrimary,
    },
    username: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    disciplineChip: {
      backgroundColor: colors.disciplineChipBackground,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    disciplineChipText: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
      color: colors.disciplineChipText,
    },
    reputationChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    reputationChipText: {
      ...typography.caption,
      fontFamily: typography.bodyMedium.fontFamily,
    },
    bio: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 16,
    },
    statsRow: {
      flexDirection: 'row',
      width: '100%',
      marginTop: 18,
      gap: 6,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 12,
    },
    statItemHighlighted: {
      backgroundColor: colors.statHighlightBackground,
    },
    statValue: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    statValueHighlighted: {
      color: colors.accentSecondary,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    actionsWrapper: {
      width: '100%',
      marginTop: 16,
    },
  });
}
