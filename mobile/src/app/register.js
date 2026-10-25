/** Screen 2b – Registration (always creates a farmer/user account) */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { homeForRole, useAuth } from '../lib/auth';
import { errorMessage, useI18n } from '../lib/i18n';
import { Banner, Button, Field, Screen, Txt } from '../components/ui';
import { DistrictSelect } from '../components/forms';
import { colors, space } from '../theme';

export default function Register() {
  const { register } = useAuth();
  const { t, lang } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', district: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = t('required');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = t('required');
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = t('passwordHint');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);
    setError(null);
    try {
      const u = await register({ ...form, email: form.email.trim(), name: form.name.trim(), language: lang });
      router.replace(homeForRole(u.role));
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Txt color={colors.inkSoft} style={{ marginBottom: space.xl }}>
          {t('registerSubtitle')}
        </Txt>
        {error ? <Banner tone="danger" text={error} style={{ marginBottom: space.lg }} /> : null}
        <Field label={t('name')} value={form.name} onChangeText={set('name')} error={errors.name} autoComplete="name" />
        <Field
          label={t('email')}
          value={form.email}
          onChangeText={set('email')}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label={t('password')}
          value={form.password}
          onChangeText={set('password')}
          error={errors.password}
          hint={t('passwordHint')}
          secureTextEntry
          autoComplete="new-password"
        />
        <Field label={`${t('phone')} ${t('optional')}`} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <DistrictSelect value={form.district} onChange={set('district')} />
        <Button title={t('createAccount')} onPress={submit} loading={busy} icon="person-add" />
        <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: space.xl }} accessibilityRole="link">
          <Txt weight="semibold" color={colors.primary}>
            {t('haveAccount')}
          </Txt>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}
