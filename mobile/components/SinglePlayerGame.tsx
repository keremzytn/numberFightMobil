import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
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
    playableCards: number[];
}

// Kart animasyonunu yöneten ayrı bir bileşen
const AnimatedCard = ({
    card,
    isSelected,
    isPlayable,
    onPress,
    loading,
    styles,
    cardTextStyle,
}: any) => {
    const animatedValue = React.useRef(new Animated.Value(isSelected ? 1.12 : 1)).current;
    React.useEffect(() => {
        Animated.spring(animatedValue, {
            toValue: isSelected ? 1.12 : 1,
            useNativeDriver: true,
        }).start();
    }, [isSelected]);
    const animatedStyle = {
        transform: [{ scale: animatedValue }],
        shadowOpacity: isSelected ? 0.35 : 0.13,
    };
    if (isPlayable) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Animated.View style={[styles.card, isSelected && styles.selectedCard, animatedStyle]}>
                    <ThemedText style={cardTextStyle}>{card}</ThemedText>
                </Animated.View>
            </TouchableOpacity>
        );
    } else {
        return (
            <Animated.View
                style={[
                    styles.card,
                    { backgroundColor: '#eee', opacity: 0.4 },
                    { shadowOpacity: 0.13, transform: [{ scale: 1 }] },
                ]}
            >
                <ThemedText style={cardTextStyle}>{card}</ThemedText>
            </Animated.View>
        );
    }
};

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
    playableCards,
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
                    <AnimatedCard
                        key={card}
                        card={card}
                        isSelected={selectedCard === card}
                        isPlayable={playableCards.includes(card)}
                        onPress={() => playCard(card)}
                        loading={loading}
                        styles={styles}
                        cardTextStyle={styles.cardText}
                    />
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