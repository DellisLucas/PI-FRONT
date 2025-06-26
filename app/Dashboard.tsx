import { Layout } from '@/components/Layout';
import { expenses, incomes } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  month: string;
  expenses: number;
  incomes: number;
}

interface PieDataItem {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface BarData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

export default function HomeScreen() {
  const [meta, setMeta] = useState(500);
  const [loading, setLoading] = useState(true);
  const [despesa, setDespesa] = useState(0);
  const [receita, setReceita] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pieData, setPieData] = useState<PieDataItem[]>([]);
  const [barData, setBarData] = useState<BarData>({ labels: [], datasets: [] });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);
      console.log('Usuário carregado:', user);

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

      // Processa despesas do mês atual
      despesas.forEach(despesa => {
        console.log('Processando despesa:', despesa);
        const dataDespesa = new Date(despesa.date);
        const mesDespesa = dataDespesa.getMonth() + 1;
        const anoDespesa = dataDespesa.getFullYear();

        const detalhes = {
          data: dataDespesa,
          mes: mesDespesa,
          ano: anoDespesa,
          mesAtual,
          anoAtual,
          valor: despesa.amount,
          match: mesDespesa === mesAtual && anoDespesa === anoAtual
        };
        console.log('Despesa detalhada:', detalhes);

        if (detalhes.match) {
          totalDespesasMes += Number(despesa.amount);
        }
      });

      // Processa receitas do mês atual
      receitas.forEach(receita => {
        console.log('Processando receita:', receita);
        const dataReceita = new Date(receita.date);
        const mesReceita = dataReceita.getMonth() + 1;
        const anoReceita = dataReceita.getFullYear();

        const detalhes = {
          data: dataReceita,
          mes: mesReceita,
          ano: anoReceita,
          mesAtual,
          anoAtual,
          valor: receita.amount,
          match: mesReceita === mesAtual && anoReceita === anoAtual
        };
        console.log('Receita detalhada:', detalhes);

        if (detalhes.match) {
          totalReceitasMes += Number(receita.amount);
        }
      });

      console.log('Total de despesas do mês:', totalDespesasMes);
      console.log('Total de receitas do mês:', totalReceitasMes);

      // Prepara dados para os gráficos
      setPieData([
        {
          name: 'Despesas',
          population: totalDespesasMes || 0,
          color: '#FF6B6B',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        },
        {
          name: 'Receitas',
          population: totalReceitasMes || 0,
          color: '#4CAF50',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }
      ]);

      // Preparar dados dos últimos 6 meses
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const data = new Date(anoAtual, mesAtual - i, 1);
        const mes = data.toLocaleString('pt-BR', { month: 'short' });
        
        const despesasMes = despesas
          .filter(d => {
            const dataDespesa = new Date(d.date);
            return dataDespesa.getMonth() === data.getMonth() && 
                   dataDespesa.getFullYear() === data.getFullYear();
          })
          .reduce((total, d) => total + d.amount, 0);

        const receitasMes = receitas
          .filter(r => {
            const dataReceita = new Date(r.date);
            return dataReceita.getMonth() === data.getMonth() && 
                   dataReceita.getFullYear() === data.getFullYear();
          })
          .reduce((total, r) => total + r.amount, 0);

        meses.push({
          month: mes,
          expenses: despesasMes,
          incomes: receitasMes
        });
      }

      // Prepara dados para o gráfico de barras
      setBarData({
        labels: meses.map(m => m.month),
        datasets: [
          {
            data: meses.map(m => m.expenses),
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`, // Vermelho para despesas
            strokeWidth: 2
          },
          {
            data: meses.map(m => m.incomes),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Verde para receitas
            strokeWidth: 2
          }
        ],
        legend: ['Despesas', 'Receitas']
      });

      setDespesa(totalDespesasMes || 0);
      setReceita(totalReceitasMes || 0);

      setMonthlyData(meses);
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

  const handleNewGoal = () => {
    setModalVisible(true);
  };

  const handleSaveGoal = () => {
    const valor = parseFloat(novaMeta);
    if (isNaN(valor) || valor <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Valor inválido',
        text2: 'Por favor, insira um valor válido maior que zero.',
      });
      return;
    }

    setMeta(valor);
    setModalVisible(false);
    setNovaMeta('');
    
    Toast.show({
      type: 'success',
      text1: 'Meta atualizada',
      text2: `Nova meta: R$ ${valor.toFixed(2)}`,
    });
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>GASTOS E RECEITAS DO MÊS</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#666" />
        ) : (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Despesas x Receitas (Mês Atual)</Text>
              {despesa > 0 || receita > 0 ? (
                <PieChart
                  data={pieData}
                  width={screenWidth}
                  height={250}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text style={styles.noDataText}>Nenhum dado disponível para o mês atual</Text>
              )}
            </View>

            <Text style={styles.subtitle}>ÚLTIMOS 6 MESES</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={barData}
                width={screenWidth - 32}
                height={250}
                yAxisLabel="R$ "
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.5,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
                fromZero
                segments={5}
              />
            </View>
          </>
        )}

        <View style={styles.metaSection}>
          <Text style={styles.subtitle}>META MENSAL</Text>
          <Button title={`Guardar R$ ${meta.toFixed(2)}`} onPress={handleNewGoal} />
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            Precisa de ajuda?{'\n'}Consulte nossas dicas
          </Text>
          <Image
            source={require('../assets/images/pig.png')}
            style={styles.pigImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Definir Nova Meta</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Digite o valor da meta"
              keyboardType="numeric"
              value={novaMeta}
              onChangeText={setNovaMeta}
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNovaMeta('');
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  metaSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  pigImage: {
    width: 80,
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
});
