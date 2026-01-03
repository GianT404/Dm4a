import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
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

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          store.setProgress(status.positionMillis, status.durationMillis || 0);
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
      } else {
        await soundObject.playAsync();
        store.setPlayState(true);
      }
    }
  },
  
  seekTo: async (ms: number) => {
      if (soundObject) await soundObject.setPositionAsync(ms);
  }
};