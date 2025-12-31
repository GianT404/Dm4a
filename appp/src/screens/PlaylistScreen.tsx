import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/TrackItem';
import { PlayerService } from '../services/player';
import { Trash2, Search, Shuffle } from 'lucide-react-native'; // Import thêm icon
import { Swipeable } from 'react-native-gesture-handler';

export default function PlaylistScreen() {
  const { playlist, currentTrack, removeFromPlaylist , isShuffle, toggleShuffle} = useMusicStore();
  const [searchQuery, setSearchQuery] = useState(''); // State lưu từ khóa tìm kiếm

  // Logic lọc playlist theo tên bài hoặc tên ca sĩ
  const filteredPlaylist = playlist.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

const handleShufflePress = () => {
    toggleShuffle();
    // if (!isShuffle) { 
    //   if (filteredPlaylist.length === 0) return;
    //   const randomIndex = Math.floor(Math.random() * filteredPlaylist.length);
    //   const randomTrack = filteredPlaylist[randomIndex];
    //   PlayerService.playTrack(randomTrack.id);
    // }
  };

  const renderRightActions = (progress: any, dragX: any, item: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={() => removeFromPlaylist(item.id)}
        className="items-end justify-center px-6 mb-2 bg-red-600 rounded-r-lg"
        style={{ width: 100 }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 color="white" size={24} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-[#121212]">
      
      {/* Header Title */}
      <Text className="my-4 text-2xl font-bold text-white font-roboto-bold">
        Thư viện
      </Text>

      {/* 3️⃣ Thanh Search Bar */}
      <View className="flex-row items-center px-4 py-3 mb-4 rounded-full bg-zinc-800">
        <Search color="#a1a1aa" size={20} />
        <TextInput 
          className="flex-1 ml-3 text-base text-white font-roboto-regular"
          placeholder="Tìm bài hát hoặc nghệ sĩ..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text className="text-zinc-400">Hủy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4️⃣ Nút Shuffle & Số lượng bài */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-400 font-roboto-regular">
          {filteredPlaylist.length} bài hát
        </Text>

        <TouchableOpacity 
          onPress={handleShufflePress}
          activeOpacity={0.7}
          className={`flex-row items-center px-4 py-2 rounded-full ${
            isShuffle ? 'bg-green-500' : 'bg-zinc-800'
          }`}
        >
          <Shuffle 
            color={isShuffle ? 'black' : 'white'} 
            size={18} 
            fill={isShuffle ? 'black' : 'transparent'} 
          />
        </TouchableOpacity>
      </View>

      {/* Danh sách bài hát */}
      <FlatList
        data={filteredPlaylist} // Dùng danh sách đã lọc
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled" // Để bấm vào list không bị ẩn bàn phím ngay lập tức
        ListEmptyComponent={() => (
          <View className="items-center justify-center mt-10">
            <Text className="text-zinc-500 font-roboto-regular">Không tìm thấy bài hát nào bro ơi :(</Text>
          </View>
        )}
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
              hideStatus={true}
            />
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}