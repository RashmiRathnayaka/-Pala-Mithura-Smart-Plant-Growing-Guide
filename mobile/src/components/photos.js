/** Photo picker (camera or gallery) with thumbnails and removal. */
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { notify } from '../lib/confirm';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { useI18n } from '../lib/i18n';
import { Button, Txt } from './ui';

const MAX_MB = 5;

export async function pickImages({ camera = false, max = 6 } = {}) {
  const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const opts = { mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: !camera, selectionLimit: max };
  const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled) return [];
  return res.assets
    .filter((a) => !a.fileSize || a.fileSize <= MAX_MB * 1024 * 1024)
    .map((a) => ({ uri: a.uri, mimeType: a.mimeType || 'image/jpeg', fileName: a.fileName || undefined }));
}

export function PhotoPicker({ photos, onChange, max = 6 }) {
  const { t } = useI18n();
  const add = async (camera) => {
    try {
      const picked = await pickImages({ camera, max: max - photos.length });
      onChange([...photos, ...picked].slice(0, max));
    } catch (err) {
      notify(t('errGeneric'), err.message);
    }
  };
  return (
    <View>
      {photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingBottom: space.md }}>
          {photos.map((p, i) => (
            <View key={p.uri}>
              <Image source={{ uri: p.uri }} style={styles.thumb} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('delete')}
                onPress={() => onChange(photos.filter((_, j) => j !== i))}
                style={styles.remove}
                hitSlop={8}
              >
                <Ionicons name="close" size={16} color={colors.white} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
      {photos.length < max ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {Platform.OS !== 'web' ? (
            <Button title={t('takePhoto')} icon="camera" variant="secondary" onPress={() => add(true)} style={{ flex: 1 }} compact />
          ) : null}
          <Button title={t('pickPhoto')} icon="images" variant="secondary" onPress={() => add(false)} style={{ flex: 1 }} compact />
        </View>
      ) : null}
      <Txt variant="caption" color={colors.muted} style={{ marginTop: space.xs }}>
        {t('maxPhotos')} · {photos.length}/{max}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(22,36,27,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
