import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StatusBar, TextInput, Platform, Animated, Dimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Library, Music } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { FullPlayer } from './src/components/FullPlayer';
import { useMusicStore } from './src/store/useMusicStore';
import "./global.css";

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window'); // Lấy chiều rộng màn hình

const setGlobalFont = () => {
  const fontConfig = { fontFamily: 'RobotoMono_400Regular' };
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = [fontConfig];
  (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps.style = [fontConfig];
};

setGlobalFont();

function MainLayout() {
  const [tab, setTab] = useState<'home' | 'library'>('home');
  const insets = useSafeAreaInsets();
  
  const playlist = useMusicStore((state) => state.playlist);

  // Animation States
  const [showPlusOne, setShowPlusOne] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(playlist.length);
  const slideAnim = useRef(new Animated.Value(0)).current; 
  const switchTab = (newTab: 'home' | 'library') => {
    setTab(newTab);
    Animated.timing(slideAnim, {
      toValue: newTab === 'home' ? 0 : 1, 
      duration: 300, 
      useNativeDriver: true,
    }).start();
  };

  // Trigger Animation +1 Badge
  useEffect(() => {
    if (playlist.length > prevCount.current) {
      setShowPlusOne(true);
      fadeAnim.setValue(1);
      translateYAnim.setValue(0);

      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: -30,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
            Animated.delay(400),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            })
        ])
      ]).start(() => {
        setShowPlusOne(false);
      });
    }
    prevCount.current = playlist.length;
  }, [playlist.length]);

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />

      {/* SLIDING CONTAINER: Chứa cả 2 màn hình nằm ngang */}
      <View className="flex-1 overflow-hidden">
        <Animated.View 
          style={{ 
            flexDirection: 'row', 
            width: width * 2, 
            height: '100%',
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -width], 
                })
              }
            ]
          }}
        >
          <View style={{ width: width, height: '100%', paddingBottom: 80 + insets.bottom }}>
            <HomeScreen />
          </View>

          <View style={{ width: width, height: '100%', paddingBottom: 80 + insets.bottom }}>
            <PlaylistScreen />
          </View>
        </Animated.View>
      </View>

      <MiniPlayer />
      <FullPlayer />

      {/* BOTTOM TAB BAR */}
      <View 
        className="absolute left-0 right-0 flex-row bg-[#121212] border-t border-zinc-900"
        style={{ 
          bottom: 0,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 20),
          paddingTop: 10,
          paddingHorizontal: 24,
          alignItems: 'flex-start'
        }}
      >
        <TouchableOpacity 
          onPress={() => switchTab('home')} 
          className="items-center justify-center flex-1 h-full"
          activeOpacity={0.8}
        >
          <Search color={tab === 'home' ? 'white' : '#3f3f46'} size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => switchTab('library')} 
          className="relative items-center justify-center flex-1 h-full"
          activeOpacity={0.8}
        >
          <View className="relative items-center justify-center w-full h-full">
             <Library color={tab === 'library' ? 'white' : '#3f3f46'} size={24} />

             {showPlusOne && (
                <Animated.View 
                    className="absolute flex-row items-center px-2 py-1 bg-green-500 rounded-full"
                    style={{
                        top: -10, 
                        right: 20,
                        opacity: fadeAnim, 
                        transform: [{ translateY: translateYAnim }] 
                    }}
                >
                    <Music size={10} color="white" />
                    <Text className="ml-1 text-[10px] font-bold text-white">+1</Text>
                </Animated.View>
             )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
    RobotoMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MainLayout />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}