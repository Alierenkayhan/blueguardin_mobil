import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './AuthContext';
import { BASE_URL } from '../constants';

const LoginScreen = ({ navigation }) =>
{
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useContext(AuthContext);

    const handleLogin = async () =>
    {
        if (username.trim() === '' || password.trim() === '')
        {
            Alert.alert('Hata', 'Kullanıcı adı ve şifre boş olamaz.');
            return;
        }
        try
        {
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok)
            {
                Alert.alert('Başarılı', data.message || 'Giriş başarılı.');
                signIn({ username });
                navigation.navigate('Home');
            } else
            {
                Alert.alert('Giriş Hatası', data.error || 'Kullanıcı adı veya şifre yanlış.');
            }
        } catch (error)
        {
            Alert.alert('Giriş Hatası', 'Sunucuya bağlanılamadı.');
        }
    };

    return (
        <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.authInner}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
                <Text style={styles.authTitle}>Giriş Yap</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Kullanıcı Adı"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Şifre"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#3498db" style={styles.icon} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Kayıt Ol</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    authContainer: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    authInner: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    authTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#333',
        marginBottom: 25,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    icon: {
        marginLeft: -35,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#3498db',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginVertical: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    linkButton: {
        marginTop: 10,
    },
    linkText: {
        color: '#3498db',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
