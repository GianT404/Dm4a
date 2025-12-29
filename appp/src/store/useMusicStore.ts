import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';
import { API_URL } from '../services/api';
import { LyricLine } from '../utils/lyricsParser';

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  localAudioUri?: string;
  localLyricsUri?: string;
  status: 'downloading' | 'ready' | 'error';
}

interface MusicState {
  playlist: Track[];
  currentTrack: Track | null;
  lyrics: LyricLine[];
  isPlaying: boolean;
  position: number;
  duration: number;
  isFullPlayerVisible: boolean; 

  setFullPlayerVisible: (visible: boolean) => void;
  setPlayState: (isPlaying: boolean) => void;
  setTrack: (track: Track) => void;
  setProgress: (position: number, duration: number) => void;
  setLyrics: (lyrics: LyricLine[]) => void;
  addToPlaylist: (track: Partial<Track>) => Promise<void>;
  removeFromPlaylist: (id: string) => void;
  playNext: () => void;
  playPrev: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      playlist: [],
      currentTrack: null,
      lyrics: [],
      isPlaying: false,
      position: 0,
      duration: 1,
      isFullPlayerVisible: false,

      setFullPlayerVisible: (v) => set({ isFullPlayerVisible: v }),
      setPlayState: (v) => set({ isPlaying: v }),
      setTrack: (t) => set({ currentTrack: t }),
      setProgress: (p, d) => set({ position: p, duration: d }),
      setLyrics: (l) => set({ lyrics: l }),

      addToPlaylist: async (rawTrack) => {
        const { id, title } = rawTrack;
        if (!id || get().playlist.some(t => t.id === id)) return;

        const newTrack: Track = { ...rawTrack as Track, status: 'downloading' };
        set(state => ({ playlist: [newTrack, ...state.playlist] }));

        try {
          const dir = FileSystem.documentDirectory + 'music_storage/';
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

          const metaRes = await axios.get(`${API_URL}/meta?id=${id}`);
          const tracks = metaRes.data.tracks || [];
          
          let bestLang = tracks.find((t: any) => t.code === 'vi')?.code 
                      || tracks.find((t: any) => t.code === 'en')?.code
                      || tracks.find((t: any) => t.code === 'auto')?.code
                      || tracks[0]?.code;

          const audioDest = dir + `${id}.m4a`;
          const audioTask = FileSystem.downloadAsync(`${API_URL}/download-audio?id=${id}`, audioDest);
          
          let lyricsDest = undefined;
          let lyricsTask = null;
          if (bestLang) {
             lyricsDest = dir + `${id}_${bestLang}.vtt`;
             lyricsTask = FileSystem.downloadAsync(
               `${API_URL}/download-lyrics?id=${id}&lang=${bestLang}`, 
               lyricsDest
             );
          }

          const [audioRes] = await Promise.all([audioTask, lyricsTask]);

          set(state => ({
            playlist: state.playlist.map(t => t.id === id ? { 
              ...t, 
              status: 'ready',
              localAudioUri: audioRes.uri,
              localLyricsUri: lyricsTask ? lyricsDest : undefined
            } : t)
          }));

        } catch (error) {
          console.error(error);
          set(state => ({ playlist: state.playlist.map(t => t.id === id ? { ...t, status: 'error' } : t) }));
        }
      },

      removeFromPlaylist: (id) => set(state => ({ playlist: state.playlist.filter(t => t.id !== id) })),
      
      playNext: () => { 
        const { playlist, currentTrack } = get();
        if(!currentTrack) return;
        const idx = playlist.findIndex(t => t.id === currentTrack.id);
        const next = playlist[idx + 1] || playlist[0];
        if(next) set({ currentTrack: next }); 
      },
      
      playPrev: () => {
        const { playlist, currentTrack } = get();
        if(!currentTrack) return;
        const idx = playlist.findIndex(t => t.id === currentTrack.id);
        const prev = playlist[idx - 1] || playlist[playlist.length - 1];
        if(prev) set({ currentTrack: prev });
      },
    }),
    { name: 'cold-music-offline', storage: createJSONStorage(() => AsyncStorage) }
  )
);