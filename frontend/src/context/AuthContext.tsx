import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { User } from '../types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role?: 'admin' | 'client') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log('🔑 Token encontrado, verificando usuario...');
        const data = await authService.getCurrentUser();
        console.log('✅ Usuario cargado:', data.user?.email);
        setUser(data.user);
      } else {
        console.log('ℹ️ No hay token guardado');
      }
    } catch (error: any) {
      console.error('❌ Error loading user:', error.message);
      // Si el token es inválido, lo eliminamos
      if (error.response?.status === 401) {
        console.log('🔒 Token inválido, limpiando...');
        await AsyncStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log('🔐 Intentando login con:', email);
      const data = await authService.login(email, password);
      console.log('✅ Login exitoso:', data.user?.email);
      if (data.user) {
        setUser(data.user);
      } else {
        throw new Error('No se recibieron datos del usuario');
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error.message);
      console.error('❌ Response:', error.response?.data);
      if (error.code === 'ECONNABORTED') {
        throw new Error('El servidor tardó demasiado. Por favor, intenta de nuevo.');
      }
      if (!error.response) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
      }
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  }

  async function signUp(name: string, email: string, password: string, role: 'admin' | 'client' = 'client') {
    try {
      const data = await authService.register(name, email, password, role);
      setUser(data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al registrar usuario');
    }
  }

  async function signOut() {
    await authService.logout();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
