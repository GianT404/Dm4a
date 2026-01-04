import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';

export const MiniPlayer = () => {
  // ✅ Subscribe to ALL relevant fields explicitly
  const currentTrack = useMusicStore(state => state.currentTrack);
  const isPlaying = useMusicStore(state => state.isPlaying);
  const position = useMusicStore(state => state.position);
  const duration = useMusicStore(state => state.duration);
  const setFullPlayerVisible = useMusicStore(state => state.setFullPlayerVisible);
  
  // ✅ Debug logs để check state updates
  useEffect(() => {
    console.log('🎵 MiniPlayer State Update:', {
      hasTrack: !!currentTrack,
      trackTitle: currentTrack?.title,
      isPlaying,
      position: position.toFixed(1),
      duration: duration.toFixed(1),
      progress: duration > 0 ? ((position / duration) * 100).toFixed(1) + '%' : '0%'
    });
  }, [currentTrack, isPlaying, position, duration]);

  if (!currentTrack) {
    console.log('⚠️ MiniPlayer: No current track');
    return null;
  }

  const handleTogglePlay = () => {
    console.log('🎵 MiniPlayer: Toggle play pressed');
    PlayerService.togglePlay();
  };

  const handleOpenFullPlayer = () => {
    console.log('🎵 MiniPlayer: Opening full player');
    setFullPlayerVisible(true);
  };

  return (
    <TouchableOpacity 
      onPress={handleOpenFullPlayer}
      activeOpacity={0.9}
      className="absolute flex-row items-center p-3 border shadow-2xl bottom-24 left-4 right-4 bg-zinc-900 rounded-2xl border-zinc-800"
    >
      <Image 
        source={{ uri: currentTrack.thumbnail }} 
        className="w-10 h-10 rounded-lg" 
      />
      <View className="flex-1 ml-3">
        <Text className="text-sm font-bold text-white" numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text className="text-xs text-zinc-500">
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
      <View className="absolute bottom-0 left-4 right-4 h-[2px] bg-zinc-800">
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