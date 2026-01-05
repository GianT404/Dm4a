import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StatusBar, TextInput, Platform, Animated, Dimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Library, Music } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler'; 
import * as Audio from 'expo-av';

// 👇 Import Navigation chuẩn
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { FullPlayer } from './src/components/FullPlayer';
import { useMusicStore } from './src/store/useMusicStore';
import './global.css';
import { PlayerService } from './src/services/player';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

// 👇 Khởi tạo Stack (Không được viết lại hàm ở cuối file nữa nhé!)
const Stack = createNativeStackNavigator();

const setGlobalFont = () => {
  const fontConfig = { fontFamily: 'RobotoMono_400Regular' };
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = [fontConfig];
  (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps.style = [fontConfig];
};

setGlobalFont();

// ==========================================
// 1. MAIN LAYOUT (Màn hình chính chứa Tab bar)
// ==========================================
function MainLayout({ navigation }: any) { // Nhận prop navigation để dùng nếu cần
  const [tab, setTab] = useState<'home' | 'library'>('home');
  const insets = useSafeAreaInsets();
  
  const playlist = useMusicStore((state) => state.playlist);
  
  // Animation States
  const [showPlusOne, setShowPlusOne] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(playlist.length);
  
  // Slide Animation
  const slideAnim = useRef(new Animated.Value(0)).current; 
  const tabBarPaddingBottom = insets.bottom > 0 ? insets.bottom : 2;
  const tabBarHeight = 60 + tabBarPaddingBottom; 
  const miniPlayerBottomPosition = tabBarHeight - 76; 

  // Hàm chuyển tab
  const switchTab = (newTab: 'home' | 'library') => {
    if (tab === newTab) return;
    setTab(newTab);
    Animated.timing(slideAnim, {
      toValue: newTab === 'home' ? 0 : 1, 
      duration: 300, 
      useNativeDriver: true,
    }).start();
  };

  // 👇 GESTURE: Xử lý vuốt tay
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.velocityX < -500 && tab === 'home') {
        switchTab('library');
      }
      else if (e.velocityX > 500 && tab === 'library') {
        switchTab('home');
      }
    })
    .runOnJS(true);

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

      {/* 👇 Bọc Container trong GestureDetector để nhận diện vuốt */}
      <GestureDetector gesture={panGesture}>
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
      </GestureDetector>
      
      <View 
        style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          bottom: miniPlayerBottomPosition, 
          zIndex: 1
        }}
      >
        <MiniPlayer />
      </View>
      
      <FullPlayer />

      {/* BOTTOM TAB BAR */}
      <View 
        className="absolute left-0 right-0 flex-row bg-[#121212] border-t border-zinc-900"
        style={{ 
          bottom: 0,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10,
          height: tabBarHeight, 
          paddingTop: 10,
          paddingHorizontal: 24,
          alignItems: 'flex-start',
          zIndex: 20
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

// ==========================================
// 2. APP COMPONENT (Root)
// ==========================================
export default function App() {
  const [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
    RobotoMono_700Bold,
  });

  useEffect(() => {
    let timeout: any = null;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    } else {
      timeout = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 7000);
    }
    return () => { if (timeout) clearTimeout(timeout); };
  }, [fontsLoaded]);

  useEffect(() => {
    const setAudioMode = async () => {
      await (Audio as any).setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: (Audio as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: false,
      });
    };
    setAudioMode();
  }, []);
  useEffect(() => {
    const setupPlayer = async () => {
      PlayerService.init(); 
    };
    setupPlayer();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* MainLayout: Home + Library */}
            <Stack.Screen name="Main" component={MainLayout} /> 
            
            {/* ProfileScreen: Màn hình phụ, đè lên Main */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}