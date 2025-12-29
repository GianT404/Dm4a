import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/TrackItem';
import { PlayerService } from '../services/player';
import { Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';

export default function PlaylistScreen() {
  const { playlist, currentTrack, removeFromPlaylist } = useMusicStore();
    const renderRightActions = (progress: any, dragX: any, item: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

  return (
      <TouchableOpacity 
        onPress={() => removeFromPlaylist(item.id)}
        className="bg-red-600 justify-center items-end px-6 mb-2 rounded-r-lg"
        style={{ width: 100 }} // Độ rộng vùng xóa
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 color="white" size={24} />
        </Animated.View>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-black px-4 pt-4">
      <Text className="text-2xl font-bold text-white my-4">Playlist ({playlist.length})</Text>
      <FlatList
        data={playlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
renderItem={({ item }) => (
          <Swipeable
            renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') removeFromPlaylist(item.id);
            }}
          >
            <TrackItem 
              track={item} 
              isCurrent={currentTrack?.id === item.id}
              onPress={() => PlayerService.playTrack(item.id)}
            />
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}