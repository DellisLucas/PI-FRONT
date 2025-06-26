import { Layout } from '@/components/Layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface MonthlyStat {
  _id: { year: number; month: number };
  totalIncome: number;
  avgIncome: number;
  incomeCount: number;
}
interface RecentActivity {
  _id: { year: number; month: number; day: number };
  total: number;
  count: number;
}
interface CategoryAnalysis {
  category: string;
  total: number;
  count: number;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
}

export default function SaudeFinanceiraScreen() {
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);
      const API_URL = 'http://10.0.0.9:3001';
      console.log('Fazendo requisição para saúde financeira...');
      const response = await fetch(`${API_URL}/api/reports/financial-health?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('@CashTab:token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Erro na resposta:', response.status, response.statusText);
        throw new Error(`Erro ao buscar relatório: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Saúde financeira - resposta completa:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        console.error('Dados inválidos recebidos:', data);
        throw new Error('Dados inválidos recebidos da API');
      }

      const reportData = data[0];
      console.log('Saúde financeira - dados processados:', reportData);

      setMonthlyStats(reportData.monthlyStats || []);
      setRecentActivity(reportData.recentActivity || []);
      setCategoryAnalysis((reportData.categoryAnalysis || []).map((cat: any) => ({
        category: cat._id,
        total: cat.total,
        count: cat.count,
        avgAmount: cat.avgAmount,
        minAmount: cat.minAmount,
        maxAmount: cat.maxAmount,
      })));

      console.log('Dados processados:');
      console.log('monthlyStats:', reportData.monthlyStats);
      console.log('recentActivity:', reportData.recentActivity);
      console.log('categoryAnalysis:', reportData.categoryAnalysis);
    } catch (error) {
      console.error('Erro ao carregar saúde financeira:', error);
      Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível carregar o relatório' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </Layout>
    );
  }

  // Gráfico de barras dos últimos 12 meses
  const meses = monthlyStats.map(m => `${m._id.month}/${m._id.year.toString().slice(-2)}`).reverse();
  const receitasPorMes = monthlyStats.map(m => m.totalIncome).reverse();

  // Gráfico de linha dos últimos 30 dias
  const dias = recentActivity.map(a => `${a._id.day}/${a._id.month}`).reverse();
  const receitasPorDia = recentActivity.map(a => a.total).reverse();

  // Gráfico de pizza das categorias
  const pieData = categoryAnalysis.map((cat, i) => ({
    name: cat.category,
    population: cat.total,
    color: `hsl(${(i * 360) / categoryAnalysis.length}, 70%, 50%)`,
    legendFontColor: '#333',
    legendFontSize: 13,
  }));

  // Cálculo de médias e dicas
  const mediaMensal = monthlyStats.length > 0 ? (monthlyStats.reduce((sum, m) => sum + m.totalIncome, 0) / monthlyStats.length) : 0;
  const melhorMes = monthlyStats.reduce((prev, curr) => (curr.totalIncome > prev.totalIncome ? curr : prev), monthlyStats[0] || { totalIncome: 0 });
  const piorMes = monthlyStats.reduce((prev, curr) => (curr.totalIncome < prev.totalIncome ? curr : prev), monthlyStats[0] || { totalIncome: 0 });

  // Logs dos estados processados
  console.log('monthlyStats state:', monthlyStats);
  console.log('recentActivity state:', recentActivity);
  console.log('categoryAnalysis state:', categoryAnalysis);

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Saúde Financeira</Text>

        {/* Gráfico de barras dos últimos 12 meses */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Receitas dos Últimos 12 Meses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <BarChart
              data={{ labels: meses, datasets: [{ data: receitasPorMes }] }}
              width={Math.max(screenWidth - 32, 12 * 80)}
              height={220}
              yAxisLabel="R$ "
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: { borderRadius: 16 },
                barPercentage: 0.5,
                propsForLabels: { fontSize: 10 },
                propsForBackgroundLines: { stroke: '#e3e3e3' },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              segments={5}
              yAxisInterval={1}
            />
          </ScrollView>
        </View>

        {/* Gráfico de linha dos últimos 30 dias */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Receitas dos Últimos 30 Dias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <LineChart
              data={{ labels: dias, datasets: [{ data: receitasPorDia }] }}
              width={Math.max(screenWidth - 32, 30 * 40)}
              height={220}
              yAxisLabel="R$ "
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: { borderRadius: 16 },
                propsForLabels: { fontSize: 10 },
                propsForBackgroundLines: { stroke: '#e3e3e3' },
              }}
              style={styles.chart}
              fromZero
              segments={5}
              yAxisInterval={1}
            />
          </ScrollView>
        </View>

        {/* Gráfico de pizza das categorias */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribuição por Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={Math.max(screenWidth - 32, pieData.length * 100)}
                height={220}
                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={styles.noDataText}>Nenhuma categoria encontrada.</Text>
            )}
          </ScrollView>
        </View>

        {/* Resumo e dicas */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Média Mensal de Receitas</Text>
          <Text style={styles.summaryValue}>R$ {mediaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.summaryLabel}>Melhor Mês</Text>
          <Text style={[styles.summaryValue, styles.incomeValue]}>{melhorMes ? `${melhorMes._id?.month}/${melhorMes._id?.year}` : '-'} (R$ {melhorMes?.totalIncome?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</Text>
          <Text style={styles.summaryLabel}>Pior Mês</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>{piorMes ? `${piorMes._id?.month}/${piorMes._id?.year}` : '-'} (R$ {piorMes?.totalIncome?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</Text>
        </View>
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Dica de Saúde Financeira</Text>
          <Text style={styles.tipsText}>
            {mediaMensal > 0
              ? mediaMensal > 2000
                ? 'Parabéns! Sua média mensal de receitas está excelente. Considere investir parte do valor.'
                : 'Tente aumentar sua média mensal de receitas e diversificar suas fontes de renda.'
              : 'Cadastre receitas para acompanhar sua saúde financeira!'}
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  incomeValue: {
    color: '#4CAF50',
  },
  expenseValue: {
    color: '#FF6B6B',
  },
  tipsContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 