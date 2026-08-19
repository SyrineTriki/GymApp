import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

export function Loader({ accent = colors.accent }: { accent?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
});
