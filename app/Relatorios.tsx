import { Layout } from '@/components/Layout';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { ComponentProps, useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface MonthlyReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomes: any[];
  expenses: any[];
}

interface CategoryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  incomeCategories: {
    category: string;
    total: number;
    count: number;
  }[];
  expenseCategories: {
    category: string;
    total: number;
    count: number;
  }[];
  totalIncome: number;
  totalExpense: number;
}

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  route: '/Relatorios/Mensal' | '/Relatorios/Anual' | '/Relatorios/Categorias' | '/Relatorios/FluxoCaixa' | '/Relatorios/SaudeFinanceira' | '/Relatorios/Tendencias' | '/Relatorios/Comparativo' | '/Relatorios/Preditivo';
}

const reportOptions: ReportOption[] = [
  {
    id: 'monthly',
    title: 'Relatório Mensal',
    description: 'Análise detalhada de receitas e despesas do mês',
    icon: 'calendar-today',
    route: '/Relatorios/Mensal'
  },
  {
    id: 'yearly',
    title: 'Relatório Anual',
    description: 'Visão geral das finanças ao longo do ano',
    icon: 'bar-chart',
    route: '/Relatorios/Anual'
  },
  {
    id: 'categories',
    title: 'Relatório por Categorias',
    description: 'Análise de gastos e receitas por categoria',
    icon: 'list',
    route: '/Relatorios/Categorias'
  },
  {
    id: 'financial-health',
    title: 'Saúde Financeira',
    description: 'Análise da sua situação financeira atual',
    icon: 'favorite',
    route: '/Relatorios/SaudeFinanceira'
  },
  {
    id: 'trends',
    title: 'Análise de Tendências',
    description: 'Identificação de padrões e tendências nos seus gastos',
    icon: 'trending-up',
    route: '/Relatorios/Tendencias'
  },
  {
    id: 'predictive',
    title: 'Relatório Preditivo',
    description: 'Previsões baseadas no seu histórico financeiro',
    icon: 'auto-graph',
    route: '/Relatorios/Preditivo'
  }
];

export default function RelatoriosScreen() {
  const [loading, setLoading] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [categoryReport, setCategoryReport] = useState<CategoryReport | null>(null);
  const router = useRouter();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);

      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth() + 1;
      const anoAtual = dataAtual.getFullYear();

      const API_URL = 'http://10.0.0.9:3001';
      console.log('Carregando relatórios para:', { mesAtual, anoAtual });
      console.log('URL base da API:', API_URL);

      // Buscar relatório mensal
      const monthlyUrl = `${API_URL}/api/reports/monthly?userId=${user.id}&month=${mesAtual}&year=${anoAtual}`;
      console.log('URL do relatório mensal:', monthlyUrl);
      console.log('Token de autenticação:', await AsyncStorage.getItem('@CashTab:token'));

      const monthlyResponse = await fetch(
        monthlyUrl,
        {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('@CashTab:token')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!monthlyResponse.ok) {
        throw new Error(`Erro na API: ${monthlyResponse.status} ${monthlyResponse.statusText}`);
      }

      const monthlyData = await monthlyResponse.json();
      console.log('Dados do relatório mensal:', monthlyData);
      setMonthlyReport(monthlyData);

      // Buscar relatório por categorias
      const startDate = new Date(anoAtual, mesAtual - 1, 1).toISOString();
      const endDate = new Date(anoAtual, mesAtual, 0).toISOString();
      
      const categoryUrl = `${API_URL}/api/reports/categories?userId=${user.id}&startDate=${startDate}&endDate=${endDate}`;
      console.log('URL do relatório de categorias:', categoryUrl);

      const categoryResponse = await fetch(
        categoryUrl,
        {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('@CashTab:token')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!categoryResponse.ok) {
        throw new Error(`Erro na API: ${categoryResponse.status} ${categoryResponse.statusText}`);
      }

      const categoryData = await categoryResponse.json();
      console.log('Dados do relatório de categorias:', categoryData);
      setCategoryReport(categoryData);

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os relatórios'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportPress = (route: ReportOption['route']) => {
    router.push(route as any);
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>RELATÓRIOS</Text>
        <Text style={styles.subtitle}>Escolha o tipo de relatório desejado</Text>

        <View style={styles.grid}>
          {reportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.card}
              onPress={() => handleReportPress(option.route)}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name={option.icon} size={24} color="#2196F3" />
                <Text style={styles.cardTitle}>{option.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Toast />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    flex: 1,
  },
  cardDescription: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
}); 