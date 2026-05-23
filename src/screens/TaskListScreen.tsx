import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTasks } from '../context/TaskContext';
import { TASKS, CATEGORY_LABELS } from '../data/tasks';
import { Category } from '../types';
import { Colors, Spacing, Radius } from '../theme/colors';

const ALL_CATEGORIES: Array<Category | 'all'> = [
  'all',
  'chat',
  'plantes',
  'lessive',
  'menage',
  'cuisine',
  'salledebain',
  'poubelles',
];

export default function TaskListScreen() {
  const { taskState, toggle, resetCleaning } = useTasks();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const filteredTasks = TASKS.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  ).sort((a, b) => a.order - b.order);

  const totalDone = TASKS.filter((t) => taskState[t.id]?.done).length;

  return (
    <View style={styles.container}>
      {/* Category filter chips */}
      <View style={styles.chipsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {ALL_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const label = cat === 'all' ? 'Toutes ✨' : CATEGORY_LABELS[cat];
          const bgColor = cat !== 'all' ? Colors.category[cat] : undefined;
          const textColor = cat !== 'all' ? Colors.categoryText[cat] : undefined;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isActive && cat !== 'all' && { backgroundColor: textColor, borderColor: textColor },
                !isActive && cat !== 'all' && { backgroundColor: bgColor, borderColor: bgColor },
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                  isActive && cat !== 'all' && { color: '#FFFFFF' },
                  !isActive && cat !== 'all' && { color: textColor },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      {/* Stats */}
      <Text style={styles.statsText}>
        {totalDone}/{TASKS.length} tâches complètes
      </Text>

      {/* Task list */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const done = taskState[item.id]?.done ?? false;
          const catBg = Colors.category[item.category] ?? '#F5F5F5';
          return (
            <TouchableOpacity
              style={[styles.taskRow, done && styles.taskRowDone]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.catDot, { backgroundColor: Colors.categoryText[item.category] ?? Colors.primary }]} />
              <Text style={styles.taskIcon}>{item.icon}</Text>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={styles.taskDesc}>{item.description}</Text>
                )}
                <View style={[styles.catBadge, { backgroundColor: catBg }]}>
                  <Text style={[styles.catBadgeText, { color: Colors.categoryText[item.category] }]}>
                    {CATEGORY_LABELS[item.category]}
                  </Text>
                </View>
              </View>
              <View style={[styles.checkbox, done && styles.checkboxDone]}>
                {done && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.resetButton} onPress={resetCleaning}>
            <Text style={styles.resetButtonText}>🔄 Nouvelle session ménage</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chipsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    height: 54,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 34,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  statsText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskRowDone: {
    opacity: 0.55,
    backgroundColor: '#F5F5F5',
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  taskDesc: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  catBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkboxDone: {
    backgroundColor: Colors.swipeDone,
    borderColor: Colors.swipeDone,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    marginTop: Spacing.md,
    alignSelf: 'center',
    padding: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  resetButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
