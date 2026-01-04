import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, CheckCircle } from 'lucide-react-native';

import { getTrending, searchVideo } from '../services/api';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/TrackItem';
import { PlayerService } from '../services/player';
export default function HomeScreen() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    trendingData,
    setTrendingData,
    addToPlaylist,
    playlist,
  } = useMusicStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // player UI state
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /* =========================
      LOAD TRENDING
  ========================= */
  useEffect(() => {
    if (trendingData.length === 0) loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const data = await getTrending();
      setTrendingData(data);
    } catch (error) {
      console.error('Lỗi load trending:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchResults([]);
    await loadTrending();
    setRefreshing(false);
  }, []);

  /* =========================
      SEARCH
  ========================= */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await searchVideo(searchQuery);
      setSearchResults(data);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      PLAY HANDLER
  ========================= */
  const handlePlayNow = async (item: any) => {
    const existingTrack = playlist.find(t => t.id === item.id);

    if (existingTrack?.status === 'ready') {
      await PlayerService.playTrack(existingTrack.id);
      setCurrentTrack(existingTrack);
      setIsPlaying(true);
      return;
    }

    await addToPlaylist(item);

    const updatedTrack = useMusicStore
      .getState()
      .playlist.find(t => t.id === item.id);

    if (updatedTrack?.status === 'ready') {
      await PlayerService.playTrack(updatedTrack.id);
      setCurrentTrack(updatedTrack);
      setIsPlaying(true);
    }
  };

  /* =========================
      TRENDING ITEM
  ========================= */
  const TrendingItem = ({ item }: { item: any }) => {
    const trackInList = playlist.find(t => t.id === item.id);
    const isDownloading = trackInList?.status === 'downloading';
    const isExists = !!trackInList;

    return (
      <TouchableOpacity
        onPress={() => handlePlayNow(item)}
        className="items-center mr-5 w-28"
      >
        <View className="relative shadow-lg">
          <Image
            source={{ uri: item.thumbnail }}
            className="w-24 h-24 rounded-xl"
          />
          {(isDownloading || isExists) && (
            <View className="absolute bottom-0 right-0 p-1 bg-black rounded-full">
              {isDownloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CheckCircle size={20} color="#fff" />
              )}
            </View>
          )}
        </View>

        <Text numberOfLines={2} className="mt-1 text-xs text-center text-white">
          {item.title}
        </Text>
        <Text numberOfLines={1} className="mt-3 text-xs font-bold text-center text-zinc-400">
          {item.author}
        </Text>
      </TouchableOpacity>
    );
  };

  /* =========================
      RENDER
  ========================= */
  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-[#121212]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ef4444']}
            tintColor="#ef4444"
          />
        }
      >
        <Text className="my-6 text-2xl font-black tracking-widest text-white uppercase">
          D<Text className="text-[#ef4444]">M4A</Text>
        </Text>

        <View className="pb-4 bg-[#121212]">
          <View className="flex-row items-center px-4 py-3 bg-white rounded-xl">
            <Search color="#000" size={20} />
            <TextInput
              className="flex-1 ml-3 text-base font-bold text-black"
              placeholder="Tìm bài hát, nghệ sĩ..."
              placeholderTextColor="#52525b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        <View>
          {trendingData.length > 0 && (
            <View className="mb-8">
              <Text className="mb-4 text-xl font-bold text-white">
                Thử xem biết đâu nghiện
              </Text>
              <FlatList
                horizontal
                data={trendingData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TrendingItem item={item} />}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#22c55e" />
          ) : (
            <View className={currentTrack ? 'pb-32' : 'pb-6'}>
              {searchResults.map((item: any) => {
                const exists = playlist.find(t => t.id === item.id);
                return (
                  <TrackItem
                    key={item.id}
                    track={exists || item}
                    onPress={() => handlePlayNow(item)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* {currentTrack && (
        <PlayerControls
          track={currentTrack}
          isPlaying={isPlaying}
          onPlay={async () => {
            await PlayerService.togglePlay();
            setIsPlaying(true);
          }}
          onPause={async () => {
            await PlayerService.togglePlay();
            setIsPlaying(false);
          }}
        />
      )} */}
    </SafeAreaView>
  );
}
