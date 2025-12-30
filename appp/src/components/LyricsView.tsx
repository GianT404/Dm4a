import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';
// Import thêm Icon nếu muốn đẹp (tùy chọn)
import { MicOff } from 'lucide-react-native'; 

export const LyricsView = () => {
  const { lyrics, position } = useMusicStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const activeIndex = lyrics.findIndex((line) => position >= line.start && position < line.end);

  useEffect(() => {
    if (activeIndex !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: activeIndex * 40 - 100, animated: true });
    }
  }, [activeIndex]);
  if (!lyrics || lyrics.length === 0) {
    return (
      <View className="items-center justify-center flex-1 mt-10">
        <MicOff size={36} color="#52525b" /> 
        <Text className="mt-4 text-base font-bold tracking-widest uppercase text-zinc-500">
          Không có lời bài hát
        </Text>
      </View>
    );
  }
  return (
    <ScrollView ref={scrollViewRef} className="flex-1 mt-6" showsVerticalScrollIndicator={false}>
      {lyrics.map((line, index) => (
        <View key={index} className="justify-center h-12 py-3">
          <Text className={`text-center text-lg font-bold ${index === activeIndex ? 'text-white' : 'text-zinc-800'}`}>
            {line.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};