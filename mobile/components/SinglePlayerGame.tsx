import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface SinglePlayerGameProps {
    name: string;
    playerScore: number;
    opponentName: string;
    opponentScore: number;
    playerCards: number[];
    selectedCard: number | null;
    playCard: (card: number) => void;
    loading: boolean;
    aiLastMove: number | null;
    styles: any;
}

const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({
    name,
    playerScore,
    opponentName,
    opponentScore,
    playerCards,
    selectedCard,
    playCard,
    loading,
    aiLastMove,
    styles,
}) => {
    return (
        <View style={styles.gameContainer}>
            <View style={styles.header}>
                <View style={styles.playerInfo}>
                    <ThemedText type="subtitle">{name}</ThemedText>
                    <ThemedText>Skor: {playerScore}</ThemedText>
                </View>
                <View style={styles.vsBox}>
                    <ThemedText type="title">VS</ThemedText>
                </View>
                <View style={styles.playerInfo}>
                    <ThemedText type="subtitle">{opponentName}</ThemedText>
                    <ThemedText>Skor: {opponentScore}</ThemedText>
                </View>
            </View>
            <View style={styles.cardsContainer}>
                {playerCards.map((card) => (
                    <TouchableOpacity
                        key={card}
                        style={[
                            styles.card,
                            selectedCard === card && styles.selectedCard,
                        ]}
                        onPress={() => playCard(card)}
                        disabled={loading}
                    >
                        <ThemedText style={styles.cardText}>{card}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            {aiLastMove !== null && (
                <ThemedText style={{ marginTop: 24 }} type="default">
                    AI şu kartı oynadı: {aiLastMove}
                </ThemedText>
            )}
            <ThemedText style={{ marginTop: 24 }} type="default">Kartına dokunarak oynayabilirsin (API test)</ThemedText>
        </View>
    );
};

export default SinglePlayerGame; 