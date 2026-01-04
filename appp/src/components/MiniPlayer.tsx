import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { getColors } from 'react-native-image-colors'; 

import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';
import { MarqueeText } from './MarqueeText';

export const MiniPlayer = () => {
  const currentTrack = useMusicStore(state => state.currentTrack);
  const isPlaying = useMusicStore(state => state.isPlaying);
  const position = useMusicStore(state => state.position);
  const duration = useMusicStore(state => state.duration);
  const setFullPlayerVisible = useMusicStore(state => state.setFullPlayerVisible);
  const [backgroundColor, setBackgroundColor] = useState('#18181b');

  // Logic lấy màu từ ảnh bìa (Giữ nguyên)
  useEffect(() => {
    if (!currentTrack?.thumbnail) return;

    const fetchColors = async () => {
      try {
        const result = await getColors(currentTrack.thumbnail, {
          fallback: '#18181b',
          cache: true,
          key: currentTrack.thumbnail,
        });

        switch (result.platform) {
          case 'android':
          case 'web':
            setBackgroundColor(result.vibrant || result.dominant || '#18181b');
            break;
          case 'ios':
            setBackgroundColor(result.background || result.primary || '#18181b');
            break;
          default:
            setBackgroundColor('#18181b');
        }
      } catch (error) {
        console.log('Failed to extract color', error);
      }
    };

    fetchColors();
  }, [currentTrack?.thumbnail]);

  if (!currentTrack) return null;

  const handleTogglePlay = () => {
    PlayerService.togglePlay();
  };

  const handleOpenFullPlayer = () => {
    setFullPlayerVisible(true);
  };

  return (
    <TouchableOpacity 
      onPress={handleOpenFullPlayer}
      activeOpacity={0.9}
      // 👇 Thêm 'overflow-hidden' để lớp phủ không bị tràn ra khỏi bo góc
      className="absolute flex-row items-center p-3 overflow-hidden border shadow-2xl bottom-24 left-4 right-4 rounded-2xl border-zinc-800"
      style={{ backgroundColor: backgroundColor }} 
    >
      {/* 👇 LỚP PHỦ ĐEN MỜ (OVERLAY) */}
      {/* bg-black/40 nghĩa là màu đen độ mờ 40%. Ông có thể chỉnh /30 hoặc /50 tùy thích */}
      <View className="absolute inset-0 bg-black/40" pointerEvents="none" />

      {/* --- NỘI DUNG (Content nằm đè lên lớp phủ) --- */}
      <Image 
        source={{ uri: currentTrack.thumbnail }} 
        className="w-10 h-10 rounded-lg" 
      />
      <View className="flex-1 ml-3">
        <MarqueeText text={currentTrack.title} />
        {/* Chỉnh màu chữ sáng lên một chút cho dễ đọc trên nền tối */}
        <Text className="text-xs text-zinc-300" numberOfLines={1}>
          {currentTrack.author}
        </Text>
      </View>
      
      <TouchableOpacity 
        onPress={handleTogglePlay} 
        className="items-center justify-center w-10 h-10"
      >
        {isPlaying ? (
          <Pause color="white" size={24} fill="white" />
        ) : (
          <Play color="white" size={24} fill="white" />
        )}
      </TouchableOpacity>

      {/* Progress Bar */}
      <View className="absolute bottom-0 left-4 right-4 h-[2px] bg-white/20">
        <View 
          style={{ 
            width: `${duration > 0 ? (position / duration) * 100 : 0}%` 
          }} 
          className="h-full bg-white" 
        />
      </View>
    </TouchableOpacity>
  );
};