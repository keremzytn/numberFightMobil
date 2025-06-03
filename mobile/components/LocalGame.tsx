import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.102:3001'; // Sunucu adresini backend'e göre güncelle

export default function LocalGame({ playerNames = ['Oyuncu 1', 'Oyuncu 2'] }: { playerNames?: string[] }) {
    const [scores, setScores] = useState([0, 0]);
    const [turn, setTurn] = useState(0);
    const [cards, setCards] = useState([
        [1, 2, 3, 4, 5, 6, 7],
        [1, 2, 3, 4, 5, 6, 7],
    ]);
    const [selected, setSelected] = useState<number | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [playerIndex, setPlayerIndex] = useState<number | null>(null);
    const [waiting, setWaiting] = useState(true);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;
        // Rastgele oda isteği
        socket.emit('find_room');
        socket.on('room_joined', ({ roomId, playerIndex }) => {
            setRoomId(roomId);
            setPlayerIndex(playerIndex);
            setWaiting(false);
        });
        socket.on('start_game', () => {
            setWaiting(false);
        });
        socket.on('opponent_played', ({ card }) => {
            setCards(prev => prev.map((arr, idx) => idx === (1 - (playerIndex ?? 0)) ? arr.filter(c => c !== card) : arr));
            setTurn(playerIndex ?? 0);
        });
        socket.on('update_scores', (scores) => {
            setScores(scores);
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    const playCard = (card: number) => {
        if (waiting || playerIndex === null || turn !== playerIndex) return;
        setSelected(card);
        setCards(prev => prev.map((arr, idx) => idx === playerIndex ? arr.filter(c => c !== card) : arr));
        setTurn(1 - playerIndex);
        socketRef.current.emit('play_card', { roomId, card });
    };

    if (waiting || playerIndex === null) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0a7ea4" />
                <ThemedText>Eşleşme bekleniyor...</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ThemedText type="title">Çevrim İçi 2 Kişi Modu</ThemedText>
            <ThemedText>{playerNames[turn]} ({turn === playerIndex ? 'Sen' : 'Rakip'})'in sırası</ThemedText>
            <View style={styles.cardsContainer}>
                {cards[playerIndex].map(card => (
                    <TouchableOpacity
                        key={card}
                        style={styles.card}
                        onPress={() => playCard(card)}
                        disabled={turn !== playerIndex}
                    >
                        <ThemedText style={styles.cardText}>{card}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 24 }}>
                <ThemedText>Skorlar: {scores[0]} - {scores[1]}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    cardsContainer: { flexDirection: 'row', gap: 12, marginTop: 32 },
    card: { width: 48, height: 68, backgroundColor: '#fff', borderRadius: 8, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', margin: 4, elevation: 2 },
    cardText: { fontSize: 24, fontWeight: 'bold', color: '#222' },
}); 