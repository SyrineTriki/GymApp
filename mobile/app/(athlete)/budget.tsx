import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { NutritionService, BudgetOptimizerResult } from '../../services/nutrition.service';
import { AmbientBackground } from '../../components/ui/AmbientBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { StyledInput } from '../../components/StyledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, font, radius, spacing } from '../../constants/theme';

export default function BudgetOptimizer() {
  const router = useRouter();
  const [budget, setBudget] = useState('50');
  const [result, setResult] = useState<BudgetOptimizerResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    const n = Number(budget);
    if (!n || n <= 0) { Alert.alert('Invalid budget', 'Enter a budget greater than 0.'); return; }
    setLoading(true);
    try { setResult(await NutritionService.budgetOptimizer(n)); }
    catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Budget optimizer</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.intro}>Enter what you can spend, and we'll suggest the most nutrition-dense grocery picks from the current price list to stretch it.</Text>

        <GlassCard style={styles.inputCard}>
          <StyledInput label="Weekly budget" placeholder="50" value={budget} onChangeText={setBudget} keyboardType="numeric" containerStyle={{ marginBottom: 0 }} />
          <PrimaryButton label="Optimize" onPress={run} loading={loading} style={{ backgroundColor: colors.teal, marginTop: 12 }} />
        </GlassCard>

        {result && (
          <>
            <View style={styles.summaryRow}>
              <SummaryPill label="Budget" value={`${result.budget} ${result.currency}`} />
              <SummaryPill label="Spent" value={`${result.total_spent} ${result.currency}`} accent={colors.teal} />
              <SummaryPill label="Left" value={`${result.remaining} ${result.currency}`} />
            </View>

            <Text style={styles.sectionTitle}>Suggested groceries</Text>
            {result.items.length === 0 ? (
              <EmptyState icon="🛒" title="No items fit this budget" body="Try increasing your budget." />
            ) : (
              result.items.map(item => (
                <GlassCard key={item.food_id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{item.suggested_units} × {item.unit} @ {item.price} {item.currency}</Text>
                  </View>
                  <Text style={styles.itemSubtotal}>{item.subtotal} {item.currency}</Text>
                </GlassCard>
              ))
            )}
          </>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function SummaryPill({ label, value, accent = colors.text }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color: accent }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  intro: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  inputCard: { marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  pill: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  pillValue: { fontSize: font.base, fontWeight: '800' },
  pillLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemName: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  itemSubtotal: { fontSize: font.sm, fontWeight: '800', color: colors.teal },
});
