import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, TextInput, Button, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import LocalGame from '@/components/LocalGame';
import OnlineGame from '@/components/OnlineGame';
import RegisterScreen from './Register';
import SinglePlayerGame from '@/components/SinglePlayerGame';

const API_URL = 'http://192.168.1.102:3000'; // Gerekirse IP ile değiştir

const GAME_MODES = [
  { key: 'ai', label: 'Yapay Zeka' },
  { key: 'local', label: 'Yerel 2 Kişi' },
  { key: 'online', label: 'Çevrim İçi' },
];

const COLORS = {
  primary: '#0a7ea4',
  accent: '#00bfae',
  background: '#f4f8fb',
  card: '#fff',
  border: '#e0e0e0',
  shadow: '#b0bec5',
  text: '#222',
  muted: '#8e99a3',
};

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerCards, setPlayerCards] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [opponentName] = useState('AI');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [aiLastMove, setAiLastMove] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AsyncStorage.getItem('user');
      if (!user) {
        router.replace('/(tabs)/Login');
      }
    };
    checkAuth();
  }, []);

  const startGame = async () => {
    if (!selectedMode) {
      Alert.alert('Uyarı', 'Lütfen bir oyun modu seçin.');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_URL}/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode }),
      });
      setPlayerCards([1, 2, 3, 4, 5, 6, 7]);
      setPlayerScore(0);
      setOpponentScore(0);
      setAiLastMove(null);
      setStarted(true);
    } catch (e) {
      Alert.alert('Hata', 'APIye bağlanılamadı.');
    }
    setLoading(false);
  };

  const playCard = async (card: number) => {
    if (loading) return;
    setLoading(true);
    setSelectedCard(card);
    try {
      const res = await fetch(`${API_URL}/game/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIndex: 0, card }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Kural Hatası', data.error);
        setLoading(false);
        return;
      }
      // Kartı elden çıkar
      setPlayerCards(prev => prev.filter(c => c !== card));
      setAiLastMove(data.aiMove ?? null);
      // Skor güncellemesi (sadece demo, gerçek skor backend'de hesaplanmalı)
      if (data.history && data.history.length > 0) {
        const last = data.history.slice(-2);
        if (last.length === 2) {
          const p0 = last[0].card;
          const p1 = last[1].card;
          if (p0 > p1) setPlayerScore(s => s + 1);
          else if (p1 > p0) setOpponentScore(s => s + 1);
        }
      }
    } catch (e) {
      Alert.alert('Hata', 'APIye bağlanılamadı.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setStarted(false);
    setSelectedMode(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerCards([1, 2, 3, 4, 5, 6, 7]);
    setAiLastMove(null);
    setSelectedCard(null);
  };

  const handleMenu = (item: string) => {
    setMenuVisible(false);
    if (item === 'Ayarlar') Alert.alert('Ayarlar', 'Ayarlar ekranı yakında!');
    if (item === 'Hakkında') Alert.alert('Hakkında', 'Number Fight Mobil v1.0');
  };

  // Menü ve üst barı her ekranda göstermek için ayrı bir component olarak tanımla
  const TopBarMenu = () => (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={26} color="#0a7ea4" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(v => !v)}>
        <Ionicons name="ellipsis-vertical" size={26} color="#0a7ea4" />
      </TouchableOpacity>
      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity onPress={() => handleMenu('Ayarlar')} style={styles.menuItem}>
            <ThemedText>Ayarlar</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMenu('Hakkında')} style={styles.menuItem}>
            <ThemedText>Hakkında</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (showRegister) {
    return <RegisterScreen navigation={{ goBack: () => setShowRegister(false) }} />;
  }

  if (!started) {
    return (
      <View style={styles.centeredContainer}>
        <TopBarMenu />
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
        <TextInput
          style={styles.input}
          placeholder="İsminizi girin"
          value={name}
          onChangeText={setName}
        />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {GAME_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                { padding: 12, borderRadius: 8, borderWidth: 2, borderColor: selectedMode === mode.key ? '#0a7ea4' : '#ccc', backgroundColor: selectedMode === mode.key ? '#e0f7fa' : '#fff', marginHorizontal: 4 },
              ]}
              onPress={() => setSelectedMode(mode.key)}
              disabled={loading}
            >
              <ThemedText style={{ fontWeight: 'bold', color: selectedMode === mode.key ? '#0a7ea4' : '#222' }}>{mode.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title={loading ? 'Başlatılıyor...' : 'Oyuna Başla'}
          onPress={startGame}
          disabled={!name.trim() || loading}
        />
      </View>
    );
  }

  if (selectedMode === 'local') {
    return (
      <View style={{ flex: 1 }}>
        <TopBarMenu />
        <LocalGame playerNames={[name, 'Oyuncu 2']} />
      </View>
    );
  }
  if (selectedMode === 'online') {
    return (
      <View style={{ flex: 1 }}>
        <TopBarMenu />
        <OnlineGame />
      </View>
    );
  }

  return (
    <>
      <TopBarMenu />
      <SinglePlayerGame
        name={name}
        playerScore={playerScore}
        opponentName={opponentName}
        opponentScore={opponentScore}
        playerCards={playerCards}
        selectedCard={selectedCard}
        playCard={playCard}
        loading={loading}
        aiLastMove={aiLastMove}
        styles={styles}
      />
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 140,
    width: 230,
    bottom: 0,
    left: 0,
    position: 'absolute',
    opacity: 0.10,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  input: {
    width: 260,
    height: 48,
    borderColor: COLORS.border,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 18,
    marginVertical: 16,
    fontSize: 18,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 36,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    marginBottom: 32,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerInfo: {
    alignItems: 'center',
    minWidth: 90,
  },
  vsBox: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
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
    width: 60,
    height: 86,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    transitionProperty: 'all',
    transitionDuration: '200ms',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accent,
    transform: [{ scale: 1.12 }],
    shadowOpacity: 0.22,
  },
  cardText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    marginBottom: 10,
    position: 'relative',
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  menuButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  menuDropdown: {
    position: 'absolute',
    top: 48,
    right: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
    minWidth: 130,
    zIndex: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
});
