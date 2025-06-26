import { auth } from '@/services/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, TextInput, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';

const Container = styled.View`
  padding: 20px;
  padding-bottom: 40px;
  padding-left: 60px;
  padding-right: 60px;
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

const Title = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: #7b2ff2;
  text-align: center;
  margin-bottom: 40px;
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

const LoginButton = styled(TouchableOpacity)`
  margin-top: 16px;
  align-items: center;
`;

const LoginText = styled.Text`
  color: #7b2ff2;
  font-size: 16px;
`;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Senhas diferentes',
        text2: 'As senhas não coincidem.',
      });
      return;
    }

    try {
      setLoading(true);
      await auth.register({ username: name, email, password });

      Toast.show({
        type: 'success',
        text1: 'Conta criada!',
        text2: 'Faça login para continuar.',
      });

      router.replace('/Login');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro no cadastro',
        text2: 'Não foi possível criar sua conta.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.replace('/Login');
  };

  return (
        <ImageBackground
          source={require('../assets/images/background.png')} // ajuste o caminho conforme necessário
          style={{ width: '100%', height: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}
          resizeMode="cover"
        >
          <Container>
            <Image
              source={require('../assets/images/register.png')}
              style={{ width: 200, height: 100, alignSelf: 'center', marginBottom: 24 }}
              resizeMode="contain"
            />
      
      <Input
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#666"
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

      <Input
        placeholder="Confirmar Senha"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#666"
      />

      <Button onPress={handleRegister} disabled={loading}>
        <ButtonText>{loading ? 'Cadastrando...' : 'CADASTRAR'}</ButtonText>
      </Button>

      <LoginButton onPress={handleLogin}>
        <LoginText>Já tem uma conta? Faça login</LoginText>
      </LoginButton>

      <Toast />
    </Container>
      </ImageBackground>
  );
}
