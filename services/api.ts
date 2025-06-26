import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.1:3001';
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(async (config) => {
  console.log('Fazendo requisição para:', config.url);
  try {
    const token = await AsyncStorage.getItem('@CashTab:token');
    if (token) {
      // Remover aspas extras se existirem e garantir que não há espaços
      const cleanToken = token.replace(/^"|"$/g, '').trim();
      // Garantir que o token começa com "Bearer " e não tem espaços extras
      const authToken = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
      config.headers.Authorization = authToken;
      console.log('Token enviado:', authToken);
      console.log('Headers completos:', {
        ...config.headers,
        Authorization: 'Bearer [TOKEN OCULTO]' // Ocultando o token por segurança
      });
    } else {
      console.log('Nenhum token encontrado');
    }
  } catch (error) {
    console.error('Erro ao obter token:', error);
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log('Resposta recebida:', response.status);
    return response;
  },
  (error) => {
    console.error('Erro na requisição:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      headers: {
        ...error.config?.headers,
        Authorization: 'Bearer [TOKEN OCULTO]' // Ocultando o token por segurança
      }
    });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Tempo de conexão esgotado. Verifique sua conexão com a internet.');
    }
    
    if (!error.response) {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
    }

    if (error.response.status === 401) {
      // Token inválido ou expirado
      console.log('Token inválido ou expirado. Removendo dados de autenticação...');
      AsyncStorage.removeItem('@CashTab:token');
      AsyncStorage.removeItem('@CashTab:user');
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    throw error;
  }
);

// Tipos
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
  userId: string;
  image?: string | null;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  userId: string;
  image?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Função para verificar o token salvo
const checkToken = async () => {
  const token = await AsyncStorage.getItem('@CashTab:token');
  console.log('Token salvo no AsyncStorage:', token);
  return token;
};

// Auth
export const auth = {
  register: async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    console.log('Tentando fazer login com:', { email: data.email });
    const response = await api.post('/api/auth/login', data);
    console.log('Resposta do login:', response.data);
    
    if (response.data?.data?.access_token) {
      const token = response.data.data.access_token;
      // Limpar token antigo antes de salvar o novo
      await AsyncStorage.removeItem('@CashTab:token');
      await AsyncStorage.removeItem('@CashTab:user');
      
      // Salvar novo token e dados do usuário
      await AsyncStorage.setItem('@CashTab:token', token);
      await AsyncStorage.setItem('@CashTab:user', JSON.stringify(response.data.data.user));
      
      console.log('Token salvo:', token);
      console.log('Dados do usuário salvos:', response.data.data.user);
      
      // Configurar o token para a próxima requisição
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verificar se o token foi salvo corretamente
      const savedToken = await AsyncStorage.getItem('@CashTab:token');
      console.log('Token verificado após salvar:', savedToken);
    } else {
      console.error('Token não encontrado na resposta:', response.data);
    }
    return response.data;
  },
};

// User
export const user = {
  update: async (id: string, data: Partial<User>) => {
    const response = await api.put(`/api/user/update/${id}`, data);
    return response.data;
  },
};

// Incomes
export const incomes = {
  list: async (userId: string) => {
    console.log('Listando receitas para o usuário:', userId);
    const response = await api.get<ApiResponse<Income[]>>(`/api/incomes?userId=${userId}`);
    console.log('Resposta bruta da API de receitas:', response);
    console.log('Dados das receitas:', response.data);
    return response.data;
  },
  create: async (data: Omit<Income, 'id' | 'userId'>) => {
    const response = await api.post<Income>('/api/incomes', data);
    return response.data;
  },
  listByDate: async (startDate: string, endDate: string) => {
    const response = await api.get<Income[]>('/api/incomes/by-date', {
      data: { startDate, endDate },
    });
    return response.data;
  },
  update: async (id: string, data: Partial<Income>) => {
    const response = await api.put<Income>(`/api/incomes/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/incomes/${id}`);
    return response.data;
  },
};

// Expenses
export const expenses = {
  list: async (userId: string) => {
    console.log('Listando despesas para o usuário:', userId);
    // Verificar o token antes de fazer a requisição
    await checkToken();
    const response = await api.get<ApiResponse<Expense[]>>(`/api/expenses?userId=${userId}`);
    console.log('Despesas encontradas:', response.data);
    return response.data;
  },
  create: async (data: Omit<Expense, 'id' | 'userId'>) => {
    console.log('Dados recebidos para criar despesa:', JSON.stringify(data, null, 2));
    // Obter o userId do token
    const userData = await AsyncStorage.getItem('@CashTab:user');
    if (!userData) {
      throw new Error('Usuário não autenticado');
    }
    const { id: userId } = JSON.parse(userData);
    
    // Garantir que os dados estão no formato correto
    const despesaData = {
      description: String(data.description || '').trim(),
      amount: Number(data.amount || 0),
      date: data.date, // Enviar a data exatamente como recebida
      category: String(data.category || '').trim(),
      image: data.image || null,
      userId: String(userId).trim()
    };
    
    // Validar campos obrigatórios
    if (!despesaData.description) throw new Error('Descrição é obrigatória');
    if (!despesaData.amount || isNaN(despesaData.amount)) throw new Error('Valor é obrigatório e deve ser um número');
    if (!despesaData.date) throw new Error('Data é obrigatória');
    if (!despesaData.category) throw new Error('Categoria é obrigatória');
    
    console.log('Dados completos da despesa:', JSON.stringify(despesaData, null, 2));
    
    try {
      const response = await api.post<ApiResponse<Expense>>('/api/expenses', despesaData);
      console.log('Resposta da criação:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('Erro detalhado:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: despesaData
      });
      throw error;
    }
  },
  listByDateRange: async (startDate: string, endDate: string, userId: string) => {
    console.log('Buscando despesas por período:', { startDate, endDate, userId });
    const response = await api.get<Expense[]>(
      `/api/expenses/range?startDate=${startDate}&endDate=${endDate}&userId=${userId}`
    );
    console.log('Despesas encontradas:', response.data);
    return response.data;
  },
  update: async (id: string, data: Partial<Expense>) => {
    try {
      // Obter o userId do token
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) {
        throw new Error('Usuário não autenticado');
      }
      const { id: userId } = JSON.parse(userData);

      // Preparar os dados para atualização
      const updateData = {
        description: data.description?.trim(),
        amount: Number(data.amount),
        date: data.date,
        category: data.category?.trim(),
        image: data.image,
        userId: userId
      };

      // Validar campos obrigatórios
      if (!updateData.description) throw new Error('Descrição é obrigatória');
      if (!updateData.amount || isNaN(updateData.amount)) throw new Error('Valor é obrigatório e deve ser um número');
      if (!updateData.date) throw new Error('Data é obrigatória');
      if (!updateData.category) throw new Error('Categoria é obrigatória');

      console.log('Enviando dados para atualização:', { id, updateData });

      // Fazer a requisição PUT
      const response = await api.put<ApiResponse<Expense>>(`/api/expenses/${id}`, updateData);
      
      console.log('Resposta da atualização:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Falha ao atualizar despesa');
      }

      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar despesa:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Não autorizado a atualizar esta despesa');
      }
      if (error.response?.status === 404) {
        throw new Error('Despesa não encontrada');
      }
      
      throw new Error(error.message || 'Erro ao atualizar despesa');
    }
  },
  delete: async (id: string) => {
    console.log('Removendo despesa:', id);
    const response = await api.delete(`/api/expenses/${id}`);
    console.log('Despesa removida:', response.data);
    return response.data;
  },
};

// Reports
export const reports = {
  monthly: async (userId: string, month: number, year: number) => {
    const response = await api.get(
      `/api/reports/monthly?userId=${userId}&month=${month}&year=${year}`
    );
    return response.data;
  },
  yearly: async (userId: string, year: number) => {
    const response = await api.get(`/api/reports/yearly?userId=${userId}&year=${year}`);
    return response.data;
  },
  categories: async (userId: string, startDate: string, endDate: string) => {
    const response = await api.get(
      `/api/reports/categories?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },
  cashFlow: async (userId: string, months: number) => {
    const response = await api.get(
      `/api/reports/cash-flow?userId=${userId}&months=${months}`
    );
    return response.data;
  },
  financialHealth: async (userId: string) => {
    const response = await api.get(`/api/reports/financial-health?userId=${userId}`);
    return response.data;
  },
  trendAnalysis: async (userId: string) => {
    const response = await api.get(`/api/reports/trend-analysis?userId=${userId}`);
    return response.data;
  },
  comparative: async (userId: string, compareWith: string) => {
    const response = await api.get(
      `/api/reports/comparative?userId=${userId}&compareWith=${compareWith}`
    );
    return response.data;
  },
  predictive: async (userId: string) => {
    const response = await api.get(`/api/reports/predictive?userId=${userId}`);
    return response.data;
  },
};

export default api;