import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../firebase/config';
import { useHousehold } from '../context/HouseholdContext';
import { GroceryItem } from '../types';
import { Colors, Radius, Spacing } from '../theme/colors';

const STORAGE_KEY = '@grocery_items';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export default function GroceryScreen() {
  const { householdId, currentUser } = useHousehold();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [inputText, setInputText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup helpers ──────────────────────────────────────────────────────
  const isExpired = (item: GroceryItem) =>
    !!item.checkedAt && Date.now() - new Date(item.checkedAt).getTime() > TWO_HOURS_MS;

  async function cleanupExpiredSolo(current: GroceryItem[]): Promise<GroceryItem[]> {
    const fresh = current.filter((i) => !isExpired(i));
    if (fresh.length !== current.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    return fresh;
  }

  async function cleanupExpiredFirestore(current: GroceryItem[]) {
    if (!householdId) return;
    const expired = current.filter(isExpired);
    await Promise.all(
      expired.map((i) => deleteDoc(doc(db, 'households', householdId, 'groceries', i.id)))
    );
  }

  // ── Solo mode: load from AsyncStorage ───────────────────────────────────
  const loadSolo = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: GroceryItem[] = raw ? JSON.parse(raw) : [];
      const fresh = await cleanupExpiredSolo(parsed);
      setItems(fresh);
    } catch {
      setItems([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Household mode: subscribe to Firestore ───────────────────────────────
  useEffect(() => {
    if (!householdId) return;
    const colRef = collection(db, 'households', householdId, 'groceries');
    const unsub = onSnapshot(colRef, (snap) => {
      const loaded: GroceryItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GroceryItem, 'id'>),
      }));
      setItems(loaded.filter((i) => !isExpired(i)));
      // cleanup expired docs in background
      cleanupExpiredFirestore(loaded).catch(() => {});
    });
    return unsub;
  }, [householdId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Solo mode: load on focus + periodic cleanup ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!householdId) {
        loadSolo();
        intervalRef.current = setInterval(loadSolo, 60_000);
        return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
        };
      }
    }, [householdId, loadSolo])
  );

  // ── Household mode: periodic cleanup ────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!householdId) return;
      const id = setInterval(() => cleanupExpiredFirestore(items), 60_000);
      return () => clearInterval(id);
    }, [householdId, items]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Add item ─────────────────────────────────────────────────────────────
  async function handleAdd() {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    const newItem: Omit<GroceryItem, 'id'> = {
      text,
      addedBy: currentUser?.pseudo ?? 'Moi',
      addedAt: new Date().toISOString(),
      checkedBy: null,
      checkedAt: null,
    };

    if (householdId) {
      await addDoc(collection(db, 'households', householdId, 'groceries'), newItem);
    } else {
      const item: GroceryItem = { ...newItem, id: Date.now().toString() };
      const updated = [item, ...items];
      setItems(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  // ── Toggle check ─────────────────────────────────────────────────────────
  async function handleToggle(item: GroceryItem) {
    const nowChecked = !item.checkedAt;
    const nowIso = nowChecked ? new Date().toISOString() : null;

    if (householdId) {
      await updateDoc(doc(db, 'households', householdId, 'groceries', item.id), {
        checkedBy: nowChecked ? (currentUser?.pseudo ?? 'Moi') : null,
        checkedAt: nowIso,
      });
    } else {
      const updated = items.map((i) =>
        i.id === item.id
          ? { ...i, checkedAt: nowIso, checkedBy: nowChecked ? (currentUser?.pseudo ?? 'Moi') : null }
          : i
      );
      setItems(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  // ── Delete item ───────────────────────────────────────────────────────────
  async function handleDelete(item: GroceryItem) {
    if (householdId) {
      await deleteDoc(doc(db, 'households', householdId, 'groceries', item.id));
    } else {
      const updated = items.filter((i) => i.id !== item.id);
      setItems(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  // ── Sorted list: unchecked first, then checked ───────────────────────────
  const sortedItems = [
    ...items.filter((i) => !i.checkedAt).sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
    ...items.filter((i) => !!i.checkedAt).sort((a, b) => b.checkedAt!.localeCompare(a.checkedAt!)),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Input row ─────────────────────────────────────────────── */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ajouter un article…"
          placeholderTextColor={Colors.textLight}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── List ──────────────────────────────────────────────────── */}
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Rien à acheter 🎉</Text>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const checked = !!item.checkedAt;
          return (
            <View style={[styles.itemRow, checked && styles.itemRowChecked]}>
              <TouchableOpacity
                style={[styles.checkbox, checked && styles.checkboxChecked]}
                onPress={() => handleToggle(item)}
              >
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.itemTextCol}>
                <Text
                  style={[styles.itemText, checked && styles.itemTextChecked]}
                  numberOfLines={2}
                >
                  {item.text}
                </Text>
                {checked && item.checkedBy && (
                  <Text style={styles.checkedBy}>par {item.checkedBy}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inputRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textDark,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 34 },
  list: { padding: Spacing.md, paddingBottom: Spacing.xl },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 16,
    marginTop: 60,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  itemRowChecked: { opacity: 0.5 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  itemTextCol: { flex: 1 },
  itemText: { fontSize: 16, color: Colors.textDark },
  itemTextChecked: { textDecorationLine: 'line-through', color: Colors.textMedium },
  checkedBy: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  deleteBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  deleteBtnText: { color: Colors.textLight, fontSize: 14, fontWeight: '600' },
});
