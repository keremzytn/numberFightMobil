import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';

const API_URL = 'http://192.168.1.102:3000';

export default function ProfileScreen() {
    // Varsayılan olarak mevcut kullanıcı bilgileri gelmeli, şimdilik email sabit
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const defaultStyles = useDefaultStyles();

    // Sadece test için, gerçek uygulamada email oturumdan alınmalı
    const TEST_EMAIL = 'test@example.com';

    useEffect(() => {
        // Profil bilgilerini çek
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/profile/me`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: TEST_EMAIL }),
                });
                const data = await res.json();
                if (res.ok && data.user) {
                    setName(data.user.name || '');
                    setEmail(data.user.email || '');
                    setBirthDate(data.user.birthDate ? new Date(data.user.birthDate) : null);
                }
            } catch { }
            setLoading(false);
        };
        fetchProfile();
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

    const handleUpdate = async () => {
        if (!name || !email || !birthDate) {
            Alert.alert('Uyarı', 'Tüm alanları doldurun.');
            return;
        }
        if (!isEmailValid(email)) {
            Alert.alert('Uyarı', 'Geçerli bir e-posta adresi girin.');
            return;
        }
        if (password && !isPasswordValid(password)) {
            Alert.alert('Uyarı', 'Parola en az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
            return;
        }
        if (password && password !== passwordRepeat) {
            Alert.alert('Uyarı', 'Parolalar eşleşmiyor.');
            return;
        }
        setLoading(true);
        try {
            // Profil güncelleme API'si örnek, backend'de /profile/update gibi bir endpoint olmalı
            const res = await fetch(`${API_URL}/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, birthDate }),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert('Hata', data.error || 'Güncelleme başarısız.');
            } else {
                Alert.alert('Başarılı', 'Profil güncellendi!');
            }
        } catch (e) {
            Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profilim</Text>
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
                placeholder="Yeni Şifre (değiştirmek için)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Yeni Şifre Tekrar"
                value={passwordRepeat}
                onChangeText={setPasswordRepeat}
                secureTextEntry
            />
            <Button title={loading ? 'Kaydediliyor...' : 'Güncelle'} onPress={handleUpdate} disabled={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f4f8fb',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        fontSize: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
}); 