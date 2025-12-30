import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, position, duration, setFullPlayerVisible } = useMusicStore();
  if (!currentTrack) return null;

  return (
    <TouchableOpacity 
      onPress={() => setFullPlayerVisible(true)}
      activeOpacity={0.9}
      className="absolute flex-row items-center p-3 border shadow-2xl bottom-24 left-4 right-4 bg-zinc-900 rounded-2xl border-zinc-800"
    >
      <Image source={{ uri: currentTrack.thumbnail }} className="w-10 h-10 rounded-lg" />
      <View className="flex-1 ml-3">
        <Text className="text-sm font-bold text-white" numberOfLines={1}>{currentTrack.title}</Text>
        <Text className="text-xs text-zinc-500">{currentTrack.author}</Text>
      </View>
      
      <TouchableOpacity onPress={PlayerService.togglePlay} className="items-center justify-center w-10 h-10">
        {isPlaying ? <Pause color="white" size={24} fill="white" /> : <Play color="white" size={24} fill="white" />}
      </TouchableOpacity>

      {/* Progress Bar  */}
      <View className="absolute bottom-0 left-4 right-4 h-[2px] bg-zinc-800">
        <View style={{ width: `${(position / duration) * 100}%` }} className="h-full bg-white" />
      </View>
    </TouchableOpacity>
  );
};