import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Github, Facebook, Code, Info, RotateCcw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMusicStore } from '../store/useMusicStore';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const playlist = useMusicStore((state) => state.playlist);
  const deletedPlaylist = useMusicStore((state) => state.deletedPlaylist);
  const restoreTrack = useMusicStore((state) => state.restoreTrack);
  const [activeTab, setActiveTab] = useState<'current' | 'deleted' | 'version'>('current');

  const totalAllTime = playlist.length + deletedPlaylist.length;

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <LinearGradient
        colors={['#ef4444', '#121212']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        className="absolute top-0 left-0 right-0 h-96 opacity-20"
      />

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-4 py-2">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="items-center mt-4 mb-6">
            <View className="p-1 border-4 border-zinc-800 rounded-full shadow-2xl bg-[#121212]">
              <Image source={require('../../assets/image.png')} className="w-32 h-32 rounded-full" />
            </View>
          </View>
          <View className="flex-row justify-between p-4 mx-4 mb-8 border bg-zinc-900/80 rounded-2xl border-zinc-800">
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-green-500">{playlist.length}</Text>
              <Text className="text-[10px] text-zinc-500 uppercase font-bold">Playlist</Text>
            </View>
            <View className="w-[1px] h-full bg-zinc-700" />
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-red-500">{deletedPlaylist.length}</Text>
              <Text className="text-[10px] text-zinc-500 uppercase font-bold">Đã xóa</Text>
            </View>
            <View className="w-[1px] h-full bg-zinc-700" />
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-white">{totalAllTime}</Text>
              <Text className="text-[10px] text-zinc-500 uppercase font-bold">Tổng</Text>
            </View>
          </View>

          <View className="flex-row justify-between px-5 mb-4 border-b border-zinc-800">
            <TouchableOpacity
              onPress={() => setActiveTab('current')}
              className={`pb-3 px-2 ${activeTab === 'current' ? 'border-b-2 border-green-500' : ''}`}
            >
              <Text className={`font-bold uppercase text-xs ${activeTab === 'current' ? 'text-white' : 'text-zinc-500'}`}>
                Playlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('deleted')}
              className={`pb-3 px-2 ${activeTab === 'deleted' ? 'border-b-2 border-red-500' : ''}`}
            >
              <Text className={`font-bold uppercase text-xs ${activeTab === 'deleted' ? 'text-white' : 'text-zinc-500'}`}>
                Đã xóa ({deletedPlaylist.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('version')}
              className={`pb-3 px-2 ${activeTab === 'version' ? 'border-b-2 border-blue-500' : ''}`}
            >
              <Text className={`font-bold uppercase text-xs ${activeTab === 'version' ? 'text-white' : 'text-zinc-500'}`}>
                Phiên bản
              </Text>
            </TouchableOpacity>
          </View>
          <View className="px-5 mb-8">
            {activeTab === 'current' && (
              playlist.length === 0 ? (
                <Text className="py-8 italic text-center text-zinc-600">Playlist đang trống...</Text>
              ) : (
                <View className="overflow-hidden border bg-zinc-900/50 rounded-2xl border-zinc-800">
                  {playlist.map((track, index) => (
                    <View key={track.id} className={`flex-row items-center p-3 ${index !== playlist.length - 1 ? 'border-b border-zinc-800' : ''}`}>
                      <Text className="w-6 text-xs font-bold text-zinc-600">{index + 1}</Text>
                      <Image source={{ uri: track.thumbnail }} className="w-10 h-10 rounded bg-zinc-800" />
                      <View className="flex-1 ml-3">
                        <Text numberOfLines={1} className="text-sm font-bold text-white">{track.title}</Text>
                        <Text numberOfLines={1} className="text-xs text-zinc-500">{track.author}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}
            {activeTab === 'deleted' && (
              deletedPlaylist.length === 0 ? (
                <Text className="py-8 italic text-center text-zinc-600">Nothing.</Text>
              ) : (
                <View className="overflow-hidden border bg-zinc-900/50 rounded-2xl border-zinc-800">
                  {deletedPlaylist.map((track, index) => (
                    <View key={track.id + '_del'} className={`flex-row items-center p-3 ${index !== deletedPlaylist.length - 1 ? 'border-b border-zinc-800' : ''}`}>
                      <Image source={{ uri: track.thumbnail }} className="w-10 h-10 rounded bg-zinc-800 opacity-60" />
                      <View className="flex-1 ml-3 opacity-60">
                        <Text numberOfLines={1} className="text-sm font-bold text-white">{track.title}</Text>
                        <Text numberOfLines={1} className="text-xs text-zinc-500">{track.author}</Text>
                      </View>
                      <TouchableOpacity onPress={() => restoreTrack(track)} className="items-center justify-center w-8 h-8 rounded-full bg-zinc-800">
                        <RotateCcw size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )
            )}

            {activeTab === 'version' && (
              <View className="p-5 border bg-zinc-900/50 rounded-2xl border-zinc-800">
                <View className="items-center mb-6">
                    <Text className="text-xl font-black text-white">DM4A</Text>
                </View>

                <View className="space-y-3">
                    <View className="flex-row items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                        <View className="flex-row items-center">
                            <Info size={18} color="#a1a1aa" />
                            <Text className="ml-3 font-bold text-zinc-300">Phiên bản</Text>
                        </View>
                        <Text className="font-bold text-white">v1.0.26</Text>
                    </View>
                </View>
                
                <Text className="mt-6 text-[10px] text-center text-zinc-600">
                    Made by ミＧＩＡＮ4０４シ
                </Text>
              </View>
            )}

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}