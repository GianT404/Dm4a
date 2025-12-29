import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StatusBar, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

export default function App() {
  const [tab, setTab] = useState<'home' | 'library'>('home');

  // Load Font
  const [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
    RobotoMono_700Bold,
  });

  // Ẩn Splash khi font đã sẵn sàng
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
<SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View className="flex-1 bg-black">
        
        {/* Main Content Area */}
        <View className="flex-1 mb-20"> 
          {/* mb-20 để chừa chỗ cho TabBar và MiniPlayer */}
          {tab === 'home' ? <HomeScreen /> : <PlaylistScreen />}
        </View>

        {/* Players Overlay */}
        <MiniPlayer />
        <FullPlayer />

        {/* Bottom Tab Bar */}
        <View className="absolute bottom-1 left-0 right-0 h-20 bg-black flex-row border-t border-zinc-900 px-6">
          <TouchableOpacity 
            onPress={() => setTab('home')} 
            className="flex-1 items-center justify-center"
            activeOpacity={0.8}
          >
            <Search color={tab === 'home' ? 'white' : '#3f3f46'} size={24} />
            <Text className={`text-[10px] mt-2 font-bold tracking-widest ${tab === 'home' ? 'text-white' : 'text-zinc-600'}`} style={{ fontFamily: 'RobotoMono_700Bold' }}>
              TÌM KIẾM
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setTab('library')} 
            className="flex-1 items-center justify-center"
            activeOpacity={0.8}
          >
            <Library color={tab === 'library' ? 'white' : '#3f3f46'} size={24} />
            <Text className={`text-[10px] mt-2 font-bold tracking-widest ${tab === 'library' ? 'text-white' : 'text-zinc-600'}`} style={{ fontFamily: 'RobotoMono_700Bold' }}>
              PLAYLIST
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaProvider>
    </GestureHandlerRootView>
    
  );
}