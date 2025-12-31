import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy'; // Giữ legacy như đã fix
import axios from 'axios';
import { API_URL } from '../services/api';
import { parseVTT, LyricLine } from '../utils/lyricsParser';

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  localAudioUri?: string;
  localLyricsUri?: string;
  status: 'downloading' | 'ready' | 'error';
  availableLyrics?: { code: string; name: string ;url: string}[]; 
  currentLang?: string; // Ngôn ngữ đang chọn

}

interface MusicState {
  playlist: Track[];
  currentTrack: Track | null;
  lyrics: LyricLine[];
  isPlaying: boolean;
  position: number;
  duration: number;
  isFullPlayerVisible: boolean;
  isShuffle: boolean; 
  searchQuery: string;       
  searchResults: any[];       
  trendingData: any[];
  toggleShuffle: () => void;
  setFullPlayerVisible: (visible: boolean) => void;
  setPlayState: (isPlaying: boolean) => void;
  setTrack: (track: Track) => void;
  setProgress: (position: number, duration: number) => void;
  setLyrics: (lyrics: LyricLine[]) => void;
  addToPlaylist: (track: Partial<Track>) => Promise<void>;
  removeFromPlaylist: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setTrendingData: (data: any[]) => void;
  playNext: () => void;
  playPrev: () => void;
  
  changeLyricsLanguage: (trackId: string, langCode: string) => Promise<void>;
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
      searchQuery: '',
      searchResults: [],
      trendingData: [],
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setTrendingData: (data) => set({ trendingData: data }),
      setFullPlayerVisible: (v) => set({ isFullPlayerVisible: v }),
      setPlayState: (v) => set({ isPlaying: v }),
      setTrack: (t) => set({ currentTrack: t }),
      setProgress: (p, d) => set({ position: p, duration: d }),
      setLyrics: (l) => set({ lyrics: l }),
      isShuffle: false, 
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
      addToPlaylist: async (rawTrack) => {
        const { id } = rawTrack;
        if (!id || get().playlist.some(t => t.id === id)) return;

        const newTrack: Track = { ...rawTrack as Track, status: 'downloading', availableLyrics: [] };
        set(state => ({ playlist: [newTrack, ...state.playlist] }));

        try {
          const dir = FileSystem.documentDirectory + 'music_storage/';
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

          // 1. Lấy Meta để biết có bao nhiêu ngôn ngữ
          const metaRes = await axios.get(`${API_URL}/meta?id=${id}`);
          const tracks = metaRes.data.tracks || [];
          
const availableLyrics = tracks.map((t: any) => {
    let langName = t.name || t.code.toUpperCase();
    if (typeof langName === 'object' && langName !== null) {
        langName = langName.text || langName.name || t.code.toUpperCase();
    }

    return {
        code: t.code,
        name: String(langName),
        url: `${API_URL}/download-lyrics?id=${id}&lang=${t.code}`
    };
});

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
              localLyricsUri: lyricsTask ? lyricsDest : undefined,
              availableLyrics: availableLyrics, // Lưu danh sách vào track
              currentLang: bestLang
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

      changeLyricsLanguage: async (trackId, langCode) => {
        const { playlist, currentTrack } = get();
        const track = playlist.find(t => t.id === trackId);
        if (!track) return;

        try {
            const dir = FileSystem.documentDirectory + 'music_storage/';
            const lyricsDest = dir + `${trackId}_${langCode}.vtt`;

            // Kiểm tra file đã có chưa, chưa có thì tải
            const fileInfo = await FileSystem.getInfoAsync(lyricsDest);
            if (!fileInfo.exists) {
                await FileSystem.downloadAsync(
                    `${API_URL}/download-lyrics?id=${trackId}&lang=${langCode}`, 
                    lyricsDest
                );
            }

            const vttContent = await FileSystem.readAsStringAsync(lyricsDest);
            const newLyrics = parseVTT(vttContent);

            set({ lyrics: newLyrics });
            
            // Cập nhật thông tin Track trong Playlist và CurrentTrack
            const updatedTrack = { ...track, localLyricsUri: lyricsDest, currentLang: langCode };
            
            set(state => ({
                playlist: state.playlist.map(t => t.id === trackId ? updatedTrack : t),
                currentTrack: state.currentTrack?.id === trackId ? updatedTrack : state.currentTrack
            }));

        } catch (error) {
            console.error("Error changing language:", error);
            alert("Không tải được ngôn ngữ này!");
        }
      }
    }),
    { name: 'cold-music-offline', storage: createJSONStorage(() => AsyncStorage) }
  )
);