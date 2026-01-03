import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
// Thư viện quản lý điều khiển media trên màn hình khóa / notification
import MusicControl from 'react-native-music-control';
import * as FileSystem from 'expo-file-system/legacy';
import { useMusicStore } from '../store/useMusicStore';
import { parseVTT } from '../utils/lyricsParser';

let soundObject: Audio.Sound | null = null;

export const PlayerService = {
  playTrack: async (trackId: string) => {
    const store = useMusicStore.getState();
    const track = store.playlist.find(t => t.id === trackId);

    if (!track || track.status !== 'ready' || !track.localAudioUri) {
      alert('Bài chưa tải xong hoặc lỗi!');
      return;
    }

    try {
      if (soundObject) {
        await soundObject.unloadAsync();
        soundObject = null;
      }

      store.setLyrics([]);
      if (track.localLyricsUri) {
        const info = await FileSystem.getInfoAsync(track.localLyricsUri);
        if (info.exists) {
          const vtt = await FileSystem.readAsStringAsync(track.localLyricsUri);
          store.setLyrics(parseVTT(vtt));
        }
      }

      console.log('Playing:', track.localAudioUri);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.localAudioUri },
        { shouldPlay: true }
      );
      
      soundObject = sound;
      store.setTrack(track);
      store.setPlayState(true);

      // Cấu hình thông tin hiển thị trên màn hình khóa / notification
      try {
        MusicControl.setNowPlaying({
          title: track.title,
          artwork: track.thumbnail || undefined,
          artist: track.author || undefined,
          duration: undefined,
          elapsedTime: 0,
        });

        MusicControl.enableControl('play', true);
        MusicControl.enableControl('pause', true);
        MusicControl.enableControl('nextTrack', true);
        MusicControl.enableControl('previousTrack', true);
        MusicControl.enableControl('stop', true);

        MusicControl.on('play', async () => { await PlayerService.togglePlay(); });
        MusicControl.on('pause', async () => { await PlayerService.togglePlay(); });
        MusicControl.on('nextTrack', async () => { await PlayerService.playNext(); });
        MusicControl.on('previousTrack', async () => { await PlayerService.playPrev(); });
        MusicControl.on('stop', async () => { await PlayerService.stop(); });
      } catch (e) {
        console.warn('MusicControl unavailable', e);
      }

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          store.setProgress(status.positionMillis, status.durationMillis || 0);
          try {
            MusicControl.updatePlayback({
              state: status.isPlaying ? MusicControl.STATE_PLAYING : MusicControl.STATE_PAUSED,
              elapsedTime: (status.positionMillis || 0) / 1000,
              duration: (status.durationMillis || 0) / 1000,
            });
          } catch (e) {}
          if (status.didJustFinish) {
              PlayerService.playNext();
             setTimeout(() => {
                const newTrack = useMusicStore.getState().currentTrack;
                if(newTrack) PlayerService.playTrack(newTrack.id);
             }, 500);
          }
        }
      });

    } catch (e) { console.error('Play Error', e); }
  },
  // playNext: async () => {
  //    const store = useMusicStore.getState();
  //    store.playNext(); 
     
  //    const newTrack = useMusicStore.getState().currentTrack; 
  //    if (newTrack) {
  //       await PlayerService.playTrack(newTrack.id); 
  //    }
  // },

  playPrev: async () => {
     const store = useMusicStore.getState();
     store.playPrev();
     
     const newTrack = useMusicStore.getState().currentTrack;
     if (newTrack) {
        await PlayerService.playTrack(newTrack.id);
     }
  },
playNext: async () => {
  const { playlist, currentTrack, isShuffle } = useMusicStore.getState();
  if (!currentTrack || playlist.length === 0) return;

  let nextTrack;

  if (isShuffle) {
    let remainingTracks = playlist.filter(t => t.id !== currentTrack.id);
    if (remainingTracks.length === 0) {
      nextTrack = currentTrack;
    } else {
      const randomIndex = Math.floor(Math.random() * remainingTracks.length);
      nextTrack = remainingTracks[randomIndex];
    }
  } else {
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    nextTrack = playlist[nextIndex];
  }

  if (nextTrack) {
    useMusicStore.getState().setTrack(nextTrack); 
    await PlayerService.playTrack(nextTrack.id);
  }
},
  togglePlay: async () => {
    const store = useMusicStore.getState();
    if (soundObject) {
      if (store.isPlaying) {
        await soundObject.pauseAsync();
        store.setPlayState(false);
        try { MusicControl.updatePlayback({ state: MusicControl.STATE_PAUSED, elapsedTime: (await soundObject.getStatusAsync()).positionMillis / 1000 }); } catch(e){}
      } else {
        await soundObject.playAsync();
        store.setPlayState(true);
        try { MusicControl.updatePlayback({ state: MusicControl.STATE_PLAYING, elapsedTime: (await soundObject.getStatusAsync()).positionMillis / 1000 }); } catch(e){}
      }
    }
  },
  
  seekTo: async (ms: number) => {
      if (soundObject) await soundObject.setPositionAsync(ms);
  }
,
  stop: async () => {
    const store = useMusicStore.getState();
    try {
      if (soundObject) {
        await soundObject.unloadAsync();
        soundObject = null;
      }
      store.setPlayState(false);
      store.setTrack(null as any);
      try { MusicControl.resetNowPlaying(); } catch (e) {}
    } catch (e) { console.error('Stop Error', e); }
  }
};