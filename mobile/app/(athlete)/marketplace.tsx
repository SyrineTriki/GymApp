import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MarketplaceService, MarketplaceItem } from '../../services/marketplace.service';
import { AmbientBackground } from '../../components/ui/AmbientBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { colors, font, spacing } from '../../constants/theme';

const CATEGORIES = [
  { label: 'All', value: '' }, { label: 'Supplements', value: 'supplement' },
  { label: 'Gear', value: 'gear' }, { label: 'Apparel', value: 'apparel' }, { label: 'Services', value: 'service' },
];

export default function Marketplace() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(c = category) {
    try { setItems(await MarketplaceService.list(c || undefined)); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { setLoading(true); load(category); }, [category]));

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.teal} colorB={colors.violet} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={CATEGORIES} keyExtractor={c => c.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setCategory(item.value)}
                style={[styles.chip, category === item.value && { backgroundColor: colors.tealDim, borderColor: colors.teal }]}
              >
                <Text style={[styles.chipText, category === item.value && { color: colors.teal }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ gap: 8 }}
          />
        </View>

        {loading ? <Loader accent={colors.teal} /> : (
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(category); }} tintColor={colors.teal} />}
            ListEmptyComponent={<EmptyState icon="🛍️" title="No items in this category" body="Check back soon for new listings." />}
            renderItem={({ item }) => (
              <GlassCard style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
                  <Text style={styles.seller}>{item.seller_name}{item.rating ? ` · ⭐ ${item.rating}` : ''}</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.price}>{item.price} {item.currency}</Text>
                  <Badge label={item.in_stock ? 'In stock' : 'Out of stock'} tone={item.in_stock ? 'success' : 'error'} />
                </View>
              </GlassCard>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: font.base, fontWeight: '800', color: colors.text },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted },
  card: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  name: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  desc: { fontSize: font.xs, color: colors.textMuted, marginTop: 3, lineHeight: 16 },
  seller: { fontSize: 11, color: colors.textHint, marginTop: 6 },
  priceCol: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: font.sm, fontWeight: '800', color: colors.teal },
});
