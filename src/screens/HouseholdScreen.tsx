import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useHousehold } from '../context/HouseholdContext';
import { Colors, Spacing, Radius } from '../theme/colors';

export default function HouseholdScreen() {
  const {
    currentUser,
    householdId,
    members,
    isInHousehold,
    setPseudo,
    createHousehold,
    joinHousehold,
    leaveHousehold,
  } = useHousehold();

  const [pseudoInput, setPseudoInput] = useState(currentUser?.pseudo ?? '');
  const [isEditingPseudo, setIsEditingPseudo] = useState(!currentUser?.pseudo);
  const [showScanner, setShowScanner] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  async function handleSavePseudo() {
    const trimmed = pseudoInput.trim();
    if (!trimmed) return;
    await setPseudo(trimmed);
    setIsEditingPseudo(false);
  }

  async function handleCreateHousehold() {
    if (!currentUser?.pseudo) {
      Alert.alert('Pseudo requis', 'Choisis un pseudo avant de créer un foyer.');
      return;
    }
    try {
      setIsCreating(true);
      await createHousehold();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le foyer. Vérifie ta connexion.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoin() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission refusée', 'La caméra est nécessaire pour scanner le QR code.');
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setShowScanner(false);
    try {
      await joinHousehold(data);
    } catch {
      Alert.alert('QR invalide', 'Ce QR code ne correspond à aucun foyer.');
      setScanned(false);
    }
  }

  function handleLeave() {
    Alert.alert(
      'Quitter le foyer',
      'Tu ne pourras plus accéder aux tâches et courses partagées. Continue ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: leaveHousehold },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Pseudo ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ton pseudo</Text>
        {isEditingPseudo ? (
          <View style={styles.pseudoRow}>
            <TextInput
              style={styles.pseudoInput}
              value={pseudoInput}
              onChangeText={setPseudoInput}
              placeholder="Ex : Bébou"
              placeholderTextColor={Colors.textLight}
              autoFocus
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleSavePseudo}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePseudo}>
              <Text style={styles.saveBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.pseudoDisplay}
            onPress={() => setIsEditingPseudo(true)}
          >
            <Text style={styles.pseudoText}>{currentUser?.pseudo || '—'}</Text>
            <Text style={styles.editHint}>✏️ modifier</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Household ────────────────────────────────────────────── */}
      {!isInHousehold ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foyer</Text>
          <Text style={styles.sectionDesc}>
            Lie ton téléphone à celui de tes proches pour partager les tâches ménage et la liste de
            courses en temps réel.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionCreate]}
            onPress={handleCreateHousehold}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnTextWhite}>🏠 Créer un foyer</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionJoin]} onPress={handleJoin}>
            <Text style={styles.actionBtnTextPrimary}>📷 Rejoindre un foyer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ton foyer</Text>
          <Text style={styles.sectionDesc}>
            Fais scanner ce QR code par tes proches pour qu'ils rejoignent le foyer.
          </Text>
          <View style={styles.qrWrapper}>
            <QRCode
              value={householdId!}
              size={200}
              color={Colors.textDark}
              backgroundColor={Colors.card}
            />
          </View>

          <Text style={styles.membersTitle}>Membres ({members.length})</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{m.pseudo[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <Text style={styles.memberName}>
                {m.pseudo}
                {m.id === currentUser?.id ? '  (toi)' : ''}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.leaveBtnText}>Quitter le foyer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── QR Scanner Modal ─────────────────────────────────────── */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <Text style={styles.scannerTitle}>📷 Scanner le QR code du foyer</Text>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowScanner(false)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textMedium,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  pseudoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pseudoInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.textDark,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  pseudoDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pseudoText: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  editHint: { fontSize: 13, color: Colors.textLight },
  actionBtn: {
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
  },
  actionCreate: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionJoin: { backgroundColor: Colors.card, borderColor: Colors.primary },
  actionBtnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 16 },
  actionBtnTextPrimary: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  qrWrapper: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMedium,
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  memberName: { fontSize: 15, color: Colors.textDark, fontWeight: '500' },
  leaveBtn: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  leaveBtnText: { color: '#E53935', fontSize: 14, fontWeight: '600' },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 60,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  camera: { width: '100%', flex: 1 },
  cancelBtn: {
    margin: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});
