import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

export default function Payment({ route, navigation }) {
  const { balance } = route.params;
  const { user } = useAuth();

  const [mode, setMode] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState('NFC');
  const [busy, setBusy] = useState(false);

  const computedAmount = (() => {
    if (mode === 'full') return balance;
    if (mode === 'half') return balance / 2;
    if (mode === 'custom') {
      const n = Number(customAmount);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  })();

  const remainingAfter = Math.max(0, balance - computedAmount);

  const customError = (() => {
    if (mode !== 'custom') return null;
    if (!customAmount) return null;
    const n = Number(customAmount);
    if (isNaN(n) || n <= 0) return 'Enter a valid positive number.';
    if (n > balance) return `Amount cannot exceed ₱${balance.toFixed(2)}.`;
    return null;
  })();

  const canPay =
    computedAmount > 0 &&
    computedAmount <= balance &&
    !customError &&
    !busy;

  const handlePay = () => {
    if (!canPay) return;

    Alert.alert(
      'Confirm Payment',
      `Pay ₱${computedAmount.toFixed(2)} via ${method}?\n\nRemaining balance after payment: ₱${remainingAfter.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBusy(true);
            try {
              const { data, error } = await supabase
                .from('payments')
                .insert([
                  {
                    user_id: user.id,
                    amount: computedAmount,
                    status: 'paid',
                    method: method,
                  },
                ])
                .select()
                .single();

              if (error) throw error;

              Alert.alert(
                '✅ Payment Successful',
                `Amount: ₱${computedAmount.toFixed(2)}\nTransaction: ${data.id.slice(0, 8)}\n\nRemaining: ₱${remainingAfter.toFixed(2)}`,
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      navigation.navigate('Main', { screen: 'Bill' }),
                  },
                ]
              );
            } catch (e) {
              Alert.alert('Payment Failed', e.message);
            }
            setBusy(false);
          },
        },
      ]
    );
  };

  if (busy) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={s.processingT}>Processing payment...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.c}>
      <Text style={s.title}>💳 Payment</Text>

      <View style={s.amountCard}>
        <Text style={s.amountLabel}>Amount Due</Text>
        <Text style={s.amountValue}>₱{balance.toFixed(2)}</Text>
      </View>

      <Text style={s.sectionTitle}>Choose Payment Option</Text>

      <OptionCard
        icon="💰"
        title="Pay Full Balance"
        subtitle={`₱${balance.toFixed(2)}`}
        selected={mode === 'full'}
        onPress={() => setMode('full')}
        color="#34C759"
      />

      <OptionCard
        icon="✂️"
        title="Pay Half"
        subtitle={`₱${(balance / 2).toFixed(2)} (50% of balance)`}
        selected={mode === 'half'}
        onPress={() => setMode('half')}
        color="#FF9500"
      />

      <OptionCard
        icon="✏️"
        title="Custom Amount"
        subtitle="Enter your own amount"
        selected={mode === 'custom'}
        onPress={() => setMode('custom')}
        color="#007AFF"
      />

      {mode === 'custom' && (
        <View style={s.customWrap}>
          <Text style={s.label}>Enter Amount (₱)</Text>
          <TextInput
            style={[s.input, customError && s.inputError]}
            value={customAmount}
            onChangeText={(v) => setCustomAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="0.00"
            editable={!busy}
          />
          {customError ? (
            <Text style={s.errorText}>{customError}</Text>
          ) : (
            <Text style={s.hintText}>Maximum: ₱{balance.toFixed(2)}</Text>
          )}
        </View>
      )}

      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>Payment Summary</Text>
        <Row
          label="Option"
          value={
            mode === 'full'
              ? 'Full Payment'
              : mode === 'half'
              ? 'Half Payment (50%)'
              : 'Custom Amount'
          }
        />
        <Row
          label="Amount to Pay"
          value={`₱${computedAmount.toFixed(2)}`}
          valueColor="#34C759"
          bold
        />
        <Row label="Current Balance" value={`₱${balance.toFixed(2)}`} />
        <View style={s.divider} />
        <Row
          label="Remaining After Payment"
          value={`₱${remainingAfter.toFixed(2)}`}
          valueColor={remainingAfter > 0 ? '#FF9500' : '#28a745'}
          bold
        />
        {remainingAfter <= 0 && (
          <Text style={s.fullyPaidHint}>🎉 This will fully pay your bill!</Text>
        )}
      </View>

      <Text style={s.sectionTitle}>Payment Method</Text>
      {['NFC', 'Credit Card', 'Cash'].map((m) => (
        <TouchableOpacity
          key={m}
          style={[s.method, method === m && s.methodOn]}
          onPress={() => setMethod(m)}
          disabled={busy}
        >
          <Text style={[s.methodT, method === m && s.methodTOn]}>
            {m === 'NFC'
              ? '📱 NFC'
              : m === 'Credit Card'
              ? '💳 Credit Card'
              : '💵 Cash'}
          </Text>
          {method === m && <Text style={s.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[s.payBtn, !canPay && s.payBtnDisabled]}
        onPress={handlePay}
        disabled={!canPay}
      >
        <Text style={s.payT}>
          {canPay
            ? `Pay ₱${computedAmount.toFixed(2)}`
            : 'Enter Valid Amount'}
        </Text>
      </TouchableOpacity>

      <Text style={s.footer}>☁️ Data source: Supabase</Text>
    </ScrollView>
  );
}

const OptionCard = ({ icon, title, subtitle, selected, onPress, color }) => (
  <TouchableOpacity
    style={[
      s.optionCard,
      selected && { borderColor: color, backgroundColor: '#f8faff' },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[s.optionIcon, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.optionTitle, selected && { color }]}>{title}</Text>
      <Text style={s.optionSub}>{subtitle}</Text>
    </View>
    <View
      style={[
        s.radio,
        selected && { borderColor: color, backgroundColor: color },
      ]}
    >
      {selected && <Text style={s.radioCheck}>✓</Text>}
    </View>
  </TouchableOpacity>
);

const Row = ({ label, value, valueColor, bold }) => (
  <View style={s.row}>
    <Text style={[s.rowLabel, bold && { fontWeight: '700' }]}>{label}</Text>
    <Text
      style={[
        s.rowValue,
        bold && { fontWeight: '700' },
        valueColor && { color: valueColor },
      ]}
    >
      {value}
    </Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  processingT: { marginTop: 16, fontSize: 14, color: '#333' },

  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },

  amountCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: { color: '#fff', fontSize: 13, opacity: 0.9 },
  amountValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  optionSub: { fontSize: 12, color: '#888', marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCheck: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  customWrap: { marginTop: 4, marginBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  inputError: { borderColor: '#FF3B30' },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 6 },
  hintText: { color: '#888', fontSize: 12, marginTop: 6 },

  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontWeight: '700', fontSize: 14, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: { color: '#666', fontSize: 13 },
  rowValue: {
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 6 },
  fullyPaidHint: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  method: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodOn: { borderColor: '#007AFF', backgroundColor: '#e6f0ff' },
  methodT: { fontSize: 15, color: '#333' },
  methodTOn: { fontWeight: '700', color: '#007AFF' },
  checkmark: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },

  payBtn: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  payBtnDisabled: { backgroundColor: '#C7C7CC' },
  payT: { color: '#fff', fontWeight: '700', fontSize: 17 },

  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    marginTop: 16,
  },
});