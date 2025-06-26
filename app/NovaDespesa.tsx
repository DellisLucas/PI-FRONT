import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  background: #7b2ff2;
  justify-content: center;
  align-items: center;
`;

const Card = styled.View`
  background: #fff;
  padding: 32px 24px;
  border-radius: 24px;
  width: 90%;
  align-items: center;
  elevation: 4;
`;

const Title = styled.Text`
  font-size: 32px;
  color: #7b2ff2;
  font-weight: bold;
  margin-bottom: 24px;
  font-family: 'sans-serif';
`;

const Input = styled.TextInput`
  width: 100%;
  background: #eee;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  background: #a259f7;
  padding: 14px 0;
  border-radius: 16px;
  width: 100%;
  align-items: center;
  margin-top: 8px;
  box-shadow: 0px 2px 4px #00000020;
`;

const CancelButton = styled(Button)`
  background: #ff8a8a;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`;

export default function NovaDespesaScreen() {
  const [id, setId] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const router = useRouter();

  function handleCadastrar() {
    alert('Despesa cadastrada!');
    router.replace('/');
  }

  return (
    <Container>
      <Card>
        <Title>nova despesa</Title>
        <Input placeholder="ID" value={id} onChangeText={setId} />
        <Input placeholder="DATA" value={data} onChangeText={setData} />
        <Input placeholder="DESCRIÇÃO" value={descricao} onChangeText={setDescricao} />
        <Input placeholder="VALOR" value={valor} onChangeText={setValor} keyboardType="numeric" />
        <Button onPress={handleCadastrar}>
          <ButtonText>CADASTRAR DESPESA</ButtonText>
        </Button>
        <CancelButton onPress={() => router.replace('/') }>
          <ButtonText>CANCELAR</ButtonText>
        </CancelButton>
      </Card>
    </Container>
  );
} 