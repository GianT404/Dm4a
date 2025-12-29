import React, { useState } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../services/api';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/TrackItem';
import { Icon, Search } from 'lucide-react-native';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToPlaylist, playlist } = useMusicStore();

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/search`, { params: { query } });
      setResults(res.data.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
<SafeAreaView className="flex-1 bg-black px-4 pt-4">
  <Text className="text-2xl font-black tracking-widest text-white my-6 uppercase">
    Dm4a
  </Text>
  
  {/* Thanh tìm kiếm mới có Icon */}
  <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-6">
    <Search color="#000000" size={20} />
    
    <TextInput 
      className="flex-1 ml-3 text-black font-bold text-base"
      placeholder="Nghe gì?" 
      placeholderTextColor="#52525b"
      returnKeyType="search" 
      value={query} 
      onChangeText={setQuery} 
      onSubmitEditing={handleSearch}
    />
  </View>

  {loading ? (
    <ActivityIndicator size="large" color="#FFFFFF" /> 
  ) : (
    <FlatList
      data={results}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }) => {
        const exists = playlist.find((t: any) => t.id === item.id);
        return (
          <TrackItem 
            track={exists || item} 
            onPress={() => !exists && addToPlaylist(item)} 
          />
        );
      }}
      contentContainerStyle={{ paddingBottom: 100 }} 
    />
  )}
</SafeAreaView>
  );
}