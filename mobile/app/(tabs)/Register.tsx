import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';

const API_URL = 'http://192.168.1.102:3000';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const defaultStyles = useDefaultStyles();
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

    // Parola gereksinimi kontrolü
    const isPasswordValid = (pw: string) => {
        return (
            pw.length >= 8 &&
            /[A-Z]/.test(pw) &&
            /[a-z]/.test(pw) &&
            /[0-9]/.test(pw)
        );
    };
    // E-posta formatı kontrolü
    const isEmailValid = (mail: string) => {
        return /^\S+@\S+\.\S+$/.test(mail);
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !passwordRepeat || !birthDate) {
            Alert.alert('Uyarı', 'Tüm alanları doldurun.');
            return;
        }
        if (!isEmailValid(email)) {
            Alert.alert('Uyarı', 'Geçerli bir e-posta adresi girin.');
            return;
        }
        if (!isPasswordValid(password)) {
            Alert.alert('Uyarı', 'Parola en az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
            return;
        }
        if (password !== passwordRepeat) {
            Alert.alert('Uyarı', 'Parolalar eşleşmiyor.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, birthDate }),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert('Hata', data.error || 'Kayıt başarısız.');
            } else {
                if (data.user && data.user.token) {
                    await AsyncStorage.setItem('user', JSON.stringify(data.user));
                    Alert.alert('Başarılı', 'Kayıt başarılı! Giriş yapabilirsiniz.', [
                        { text: 'Tamam', onPress: () => router.back() },
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
            <Text style={styles.title}>Kayıt Ol</Text>
            <TextInput
                style={styles.input}
                placeholder="İsim"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="E-posta"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text style={{ color: birthDate ? '#222' : '#aaa', fontSize: 18 }}>
                    {birthDate ? new Date(birthDate).toLocaleDateString() : 'Doğum Tarihi'}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 10 }}>
                    <DateTimePicker
                        mode="single"
                        date={birthDate ? birthDate : new Date()}
                        onChange={({ date }) => {
                            setBirthDate(date as Date);
                            setShowDatePicker(false);
                        }}
                        styles={defaultStyles}
                        maxDate={new Date()}
                    />
                    <Button title="İptal" onPress={() => setShowDatePicker(false)} />
                </View>
            )}
            <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Şifre Tekrar"
                value={passwordRepeat}
                onChangeText={setPasswordRepeat}
                secureTextEntry
            />
            <Button title={loading ? 'Kaydediliyor...' : 'Kayıt Ol'} onPress={handleRegister} disabled={loading} />
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
}); 