import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import RaspberryPiControl from './components/RaspberryPiControl';
import { AuthProvider } from './components/AuthContext';

const Stack = createStackNavigator();


export default function App()
{
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={RaspberryPiControl} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
