import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TaskState } from '../types';
import {
  loadTaskState,
  saveTaskState,
  applyDailyReset,
  toggleTask,
  startNewCleaningSession,
} from '../store/taskStore';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useHousehold } from './HouseholdContext';
import { TASKS } from '../data/tasks';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface TaskContextValue {
  taskState: TaskState;
  toggle: (id: string) => Promise<void>;
  resetCleaning: () => Promise<void>;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { householdId, currentUser } = useHousehold();

  // ── Local state (daily + weekly + cleaning solo) ─────────────────────────
  const [localState, setLocalState] = useState<TaskState>({});
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  // ── Firestore state (cleaning tasks when in household) ───────────────────
  const [firestoreCleaningState, setFirestoreCleaningState] = useState<TaskState>({});
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(false);

  // Derived merged state: Firestore cleaning state overrides local for cleaning tasks
  const taskState = useMemo<TaskState>(() => {
    if (!householdId) return localState;
    return { ...localState, ...firestoreCleaningState };
  }, [localState, firestoreCleaningState, householdId]);

  const isLoading = isLoadingLocal || isLoadingFirestore;

  // ── Load local state from AsyncStorage on mount ──────────────────────────
  useEffect(() => {
    (async () => {
      let state = await loadTaskState();
      state = await applyDailyReset(state);
      await saveTaskState(state);
      setLocalState(state);
      setIsLoadingLocal(false);
    })();
  }, []);

  // ── Subscribe to Firestore cleaning tasks when household is set ───────────
  useEffect(() => {
    if (!householdId) {
      setFirestoreCleaningState({});
      setIsLoadingFirestore(false);
      return;
    }

    setIsLoadingFirestore(true);
    const colRef = collection(db, 'households', householdId, 'tasks');

    const unsub = onSnapshot(colRef, async (snap) => {
      const now = Date.now();
      const newState: TaskState = {};
      const autoResetBatch = writeBatch(db);
      let hasAutoResets = false;

      snap.forEach((docSnap) => {
        const data = docSnap.data() as { done: boolean; doneAt?: string; doneBy?: string };
        // 7-day auto-reset
        if (data.done && data.doneAt) {
          const doneTime = new Date(data.doneAt).getTime();
          if (now - doneTime > SEVEN_DAYS_MS) {
            // Expired — reset in Firestore
            autoResetBatch.set(doc(db, 'households', householdId, 'tasks', docSnap.id), {
              done: false,
              doneAt: null,
              doneBy: null,
            });
            newState[docSnap.id] = { done: false };
            hasAutoResets = true;
            return;
          }
        }
        newState[docSnap.id] = {
          done: data.done ?? false,
          doneAt: data.doneAt,
          doneBy: data.doneBy,
        };
      });

      if (hasAutoResets) {
        await autoResetBatch.commit();
      }

      setFirestoreCleaningState(newState);
      setIsLoadingFirestore(false);
    });

    return unsub;
  }, [householdId]);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggle = async (id: string) => {
    const task = TASKS.find((t) => t.id === id);
    const isCleaning = task?.recurring === 'cleaning';

    if (isCleaning && householdId) {
      // Firestore path
      const current = taskState[id];
      const nowDone = !current?.done;
      await setDoc(doc(db, 'households', householdId, 'tasks', id), {
        done: nowDone,
        doneAt: nowDone ? new Date().toISOString() : null,
        doneBy: nowDone ? (currentUser?.pseudo ?? null) : null,
      });
      // Optimistic local update (will be overwritten by Firestore snapshot)
      setFirestoreCleaningState((prev) => ({
        ...prev,
        [id]: {
          done: nowDone,
          doneAt: nowDone ? new Date().toISOString() : undefined,
          doneBy: nowDone ? (currentUser?.pseudo ?? undefined) : undefined,
        },
      }));
    } else {
      // Local AsyncStorage path
      const newState = await toggleTask(id, localState);
      setLocalState(newState);
    }
  };

  // ── Reset cleaning ────────────────────────────────────────────────────────
  const resetCleaning = async () => {
    if (householdId) {
      const cleaningIds = TASKS.filter((t) => t.recurring === 'cleaning').map((t) => t.id);
      const batch = writeBatch(db);
      cleaningIds.forEach((id) => {
        batch.set(doc(db, 'households', householdId, 'tasks', id), {
          done: false,
          doneAt: null,
          doneBy: null,
        });
      });
      await batch.commit();
    } else {
      const newState = await startNewCleaningSession(localState);
      await saveTaskState(newState);
      setLocalState(newState);
    }
  };

  return (
    <TaskContext.Provider value={{ taskState, toggle, resetCleaning, isLoading }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used inside TaskProvider');
  return ctx;
}
