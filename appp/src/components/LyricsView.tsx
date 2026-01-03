import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';
import { parseLRC, parseVTT, LyricLine } from '../utils/lyricsParser';

const { height } = Dimensions.get('window');
const ITEM_HEIGHT = 90; 
const SYNC_OFFSET = 760; 

export const LyricsView = () => {
  const { currentTrack, position } = useMusicStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const flatListRef = useRef<FlatList>(null);

  // Tính toán spacer để dòng active luôn nằm giữa màn hình
  const CENTER_SPACER = height / 2 - ITEM_HEIGHT / 2;

  useEffect(() => {
    const loadLyrics = async () => {
      if (!currentTrack) return;
      setLoading(true);
      setLyrics([]); 
      setActiveIndex(-1);

      try {
        let content = null;
        if (currentTrack.availableLyrics && currentTrack.currentLang) {
             const lang = currentTrack.availableLyrics.find((l: any) => l.code === currentTrack.currentLang);
             if (lang?.url) {
                 const response = await fetch(lang.url);
                 content = await response.text();
             }
        }

        if (content) {
            const parsed = content.includes('WEBVTT') ? parseVTT(content) : parseLRC(content);
            setLyrics(parsed);
        } else {
            setLyrics([{ time: 0, text: "Giai điệu không lời..." }]);
        }
      } catch (e) {
        setLyrics([{ time: 0, text: "Lỗi tải lời rồi bro..." }]);
      } finally {
        setLoading(false);
      }
    };
    loadLyrics();
  }, [currentTrack?.id, currentTrack?.currentLang]);

  useEffect(() => {
    if (lyrics.length === 0) return;

    const currentTime = (position || 0) + SYNC_OFFSET;
    const index = lyrics.findLastIndex((line) => line.time <= currentTime);

    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
      
      flatListRef.current?.scrollToIndex({
        index: index,
        animated: true,
        viewPosition: 0.5, 
      });
    }
  }, [position, lyrics]);

  if (loading) return <ActivityIndicator color="#FFFFFF" size="large" className="flex-1"/>;

  return (
    <View className="flex-1">
      <FlatList
        ref={flatListRef}
        data={lyrics}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={{ height: CENTER_SPACER }} />}
        ListFooterComponent={<View style={{ height: CENTER_SPACER }} />}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: CENTER_SPACER + ITEM_HEIGHT * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const isActive = index === activeIndex;
          return (
            <View style={{ height: ITEM_HEIGHT }} className="items-center justify-center px-6">
              <Text
                className={`text-center text-lg ${isActive ? 'text-white font-bold' : 'text-zinc-600'}`}
                numberOfLines={3}
                style={{
                  lineHeight: 24,             // Giảm nhẹ lineheight để khít hơn khi nhiều dòng
                  textAlignVertical: 'center',
                  includeFontPadding: false,
                }}
              >
                {item.text}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
};