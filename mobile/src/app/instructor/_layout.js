import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { Loading } from '../../components/ui';
import { colors, fonts } from '../../theme';

/** Instructor area – only instructors (and admins for oversight) can enter. */
export default function InstructorLayout() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (!['instructor', 'admin'].includes(user.role)) return <Redirect href="/home" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('instructorDashboard') }} />
      <Stack.Screen name="queue" options={{ title: t('reviewQueue') }} />
      <Stack.Screen name="review/[id]" options={{ title: t('review') }} />
      <Stack.Screen name="history" options={{ title: t('reviewHistory') }} />
    </Stack>
  );
}
