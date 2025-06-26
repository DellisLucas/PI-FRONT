import { Layout } from '@/components/Layout';
import { expenses, incomes } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  userId: string;
  image?: string | null;
}

interface MonthlyReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomes: Transaction[];
  expenses: Transaction[];
}

export default function RelatorioMensalScreen() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);

      // Buscar despesas e receitas do mês atual
      const [despesasResponse, receitasResponse] = await Promise.all([
        expenses.list(user.id),
        incomes.list(user.id)
      ]);

      console.log('Resposta completa das despesas:', JSON.stringify(despesasResponse, null, 2));
      console.log('Resposta completa das receitas:', JSON.stringify(receitasResponse, null, 2));

      const despesas = Array.isArray(despesasResponse.data) ? despesasResponse.data : [];
      const receitas = Array.isArray(receitasResponse) ? receitasResponse : [];

      console.log('Despesas após conversão:', despesas);
      console.log('Receitas após conversão:', receitas);

      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth() + 1;
      const anoAtual = dataAtual.getFullYear();

      console.log('Data atual:', dataAtual);
      console.log('Mês atual:', mesAtual);
      console.log('Ano atual:', anoAtual);

      let totalDespesasMes = 0;
      let totalReceitasMes = 0;

      // Filtrar despesas e receitas do mês atual
      const despesasDoMes = despesas.filter((despesa: Transaction) => {
        const dataDespesa = new Date(despesa.date);
        return dataDespesa.getMonth() + 1 === mesAtual && dataDespesa.getFullYear() === anoAtual;
      });

      const receitasDoMes = receitas.filter((receita: Transaction) => {
        const dataReceita = new Date(receita.date);
        return dataReceita.getMonth() + 1 === mesAtual && dataReceita.getFullYear() === anoAtual;
      });

      console.log('Despesas do mês:', despesasDoMes);
      console.log('Receitas do mês:', receitasDoMes);

      // Calcular totais
      totalDespesasMes = despesasDoMes.reduce((total, despesa) => total + despesa.amount, 0);
      totalReceitasMes = receitasDoMes.reduce((total, receita) => total + receita.amount, 0);

      console.log('Total de despesas do mês:', totalDespesasMes);
      console.log('Total de receitas do mês:', totalReceitasMes);

      setReport({
        month: mesAtual,
        year: anoAtual,
        totalIncome: totalReceitasMes,
        totalExpense: totalDespesasMes,
        balance: totalReceitasMes - totalDespesasMes,
        incomes: receitasDoMes,
        expenses: despesasDoMes
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os dados'
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
          <Text style={styles.title}>Relatório Mensal</Text>
          <Text style={styles.noDataText}>Nenhum dado disponível para o período.</Text>
        </View>
      </Layout>
    );
  }

  const pieData = [
    {
      name: 'Receitas',
      population: report.totalIncome,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Despesas',
      population: report.totalExpense,
      color: '#FF6B6B',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Relatório Mensal</Text>
        
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

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribuição de Receitas e Despesas</Text>
          <PieChart
            data={pieData}
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
        </View>

        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Receitas do Mês</Text>
          {report.incomes && report.incomes.length > 0 ? (
            report.incomes.map((income, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionDate}>
                    {new Date(income.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={[styles.transactionValue, styles.incomeValue]}>
                    +R$ {income.amount.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.transactionDescription}>{income.description}</Text>
                <Text style={styles.transactionCategory}>{income.category}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Nenhuma receita registrada neste mês.</Text>
          )}

          <Text style={styles.sectionTitle}>Despesas do Mês</Text>
          {report.expenses && report.expenses.length > 0 ? (
            report.expenses.map((expense, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionDate}>
                    {new Date(expense.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={[styles.transactionValue, styles.expenseValue]}>
                    -R$ {expense.amount.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.transactionDescription}>{expense.description}</Text>
                <Text style={styles.transactionCategory}>{expense.category}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Nenhuma despesa registrada neste mês.</Text>
          )}
        </View>
      </ScrollView>
      <Toast />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
  },
  transactionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
  },
}); 