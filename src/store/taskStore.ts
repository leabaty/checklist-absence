import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskState } from '../types';
import { TASKS } from '../data/tasks';

const STORAGE_KEY_STATE = '@checklist_task_state';
const STORAGE_KEY_LAST_RESET = '@checklist_last_daily_reset';
const STORAGE_KEY_CLEANING_SESSION = '@checklist_cleaning_session';

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Load / Save ────────────────────────────────────────────────────────────

export async function loadTaskState(): Promise<TaskState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveTaskState(state: TaskState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
}

// ─── Daily reset ────────────────────────────────────────────────────────────

export async function applyDailyReset(state: TaskState): Promise<TaskState> {
  const today = todayString();
  try {
    const lastReset = await AsyncStorage.getItem(STORAGE_KEY_LAST_RESET);
    if (lastReset === today) return state; // already reset today

    const dailyTaskIds = TASKS.filter((t) => t.recurring === 'daily').map((t) => t.id);
    const weeklyTaskIds = TASKS.filter((t) => t.recurring === 'weekly').map((t) => t.id);

    const newState: TaskState = { ...state };

    // Reset daily tasks every day
    dailyTaskIds.forEach((id) => {
      newState[id] = { done: false };
    });

    // Reset weekly tasks only on Monday
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon
    if (dayOfWeek === 1) {
      weeklyTaskIds.forEach((id) => {
        newState[id] = { done: false };
      });
    }

    await AsyncStorage.setItem(STORAGE_KEY_LAST_RESET, today);
    return newState;
  } catch {
    return state;
  }
}

// ─── Cleaning session ────────────────────────────────────────────────────────

export async function startNewCleaningSession(state: TaskState): Promise<TaskState> {
  const cleaningIds = TASKS.filter((t) => t.recurring === 'cleaning').map((t) => t.id);
  const newState: TaskState = { ...state };
  cleaningIds.forEach((id) => {
    newState[id] = { done: false };
  });
  const session = { startedAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY_CLEANING_SESSION, JSON.stringify(session));
  return newState;
}

export async function toggleTask(
  taskId: string,
  state: TaskState
): Promise<TaskState> {
  const current = state[taskId];
  const newState: TaskState = {
    ...state,
    [taskId]: {
      done: !current?.done,
      doneAt: !current?.done ? new Date().toISOString() : undefined,
    },
  };
  await saveTaskState(newState);
  return newState;
}
