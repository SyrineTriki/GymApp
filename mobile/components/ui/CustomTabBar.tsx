import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, font, radius } from '../../constants/theme';

export type TabConfig = Record<string, { icon: keyof typeof Feather.glyphMap; label: string }>;

interface Props extends BottomTabBarProps {
  accent: string;
  config: TabConfig;
}

export function CustomTabBar({ state, navigation, accent, config }: Props) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter(r => config[r.name]);
  const compact = visibleRoutes.length > 5;

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12), paddingHorizontal: compact ? 4 : 6 }]}>
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        const meta = config[route.name];
        const focused = state.index === index;
        const showLabel = !compact || focused;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={[
              styles.tab,
              compact && styles.tabCompact,
              focused && { backgroundColor: accent + '22' },
            ]}
            activeOpacity={0.75}
          >
            <Feather name={meta.icon} size={compact ? 17 : 18} color={focused ? accent : colors.textMuted} />
            {showLabel && (
              <Text
                style={[styles.label, compact && styles.labelCompact, { color: focused ? accent : colors.textMuted }]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(19,19,26,0.92)', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  tab: { alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.md, minWidth: 56 },
  tabCompact: { paddingHorizontal: 6, minWidth: 34, flex: 1 },
  label: { fontSize: 10, fontWeight: '700' },
  labelCompact: { fontSize: 9 },
});