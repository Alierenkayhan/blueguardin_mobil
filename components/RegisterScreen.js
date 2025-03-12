import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants';

const RegisterScreen = ({ navigation }) =>
{
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async () =>
    {
        if (username.trim() === '' || password.trim() === '' || confirmPassword.trim() === '')
        {
            Alert.alert('Hata', 'Tüm alanlar doldurulmalıdır.');
            return;
        }
        if (password.length < 6)
        {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }
        if (password !== confirmPassword)
        {
            Alert.alert('Hata', 'Şifreler uyuşmuyor.');
            return;
        }

        try
        {
            const response = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            if (response.ok)
            {
                Alert.alert('Başarılı', 'Kayıt başarılı, artık giriş yapabilirsiniz.');
                navigation.navigate('Login');
            } else if (response.status === 409)
            {
                Alert.alert('Kayıt Hatası', 'Bilinmeyen bir hata oluştu.');
            } else if (response.status === 400)
            {
                Alert.alert('Kayıt Hatası', 'Kullanıcı adı veya şifre zaten alınmış.');
            } else
            {
                Alert.alert('Kayıt Hatası', 'Bilinmeyen bir hata oluştu.');
            }
        } catch (error)
        {
            console.error("Kayıt hatası:", error);
            Alert.alert('Kayıt Hatası', 'Sunucuya bağlanılamadı.');
        }
    };



    return (
        <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.authInner}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
                <Text style={styles.authTitle}>Kayıt Ol</Text>
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
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Şifre Tekrar"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#3498db" style={styles.icon} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Kayıt Ol</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Girişe Dön</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default RegisterScreen;

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
