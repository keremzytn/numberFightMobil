import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function LocalGame({ playerNames = ['Oyuncu 1', 'Oyuncu 2'] }: { playerNames?: string[] }) {
    const [scores, setScores] = useState([0, 0]);
    const [turn, setTurn] = useState(0);
    const [cards, setCards] = useState([
        [1, 2, 3, 4, 5, 6, 7],
        [1, 2, 3, 4, 5, 6, 7],
    ]);
    const [selected, setSelected] = useState<number | null>(null);

    const playCard = (card: number) => {
        setSelected(card);
        // Basit demo: kartı elden çıkar
        setCards(prev => prev.map((arr, idx) => idx === turn ? arr.filter(c => c !== card) : arr));
        setTurn(t => 1 - t);
    };

    return (
        <View style={styles.container}>
            <ThemedText type="title">Yerel 2 Kişi Modu</ThemedText>
            <ThemedText>{playerNames[turn]}'in sırası</ThemedText>
            <View style={styles.cardsContainer}>
                {cards[turn].map(card => (
                    <TouchableOpacity
                        key={card}
                        style={styles.card}
                        onPress={() => playCard(card)}
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