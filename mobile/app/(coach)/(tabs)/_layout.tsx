import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar, TabConfig } from '../../../components/ui/CustomTabBar';
import { colors } from '../../../constants/theme';

const config: TabConfig = {
  home:     { icon: 'grid',            label: 'Home' },
  clients:  { icon: 'users',           label: 'Clients' },
  sessions: { icon: 'calendar',        label: 'Sessions' },
  programs: { icon: 'clipboard',       label: 'Plans' },
  messages: { icon: 'message-circle',  label: 'Chat' },
};

export default function CoachTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <CustomTabBar {...props} accent={colors.amber} config={config} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="clients" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="programs" />
      <Tabs.Screen name="messages" />
    </Tabs>
  );
}
