import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTasks } from '../context/TaskContext';
import { TASKS } from '../data/tasks';
import { Colors, Spacing, Radius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const CARD_TILT = 8; // degrees

export default function CleaningScreen() {
  const { taskState, toggle, resetCleaning } = useTasks();

  const cleaningTasks = TASKS.filter((t) => t.recurring === 'cleaning').sort(
    (a, b) => a.order - b.order
  );

  // Only show undone tasks on the stack
  const pendingTasks = cleaningTasks.filter((t) => !taskState[t.id]?.done);
  const doneCount = cleaningTasks.length - pendingTasks.length;

  const [currentIndex, setCurrentIndex] = useState(0);

  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [`-${CARD_TILT}deg`, '0deg', `${CARD_TILT}deg`],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const doneOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const laterOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Refs so the panResponder (created once) always calls the latest versions
  const swipeOutRef = useRef<(direction: 'right' | 'left') => void>(() => {});
  const resetPositionRef = useRef<() => void>(() => {});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOutRef.current('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOutRef.current('left');
        } else {
          resetPositionRef.current();
        }
      },
    })
  ).current;

  function swipeOut(direction: 'right' | 'left') {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(async () => {
      const task = pendingTasks[currentIndex % pendingTasks.length];
      if (direction === 'right') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await toggle(task.id);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentIndex((i) => (i + 1) % pendingTasks.length);
      }
      position.setValue({ x: 0, y: 0 });
    });
  }

  function resetPosition() {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }

  // Update refs on every render so panResponder always calls latest versions
  swipeOutRef.current = swipeOut;
  resetPositionRef.current = resetPosition;

  // All done!
  if (pendingTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.allDoneCard}>
          <Text style={styles.allDoneEmoji}>🎉</Text>
          <Text style={styles.allDoneTitle}>Bravo Bébou !</Text>
          <Text style={styles.allDoneText}>
            Toutes les {cleaningTasks.length} tâches ménage sont faites. T'es le roi de la propreté 🧼✨
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetCleaning}>
            <Text style={styles.resetButtonText}>🔄 Nouvelle session ménage</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const task = pendingTasks[currentIndex % pendingTasks.length];

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {doneCount}/{cleaningTasks.length} tâches faites
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(doneCount / cleaningTasks.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Swipe hints */}
      <View style={styles.hintsRow}>
        <Text style={styles.hintLeft}>⏭️ Plus tard</Text>
        <Text style={styles.hintRight}>Fait ✅</Text>
      </View>

      {/* Card stack */}
      <View style={styles.cardContainer}>
        {/* Background card (next) */}
        {pendingTasks.length > 1 && (
          <View style={[styles.card, styles.cardBehind]}>
            <Text style={styles.cardIcon}>
              {pendingTasks[(currentIndex + 1) % pendingTasks.length].icon}
            </Text>
            <Text style={styles.cardTitle}>
              {pendingTasks[(currentIndex + 1) % pendingTasks.length].title}
            </Text>
          </View>
        )}

        {/* Swipeable top card */}
        <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
          {/* Swipe feedback overlays */}
          <Animated.View style={[styles.overlay, styles.overlayDone, { opacity: doneOpacity }]}>
            <Text style={styles.overlayText}>✅ FAIT</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.overlayLater, { opacity: laterOpacity }]}>
            <Text style={styles.overlayText}>⏭️ PLUS TARD</Text>
          </Animated.View>

          <Text style={styles.cardIcon}>{task.icon}</Text>
          <Text style={styles.cardTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.cardDescription}>{task.description}</Text>
          )}
          {task.tips && (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsLabel}>💡 Conseils</Text>
              <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.tipsText}>{task.tips}</Text>
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionLater]}
          onPress={() => swipeOut('left')}
        >
          <Text style={styles.actionButtonText}>⏭️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionDone]}
          onPress={() => swipeOut('right')}
        >
          <Text style={styles.actionButtonText}>✅</Text>
        </TouchableOpacity>
      </View>

      {/* Reset session */}
      <TouchableOpacity style={styles.resetLink} onPress={resetCleaning}>
        <Text style={styles.resetLinkText}>🔄 Nouvelle session ménage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  progressContainer: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textMedium,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  hintsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hintLeft: {
    color: Colors.swipeLater,
    fontWeight: '600',
    fontSize: 13,
    opacity: 0.7,
  },
  hintRight: {
    color: Colors.swipeDone,
    fontWeight: '600',
    fontSize: 13,
    opacity: 0.7,
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - Spacing.md * 2,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 200,
  },
  cardBehind: {
    transform: [{ scale: 0.94 }, { translateY: 12 }],
    opacity: 0.7,
  },
  overlay: {
    position: 'absolute',
    top: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 3,
    zIndex: 10,
  },
  overlayDone: {
    right: Spacing.md,
    borderColor: Colors.swipeDone,
    backgroundColor: `${Colors.swipeDone}22`,
    transform: [{ rotate: '12deg' }],
  },
  overlayLater: {
    left: Spacing.md,
    borderColor: Colors.swipeLater,
    backgroundColor: `${Colors.swipeLater}22`,
    transform: [{ rotate: '-12deg' }],
  },
  overlayText: {
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 2,
    color: Colors.textDark,
  },
  cardIcon: {
    fontSize: 56,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tipsBox: {
    width: '100%',
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  tipsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textMedium,
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionLater: {
    backgroundColor: '#FFF0F0',
    borderWidth: 2,
    borderColor: Colors.swipeLater,
  },
  actionDone: {
    backgroundColor: '#F0FFF4',
    borderWidth: 2,
    borderColor: Colors.swipeDone,
  },
  actionButtonText: {
    fontSize: 32,
  },
  resetLink: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  resetLinkText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  allDoneCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  allDoneEmoji: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  allDoneTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  allDoneText: {
    fontSize: 16,
    color: Colors.textMedium,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
