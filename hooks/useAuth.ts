import { auth } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await auth.login({ email, password });
      
      await AsyncStorage.setItem('@CashTab:token', response.token);
      await AsyncStorage.setItem('@CashTab:userId', response.user.id);
      await AsyncStorage.setItem('@CashTab:userName', response.user.name);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      router.replace('/Dashboard');
    } catch (error) {
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      await auth.register({ name, email, password });
      router.replace('/Login');
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('@CashTab:token');
    await AsyncStorage.removeItem('@CashTab:userId');
    await AsyncStorage.removeItem('@CashTab:userName');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    router.replace('/Login');
  },
})); 