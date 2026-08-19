import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, font, radius } from '../../constants/theme';

// Maps each route name to its icon + label, e.g.
// { home: { icon: 'home', label: 'Home' }, clients: { icon: 'users', label: 'Clients' } }
export type TabConfig = Record<string, { icon: keyof typeof Feather.glyphMap; label: string }>;

interface Props extends BottomTabBarProps {
  accent: string;
  config: TabConfig;
}

export function CustomTabBar({ state, navigation, accent, config }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const meta = config[route.name];
        if (!meta) return null;
        const focused = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={[styles.tab, focused && { backgroundColor: accent + '22' }]}
            activeOpacity={0.75}
          >
            <Feather name={meta.icon} size={18} color={focused ? accent : colors.textMuted} />
            <Text style={[styles.label, { color: focused ? accent : colors.textMuted }]}>{meta.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(19,19,26,0.92)', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, paddingVertical: 8, paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  tab: { alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.md, minWidth: 56 },
  label: { fontSize: 10, fontWeight: '700' },
});
