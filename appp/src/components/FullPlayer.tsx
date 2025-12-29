import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Dimensions, FlatList } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';
import { ChevronDown, Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { LyricsView } from './LyricsView';

const { width } = Dimensions.get('window');

// Hàm helper để format thời gian (MM:SS)
const formatTime = (millis: number) => {
  if (!millis || millis < 0) return '00:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const FullPlayer = () => {
  const { isFullPlayerVisible, currentTrack, isPlaying, position, duration, setFullPlayerVisible } = useMusicStore();
  const [currentPage, setCurrentPage] = useState(0); // 0: Artwork, 1: Lyrics
  
  const pages = [{ id: 'artwork' }, { id: 'lyrics' }];

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index);
    }
  }).current;

  if (!currentTrack) return null;

  return (
    <Modal visible={isFullPlayerVisible} animationType="slide">
      <View className="flex-1 bg-black pt-4">
        
        {/* HEADER */}
        <View className="flex-row justify-between items-center px-8 mb-4">
          <TouchableOpacity onPress={() => setFullPlayerVisible(false)}>
            <ChevronDown color="white" size={28} />
          </TouchableOpacity>
          <Text className="text-zinc-600 font-black text-[10px] tracking-[6px]">
            {currentPage === 0 ? 'NOW PLAYING' : 'LYRICS'}
          </Text>
          <View className="w-6" />
        </View>

        {/* CONTENT (SWIPABLE AREA) */}
        <View className="flex-1">
          <FlatList
            data={pages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            renderItem={({ item }) => {
              if (item.id === 'artwork') {
                return (
                  <View style={{ width }} className="items-center justify-center px-8">
                    <Image 
                      source={{ uri: currentTrack.thumbnail }} 
                      style={{ width: width - 80, height: width - 80 }} 
                      className="rounded-lg border border-zinc-900" 
                    />
                    <View className="mt-12 items-start w-full px-4">
                      <Text className="text-white text-xl font-black leading-none tracking-tighter" numberOfLines={2}>
                        {currentTrack.title}
                      </Text>
                      <Text className="text-zinc-600 text-lg mt-3 font-medium italic lowercase">
                        {currentTrack.author}
                      </Text>
                    </View>
                  </View>
                );
              } 
              
              // Trang Lyrics
              return (
                <View style={{ width }} className="px-8 pt-4 pb-4">
                   <LyricsView />
                </View>
              );
            }}
          />
        </View>

        {/* PAGINATION DOTS */}
        <View className="flex-row justify-center items-center space-x-2 mb-8 gap-2">
          <View className={`w-2 h-2 rounded-full ${currentPage === 0 ? 'bg-white' : 'bg-zinc-800'}`} />
          <View className={`w-2 h-2 rounded-full ${currentPage === 1 ? 'bg-white' : 'bg-zinc-800'}`} />
        </View>

        {/* CONTROLS AREA */}
        <View className="px-8 pb-16 bg-black">
            <Slider
                style={{ width: '100%', height: 40 ,}}
                minimumValue={0} maximumValue={duration} value={position}
                minimumTrackTintColor="#FFFFFF" maximumTrackTintColor="#fff"
                thumbTintColor="#FFFFFF"
                onSlidingComplete={PlayerService.seekTo}
            />
            <View className="flex-row justify-between mt-1 px-1">
                <Text className="text-zinc-500 text-[10px] font-mono font-bold tracking-widest">
                    {formatTime(position)}
                </Text>
                <Text className="text-zinc-500 text-[10px] font-mono font-bold tracking-widest">
                    {formatTime(duration)}
                </Text>
            </View>

            <View className="flex-row justify-between items-center mt-6 px-4">
                <TouchableOpacity onPress={() => PlayerService.playPrev()}>
                  <SkipBack size={28} color="white" fill="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={PlayerService.togglePlay} 
                    className="bg-white w-20 h-20 rounded-full items-center justify-center"
                >
                    {isPlaying ? (
                      <Pause size={32} color="black" fill="black" />
                    ) : (
                      <Play size={32} color="black" fill="black" className="ml-1" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => PlayerService.playNext()}>
                  <SkipForward size={28} color="white" fill="white" />
                </TouchableOpacity>
            </View>
        </View>

      </View>
    </Modal>
  );
};