import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { reconnectSocketWithNewToken } from '../services/socket';
import { UserProfile, LoginInput, RegisterInput } from '@projectx/common';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<any>;
  googleLogin: (input?: { email?: string; name?: string; collegeDomain?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickLoginAs: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('projectx_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('projectx_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      // Invalid session
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('projectx_access_token');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (input: LoginInput) => {
    const res = await api.post('/auth/login', input);
    const { tokens, user: userData } = res.data.data;
    localStorage.setItem('projectx_access_token', tokens.accessToken);
    localStorage.setItem('projectx_refresh_token', tokens.refreshToken);
    localStorage.setItem('projectx_user', JSON.stringify(userData));
    setUser(userData);
    reconnectSocketWithNewToken(tokens.accessToken);
  };

  const googleLogin = async (input?: { email?: string; name?: string; collegeDomain?: string }) => {
    const payload = {
      email: input?.email || 'google.student@stanford.edu',
      name: input?.name || 'Google Verified Student',
      collegeDomain: input?.collegeDomain || 'stanford.edu',
    };
    const res = await api.post('/auth/google', payload);
    const { tokens, user: userData } = res.data.data;
    localStorage.setItem('projectx_access_token', tokens.accessToken);
    localStorage.setItem('projectx_refresh_token', tokens.refreshToken);
    localStorage.setItem('projectx_user', JSON.stringify(userData));
    setUser(userData);
    reconnectSocketWithNewToken(tokens.accessToken);
  };

  const register = async (input: RegisterInput) => {
    const res = await api.post('/auth/register', input);
    return res.data;
  };

  const quickLoginAs = async (email: string) => {
    try {
      await login({ email, password: 'Test@123' });
    } catch {
      await login({ email, password: 'password123' });
    }
  };

  const logout = () => {
    localStorage.removeItem('projectx_access_token');
    localStorage.removeItem('projectx_refresh_token');
    localStorage.removeItem('projectx_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        googleLogin,
        register,
        logout,
        refreshUser,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
