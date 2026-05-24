import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from '../firebase/config';
import { Member } from '../types';

const USER_ID_KEY = '@user_id';
const USER_PSEUDO_KEY = '@user_pseudo';
const HOUSEHOLD_ID_KEY = '@household_id';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout réseau')), ms)
    ),
  ]);
}

export interface CurrentUser {
  id: string;
  pseudo: string;
}

interface HouseholdContextValue {
  currentUser: CurrentUser | null;
  householdId: string | null;
  members: Member[];
  isInHousehold: boolean;
  isLoading: boolean;
  setPseudo: (pseudo: string) => Promise<void>;
  createHousehold: () => Promise<string>;
  joinHousehold: (id: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be inside HouseholdProvider');
  return ctx;
}

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted user + household from AsyncStorage
  useEffect(() => {
    (async () => {
      let userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!userId) {
        userId = Crypto.randomUUID();
        await AsyncStorage.setItem(USER_ID_KEY, userId);
      }
      const pseudo = (await AsyncStorage.getItem(USER_PSEUDO_KEY)) ?? '';
      const hId = await AsyncStorage.getItem(HOUSEHOLD_ID_KEY);
      setCurrentUser({ id: userId, pseudo });
      setHouseholdId(hId);
      setIsLoading(false);
    })();
  }, []);

  // Real-time Firestore listener for household members
  useEffect(() => {
    if (!householdId) {
      setMembers([]);
      return;
    }
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (snap.exists()) {
        setMembers((snap.data().members as Member[]) ?? []);
      }
    });
    return unsub;
  }, [householdId]);

  const setPseudo = useCallback(
    async (pseudo: string) => {
      if (!currentUser) return;
      await AsyncStorage.setItem(USER_PSEUDO_KEY, pseudo);
      setCurrentUser((prev) => (prev ? { ...prev, pseudo } : null));
      // Update pseudo in Firestore if member of a household
      if (householdId) {
        const hSnap = await getDoc(doc(db, 'households', householdId));
        if (hSnap.exists()) {
          const updated = ((hSnap.data().members as Member[]) ?? []).map((m) =>
            m.id === currentUser.id ? { ...m, pseudo } : m
          );
          await updateDoc(doc(db, 'households', householdId), { members: updated });
        }
      }
    },
    [currentUser, householdId]
  );

  const createHousehold = useCallback(async (): Promise<string> => {
    if (!currentUser) throw new Error('No user');
    const newId = Crypto.randomUUID();
    const member: Member = {
      id: currentUser.id,
      pseudo: currentUser.pseudo || 'Moi',
      joinedAt: new Date().toISOString(),
    };
    // Must confirm Firestore write before returning — the QR code is useless
    // if the doc doesn't exist yet when phone 2 tries to join.
    await withTimeout(
      setDoc(doc(db, 'households', newId), { members: [member] }),
      15_000
    );
    await AsyncStorage.setItem(HOUSEHOLD_ID_KEY, newId);
    setHouseholdId(newId);
    return newId;
  }, [currentUser]);

  const joinHousehold = useCallback(
    async (id: string) => {
      if (!currentUser) throw new Error('No user');
      // 10-second timeout so the UI never hangs forever
      const hSnap = await withTimeout(getDoc(doc(db, 'households', id)), 10_000);
      if (!hSnap.exists()) throw new Error('Foyer introuvable');
      const existing = ((hSnap.data().members as Member[]) ?? []).find(
        (m) => m.id === currentUser.id
      );
      if (!existing) {
        const member: Member = {
          id: currentUser.id,
          pseudo: currentUser.pseudo || 'Moi',
          joinedAt: new Date().toISOString(),
        };
        await withTimeout(
          updateDoc(doc(db, 'households', id), { members: arrayUnion(member) }),
          10_000
        );
      }
      await AsyncStorage.setItem(HOUSEHOLD_ID_KEY, id);
      setHouseholdId(id);
    },
    [currentUser]
  );

  const leaveHousehold = useCallback(async () => {
    await AsyncStorage.removeItem(HOUSEHOLD_ID_KEY);
    setHouseholdId(null);
    setMembers([]);
  }, []);

  return (
    <HouseholdContext.Provider
      value={{
        currentUser,
        householdId,
        members,
        isInHousehold: !!householdId,
        isLoading,
        setPseudo,
        createHousehold,
        joinHousehold,
        leaveHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}
