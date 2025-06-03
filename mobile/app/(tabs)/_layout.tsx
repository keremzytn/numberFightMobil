import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      setIsLoggedIn(false);
      return;
    }
    try {
      const user = JSON.parse(userStr);
      const token = user?.token;
      if (!token) {
        setIsLoggedIn(false);
        await AsyncStorage.removeItem('user');
        Alert.alert('Oturum Hatası', 'Oturum bulunamadı, lütfen tekrar giriş yapın.');
        router.replace('/(tabs)/Login');
        return;
      }
      const res = await fetch('http://192.168.1.102:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        await AsyncStorage.removeItem('user');
        Alert.alert('Oturum Hatası', 'Oturum süreniz doldu veya geçersiz. Lütfen tekrar giriş yapın.');
        router.replace('/(tabs)/Login');
      }
    } catch (e) {
      setIsLoggedIn(false);
      await AsyncStorage.removeItem('user');
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      router.replace('/(tabs)/Login');
    }
  };

  useEffect(() => {
    checkUser();
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Tabbar yeniden odaklandı, kullanıcı tekrar kontrol ediliyor.');
      checkUser();
    });
    return unsubscribe;
  }, [navigation]);

  console.log('isLoggedIn:', isLoggedIn);

  if (isLoggedIn === null) return null; // yüklenene kadar tabları gösterme

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {isLoggedIn ? (
        <Tabs.Screen
          name="Profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
          }}
        />
      ) : (
        <>
          <Tabs.Screen
            name="Login"
            options={{
              title: 'Giriş Yap',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
            }}
          />
          <Tabs.Screen
            name="Register"
            options={{
              title: 'Kayıt Ol',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
        </>
      )}
    </Tabs>
  );
}
