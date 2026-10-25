/** Plant-specific components: image with designed fallback, cards, verification badge. */
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, shadow, space } from '../theme';
import { imageUrl } from '../lib/config';
import { useI18n } from '../lib/i18n';
import { Txt } from './ui';

/** Shows the plant's first photo, or a leaf illustration tinted with its category colour. */
export function PlantImage({ plant, image, height = 140, rounded = radius.lg, style }) {
  const { loc } = useI18n();
  const url = imageUrl(image?.url || plant?.images?.[0]?.url);
  const tint = plant?.category?.color || colors.primary;
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[{ height, borderRadius: rounded, backgroundColor: colors.primarySoft }, style]}
        contentFit="cover"
        transition={150}
        accessibilityLabel={loc(plant?.name)}
      />
    );
  }
  const initial = (loc(plant?.name) || '').slice(0, 2);
  return (
    <View
      style={[{ height, borderRadius: rounded, backgroundColor: tint, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityLabel={loc(plant?.name)}
    >
      <Ionicons name="leaf" size={height * 0.9} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', right: -height * 0.15, bottom: -height * 0.2 }} />
      <Txt variant={height > 120 ? 'display' : 'title'} weight="bold" color="rgba(255,255,255,0.92)">
        {initial}
      </Txt>
    </View>
  );
}

export function VerificationBadge({ status, compact }) {
  const { t } = useI18n();
  const map = {
    verified: { icon: 'shield-checkmark', fg: colors.verified, bg: colors.verifiedSoft },
    needs_review: { icon: 'time', fg: colors.pending, bg: colors.pendingSoft },
    unverified: { icon: 'help-circle', fg: colors.inkSoft, bg: colors.line },
  };
  const m = map[status] || map.unverified;
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Ionicons name={m.icon} size={14} color={m.fg} />
      {!compact ? (
        <Txt variant="caption" weight="semibold" color={m.fg}>
          {t(`verification_${status || 'unverified'}`)}
        </Txt>
      ) : null}
    </View>
  );
}

/** Vertical card for horizontal carousels. */
export function PlantTile({ plant, width = 150 }) {
  const { loc } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loc(plant.name)}
      onPress={() => router.push(`/plant/${plant._id}`)}
      style={({ pressed }) => [styles.tile, { width }, pressed && { opacity: 0.9 }]}
    >
      <PlantImage plant={plant} height={width * 0.78} rounded={radius.md} />
      <Txt weight="bold" numberOfLines={1} style={{ marginTop: space.sm }}>
        {loc(plant.name)}
      </Txt>
      <Txt variant="caption" color={colors.muted} numberOfLines={1} style={{ fontStyle: 'italic' }}>
        {plant.scientificName}
      </Txt>
    </Pressable>
  );
}

/** Full-width row card for search results and lists. */
export function PlantRow({ plant, right, onPress }) {
  const { loc } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress || (() => router.push(`/plant/${plant._id}`))}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
    >
      <PlantImage plant={plant} height={72} style={{ width: 72 }} rounded={radius.md} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyLg" weight="bold" numberOfLines={1}>
          {loc(plant.name)}
        </Txt>
        <Txt variant="caption" color={colors.muted} numberOfLines={1}>
          {plant.name?.en && loc(plant.name) !== plant.name.en ? `${plant.name.en} · ` : ''}
          <Txt variant="caption" color={colors.muted} style={{ fontStyle: 'italic' }}>
            {plant.scientificName}
          </Txt>
        </Txt>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <VerificationBadge status={plant.verification?.status} />
        </View>
      </View>
      {right || <Ionicons name="chevron-forward" size={20} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, alignSelf: 'flex-start' },
  tile: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.sm, ...shadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.sm,
    marginBottom: space.md,
    ...shadow,
  },
});
