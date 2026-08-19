import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ExercisesService, ExerciseSummary, imgSrc } from '../../../services/exercises.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, radius, spacing } from '../../../constants/theme';

const PAGE_SIZE = 30;

export default function ExerciseLibrary() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState('all');
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [items, setItems] = useState<ExerciseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    ExercisesService.filters().then(f => setBodyParts(f.body_parts)).catch(() => {});
  }, []);

  const search = useCallback(async (q: string, bp: string) => {
    setLoading(true);
    try {
      const res = await ExercisesService.list({ q: q || undefined, body_part: bp, limit: PAGE_SIZE, offset: 0 });
      setItems(res.items);
      setTotal(res.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query, bodyPart), 300);   // debounce typing
    return () => clearTimeout(t);
  }, [query, bodyPart, search]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await ExercisesService.list({ q: query || undefined, body_part: bodyPart, limit: PAGE_SIZE, offset: items.length });
      setItems(prev => [...prev, ...res.items]);
    } catch { /* ignore */ }
    finally { setLoadingMore(false); }
  }

  const chips = ['all', ...bodyParts];

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.rose} />
      <View style={styles.content}>
        <ScreenHeader title="Library" subtitle={`${total} exercises`} accent={colors.amber} />

        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises…"
            placeholderTextColor={colors.textHint}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={chips} keyExtractor={c => c}
          style={{ marginBottom: spacing.md, flexGrow: 0 }}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setBodyPart(item)}
              style={[styles.chip, bodyPart === item && { backgroundColor: colors.amberDim, borderColor: colors.amber }]}
            >
              <Text style={[styles.chipText, bodyPart === item && { color: colors.amber }]}>
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {loading ? <Loader accent={colors.amber} /> : (
          <FlatList
            data={items}
            keyExtractor={e => e.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 120 }}
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            ListEmptyComponent={<EmptyState icon="🔍" title="No exercises found" body="Try a different search term or filter." />}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.amber} style={{ marginTop: 10 }} /> : null}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/(athlete)/exercise/${item.id}`)}
              >
                {imgSrc(item.image_filename) ? (
                  <Image source={{ uri: imgSrc(item.image_filename) }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}><Feather name="image" size={20} color={colors.textHint} /></View>
                )}
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.meta}>{item.target_muscle} · {item.equipment}</Text>
              </TouchableOpacity>
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
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 12, height: 44, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: font.sm },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'capitalize' },
  card: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 10, gap: 6,
  },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.surface2 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' },
});
