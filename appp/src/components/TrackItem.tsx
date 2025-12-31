import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle, Trash2 } from 'lucide-react-native';

export const TrackItem = ({ track, onPress, onRemove, isCurrent, hideStatus }: any) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={track.status === 'downloading'}
      activeOpacity={0.8}
      className={`flex-row items-center px-4 py-4  ${isCurrent ? 'bg-[#121212]' : 'bg-[#121212]'}`}
    >
      <Image source={{ uri: track.thumbnail }} className="rounded-lg w-14 h-14 bg-zinc-900" />
      
      <View className="flex-1 ml-6 ">
        <Text 
          className={`font-black text-sm tracking-tighter ${isCurrent ? 'text-[#ef4444]' : 'text-zinc-200'}`} 
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text className="text-zinc-600 text-[10px] mt-1 tracking-[2px]  font-bold">
          {track.author}
        </Text>
      </View>

      <View className="flex-row items-center">
        {track.status === 'downloading' && <ActivityIndicator size="small" color="#FFFFFF" />}
        
        {!hideStatus && track.status === 'ready' && (
           <CheckCircle size={16} color="#FFFFFF" />
        )}
        
        {onRemove && (
          <TouchableOpacity onPress={onRemove} className="ml-4 opacity-20">
            <Trash2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};