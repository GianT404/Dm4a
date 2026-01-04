import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, ScrollView, StyleSheet, Easing, Text } from 'react-native';

type Props = {
  text: string;
  speed?: number; // Tốc độ chạy (px/s)
};

export const MarqueeText = ({ text, speed = 30 }: Props) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Khoảng cách giữa 2 đoạn text khi nối đuôi nhau (50px)
  const spacing = 50; 

  useEffect(() => {
    translateX.setValue(0);
    translateX.stopAnimation();

    // Chỉ chạy animation khi Text dài hơn Container
    if (textWidth > containerWidth && containerWidth > 0) {
      
      // Quãng đường cần chạy = chiều dài text + khoảng trống
      const distance = textWidth + spacing; 
      const duration = (distance / speed) * 1000;

      Animated.loop(
        Animated.timing(translateX, {
          toValue: -distance, // Chạy sang trái đúng bằng độ dài của 1 cụm (text + spacing)
          duration: duration,
          easing: Easing.linear, // Chạy đều tăm tắp
          useNativeDriver: true,
        })
      ).start();
    }
  }, [textWidth, containerWidth, text, speed]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView 
        horizontal 
        scrollEnabled={false} 
        showsHorizontalScrollIndicator={false}
      >
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateX }] }}>
          {/* TEXT GỐC */}
          <Text
            onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
            numberOfLines={1}
            style={styles.text}
          >
            {text}
          </Text>

          {/* TEXT BẢN SAO (Clone) - Chỉ hiện khi cần scroll */}
          {textWidth > containerWidth && (
            <Text
              numberOfLines={1}
              style={[styles.text, { marginLeft: spacing }]} // Cách ra 1 đoạn
            >
              {text}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});