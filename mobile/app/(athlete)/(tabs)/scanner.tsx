import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { NutritionService, NutritionLog } from '../../../services/nutrition.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StyledInput } from '../../../components/StyledInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { PickerField } from '../../../components/ui/PickerField';
import { colors, font, spacing } from '../../../constants/theme';

const MEALS = [
  { label: 'Breakfast', value: 'breakfast' }, { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' }, { label: 'Snack', value: 'snack' },
];

export default function AthleteScanner() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState('snack');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { setLogs(await NutritionService.listLogs()); }
    catch { /* ignore */ }
    finally { setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function submit() {
    if (!foodName.trim()) { Alert.alert('Missing info', 'Enter what you ate.'); return; }
    setSaving(true);
    try {
      await NutritionService.log({
        food_name: foodName.trim(), quantity: Number(quantity) || 1, unit,
        meal_type: mealType as any, calories: calories ? Number(calories) : undefined,
      });
      setFoodName(''); setQuantity('1'); setCalories('');
      load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not log this item.');
    } finally { setSaving(false); }
  }

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.teal} />}
      >
        <ScreenHeader title="Log Food" subtitle="Track what you eat" accent={colors.teal} />

        <GlassCard style={{ gap: 12, marginBottom: spacing.lg }}>
          <StyledInput label="Food" placeholder="e.g. Grilled chicken breast" value={foodName} onChangeText={setFoodName} containerStyle={{ marginBottom: 0 }} />
          <View style={styles.row}>
            <StyledInput label="Qty" value={quantity} onChangeText={setQuantity} keyboardType="numeric" containerStyle={{ flex: 1, marginBottom: 0 }} />
            <StyledInput label="Unit" value={unit} onChangeText={setUnit} containerStyle={{ flex: 1, marginBottom: 0 }} />
            <StyledInput label="Cal (opt.)" value={calories} onChangeText={setCalories} keyboardType="numeric" containerStyle={{ flex: 1, marginBottom: 0 }} />
          </View>
          <PickerField label="Meal" placeholder="Select meal" accent={colors.teal} value={mealType} options={MEALS} onSelect={setMealType} />
          <PrimaryButton label="Log it" onPress={submit} loading={saving} style={{ backgroundColor: colors.teal }} />
        </GlassCard>

        <Text style={styles.sectionTitle}>Today's log</Text>
        {logs.length === 0 ? (
          <EmptyState icon="🍽️" title="Nothing logged yet" body="Add your meals above to keep track of what you eat." />
        ) : (
          logs.slice(0, 20).map(l => (
            <GlassCard key={l.id} style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{l.food_name}</Text>
                <Text style={styles.logMeta}>{l.quantity} {l.unit} · {new Date(l.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{l.calories ? ` · ${l.calories} kcal` : ''}</Text>
              </View>
              <Badge label={l.meal_type} tone="accent" accentColor={colors.teal} />
            </GlassCard>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  row: { flexDirection: 'row', gap: 8 },
  sectionTitle: { fontSize: font.base, fontWeight: '800', color: colors.text, marginBottom: 10 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  logName: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  logMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
});
