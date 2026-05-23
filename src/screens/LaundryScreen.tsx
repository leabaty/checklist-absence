import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../theme/colors';

interface InfoItem {
  label?: string;
  text: string;
  warning?: boolean;
}

interface InfoSection {
  icon: string;
  title: string;
  color: string;
  items: InfoItem[];
}

const SECTIONS: InfoSection[] = [
  {
    icon: '👕',
    title: 'Tri du linge',
    color: Colors.category.lessive,
    items: [
      { label: 'Blanc', text: '1 pod de lessive + 2 cuillères à soupe de percarbonate de soude' },
      { label: 'Multicolore', text: '1 pod de lessive + lingette anti-décoloration' },
      { label: '40°C', text: 'Linge général' },
      { label: '60°C', text: 'Draps, serviettes, sous-vêtements' },
    ],
  },
  {
    icon: '🧴',
    title: 'Traitement des taches',
    color: '#FFF0D9',
    items: [
      { label: 'Tâche grasse', text: 'Bicarbonate de soude à laisser agir 30 minutes avant de frotter, puis liquide vaisselle' },
      { label: 'Tâche linge blanc', text: 'Spray rose + percarbonate, puis frotter' },
      { label: 'Tâche linge coloré', text: 'Spray rose, puis frotter' },
      {
        text: "⚠️ Jamais d'eau chaude sur une tâche avant traitement !",
        warning: true,
      },
    ],
  },
  {
    icon: '⚡',
    title: 'Heures creuses',
    color: '#FFFBD9',
    items: [
      { text: 'Nuit   0h38 → 6h38' },
      { text: 'Après-midi   15h08 → 17h08' },
    ],
  },
];

export default function LaundryScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>
        Je crois en toi bé ✊
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={[styles.card, { backgroundColor: section.color }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{section.icon}</Text>
            <Text style={styles.cardTitle}>{section.title}</Text>
          </View>
          <View style={styles.divider} />
          {section.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.itemRow,
                item.warning && styles.itemRowWarning,
                i < section.items.length - 1 && styles.itemRowBorder,
              ]}
            >
              {item.label ? (
                <>
                  <View style={styles.labelPill}>
                    <Text style={styles.labelText}>{item.label}</Text>
                  </View>
                  <Text style={styles.itemText}>{item.text}</Text>
                </>
              ) : (
                <Text style={[styles.itemText, item.warning && styles.warningText]}>
                  {item.text}
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.border}88`,
  },
  itemRowWarning: {
    backgroundColor: '#FFF3CC',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  labelPill: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    minWidth: 80,
    alignItems: 'center',
  },
  labelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  itemText: {
    fontSize: 14,
    color: Colors.textDark,
    flex: 1,
    lineHeight: 20,
  },
  warningText: {
    color: '#8B6914',
    fontWeight: '600',
    fontSize: 13,
  },
});
