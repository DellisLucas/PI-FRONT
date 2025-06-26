import { Layout } from '@/components/Layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface CategoryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  incomeCategories: CategoryData[];
  expenseCategories: CategoryData[];
  totalIncome: number;
  totalExpense: number;
}

export default function RelatorioCategoriasScreen() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CategoryReport | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);

      const now = new Date();
      const startDateISO = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
      const endDateISO = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const API_URL = 'http://10.0.0.9:3001';
      console.log('Carregando relatório por categorias para:', { startDateISO, endDateISO });
      console.log('Token de autenticação:', await AsyncStorage.getItem('@CashTab:token'));

      const response = await fetch(
        `${API_URL}/api/reports/categories?userId=${user.id}&startDate=${startDateISO}&endDate=${endDateISO}`,
        {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('@CashTab:token')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dados brutos recebidos do backend:', data);
      setReport(data);

    } catch (error) {
      console.error('Erro ao carregar relatório por categorias:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar o relatório por categorias'
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
          <Text style={styles.title}>Relatório por Categorias</Text>
          <Text style={styles.noDataText}>Nenhum dado disponível para o período.</Text>
        </View>
      </Layout>
    );
  }

  // Função para gerar cores distintas
  function getColor(index: number, total: number, type: 'income' | 'expense') {
    if (type === 'income') {
      // Tons de verde e azul
      const base = 120 + (index * 120) / Math.max(1, total - 1);
      return `hsl(${base}, 60%, 50%)`;
    } else {
      // Tons de vermelho e laranja
      const base = 10 + (index * 60) / Math.max(1, total - 1);
      return `hsl(${base}, 80%, 60%)`;
    }
  }

  const incomePieData = report.incomeCategories.map((category, index) => ({
    name: category.category,
    population: category.total,
    color: getColor(index, report.incomeCategories.length, 'income'),
    legendFontColor: '#333',
    legendFontSize: 13,
  }));

  const expensePieData = report.expenseCategories.map((category, index) => ({
    name: category.category,
    population: category.total,
    color: getColor(index, report.expenseCategories.length, 'expense'),
    legendFontColor: '#333',
    legendFontSize: 13,
  }));

  // Logs para depuração dos dados processados
  console.log('incomePieData:', incomePieData);
  console.log('expensePieData:', expensePieData);
  console.log('Detalhamento incomeCategories:', report.incomeCategories);
  console.log('Detalhamento expenseCategories:', report.expenseCategories);

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Relatório por Categorias</Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Receitas Totais</Text>
            <Text style={[styles.summaryValue, styles.incomeValue]}>
              R$ {report.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Despesas Totais</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              R$ {report.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Receitas por Categoria</Text>
          {incomePieData.length > 0 ? (
            <PieChart
              data={incomePieData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>Nenhuma receita neste período.</Text>
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Despesas por Categoria</Text>
          {expensePieData.length > 0 ? (
            <PieChart
              data={expensePieData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>Nenhuma despesa neste período.</Text>
          )}
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Detalhamento por Categoria</Text>
          
          <Text style={styles.categoryTypeTitle}>Receitas</Text>
          {report.incomeCategories.length === 0 && (
            <Text style={styles.noDataText}>Nenhuma receita neste período.</Text>
          )}
          {report.incomeCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={[styles.categoryValue, styles.incomeValue]}>
                  R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <Text style={styles.categoryCount}>{category.count} transações</Text>
            </View>
          ))}

          <Text style={styles.categoryTypeTitle}>Despesas</Text>
          {report.expenseCategories.length === 0 && (
            <Text style={styles.noDataText}>Nenhuma despesa neste período.</Text>
          )}
          {report.expenseCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={[styles.categoryValue, styles.expenseValue]}>
                  R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <Text style={styles.categoryCount}>{category.count} transações</Text>
            </View>
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
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    alignItems: 'center',
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
    marginBottom: 24,
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
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  categoryItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 