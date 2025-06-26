import { Layout } from '@/components/Layout';
import { incomes } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';

const Container = styled.ScrollView`
  flex: 1;
  background: #fff;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

const Title = styled.Text`
  font-size: 24px;
  color: #7b2ff2;
  font-weight: bold;
`;

const AddButton = styled(TouchableOpacity)`
  background-color: #7b2ff2;
  padding: 8px 16px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const AddButtonText = styled.Text`
  color: white;
  font-weight: bold;
`;

const Table = styled.View`
  margin: 16px;
  background-color: white;
  border-radius: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
  overflow: hidden;
`;

const TableHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 16px;
  background-color: #f8f8f8;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

const TableRow = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
  background-color: white;
`;

const TableRowLast = styled(TableRow)`
  border-bottom-width: 0;
`;

const Cell = styled.Text`
  flex: 1;
  color: #333;
  font-size: 16px;
`;

const CellHeader = styled(Cell)`
  font-weight: bold;
  color: #7b2ff2;
`;

const CellDescription = styled(Cell)`
  flex: 1.5;
  color: #333;
  font-size: 16px;
`;

const CellDate = styled(Cell)`
  color: #666;
`;

const CellValue = styled(Cell)`
  color: #4CAF50;
  font-weight: 500;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.View`
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
`;

const ActionModalContent = styled(ModalContent)`
  width: 80%;
  max-width: 300px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
  color: #7b2ff2;
`;

const Input = styled(TextInput)`
  background-color: #f0f0f0;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 16px;
`;

const ModalButtons = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
`;

const ModalButton = styled(TouchableOpacity)<{ variant?: 'cancel' | 'save' }>`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  background-color: ${props => props.variant === 'cancel' ? '#666' : '#7b2ff2'};
`;

const ActionButton = styled(TouchableOpacity)<{ variant?: 'edit' | 'delete' }>`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 10px;
  background-color: ${props => props.variant === 'delete' ? '#666' : '#7b2ff2'};
  margin-bottom: 12px;
  gap: 12px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const ActionButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const ImageContainer = styled.View`
  margin-bottom: 16px;
  align-items: center;
`;

const ImagePreview = styled.Image`
  width: 200px;
  height: 200px;
  border-radius: 10px;
  margin-bottom: 8px;
`;

const ImageButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  background-color: #7b2ff2;
  padding: 12px;
  border-radius: 10px;
  gap: 8px;
`;

const ImageButtonText = styled.Text`
  color: white;
  font-weight: bold;
`;

const RemoveImageButton = styled(TouchableOpacity)`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 8px;
  border-radius: 20px;
`;

const DateInputContainer = styled.View`
  position: relative;
  margin-bottom: 16px;
`;

const DateInput = styled(TextInput)`
  background-color: #f0f0f0;
  border-radius: 10px;
  padding: 12px;
  font-size: 16px;
`;

const CalendarButton = styled(TouchableOpacity)`
  position: absolute;
  right: 12px;
  top: 12px;
`;

export default function ReceitasScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedReceita, setSelectedReceita] = useState<any>(null);
  const [receitas, setReceitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [novaReceita, setNovaReceita] = useState({
    data: '',
    descricao: '',
    valor: '',
    categoria: '',
    imagem: null as string | null,
  });
  const router = useRouter();

  useEffect(() => {
    carregarReceitas();
  }, []);

  const carregarReceitas = async () => {
    try {
      console.log('Iniciando carregamento de receitas...');
      setLoading(true);
      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);
      console.log('Usuário carregado:', user);
      
      const response = await incomes.list(user.id);
      console.log('Resposta da API:', response);
      
      if (response && Array.isArray(response)) {
        console.log('Dados das receitas:', response);
        setReceitas(response);
        console.log('Estado das receitas atualizado:', response);
      } else {
        console.log('Resposta inválida da API:', response);
        setReceitas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as receitas');
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da sua permissão para acessar a câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNovaReceita(prev => ({ ...prev, imagem: result.assets[0].uri }));
    }
  };

  const removeImage = () => {
    setNovaReceita(prev => ({ ...prev, imagem: null }));
  };

  const handleRowPress = (receita: any) => {
    setSelectedReceita(receita);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    const [year, month, day] = selectedReceita.date.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    setNovaReceita({
      data: formatDate(date),
      descricao: selectedReceita.description,
      valor: selectedReceita.amount.toString(),
      categoria: selectedReceita.category,
      imagem: selectedReceita.image || null,
    });
    setModalVisible(true);
  };

  const handleDelete = async () => {
    try {
      if (!selectedReceita || !selectedReceita._id) throw new Error('ID da receita não encontrado');
      await incomes.delete(selectedReceita._id);
      setActionModalVisible(false);
      await carregarReceitas();
      Toast.show({ type: 'success', text1: 'Receita excluída', text2: 'A receita foi excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível excluir a receita' });
    }
  };

  const formatDate = (date: Date) => {
    const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    const day = localDate.getDate().toString().padStart(2, '0');
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
    const year = localDate.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const formatISODate = (isoDate: string) => {
    try {
      const [year, month, day] = isoDate.split('T')[0].split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return formatDate(date);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const localDate = new Date(selectedDate.getTime() + (selectedDate.getTimezoneOffset() * 60000));
      setNovaReceita(prev => ({ ...prev, data: formatDate(localDate) }));
    }
  };

  const handleSave = async () => {
    try {
      if (!novaReceita.data || !novaReceita.descricao || !novaReceita.valor || !novaReceita.categoria) {
        Toast.show({ type: 'error', text1: 'Campos incompletos', text2: 'Por favor, preencha todos os campos.' });
        return;
      }

      const dateRegex = /^\d{2}-\d{2}-\d{2}$/;
      if (!dateRegex.test(novaReceita.data)) {
        Toast.show({ type: 'error', text1: 'Data inválida', text2: 'Use o formato DD-MM-AA (ex: 01-01-24)' });
        return;
      }

      const valorNumerico = parseFloat(novaReceita.valor.replace(',', '.'));
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        Toast.show({ type: 'error', text1: 'Valor inválido', text2: 'Digite um valor válido maior que zero' });
        return;
      }

      const [day, month, year] = novaReceita.data.split('-');
      const fullYear = parseInt(year) >= 70 ? 1900 + parseInt(year) : 2000 + parseInt(year);
      const formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const userData = await AsyncStorage.getItem('@CashTab:user');
      if (!userData) throw new Error('Usuário não encontrado');
      const user = JSON.parse(userData);

      const receitaData = {
        description: novaReceita.descricao.trim(),
        amount: valorNumerico,
        date: formattedDate,
        category: novaReceita.categoria.trim(),
        image: novaReceita.imagem,
        userId: user.id
      };

      if (!selectedReceita || !selectedReceita._id) {
        await incomes.create(receitaData);
      } else {
        await incomes.update(selectedReceita._id, receitaData);
      }

      setModalVisible(false);
      setNovaReceita({ data: '', descricao: '', valor: '', categoria: '', imagem: null });
      setSelectedReceita(null);
      await carregarReceitas();

      Toast.show({ type: 'success', text1: 'Receita salva', text2: 'A receita foi salva com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao salvar receita:', error);
      if (error.message.includes('Sessão expirada')) {
        router.replace('/Login');
        return;
      }
      Toast.show({ type: 'error', text1: 'Erro', text2: error.message || 'Não foi possível salvar a receita' });
    }
  };

  const formatValue = (text: string) => {
    const numbers = text.replace(/[^\d,]/g, '');
    const parts = numbers.split(',');
    if (parts.length > 2) parts.pop();
    const formatted = parts.join(',');
    setNovaReceita(prev => ({ ...prev, valor: formatted }));
  };

  return (
    <Layout>
      <Container>
        <Header>
          <Title>Receitas</Title>
          <AddButton onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={20} color="white" />
            <AddButtonText>Adicionar</AddButtonText>
          </AddButton>
        </Header>

        <Table>
          <TableHeader>
            <CellHeader style={{ flex: 0.8 }}>DATA</CellHeader>
            <CellHeader style={{ flex: 1.5 }}>DESCRIÇÃO</CellHeader>
            <CellHeader style={{ flex: 1 }}>VALOR</CellHeader>
          </TableHeader>
          {receitas.map((item, index) => {
            const isLast = index === receitas.length - 1;
            const RowComponent = isLast ? TableRowLast : TableRow;
            
            return (
              <RowComponent 
                key={item._id}
                onPress={() => handleRowPress(item)}
                activeOpacity={0.7}
              >
                <CellDate style={{ flex: 0.8 }}>{formatISODate(item.date)}</CellDate>
                <CellDescription numberOfLines={1} ellipsizeMode="tail">
                  {item.description}
                </CellDescription>
                <CellValue style={{ flex: 1 }}>R$ {item.amount.toFixed(2)}</CellValue>
              </RowComponent>
            );
          })}
        </Table>
      </Container>

      {/* Modal de Adicionar/Editar */}
      <Modal
        key="add-edit-modal"
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>
              {selectedReceita ? 'Editar Receita' : 'Nova Receita'}
            </ModalTitle>
            
            <DateInputContainer>
              <DateInput
                placeholder="Data (DD-MM-AA)"
                value={novaReceita.data}
                editable={false}
                placeholderTextColor="#666"
                onPressIn={() => setShowDatePicker(true)}
              />
            </DateInputContainer>

            {showDatePicker && (
              <DateTimePicker
                value={novaReceita.data ? new Date(novaReceita.data.split('-').reverse().join('-')) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={(event, date) => {
                  if (date) {
                    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                    setNovaReceita(prev => ({
                      ...prev,
                      data: formatDate(localDate)
                    }));
                    setShowDatePicker(false);
                  }
                }}
                style={{ backgroundColor: 'white' }}
                textColor="#000"
              />
            )}

            <Input
              placeholder="Descrição"
              value={novaReceita.descricao}
              onChangeText={(text) => setNovaReceita({ ...novaReceita, descricao: text })}
              placeholderTextColor="#666"
            />

            <Input
              placeholder="Valor"
              value={novaReceita.valor}
              onChangeText={formatValue}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />

            <Input
              placeholder="Categoria"
              value={novaReceita.categoria}
              onChangeText={(text) => setNovaReceita({ ...novaReceita, categoria: text })}
              placeholderTextColor="#666"
            />

            <ImageContainer>
              {novaReceita.imagem ? (
                <View>
                  <ImagePreview source={{ uri: novaReceita.imagem }} />
                  <RemoveImageButton onPress={removeImage}>
                    <Feather name="x" size={20} color="white" />
                  </RemoveImageButton>
                </View>
              ) : (
                <ImageButton onPress={pickImage}>
                  <Feather name="camera" size={20} color="white" />
                  <ImageButtonText>Tirar Foto</ImageButtonText>
                </ImageButton>
              )}
            </ImageContainer>

            <ModalButtons>
              <ModalButton
                variant="cancel"
                onPress={() => {
                  setModalVisible(false);
                  setNovaReceita({ data: '', descricao: '', valor: '', categoria: '', imagem: null });
                  setSelectedReceita(null);
                }}
              >
                <ButtonText>Cancelar</ButtonText>
              </ModalButton>

              <ModalButton variant="save" onPress={handleSave}>
                <ButtonText>Salvar</ButtonText>
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* Modal de Ações */}
      <Modal
        key="action-modal"
        animationType="slide"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <ModalOverlay>
          <ActionModalContent>
            <ModalTitle>O que deseja fazer?</ModalTitle>
            
            <ActionButton variant="edit" onPress={handleEdit}>
              <Feather name="edit" size={24} color="white" />
              <ActionButtonText>Editar</ActionButtonText>
            </ActionButton>

            <ActionButton variant="delete" onPress={handleDelete}>
              <Feather name="trash-2" size={24} color="white" />
              <ActionButtonText>Excluir</ActionButtonText>
            </ActionButton>

            <ModalButton
              variant="cancel"
              onPress={() => {
                setActionModalVisible(false);
                setSelectedReceita(null);
              }}
            >
              <ButtonText>Cancelar</ButtonText>
            </ModalButton>
          </ActionModalContent>
        </ModalOverlay>
      </Modal>

      <Toast />
    </Layout>
  );
} 