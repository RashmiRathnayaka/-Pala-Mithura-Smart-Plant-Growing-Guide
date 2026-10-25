import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { colors, fonts } from '../../theme';

export default function TabsLayout() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  if (ready && !user) return <Redirect href="/login" />;

  const icon = (name) =>
    function TabIcon({ color, focused }) {
      return <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />;
    };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 64, paddingTop: 6 },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('tabHome'), headerShown: false, tabBarIcon: icon('home') }} />
      <Tabs.Screen name="garden" options={{ title: t('tabGarden'), headerTitle: t('myGarden'), tabBarIcon: icon('leaf') }} />
      <Tabs.Screen name="report" options={{ title: t('tabReport'), headerTitle: t('problemTitle'), tabBarIcon: icon('camera') }} />
      <Tabs.Screen name="advice" options={{ title: t('tabAdvice'), headerTitle: t('myRecommendations'), tabBarIcon: icon('chatbubbles') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabProfile'), headerTitle: t('profile'), tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
