import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import API from './api';
import { useAuth } from './AuthContext';

const Ctx = createContext();

export const PaymentProvider = ({ children }) => {
  const { user } = useAuth();
  const [bill, setBill] = useState({
    total: 0,
    paid: 0,
    roomCharges: 0,
    services: 0,
  });
  const [payments, setPayments] = useState([]);

  // 🔄 Reload bill + payments
  const reload = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([
        API.getBill(),
        API.getPaymentHistory(),
      ]);
      setBill(b);
      setPayments(p);
    } catch (e) {
      console.warn('Load bill:', e.message);
    }
  }, []);

  // Reload whenever the user logs in/out
  useEffect(() => {
    if (!user) {
      setBill({ total: 0, paid: 0, roomCharges: 0, services: 0 });
      setPayments([]);
      return;
    }
    reload();
  }, [user, reload]);

  // 💳 Make payment
  const pay = async (amount, method) => {
    const txn = await API.pay(amount, method);
    await reload();
    return txn;
  };

  return (
    <Ctx.Provider value={{ bill, payments, pay, reload }}>
      {children}
    </Ctx.Provider>
  );
};

export const usePayment = () => useContext(Ctx);