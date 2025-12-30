import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Dimensions, FlatList, ScrollView } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, MessageSquare, X } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { LyricsView } from './LyricsView';

const { width, height } = Dimensions.get('window');

// Helper format thời gian
const formatTime = (millis: number) => {
  if (!millis || millis < 0) return '00:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const FullPlayer = () => {
  const { isFullPlayerVisible, currentTrack, isPlaying, position, duration, setFullPlayerVisible, changeLyricsLanguage } = useMusicStore();
  const [currentPage, setCurrentPage] = useState(0); 
  const [showLangModal, setShowLangModal] = useState(false); 

  const pages = [{ id: 'artwork' }, { id: 'lyrics' }];

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index);
    }
  }).current;

  if (!currentTrack) return null;

  return (
    <Modal visible={isFullPlayerVisible} animationType="slide">
      <View className="flex-1 pt-4 bg-black">
        
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-8 mb-4">
          <TouchableOpacity onPress={() => setFullPlayerVisible(false)}>
            <ChevronDown color="white" size={28} />
          </TouchableOpacity>
          <Text className="text-zinc-600 font-black text-[10px] tracking-[6px]">
            {currentPage === 0 ? 'NOW PLAYING' : 'LYRICS'}
          </Text>
          {(currentTrack.availableLyrics && currentTrack.availableLyrics.length > 0) ? (
             <TouchableOpacity onPress={() => setShowLangModal(true)}>
                <MessageSquare color="white" size={24} />
             </TouchableOpacity>
          ) : (
             <View className="w-6" />
          )}
        </View>

        {/* CONTENT  */}
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
                      className="border rounded-lg border-zinc-900" 
                    />
                    <View className="items-start w-full px-4 mt-12">
                      <Text className="text-xl font-black leading-none tracking-tighter text-white" numberOfLines={2}>
                        {currentTrack.title}
                      </Text>
                      <Text className="mt-3 text-lg italic font-medium lowercase text-zinc-600">
                        {currentTrack.author}
                      </Text>
                    </View>
                  </View>
                );
              } 
              return (
                <View style={{ width }} className="px-8 pt-4 pb-4">
                   <LyricsView />
                </View>
              );
            }}
          />
        </View>

        {/* PAGINATION DOTS */}
        <View className="flex-row items-center justify-center gap-2 mb-8 space-x-2">
          <View className={`w-2 h-2 rounded-full ${currentPage === 0 ? 'bg-white' : 'bg-zinc-800'}`} />
          <View className={`w-2 h-2 rounded-full ${currentPage === 1 ? 'bg-white' : 'bg-zinc-800'}`} />
        </View>

        {/* CONTROLS AREA  */}
        <View className="px-8 pb-16 bg-black">
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0} maximumValue={duration} value={position}
                minimumTrackTintColor="#FFFFFF" maximumTrackTintColor="#18181b"
                thumbTintColor="#FFFFFF"
                onSlidingComplete={PlayerService.seekTo}
            />
            
            <View className="flex-row justify-between px-1 mt-1">
                <Text className="text-zinc-500 text-[10px] font-mono font-bold tracking-widest">
                    {formatTime(position)}
                </Text>
                <Text className="text-zinc-500 text-[10px] font-mono font-bold tracking-widest">
                    {formatTime(duration)}
                </Text>
            </View>

            <View className="flex-row items-center justify-between px-4 mt-6">
                <TouchableOpacity onPress={() => PlayerService.playPrev()}>
                  <SkipBack size={28} color="white" fill="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={PlayerService.togglePlay} 
                    className="items-center justify-center w-20 h-20 bg-white rounded-full"
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

        <Modal visible={showLangModal} transparent animationType="fade">
            <View className="items-center justify-center flex-1 px-8 bg-black/80">
                <View className="bg-zinc-900 w-full rounded-sm border border-zinc-800 max-h-[500px]">
                    <View className="flex-row items-center justify-between p-6 border-b border-zinc-800">
                        <Text className="text-xs font-black tracking-widest text-white">SELECT CAPTION</Text>
                        <TouchableOpacity onPress={() => setShowLangModal(false)}>
                            <X color="white" size={24} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView className="p-4">
                        {currentTrack.availableLyrics?.map((lang) => (
                            <TouchableOpacity 
                                key={lang.code}
                                onPress={() => {
                                    changeLyricsLanguage(currentTrack.id, lang.code);
                                    setShowLangModal(false);
                                }}
                                className={`p-4 mb-2 border ${
                                    currentTrack.currentLang === lang.code 
                                    ? 'bg-white border-white' 
                                    : 'bg-black border-zinc-800'
                                }`}
                            >
                                <Text className={`font-bold font-mono uppercase ${
                                    currentTrack.currentLang === lang.code ? 'text-black' : 'text-white'
                                }`}>
                                    {lang.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>

      </View>
    </Modal>
  );
};