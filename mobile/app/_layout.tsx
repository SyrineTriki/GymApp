import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { token, role, status, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token) { router.replace('/(auth)/register'); return; }
    if (role === 'athlete') { router.replace('/(athlete)/home'); return; }
    if (role === 'coach') {
      if (status === 'pending')  { router.replace('/(coach)/pending'); return; }
      if (status === 'approved') { router.replace('/(coach)/home');    return; }
      router.replace('/(coach)/pending');
      return;
    }
    router.replace('/(auth)/register');
  }, [loading, token, role, status]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }} />
    </>
  );
}
