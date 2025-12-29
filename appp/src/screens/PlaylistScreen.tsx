import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/TrackItem';
import { PlayerService } from '../services/player';

export default function PlaylistScreen() {
  const { playlist, currentTrack, removeFromPlaylist } = useMusicStore();

  return (
    <SafeAreaView className="flex-1 bg-black px-4 pt-4">
      <Text className="text-2xl font-bold text-white my-4">Playlist ({playlist.length})</Text>
      <FlatList
        data={playlist}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackItem 
            track={item} 
            isCurrent={currentTrack?.id === item.id}
            onPress={() => PlayerService.playTrack(item.id)}
            onRemove={() => removeFromPlaylist(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}