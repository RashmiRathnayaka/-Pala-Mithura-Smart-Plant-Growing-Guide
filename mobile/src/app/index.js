/** Screen 1 – Splash: logo + Sinhala name while the saved session is restored. */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { homeForRole, useAuth } from '../lib/auth';
import { takeReturnTo } from '../lib/appearance';
import { useI18n } from '../lib/i18n';
import { Txt } from '../components/ui';
import { BRAND, colors, space, themed } from '../theme';

export default function Splash() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  // After switching light/dark the screens remount; go straight back to where the user was.
  const [returnTo] = useState(() => takeReturnTo());
  const [minTimeDone, setMinTimeDone] = useState(!!returnTo);

  useEffect(() => {
    const id = setTimeout(() => setMinTimeDone(true), 900);
    return () => clearTimeout(id);
  }, []);

  if (ready && minTimeDone) return <Redirect href={user ? returnTo || homeForRole(user.role) : '/login'} />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.mark}>
        <Ionicons name="leaf" size={64} color={colors.white} />
      </View>
      <Txt variant="display" weight="bold" color={colors.white} style={{ marginTop: space.lg }}>
        පැළ මිතුරා
      </Txt>
      <Txt color="rgba(255,255,255,0.85)">Pala Mithura</Txt>
      <Txt variant="caption" color="rgba(255,255,255,0.75)" style={styles.tagline}>
        {t('tagline')}
      </Txt>
    </View>
  );
}

const styles = themed(() => ({
  root: { flex: 1, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  mark: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: { position: 'absolute', bottom: 56 },
}));
