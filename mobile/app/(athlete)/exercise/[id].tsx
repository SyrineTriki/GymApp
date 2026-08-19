import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ExercisesService, Exercise, gifSrc, imgSrc } from '../../../services/exercises.service';
import { AmbientBackground } from '../../../components/ui/AmbientBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Loader } from '../../../components/ui/Loader';
import { colors, font, spacing } from '../../../constants/theme';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ex, setEx] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    if (!id) return;
    ExercisesService.get(id).then(setEx).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.shell}><AmbientBackground colorA={colors.amber} colorB={colors.rose} /><Loader accent={colors.amber} /></View>;
  if (!ex) return <View style={styles.shell}><AmbientBackground colorA={colors.amber} colorB={colors.rose} /><Text style={styles.notFound}>Exercise not found.</Text></View>;

  const mediaUri = showGif ? gifSrc(ex.gif_filename) : imgSrc(ex.image_filename);

  return (
    <View style={styles.shell}>
      <AmbientBackground colorA={colors.amber} colorB={colors.rose} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="chevron-left" size={22} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{ex.name}</Text>
          <View style={{ width: 22 }} />
        </View>

        {mediaUri && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => ex.gif_filename && setShowGif(v => !v)}>
            <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
            {!!ex.gif_filename && (
              <View style={styles.mediaHint}>
                <Feather name={showGif ? 'image' : 'play'} size={12} color={colors.text} />
                <Text style={styles.mediaHintText}>{showGif ? 'Show photo' : 'Play animation'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.badgeRow}>
          <Badge label={ex.body_part} tone="accent" accentColor={colors.amber} />
          <Badge label={ex.equipment} tone="muted" />
          <Badge label={ex.target_muscle} tone="accent" accentColor={colors.rose} />
        </View>

        {!!ex.secondary_muscles.length && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Secondary muscles</Text>
            <Text style={styles.sectionBody}>{ex.secondary_muscles.join(', ')}</Text>
          </GlassCard>
        )}

        {!!ex.instructions.length && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>How to perform it</Text>
            {ex.instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: font.base, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: 100 },
  media: { width: '100%', aspectRatio: 1.3, borderRadius: 16, backgroundColor: colors.surface2 },
  mediaHint: {
    position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  mediaHintText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md, marginBottom: spacing.md },
  section: { marginBottom: 10, gap: 8 },
  sectionTitle: { fontSize: font.sm, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBody: { fontSize: font.sm, color: colors.textMuted, textTransform: 'capitalize', lineHeight: 20 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.amberDim, color: colors.amber, fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
  stepText: { flex: 1, fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },
});
