import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useMusicStore } from '../store/useMusicStore';

export const LyricsView = () => {
  const { lyrics, position } = useMusicStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const activeIndex = lyrics.findIndex((line) => position >= line.start && position < line.end);

  useEffect(() => {
    if (activeIndex !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: activeIndex * 40 - 100, animated: true });
    }
  }, [activeIndex]);

return (
    <ScrollView ref={scrollViewRef} className="flex-1 mt-6" showsVerticalScrollIndicator={false}>
      {lyrics.map((line, index) => (
        <View key={index} className="py-3 h-12 justify-center">
          <Text className={`text-center text-lg font-bold ${index === activeIndex ? 'text-white' : 'text-zinc-800'}`}>
            {line.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};