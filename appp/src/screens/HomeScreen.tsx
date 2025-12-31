import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL, getTrending, searchVideo } from '../services/api'; // Import thêm API
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/TrackItem';
import { Icon, Search, PlayCircle } from 'lucide-react-native';
import { PlayerService } from '../services/player'; // Import PlayerService

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState<any[]>([]); // State lưu trending
  const [loading, setLoading] = useState(false);
  
  // Lấy playlist và hàm thêm nhạc từ Store
  const { addToPlaylist, playlist } = useMusicStore();

  // 🔥 1. Load Trending ngay khi mở App
  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    const data = await getTrending();
    setTrending(data);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Dùng hàm searchVideo đã tách ở api.ts cho đồng bộ
      const data = await searchVideo(query);
      setResults(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // 🔥 2. Hàm xử lý logic: BẤM LÀ PHÁT (Play Now)
  const handlePlayNow = async (item: any) => {
    // a. Kiểm tra bài hát đã có trong máy chưa
    const existingTrack = playlist.find(t => t.id === item.id);

    // b. Nếu có rồi và đã tải xong (ready) -> Phát luôn
    if (existingTrack && existingTrack.status === 'ready') {
      await PlayerService.playTrack(existingTrack.id);
      return;
    }

    // c. Nếu chưa có -> Tải về (đợi tải xong) rồi mới phát
    // (Ở đây có thể thêm loading indicator nếu muốn UX xịn hơn)
    await addToPlaylist(item);

    // d. Sau khi tải xong, kiểm tra lại store lần nữa để chắc chắn
    const updatedTrack = useMusicStore.getState().playlist.find(t => t.id === item.id);
    if (updatedTrack?.status === 'ready') {
       await PlayerService.playTrack(item.id);
    }
  };

  // Component hiển thị 1 item Trending
  const TrendingItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      // 👇 Gắn hàm PlayNow vào đây
      onPress={() => handlePlayNow(item)}
      className="items-center mr-5 w-28" 
    >
      <View className="relative shadow-lg shadow-green-500/50">
        <Image 
          source={{ uri: item.thumbnail }} 
          className="w-24 h-24 border-2 border-green-500 rounded-full" 
        />
        <View className="absolute bottom-0 right-0 p-1 bg-black rounded-full">
            <PlayCircle size={20} color="#22c55e" fill="black" />
        </View>
      </View>
      <Text numberOfLines={1} className="mt-3 text-sm font-bold text-center text-green-400">
        {item.author}
      </Text>
      <Text numberOfLines={2} className="mt-1 text-xs text-center text-zinc-400">
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-[#121212]">
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        
        {/* Header Title */}
        <Text className="my-6 text-2xl font-black tracking-widest text-white uppercase">
          Dm4a <Text className="text-green-500">Music</Text>
        </Text>

        {/* SECTION: TOP TRENDING */}
        {trending.length > 0 && (
          <View className="mb-8">
            <Text className="mb-4 text-xl font-bold text-white">
              🔥 Top Thịnh Hành
            </Text>
            <FlatList
              horizontal
              data={trending}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TrendingItem item={item} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            />
          </View>
        )}

        {/* Thanh tìm kiếm (Sticky Header) */}
        <View className="pb-4 bg-[#121212]">
            <View className="flex-row items-center px-4 py-3 bg-white rounded-xl">
                <Search color="#000000" size={20} />
                <TextInput 
                className="flex-1 ml-3 text-base font-bold text-black"
                placeholder="Tìm bài hát, nghệ sĩ..." 
                placeholderTextColor="#52525b"
                returnKeyType="search" 
                value={query} 
                onChangeText={setQuery} 
                onSubmitEditing={handleSearch}
                />
            </View>
        </View>

        {/* Kết quả tìm kiếm */}
        {loading ? (
            <ActivityIndicator size="large" color="#22c55e" className="mt-10" /> 
        ) : (
            <View className="pb-24"> 
                {results.map((item: any) => {
                    const exists = playlist.find((t: any) => t.id === item.id);
                    return (
                        <TrackItem 
                            key={item.id}
                            track={exists || item} 
                            // 👇 Cũng áp dụng PlayNow cho list tìm kiếm luôn cho đồng bộ
                            onPress={() => handlePlayNow(item)} 
                        />
                    );
                })}
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}