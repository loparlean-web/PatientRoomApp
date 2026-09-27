import React, { createContext, useState, useContext, useEffect } from 'react';
import API from './api';

const Ctx = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await API.init(); // 👈 may migration na
        const me = await API.me();
        if (me) setUser(me);
      } catch (e) {
        console.warn('Init:', e.message);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await API.login(username, password);
      const me = await API.me(); // 👈 re-fetch para sigurado
      setUser(me || data.user);
      return true;
    } catch (e) {
      console.warn('Login:', e.message);
      return false;
    }
  };

  const register = async (payload) => {
    try {
      const data = await API.register(payload);
      const me = await API.me();
      setUser(me || data.user);
      return true;
    } catch (e) {
      console.warn('Register:', e.message);
      return false;
    }
  };

  const logout = async () => {
    await API.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const u = await API.updateProfile(data);
    setUser(u);
  };

  const refresh = async () => {
    const me = await API.me();
    if (me) setUser(me);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateProfile, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);