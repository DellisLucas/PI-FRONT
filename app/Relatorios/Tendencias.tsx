import { Layout } from '@/components/Layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface Transaction {
  amount: number;
  date: string;
  description: string;
}

interface MonthlyData {
  year: number;
  month: number;
  total: number;
  count: number;
  transactions: Transaction[];
}

interface TrendData {
  fromMonth: string;
  toMonth: string;
  growthRate: number;
}

interface TrendReport {
  summary: {
    totalAmount: number;
    totalTransactions: number;
    avgMonthlyTotal: number;
    avgMonthlyCount: number;
    stdDevTotal: number;
    stdDevCount: number;
  };
  monthlyData: MonthlyData[];
  trend: TrendData[];
}

export default function TendenciasScreen() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<TrendReport | null>(null);

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
      console.log('Fazendo requisição para análise de tendências...');
      
      const response = await fetch(`${API_URL}/api/reports/trend-analysis?userId=${user.id}`, {
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
      console.log('Análise de tendências - resposta completa:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        console.error('Dados inválidos recebidos:', data);
        throw new Error('Dados inválidos recebidos da API');
      }

      setReport(data[0]);
      console.log('Dados processados:', data[0]);
    } catch (error) {
      console.error('Erro ao carregar análise de tendências:', error);
      Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível carregar o relatório' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </Layout>
    );
  }

  // Preparar dados para os gráficos
  const meses = report.monthlyData.map(m => `${m.month}/${m.year.toString().slice(-2)}`);
  // Garantir que totais sejam válidos e nunca vazio
  let totais = report.monthlyData.map(m => {
    if (typeof m.total !== 'number' || !Number.isFinite(m.total) || m.total < 0) {
      console.warn('Valor total inválido detectado:', m.total);
      return 0;
    }
    return m.total;
  });
  if (totais.length === 0) {
    console.warn('Array de totais vazio, preenchendo com 0');
    totais = [0];
  }

  // Corrigir taxas de crescimento inválidas e nunca vazio
  let taxasCrescimento = report.trend.map(t => {
    if (typeof t.growthRate !== 'number' || !Number.isFinite(t.growthRate) || isNaN(t.growthRate)) {
      console.warn('Taxa de crescimento inválida detectada:', t.growthRate);
      return 0;
    }
    return t.growthRate;
  });
  if (taxasCrescimento.length === 0) {
    console.warn('Array de taxas de crescimento vazio, preenchendo com 0');
    taxasCrescimento = [0];
  }

  // Ajustar escala dos gráficos
  const barChartWidth = Math.max(screenWidth - 32, meses.length * 100);
  const barChartHeight = 260;
  const lineChartWidth = Math.max(screenWidth - 32, taxasCrescimento.length * 80);
  const lineChartHeight = 260;

  // Calcular o valor máximo para o eixo Y do gráfico de barras, com padding de 20%
  const maxTotal = Math.max(...totais);
  const yMax = Math.ceil(maxTotal * 1.2);
  // Calcular segmentos para o gráfico (mínimo 4, máximo 8)
  const segmentos = Math.max(4, Math.min(8, Math.ceil(yMax / (maxTotal / 4))));

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Análise de Tendências</Text>

        {/* Resumo */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumo Geral</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Geral</Text>
              <Text style={styles.summaryValue}>
                R$ {report.summary.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média Mensal</Text>
              <Text style={styles.summaryValue}>
                R$ {report.summary.avgMonthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Transações</Text>
              <Text style={styles.summaryValue}>{report.summary.totalTransactions}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média Transações/Mês</Text>
              <Text style={styles.summaryValue}>
                {report.summary.avgMonthlyCount.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico de Barras - Totais Mensais */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Totais Mensais</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <BarChart
              data={{ labels: meses, datasets: [{ data: totais }] }}
              width={barChartWidth}
              height={barChartHeight}
              yAxisLabel="R$ "
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: { borderRadius: 16 },
                barPercentage: 0.5,
                propsForLabels: { fontSize: 12 },
                propsForBackgroundLines: { stroke: '#e3e3e3' },
                propsForVerticalLabels: { fontSize: 12 },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              segments={segmentos}
              yAxisInterval={1}
              withInnerLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              yLabelsOffset={8}
            />
          </ScrollView>
        </View>

        {/* Gráfico de Linha - Taxa de Crescimento */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Taxa de Crescimento Mensal (%)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <LineChart
              data={{ labels: report.trend.map(t => t.toMonth), datasets: [{ data: taxasCrescimento }] }}
              width={lineChartWidth}
              height={lineChartHeight}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: { borderRadius: 16 },
                propsForLabels: { fontSize: 12 },
                propsForBackgroundLines: { stroke: '#e3e3e3' },
                propsForVerticalLabels: { fontSize: 12 },
              }}
              style={styles.chart}
              segments={6}
              yAxisInterval={1}
              withInnerLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
            />
          </ScrollView>
        </View>

        {/* Análise de Variabilidade */}
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>Análise de Variabilidade</Text>
          <View style={styles.analysisGrid}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Desvio Padrão dos Valores</Text>
              <Text style={styles.analysisValue}>
                R$ {report.summary.stdDevTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Desvio Padrão das Transações</Text>
              <Text style={styles.analysisValue}>
                {report.summary.stdDevCount.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Insights</Text>
          <Text style={styles.insightsText}>
            {report.summary.avgMonthlyTotal > 0
              ? report.summary.stdDevTotal < report.summary.avgMonthlyTotal * 0.2
                ? 'Suas receitas são bastante estáveis, com baixa variabilidade mensal.'
                : 'Suas receitas apresentam alta variabilidade mensal. Considere diversificar suas fontes de renda.'
              : 'Cadastre receitas para gerar insights sobre suas tendências financeiras.'}
          </Text>
          <Text style={styles.insightsText}>
            {report.trend.length > 0 && report.trend[report.trend.length - 1].growthRate > 0
              ? 'Tendência positiva: suas receitas estão crescendo.'
              : report.trend.length > 0
                ? 'Atenção: suas receitas estão em tendência de queda.'
                : ''}
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
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
  },
  analysisContainer: {
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
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisItem: {
    width: '48%',
    marginBottom: 16,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  insightsContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  insightsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
}); 