import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Download, CheckCircle, AlertCircle, Trash2 } from 'lucide-react-native';

export const TrackItem = ({ track, onPress, onRemove, isCurrent }: any) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={track.status === 'downloading'}
      activeOpacity={0.8}
      className={`flex-row items-center px-6 py-6 border-b border-zinc-900 ${isCurrent ? 'bg-zinc-950' : 'bg-black'}`}
    >
      <Image source={{ uri: track.thumbnail }} className="w-14 h-14 bg-zinc-900 rounded-lg" />
      
      <View className="flex-1 ml-6">
        <Text className={`font-black text-sm tracking-tighter ${isCurrent ? 'text-white' : 'text-zinc-200'}`} numberOfLines={1}>
          {track.title.toUpperCase()}
        </Text>
        <Text className="text-zinc-600 text-[10px] mt-1 tracking-[2px] uppercase font-bold">
          {track.author}
        </Text>
      </View>

      <View className="flex-row items-center">
        {track.status === 'downloading' && <ActivityIndicator size="small" color="#FFFFFF" />}
        {track.status === 'ready' && <CheckCircle size={16} color="#FFFFFF" />}
        {!track.status && <Download size={16} color="#18181b" />}
        
        {onRemove && (
          <TouchableOpacity onPress={onRemove} className="ml-4 opacity-20">
            <Trash2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};