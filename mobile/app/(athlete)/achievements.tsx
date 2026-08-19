import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AchievementsService, Achievement } from '../../services/achievements.service';
import { AmbientBackground } from '../../components/ui/AmbientBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { Loader } from '../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../constants/theme';

export default function Achievements() {
  const router = useRouter();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    AchievementsService.list().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const earnedCount = items.filter(a => a.earned).length;

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.teal} colorB={colors.amber} /><Loader accent={colors.teal} /></View>;

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.amber} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.summary}>{earnedCount} of {items.length} unlocked</Text>

        <View style={styles.grid}>
          {items.map(a => (
            <GlassCard key={a.id} style={[styles.badge, !a.earned && styles.badgeLocked]} glowColor={a.earned ? colors.amber : undefined}>
              <Text style={[styles.icon, !a.earned && { opacity: 0.35 }]}>{a.icon}</Text>
              <Text style={[styles.title, !a.earned && { color: colors.textMuted }]}>{a.title}</Text>
              <Text style={styles.desc}>{a.description}</Text>
              <Text style={[styles.points, { color: a.earned ? colors.amber : colors.textHint }]}>{a.points} pts</Text>
            </GlassCard>
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  summary: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47.5%', alignItems: 'center', gap: 4, paddingVertical: 18 },
  badgeLocked: { opacity: 0.6 },
  icon: { fontSize: 30, marginBottom: 4 },
  title: { fontSize: font.sm, fontWeight: '800', color: colors.text, textAlign: 'center' },
  desc: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },
  points: { fontSize: 11, fontWeight: '800', marginTop: 4 },
});
