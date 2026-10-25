/** Screen 2a – Login */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { homeForRole, useAuth } from '../lib/auth';
import { errorMessage, useI18n } from '../lib/i18n';
import { Banner, Button, Field, Screen, Txt } from '../components/ui';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { colors, radius, space } from '../theme';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError(t('required'));
    setBusy(true);
    setError(null);
    try {
      const u = await login(email.trim(), password);
      router.replace(homeForRole(u.role));
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'flex-end' }}>
          <LanguageSwitch />
        </View>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Ionicons name="leaf" size={40} color={colors.white} />
          </View>
          <Txt variant="heading" weight="bold" color={colors.primary}>
            {t('appName')}
          </Txt>
        </View>
        <Txt variant="title" weight="bold">
          {t('welcomeBack')}
        </Txt>
        <Txt color={colors.inkSoft} style={{ marginBottom: space.xl }}>
          {t('loginSubtitle')}
        </Txt>

        {error ? <Banner tone="danger" text={error} style={{ marginBottom: space.lg }} /> : null}

        <Field
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        <Button title={t('login')} onPress={submit} loading={busy} icon="log-in" />

        <Pressable onPress={() => router.push('/register')} style={styles.link} accessibilityRole="link">
          <Txt weight="semibold" color={colors.primary}>
            {t('noAccount')}
          </Txt>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginVertical: space.xl, gap: space.sm },
  mark: { width: 76, height: 76, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  link: { alignItems: 'center', paddingVertical: space.xl },
});
