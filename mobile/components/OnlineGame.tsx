import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.102:3000'; // Sunucu adresini backend'e göre güncelle

export default function OnlineGame() {
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
        socket.on('opponent_played', ({ card, playerIndex: playedBy }) => {
            setCards(prev => prev.map((arr, idx) => idx === playedBy ? arr.filter(c => c !== card) : arr));
            setTurn(1 - (playedBy ?? 0));
            setSelected(null);
        });
        socket.on('update_scores', (scores) => {
            setScores(scores);
        });
        socket.on('opponent_left', () => {
            setWaiting(true);
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
        socketRef.current.emit('play_card', { roomId, card, playerIndex });
    };

    if (waiting || playerIndex === null) {
        return (
            <View style={styles.gameContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
                <ThemedText>Eşleşme bekleniyor...</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.gameContainer}>
            <View style={styles.header}>
                <View style={styles.playerInfo}>
                    <ThemedText type="subtitle">Sen</ThemedText>
                    <ThemedText>Skor: {scores[playerIndex]}</ThemedText>
                </View>
                <View style={styles.vsBox}>
                    <ThemedText type="title">VS</ThemedText>
                </View>
                <View style={styles.playerInfo}>
                    <ThemedText type="subtitle">Rakip</ThemedText>
                    <ThemedText>Skor: {scores[1 - playerIndex]}</ThemedText>
                </View>
            </View>
            <View style={styles.cardsContainer}>
                {cards[playerIndex].map(card => (
                    <TouchableOpacity
                        key={card}
                        style={[styles.card, selected === card && styles.selectedCard]}
                        onPress={() => playCard(card)}
                        disabled={turn !== playerIndex}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.cardText}>{card}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <ThemedText style={{ marginTop: 24 }} type="default">
                {turn === playerIndex ? 'Senin sıran' : 'Rakibin sırası'}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    gameContainer: {
        flex: 1,
        backgroundColor: '#f7f7fa',
        paddingTop: 36,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '92%',
        marginBottom: 32,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#b0bec5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.13,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#b0bec5',
    },
    playerInfo: {
        alignItems: 'center',
        minWidth: 90,
    },
    vsBox: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        backgroundColor: '#00e0b0',
        borderRadius: 12,
        shadowColor: '#b0bec5',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
        elevation: 2,
    },
    cardsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 18,
        marginTop: 32,
    },
    card: {
        width: 68,
        height: 110,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#b0bec5',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 8,
        elevation: 6,
        shadowColor: '#b0bec5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
    },
    selectedCard: {
        borderColor: '#0a7ea4',
        backgroundColor: '#00e0b0',
        borderWidth: 4,
        transform: [{ scale: 1.13 }],
        shadowOpacity: 0.30,
        shadowColor: '#0a7ea4',
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
    },
    cardText: {
        fontSize: 25,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 1,
        textAlign: 'center',
    },
}); 