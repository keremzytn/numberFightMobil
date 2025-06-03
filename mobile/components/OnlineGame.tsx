import React, { useEffect, useRef, useState } from 'react';
import { View, Button, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const WS_URL = 'ws://localhost:3000'; // Gerekirse değiştir

export default function OnlineGame() {
    const ws = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        ws.current = new WebSocket(WS_URL);
        ws.current.onopen = () => setConnected(true);
        ws.current.onclose = () => setConnected(false);
        ws.current.onerror = () => setConnected(false);
        ws.current.onmessage = (e) => {
            setMessages(prev => [...prev, e.data]);
        };
        return () => {
            ws.current?.close();
        };
    }, []);

    const sendMessage = () => {
        if (ws.current && connected && input.trim()) {
            ws.current.send(input);
            setInput('');
        }
    };

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <ThemedText type="title">Çevrim İçi Modu</ThemedText>
            <ThemedText>Bağlantı: {connected ? 'Bağlı' : 'Bağlı Değil'}</ThemedText>
            <View style={{ width: '100%', maxHeight: 200, marginVertical: 16 }}>
                {messages.map((msg, i) => (
                    <ThemedText key={i} style={{ fontSize: 14 }}>{msg}</ThemedText>
                ))}
            </View>
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Mesaj yaz..."
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: '100%', marginBottom: 8 }}
            />
            <Button title="Gönder" onPress={sendMessage} disabled={!connected || !input.trim()} />
        </View>
    );
} 