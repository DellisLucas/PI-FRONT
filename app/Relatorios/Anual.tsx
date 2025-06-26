import { Layout } from '@/components/Layout';
import { expenses, incomes } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface YearlyReport {
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyData: MonthlyData[];
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  bestMonth: {
    month: string;
    balance: number;
  };
  worstMonth: {
    month: string;
    balance: number;
  };
}

export default function RelatorioAnualScreen() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<YearlyReport | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);

      const anoAtual = new Date().getFullYear();
      console.log('Carregando relatório anual para:', anoAtual);

      // Buscar despesas e receitas do ano
      const [despesasResponse, receitasResponse] = await Promise.all([
        expenses.list(user.id),
        incomes.list(user.id)
      ]);

      console.log('Resposta das despesas:', despesasResponse);
      console.log('Resposta das receitas:', receitasResponse);

      const despesas = Array.isArray(despesasResponse.data) ? despesasResponse.data : [];
      const receitas = Array.isArray(receitasResponse) ? receitasResponse : [];

      console.log('Despesas processadas:', despesas);
      console.log('Receitas processadas:', receitas);

      // Processar dados mensais
      const monthlyData: MonthlyData[] = [];
      let totalIncome = 0;
      let totalExpense = 0;

      // Inicializar dados mensais
      for (let i = 0; i < 12; i++) {
        monthlyData.push({
          month: new Date(2024, i, 1).toLocaleString('pt-BR', { month: 'short' }),
          income: 0,
          expense: 0,
          balance: 0
        });
      }

      // Processar despesas
      despesas.forEach(despesa => {
        const data = new Date(despesa.date);
        if (data.getFullYear() === anoAtual) {
          const mes = data.getMonth();
          const valor = Math.abs(despesa.amount);
          monthlyData[mes].expense += valor;
          totalExpense += valor;
          console.log(`Despesa processada: Mês ${mes + 1}, Valor: ${valor}`);
        }
      });

      // Processar receitas
      receitas.forEach(receita => {
        const data = new Date(receita.date);
        if (data.getFullYear() === anoAtual) {
          const mes = data.getMonth();
          const valor = Math.abs(receita.amount);
          monthlyData[mes].income += valor;
          totalIncome += valor;
          console.log(`Receita processada: Mês ${mes + 1}, Valor: ${valor}`);
        }
      });

      console.log('Dados mensais processados:', monthlyData.map((mes, index) => ({
        mes: index + 1,
        receitas: mes.income,
        despesas: mes.expense,
        saldo: mes.balance
      })));

      // Calcular saldos mensais
      monthlyData.forEach(mes => {
        mes.balance = mes.income - mes.expense;
      });

      // Encontrar melhor e pior mês
      const bestMonth = monthlyData.reduce((prev, current) => 
        current.balance > prev.balance ? current : prev
      );
      const worstMonth = monthlyData.reduce((prev, current) => 
        current.balance < prev.balance ? current : prev
      );

      setReport({
        year: anoAtual,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        monthlyData,
        averageMonthlyIncome: totalIncome / 12,
        averageMonthlyExpense: totalExpense / 12,
        bestMonth: {
          month: bestMonth.month,
          balance: bestMonth.balance
        },
        worstMonth: {
          month: worstMonth.month,
          balance: worstMonth.balance
        }
      });

    } catch (error) {
      console.error('Erro ao carregar relatório anual:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar o relatório anual'
      });
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

  if (!report) {
    return (
      <Layout>
        <View style={styles.container}>
          <Text style={styles.noDataText}>Nenhum dado disponível para o ano</Text>
        </View>
      </Layout>
    );
  }

  // Dados para os gráficos
  const meses = report.monthlyData.map(m => m.month);
  const receitasPorMes = report.monthlyData.map(m => m.income);
  const despesasPorMes = report.monthlyData.map(m => m.expense);

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Relatório Anual {report.year}</Text>
        
        {/* Resumo Financeiro */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, styles.incomeValue]}>
              R$ {report.totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              R$ {report.totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Saldo</Text>
            <Text style={[
              styles.summaryValue,
              report.balance >= 0 ? styles.incomeValue : styles.expenseValue
            ]}>
              R$ {report.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Gráfico de Receitas */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Receitas por Mês</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: meses,
                datasets: [{ data: receitasPorMes }],
              }}
              width={Math.max(screenWidth - 32, 12 * 60)}
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

        {/* Gráfico de Despesas */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Despesas por Mês</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: meses,
                datasets: [{ data: despesasPorMes }],
              }}
              width={Math.max(screenWidth - 32, 12 * 60)}
              height={220}
              yAxisLabel="R$ "
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
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

        {/* Métricas Mensais */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Receita Média Mensal</Text>
            <Text style={[styles.metricValue, styles.incomeValue]}>
              R$ {report.averageMonthlyIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Despesa Média Mensal</Text>
            <Text style={[styles.metricValue, styles.expenseValue]}>
              R$ {report.averageMonthlyExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Melhor Mês</Text>
            <Text style={[styles.metricValue, styles.incomeValue]}>
              {report.bestMonth.month} (R$ {report.bestMonth.balance.toFixed(2)})
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pior Mês</Text>
            <Text style={[styles.metricValue, styles.expenseValue]}>
              {report.worstMonth.month} (R$ {report.worstMonth.balance.toFixed(2)})
            </Text>
          </View>
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
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
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
  },
  summaryItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  incomeValue: {
    color: '#4CAF50',
  },
  expenseValue: {
    color: '#FF6B6B',
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
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  metricsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
  },
}); 