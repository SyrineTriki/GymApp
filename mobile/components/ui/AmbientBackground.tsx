import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props { colorA: string; colorB: string; }

// Lightweight approximation of the web app's `.ambient-orb` glow — soft,
// low-opacity color blobs behind the content. No extra native deps required.
export function AmbientBackground({ colorA, colorB }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.orb, { backgroundColor: colorA, top: -80, right: -60, width: 260, height: 260 }]} />
      <View style={[styles.orb, { backgroundColor: colorB, top: 420, left: -80, width: 220, height: 220 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
});
