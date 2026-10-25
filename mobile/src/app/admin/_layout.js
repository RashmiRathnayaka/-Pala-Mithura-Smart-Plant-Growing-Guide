import { Redirect, Stack, useSegments } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { Loading } from '../../components/ui';
import { colors, fonts } from '../../theme';

// Instructors may maintain plant and disease data; everything else here is admin-only.
const INSTRUCTOR_ALLOWED = ['plants', 'plant-edit', 'disease-edit'];

export default function AdminLayout() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const segments = useSegments();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  const page = segments[1] || 'index';
  const allowed = user.role === 'admin' || (user.role === 'instructor' && INSTRUCTOR_ALLOWED.includes(page));
  if (!allowed) return <Redirect href={user.role === 'instructor' ? '/instructor' : '/home'} />;
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
      <Stack.Screen name="index" options={{ title: t('adminDashboard') }} />
      <Stack.Screen name="users" options={{ title: t('manageUsers') }} />
      <Stack.Screen name="plants" options={{ title: t('managePlants') }} />
      <Stack.Screen name="plant-edit" options={{ title: t('edit') }} />
      <Stack.Screen name="disease-edit" options={{ title: t('diseases') }} />
    </Stack>
  );
}
