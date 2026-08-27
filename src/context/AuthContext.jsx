import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';
import { auth, googleProvider, signInWithPopup } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hao_token') || null);
  const [loading, setLoading] = useState(true);

  // Load current user profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    const res = await authApi.login({ usernameOrEmail, password });
    if (res.success && res.token) {
      localStorage.setItem('hao_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    if (res.success && res.token) {
      localStorage.setItem('hao_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Signup failed');
  };

  const googleLogin = async () => {
    try {
      let email = '';
      let customerName = '';
      let firebaseUid = '';

      if (auth && googleProvider) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const gUser = result.user;
          email = gUser.email;
          customerName = gUser.displayName || 'Google Buyer';
          firebaseUid = gUser.uid;
        } catch (popupErr) {
          console.warn('[Firebase Popup]', popupErr.message);
          // Fallback demo account prompt if popup is blocked in sandbox
          email = prompt('Enter your Google Account Email for authentication:', 'buyer@globaltools.com');
          if (!email) return;
          customerName = 'Verified Google Buyer';
        }
      } else {
        email = prompt('Enter your Google Account Email:', 'buyer@globaltools.com');
        if (!email) return;
        customerName = 'Google Verified Partner';
      }

      const res = await authApi.googleAuth({
        email,
        customerName,
        firebaseUid,
      });

      if (res.success && res.token) {
        localStorage.setItem('hao_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res;
      }
    } catch (err) {
      console.error('Google Auth Failed', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hao_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
      return res;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === 'admin',
        login,
        signup,
        googleLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
