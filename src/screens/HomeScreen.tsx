import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTasks } from '../context/TaskContext';
import { TASKS } from '../data/tasks';
import { Colors, Spacing, Radius } from '../theme/colors';

export default function HomeScreen() {
  const { taskState, toggle, isLoading } = useTasks();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const dailyTasks = TASKS.filter((t) => t.recurring === 'daily');
  const weeklyTasks = TASKS.filter((t) => t.recurring === 'weekly');

  const dayOfWeek = new Date().getDay();
  const isMonday = dayOfWeek === 1;

  const urgentTasks = [
    ...dailyTasks,
    ...(isMonday ? weeklyTasks : []),
  ];

  const doneTodayCount = urgentTasks.filter((t) => taskState[t.id]?.done).length;
  const totalUrgent = urgentTasks.length;

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const today = new Date();
  const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${today.toLocaleString('fr-FR', { month: 'long' })}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header card */}
      <View style={styles.headerCard}>
        <Text style={styles.dateText}>{dateStr}</Text>
        <Text style={styles.summaryText}>
          {doneTodayCount === totalUrgent && totalUrgent > 0
            ? '🎉 Bravo bébou'
            : `${doneTodayCount}/${totalUrgent} tâches du jour`}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: totalUrgent > 0 ? `${(doneTodayCount / totalUrgent) * 100}%` : '0%' },
            ]}
          />
        </View>
      </View>

      {/* Daily tasks */}
      <Text style={styles.sectionTitle}>Tous les jours</Text>
      {dailyTasks.map((task) => {
        const done = taskState[task.id]?.done ?? false;
        return (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, done && styles.taskCardDone]}
            onPress={() => toggle(task.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.taskIcon}>{task.icon}</Text>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
              {task.description && (
                <Text style={styles.taskDesc}>{task.description}</Text>
              )}
            </View>
            <View style={[styles.checkbox, done && styles.checkboxDone]}>
              {done && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Weekly tasks (always shown, highlighted on Monday) */}
      <Text style={styles.sectionTitle}>
        Cette semaine {isMonday && <Text style={styles.urgentBadge}> Aujourd'hui !</Text>}
      </Text>
      {weeklyTasks.map((task) => {
        const done = taskState[task.id]?.done ?? false;
        return (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, done && styles.taskCardDone, isMonday && styles.taskCardUrgent]}
            onPress={() => toggle(task.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.taskIcon}>{task.icon}</Text>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
              {task.tips && (
                <Text style={styles.taskDesc}>{task.tips}</Text>
              )}
            </View>
            <View style={[styles.checkbox, done && styles.checkboxDone]}>
              {done && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}

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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dateText: {
    color: '#FFFFFF99',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#FFFFFF44',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  urgentBadge: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  taskCard: {
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
  taskCardDone: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  taskCardUrgent: {
    borderColor: Colors.primaryLight,
    borderWidth: 1.5,
  },
  taskIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
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
});
