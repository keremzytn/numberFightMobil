import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.102:3000';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const user = await AsyncStorage.getItem('user');
            if (user) {
                router.replace('/(tabs)');
            }
        };
        checkAuth();
    }, []);

    const isEmailValid = (mail: string) => /^\S+@\S+\.\S+$/.test(mail);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Uyarı', 'Mail ve parola alanları boş bırakılamaz.');
            return;
        }
        if (!isEmailValid(email)) {
            Alert.alert('Uyarı', 'Geçerli bir e-posta adresi girin.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === 'Kullanıcı bulunamadı') {
                    Alert.alert('Hata', 'Kayıtlı olmayan kullanıcı.');
                } else if (data.error === 'Parola hatalı') {
                    Alert.alert('Hata', 'Hatalı parola.');
                } else {
                    Alert.alert('Hata', data.error || 'Giriş başarısız.');
                }
            } else {
                if (data.user && data.user.token) {
                    await AsyncStorage.setItem('user', JSON.stringify(data.user));
                    Alert.alert('Başarılı', 'Giriş başarılı!', [
                        { text: 'Tamam', onPress: () => router.replace('/(tabs)') },
                    ]);
                } else {
                    Alert.alert('Hata', 'Sunucudan geçerli bir oturum anahtarı alınamadı. Lütfen tekrar deneyin.');
                }
            }
        } catch (e) {
            Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Giriş Yap</Text>
            <TextInput
                style={styles.input}
                placeholder="E-posta"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title={loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'} onPress={handleLogin} disabled={loading} />
            <View style={styles.linksContainer}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/Register')}>
                    <Text style={styles.link}>Kayıt Ol</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled>
                    <Text style={[styles.link, { color: '#aaa' }]}>Parolamı Unuttum</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f4f8fb',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#0a7ea4',
    },
    input: {
        width: 260,
        height: 48,
        borderColor: '#e0e0e0',
        borderWidth: 2,
        borderRadius: 16,
        paddingHorizontal: 18,
        marginVertical: 10,
        fontSize: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    linksContainer: {
        flexDirection: 'row',
        marginTop: 18,
        gap: 24,
    },
    link: {
        color: '#0a7ea4',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 8,
    },
}); 