import { Layout } from '@/components/Layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  _id: { year: number; month: number };
  total: number;
  count: number;
}

interface PredictiveReport {
  avgMonthlyTotal: number;
  stdDevTotal: number;
  trend: number;
  nextMonthPrediction: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  monthlyData?: MonthlyData[];
}

export default function PreditivoScreen() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<PredictiveReport | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

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
      const token = await AsyncStorage.getItem('@CashTab:token');
      console.log('Fazendo requisição para preditivo...');
      const response = await fetch(`${API_URL}/api/reports/predictive?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      console.log('Status da resposta:', response.status);
      if (!response.ok) throw new Error('Erro ao buscar relatório');
      const result = await response.json();
      console.log('Resposta da API preditivo:', result);
      if (!result || typeof result !== 'object') throw new Error('Dados inválidos recebidos');
      setReport(result);
      // Buscar também os dados mensais históricos, se vierem
      if (result.monthlyData) setMonthlyData(result.monthlyData);
    } catch (error: any) {
      console.error('Erro ao carregar preditivo:', error);
      Toast.show({ type: 'error', text1: 'Erro', text2: error?.message || 'Não foi possível carregar o preditivo' });
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
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#333', fontSize: 16, textAlign: 'center' }}>
            Nenhum dado preditivo encontrado para exibir.
          </Text>
        </View>
      </Layout>
    );
  }

  // Preparar dados para o gráfico
  const meses = monthlyData.map(m => `${m._id.month}/${m._id.year.toString().slice(-2)}`);
  const totais = monthlyData.map(m => (typeof m.total === 'number' && Number.isFinite(m.total) ? m.total : 0));
  // Adicionar previsão do próximo mês
  const proximoMes = meses.length > 0 ? `+1` : 'Próx.';
  const mesesComPrevisao = [...meses, proximoMes];
  const totaisComPrevisao = [...totais, report.nextMonthPrediction];

  // Ajustar escala do gráfico
  const chartWidth = Math.max(screenWidth - 32, mesesComPrevisao.length * 80);
  const chartHeight = 260;
  const maxTotal = Math.max(...totaisComPrevisao, report.confidenceInterval.upper);
  const yMax = Math.ceil(maxTotal * 1.2);
  const segmentos = Math.max(4, Math.min(8, Math.ceil(yMax / (maxTotal / 4))));

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Relatório Preditivo</Text>
        {/* Resumo */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Indicadores</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média Mensal</Text>
              <Text style={styles.summaryValue}>R$ {report.avgMonthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Desvio Padrão</Text>
              <Text style={styles.summaryValue}>R$ {report.stdDevTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tendência Média</Text>
              <Text style={styles.summaryValue}>{(report.trend * 100).toFixed(2)}%</Text>
            </View>
          </View>
        </View>
        {/* Previsão */}
        <View style={styles.predictionContainer}>
          <Text style={styles.predictionTitle}>Previsão para o Próximo Mês</Text>
          <Text style={styles.predictionValue}>R$ {report.nextMonthPrediction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.predictionInterval}>
            Intervalo de confiança: R$ {report.confidenceInterval.lower.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a R$ {report.confidenceInterval.upper.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        {/* Gráfico */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Histórico e Previsão</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <LineChart
              data={{
                labels: mesesComPrevisao,
                datasets: [
                  { data: totaisComPrevisao, color: () => '#2196F3' },
                ],
              }}
              width={chartWidth}
              height={chartHeight}
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
                propsForLabels: { fontSize: 12 },
                propsForBackgroundLines: { stroke: '#e3e3e3' },
                propsForVerticalLabels: { fontSize: 12 },
              }}
              style={styles.chart}
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
        {/* Insight */}
        <View style={styles.insightContainer}>
          <Text style={styles.insightTitle}>Insight</Text>
          <Text style={styles.insightText}>
            {report.trend > 0
              ? 'Sua tendência é de crescimento. A previsão para o próximo mês é otimista.'
              : report.trend < 0
                ? 'Atenção: tendência de queda. Considere revisar suas fontes de receita.'
                : 'Tendência estável. Mantenha o acompanhamento para identificar mudanças.'}
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
  predictionContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  predictionValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  predictionInterval: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
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
  insightContainer: {
    backgroundColor: '#fffde7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF9800',
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
}); 