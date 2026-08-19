import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar, TabConfig } from '../../../components/ui/CustomTabBar';
import { colors } from '../../../constants/theme';

const config: TabConfig = {
  home:     { icon: 'grid',      label: 'Home' },
  workout:  { icon: 'activity',  label: 'Train' },
  scanner:  { icon: 'camera',    label: 'Log Food' },
  aiCoach:  { icon: 'zap',       label: 'AI Coach' },
  profile:  { icon: 'user',      label: 'Profile' },
};

export default function AthleteTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <CustomTabBar {...props} accent={colors.teal} config={config} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="workout" />
      <Tabs.Screen name="scanner" />
      <Tabs.Screen name="aiCoach" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
