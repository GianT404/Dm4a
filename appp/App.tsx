import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StatusBar, TextInput, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Library } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Components & Styles
import HomeScreen from './src/screens/HomeScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { FullPlayer } from './src/components/FullPlayer';
import "./global.css";

// Giữ màn hình Splash
SplashScreen.preventAutoHideAsync();

const setGlobalFont = () => {
  const fontConfig = { fontFamily: 'RobotoMono_400Regular' };
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = [fontConfig];
  (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps.style = [fontConfig];
};

setGlobalFont();

// 👇 Tách Component con ra để dùng được hook useSafeAreaInsets
function MainLayout() {
  const [tab, setTab] = useState<'home' | 'library'>('home');
  const insets = useSafeAreaInsets(); // 🔥 Lấy thông số tai thỏ/bottom bar

  return (
    <View className="flex-1 bg-[#121212]">
      {/* StatusBar:
         - Android: translucent={true} backgroundColor="transparent" để ăn full màn hình
      */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />

      {/* Main Content Area */}
      {/* Thêm paddingBottom để nội dung không bị TabBar che mất */}
      <View className="flex-1" style={{ paddingBottom: 80 + insets.bottom }}> 
        {tab === 'home' ? <HomeScreen /> : <PlaylistScreen />}
      </View>

      {/* Players Overlay */}
      <MiniPlayer />
      <FullPlayer />

      <View 
        className="absolute left-0 right-0 flex-row bg-[#121212] border-t border-zinc-900"
        style={{ 
          bottom: 0, // Luôn dính đáy
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 5, 
          height: 60 + (insets.bottom > 0 ? insets.bottom : 20), 
          paddingTop: 10,
          paddingHorizontal: 24,
          alignItems: 'flex-start' 
        }}
      >
        <TouchableOpacity 
          onPress={() => setTab('home')} 
          className="items-center justify-center flex-1 h-full"
          activeOpacity={0.8}
        >
          <Search color={tab === 'home' ? 'white' : '#3f3f46'} size={24} />
          {/* Có thể thêm Text label nếu thích */}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setTab('library')} 
          className="items-center justify-center flex-1 h-full"
          activeOpacity={0.8}
        >
          <Library color={tab === 'library' ? 'white' : '#3f3f46'} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  // Load Font
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