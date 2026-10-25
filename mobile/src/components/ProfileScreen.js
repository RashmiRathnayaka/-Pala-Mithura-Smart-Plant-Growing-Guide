/** Screen 14 – Profile & settings: details, language, district/zone, password, logout. */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirmAction } from '../lib/confirm';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { errorMessage, useI18n } from '../lib/i18n';
import { API_URL } from '../lib/config';
import { Banner, Button, Card, Field, InfoRow, Screen, Select, Txt } from './ui';
import { DistrictSelect } from './forms';
import { LanguageSwitch } from './LanguageSwitch';
import { colors, space } from '../theme';

export default function ProfileScreen() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', district: user?.district || '', agroZone: user?.agroZone || '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return null;

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await updateProfile(form);
      setMsg({ tone: 'success', text: t('saved') });
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setMsg(null);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '' });
      setMsg({ tone: 'success', text: t('saved') });
    } catch (err) {
      setMsg({ tone: 'danger', text: errorMessage(err, t) });
    }
  };

  const doLogout = () => {
    logout();
    router.replace('/login');
  };

  const zones = ['wet', 'intermediate', 'dry', 'up_country', 'mid_country', 'low_country'];

  return (
    <Screen>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyLg" weight="bold">
            {user.name}
          </Txt>
          <Txt variant="caption" color={colors.inkSoft}>
            {user.email}
          </Txt>
          <Txt variant="caption" weight="semibold" color={colors.soil}>
            {t(`role_${user.role}`)}
          </Txt>
        </View>
      </Card>

      {msg ? <Banner tone={msg.tone} text={msg.text} style={{ marginBottom: space.lg }} /> : null}

      <Card style={{ marginBottom: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt weight="bold" style={{ flex: 1 }}>
            {t('language')}
          </Txt>
          <LanguageSwitch />
        </View>
      </Card>

      {user.role === 'user' ? (
        <Card style={{ marginBottom: space.lg }}>
          <Pressable onPress={() => router.push('/favorites')} accessibilityRole="button">
            <InfoRow icon="heart" label={t('favorites')} />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} accessibilityRole="button">
            <InfoRow icon="notifications" label={t('notifications')} last />
          </Pressable>
        </Card>
      ) : (
        <Button
          title={user.role === 'admin' ? t('adminDashboard') : t('instructorDashboard')}
          icon="grid"
          variant="secondary"
          onPress={() => router.replace(user.role === 'admin' ? '/admin' : '/instructor')}
          style={{ marginBottom: space.lg }}
        />
      )}

      <Card style={{ marginBottom: space.lg }}>
        <Field label={t('name')} value={form.name} onChangeText={set('name')} />
        <Field label={t('phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <DistrictSelect value={form.district} onChange={set('district')} />
        <Select
          label={t('agroZone')}
          value={form.agroZone}
          onChange={set('agroZone')}
          placeholder={t('agroZone')}
          options={zones.map((z) => ({ value: z, label: t(`zone_${z}`) }))}
        />
        <Button title={t('save')} icon="save" onPress={save} loading={busy} />
      </Card>

      <Card style={{ marginBottom: space.lg }}>
        <Txt weight="bold" style={{ marginBottom: space.md }}>
          {t('changePassword')}
        </Txt>
        <Field label={t('currentPassword')} value={pw.current} onChangeText={(v) => setPw((p) => ({ ...p, current: v }))} secureTextEntry />
        <Field label={t('newPassword')} value={pw.next} onChangeText={(v) => setPw((p) => ({ ...p, next: v }))} secureTextEntry hint={t('passwordHint')} />
        <Button title={t('changePassword')} icon="key" variant="secondary" onPress={savePassword} disabled={!pw.current || pw.next.length < 8} />
      </Card>

      <Button
        title={t('logout')}
        icon="log-out"
        variant="danger"
        onPress={() => confirmAction({ title: t('logout'), confirmText: t('logout'), cancelText: t('cancel'), onConfirm: doLogout })}
      />
      <Txt variant="caption" color={colors.muted} style={{ textAlign: 'center', marginTop: space.lg }}>
        {t('serverAt', { url: API_URL })}
      </Txt>
    </Screen>
  );
}
