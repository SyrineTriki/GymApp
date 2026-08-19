import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

export interface PickerOption { label: string; value: string; }

interface Props {
  label: string;
  value: string;
  placeholder: string;
  options: PickerOption[];
  onSelect: (v: string) => void;
  accent?: string;
}

export function PickerField({ label, value, placeholder, options, onSelect, accent = colors.accent }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={selected ? styles.valueText : styles.placeholder}>{selected ? selected.label : placeholder}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={o => o.value}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && { backgroundColor: accent + '22', borderRadius: radius.sm }]}
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                >
                  <Text style={[styles.optionText, item.value === value && { color: accent, fontWeight: '700' }]}>{item.label}</Text>
                  {item.value === value && <Text style={{ color: accent, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No options available.</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, height: 48, paddingHorizontal: 14 },
  valueText: { color: colors.text, fontSize: font.base },
  placeholder: { color: colors.textHint, fontSize: font.base },
  chevron: { color: colors.textMuted, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sheetTitle: { fontSize: font.base, fontWeight: '700', color: colors.text, marginBottom: 12 },
  option: { paddingVertical: 14, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontSize: font.base, color: colors.textMuted },
  emptyText: { color: colors.textMuted, fontSize: font.sm, padding: 16, textAlign: 'center' },
});
