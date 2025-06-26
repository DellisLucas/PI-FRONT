import { auth } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, TextInput, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';

const Container = styled.View`
  padding: 20px;
  padding-bottom: 40px;
  padding-left: 40px;
  padding-right: 40px;
  justify-content: center;
  background-color: #fff;
  border-radius: 16px;
  elevation: 4; /* sombra Android */
  shadow-color: #000; /* sombra iOS */
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  margin: 32px 16px;
`;

const Input = styled(TextInput)`
  background-color: #f0f0f0;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 16px;
  font-size: 16px;
`;

const Button = styled(TouchableOpacity)`
  background-color: #7b2ff2;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin-top: 16px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

const RegisterButton = styled(TouchableOpacity)`
  margin-top: 16px;
  align-items: center;
`;

const RegisterText = styled.Text`
  color: #7b2ff2;
  font-size: 16px;
`;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Tentando fazer login com:', { email });
      const response = await auth.login({ email, password });
      console.log('Resposta do login:', response);
      
      // Verificar se temos um token na resposta
      if (!response.data?.access_token) {
        throw new Error('Token não recebido do servidor');
      }

      // Limpar tokens antigos
      await AsyncStorage.removeItem('@CashTab:token');
      await AsyncStorage.removeItem('@CashTab:user');

      // Salvar o token no AsyncStorage
      const token = response.data.access_token.trim();
      await AsyncStorage.setItem('@CashTab:token', token);
      console.log('Token salvo:', token);
      
      // Salvar os dados do usuário
      await AsyncStorage.setItem('@CashTab:user', JSON.stringify(response.data.user));
      console.log('Dados do usuário salvos:', response.data.user);

      Toast.show({
        type: 'success',
        text1: 'Login realizado!',
        text2: 'Bem-vindo de volta.',
      });

      router.replace('/Dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro no login',
        text2: error instanceof Error ? error.message : 'Email ou senha incorretos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/Register');
  };

  return (
    <ImageBackground
      source={require('../assets/images/background.png')} // ajuste o caminho conforme necessário
      style={{ width: '100%', height: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}
      resizeMode="cover"
    >
      <Container>
        <Image
          source={require('../assets/images/login.png')}
          style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 24 }}
          resizeMode="contain"
        />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
        />

        <Input
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />

        <Button onPress={handleLogin} disabled={loading}>
          <ButtonText>{loading ? 'Entrando...' : 'ENTRAR'}</ButtonText>
        </Button>

        <RegisterButton onPress={handleRegister}>
          <RegisterText>Não tem uma conta? Cadastre-se</RegisterText>
        </RegisterButton>

        <Toast />
      </Container>
    </ImageBackground>
  );
}
