import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Dimensions, FlatList, ScrollView, StatusBar, Platform } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';
import { PlayerService } from '../services/player';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, X, CaptionsIcon, CheckCircle } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { LyricsView } from './LyricsView';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const pages = [{ id: 'artwork' }, { id: 'lyrics' }];

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index);
    }
  }).current;

  if (!currentTrack) return null;

  return (
    <Modal visible={isFullPlayerVisible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
        {currentPage === 0 && (
          <View className="absolute inset-0 w-full h-full">
            <Image
              source={{ uri: currentTrack.thumbnail }}
              className="w-full h-full opacity-60"
              resizeMode="cover"
              blurRadius={5}
            />
            {/* Lớp phủ đen để chữ dễ đọc */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
            />
          </View>
        )}

        {/* HEADER */}
        <View
          className="z-10 flex-row items-center justify-between px-6 mb-4"
          style={{ marginTop: Platform.OS === 'android' ? insets.top + 12 : insets.top }}
        >
          <TouchableOpacity onPress={() => setFullPlayerVisible(false)}>
            <ChevronDown color="white" size={32} />
          </TouchableOpacity>
          <Text className="text-white/80 font-bold text-[10px] tracking-[4px]">
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

        {/* CONTENT SWIPER */}
        <View className="flex-1">
          <FlatList
            data={pages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            renderItem={({ item }) => {
              if (item.id === 'artwork') {
                return (
                  <View style={{ width }} className="items-center justify-center">
                    {/* Ảnh chính giữa (Album Art) */}
                    <Image
                      source={{ uri: currentTrack.thumbnail }}
                      style={{ width: width - 60, height: width - 60 }}
                      className="shadow-2xl rounded-xl"
                      resizeMode="cover"
                    />

                    {/* Thông tin bài hát */}
                    <View className="items-center w-full px-8 mt-10">
                      <Text className="text-xl font-black text-center text-white" numberOfLines={2}>
                        {currentTrack.title}
                      </Text>
                      <Text className="mt-2 text-lg font-medium text-center text-white/70">
                        {currentTrack.author}
                      </Text>
                    </View>
                  </View>
                );
              }
              return (
                <View style={{ width }} className="px-6 pt-4 bg-black/40">
                  <LyricsView />
                </View>
              );
            }}
          />
        </View>

        {/* PAGINATION DOTS */}
        <View className="flex-row items-center justify-center gap-2 mb-6">
          <View className={`w-2 h-2 rounded-full ${currentPage === 0 ? 'bg-white' : 'bg-white/20'}`} />
          <View className={`w-2 h-2 rounded-full ${currentPage === 1 ? 'bg-white' : 'bg-white/20'}`} />
        </View>

        {/* CONTROLS */}
        <View
          className="px-8"
          style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }}
        >
          {/* Slider */}
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0} maximumValue={duration} value={position}
            minimumTrackTintColor="#FFFFFF" maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#FFFFFF"
            onSlidingComplete={PlayerService.seekTo}
          />

          {/* Time Labels */}
          <View className="flex-row justify-between px-1 -mt-2">
            <Text className="text-white/60 text-[10px] font-mono font-bold">
              {formatTime(position)}
            </Text>
            <Text className="text-white/60 text-[10px] font-mono font-bold">
              {formatTime(duration)}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row items-center justify-between px-4 mt-4">
            <TouchableOpacity onPress={() => PlayerService.playPrev()}>
              <SkipBack size={32} color="white" fill="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={PlayerService.togglePlay}
              className="items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg shadow-white/20"
            >
              {isPlaying ? (
                <Pause size={36} color="black" fill="black" />
              ) : (
                <Play size={36} color="black" fill="black" className="ml-1" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => PlayerService.playNext()}>
              <SkipForward size={32} color="white" fill="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MODAL LANGUAGE (Giữ nguyên) */}
        <Modal
          visible={showLangModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLangModal(false)}
        >
          <View className="items-center justify-center flex-1 px-6 bg-black/80">
            <View className="w-full max-w-md overflow-hidden bg-zinc-900 rounded-2xl">
              <View className="flex-row items-center justify-between p-5 border-b border-white/10">
                <Text className="text-lg font-bold text-white">Chọn ngôn ngữ</Text>
                <TouchableOpacity onPress={() => setShowLangModal(false)}>
                  <X size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-96">
                {currentTrack.availableLyrics?.map((lang) => {
                  const isSelected = currentTrack.currentLang === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => {
                        changeLyricsLanguage(currentTrack.id, lang.code);
                        setShowLangModal(false);
                      }}
                      className={`flex-row items-center justify-between p-4 mx-4 my-1 rounded-xl ${isSelected ? 'bg-red-500/20' : ''}`}
                    >
                      <View>
                        <Text className={`font-bold ${isSelected ? 'text-red-500' : 'text-white'}`}>
                          {lang.name}
                        </Text>
                        <Text className="text-xs text-white/40">{lang.code.toUpperCase()}</Text>
                      </View>
                      {isSelected && <CheckCircle size={20} color="#ef4444" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
};