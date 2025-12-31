import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Dimensions, FlatList, ScrollView } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, MessageSquare, X, CaptionsIcon } from 'lucide-react-native';
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
      <View className="flex-1 pt-4 bg-[#121212]">

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
              <CaptionsIcon color="white" size={24} />
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
        <View className="px-8 pb-16 bg-[#121212]">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0} maximumValue={duration} value={position}
            minimumTrackTintColor="#FFFFFF" maximumTrackTintColor="#fff"
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

        <Modal
          visible={showLangModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLangModal(false)}
        >
          <View className="items-center justify-center flex-1 px-6 bg-black/80">
            <View className="w-full max-w-md overflow-hidden shadow-2xl bg-black-900 rounded-2xl">
              {/* Header */}
              <View className="flex-row items-center justify-between p-5">
                <Text className="text-lg font-semibold text-white">
                  Chọn ngôn ngữ phụ đề
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLangModal(false)}
                  className="items-center justify-center w-10 h-10 bg-gray-800 rounded-full"
                  activeOpacity={0.7}
                >
                  <X size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Language List */}
              <ScrollView
                className="max-h-96"
                showsVerticalScrollIndicator={false}
              >
                {currentTrack.availableLyrics?.map((lang) => {
                  const isSelected = currentTrack.currentLang === lang.code;

                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => {
                        changeLyricsLanguage(currentTrack.id, lang.code);
                        setShowLangModal(false);
                      }}
                      className={`mx-5 my-1.5 overflow-hidden rounded-xl ${isSelected
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'active:bg-gray-800'
                        }`}
                      activeOpacity={0.8}
                    >
                      <View className="p-4">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`text-base font-medium ${isSelected ? 'text-blue-400' : 'text-gray-200'
                              }`}
                          >
                            {lang.name}
                          </Text>
                        </View>

                        {lang.code && (
                          <Text className={`mt-1 text-sm ${isSelected ? 'text-blue-400/70' : 'text-gray-400'
                            }`}>
                            {lang.code.toUpperCase()}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Footer Note */}
              <View className="p-4 border-t border-gray-800">
                <Text className="text-xs text-center text-gray-500">
                  {currentTrack.availableLyrics?.length || 0} ngôn ngữ có sẵn
                </Text>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
};