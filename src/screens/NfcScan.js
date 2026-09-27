import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';
import { useAuth } from '../AuthContext';

export default function NfcScan() {
  const { user, refresh } = useAuth();
  const [myUid, setMyUid] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const uid = await API.nfcGetMyCard();
          setMyUid(uid);
        } catch (e) {
          console.warn('NFC load:', e.message);
        }
        setLoading(false);
      })();
    }, [])
  );

  const handleRegister = () => {
    Alert.alert(
      '📱 Register NFC Card',
      'This will link a new NFC UID to your account. On a real device, this happens when you tap your card on the phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            setRegistering(true);
            try {
              const newUid = API.nfcGenerateUid();
              await API.nfcRegister(newUid);
              setMyUid(newUid);
              await refresh();
              Alert.alert(
                '✅ Registered',
                `NFC UID: ${newUid}\n\nLinked to your account.`,
                [{ text: 'OK' }]
              );
            } catch (e) {
              Alert.alert('Error', e.message);
            }
            setRegistering(false);
          },
        },
      ]
    );
  };

  const handleScan = async () => {
    if (!myUid) {
      return Alert.alert(
        'No NFC Card',
        'You need to register an NFC card first.'
      );
    }

    setScanning(true);
    setResult(null);

    try {
      const res = await API.scanNfc(myUid);
      setResult(res);
    } catch (e) {
      Alert.alert('Scan Error', e.message);
    }
    setScanning(false);
  };

  const handleUnregister = () => {
    Alert.alert(
      '🗑️ Unregister NFC',
      'Remove the NFC card from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.nfcUnregister();
              setMyUid(null);
              setResult(null);
              await refresh();
              Alert.alert('✅ Removed', 'NFC card unlinked from your account.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleScanOther = async () => {
    setScanning(true);
    setResult(null);
    try {
      const randomUid = API.nfcGenerateUid();
      const res = await API.scanNfc(randomUid);
      setResult(res);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setScanning(false);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.c}>
      <View style={s.header}>
        <Text style={s.title}>📱 NFC Scanner</Text>
        <Text style={s.sub}>Tap NFC card to verify</Text>
      </View>

      <View style={s.statusCard}>
        <Text style={s.statusLabel}>NFC Card Status</Text>
        {myUid ? (
          <>
            <View style={s.badge}>
              <Text style={s.badgeText}>✅ REGISTERED</Text>
            </View>
            <Text style={s.uid}>{myUid}</Text>
            <Text style={s.uidLabel}>Linked to @{user?.username}</Text>
          </>
        ) : (
          <>
            <View style={[s.badge, s.badgeWarn]}>
              <Text style={s.badgeText}>⚠️ NOT REGISTERED</Text>
            </View>
            <Text style={s.uidLabel}>No NFC card linked to your account.</Text>
          </>
        )}
      </View>

      {!myUid ? (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#007AFF' }, registering && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={registering}
        >
          {registering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnT}>📥 Register NFC Card</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#34C759' }, scanning && { opacity: 0.6 }]}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnT}>📱 Scan My NFC Card</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#8E8E93' }]}
            onPress={handleScanOther}
            disabled={scanning}
          >
            <Text style={s.btnT}>🔍 Test Unknown Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#FF3B30' }]}
            onPress={handleUnregister}
            disabled={scanning}
          >
            <Text style={s.btnT}>🗑️ Unregister Card</Text>
          </TouchableOpacity>
        </>
      )}

      {result && (
        <View style={[s.resultCard, result.verified ? s.verified : s.unverified]}>
          <Text style={s.resultBadge}>
            {result.verified ? '✅ VERIFIED PATIENT' : '❌ UNREGISTERED CARD'}
          </Text>
          <Text style={s.resultUid}>NFC UID: {result.nfcUid}</Text>

          {result.verified && result.patient ? (
            <>
              <Row label="Patient ID" value={result.patient.id} />
              <Row label="Name" value={result.patient.name} />
              <Row label="Username" value={`@${result.patient.username}`} />
              <Row
                label="Age"
                value={result.patient.age ? String(result.patient.age) : '—'}
              />
              <Row label="Blood Type" value={result.patient.bloodType || '—'} />
              <Row label="Email" value={result.patient.email || '—'} />
              <Row label="Phone" value={result.patient.phone || '—'} />
            </>
          ) : (
            <Text style={s.unverifiedText}>
              This card is not linked to any registered patient.
            </Text>
          )}

          <TouchableOpacity style={s.closeBtn} onPress={() => setResult(null)}>
            <Text style={s.closeBtnT}>✖ Close Result</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.footer}>💾 Data source: local API (AsyncStorage)</Text>
    </ScrollView>
  );
}

const Row = ({ label, value }) => (
  <View style={s.row}>
    <Text style={s.rl}>{label}</Text>
    <Text style={s.rv}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#666', marginTop: 4, fontSize: 13 },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: { color: '#888', fontSize: 12, marginBottom: 8 },
  badge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeWarn: { backgroundColor: '#fff3cd' },
  badgeText: { fontWeight: '700', fontSize: 11, color: '#333' },
  uid: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 2,
    marginVertical: 6,
  },
  uidLabel: { color: '#666', fontSize: 12, textAlign: 'center' },
  btn: { padding: 16, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultCard: { marginTop: 20, padding: 20, borderRadius: 12, borderWidth: 2 },
  verified: { backgroundColor: '#d4edda', borderColor: '#28a745' },
  unverified: { backgroundColor: '#f8d7da', borderColor: '#dc3545' },
  resultBadge: { fontWeight: '700', marginBottom: 10, fontSize: 13 },
  resultUid: { fontSize: 12, color: '#555', marginBottom: 14 },
  unverifiedText: { color: '#721c24', marginTop: 8, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rl: { color: '#444', fontSize: 13 },
  rv: { fontWeight: '600', fontSize: 13, flexShrink: 1, textAlign: 'right' },
  closeBtn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  closeBtnT: { color: '#333', fontWeight: '600', fontSize: 13 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 24 },
});