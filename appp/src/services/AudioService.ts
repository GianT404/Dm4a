import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export type Track = {
  id: string;
  uri: string;
  title: string;
  artist?: string;
};

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentTrack: Track | null = null;
  private isPlaying = false;

  async setup() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
    });
  }

  getState() {
    return {
      track: this.currentTrack,
      isPlaying: this.isPlaying,
    };
  }

  async play(track: Track) {
    if (this.sound) {
      await this.sound.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: track.uri },
      { shouldPlay: true }
    );

    this.sound = sound;
    this.currentTrack = track;
    this.isPlaying = true;
  }

  async pause() {
    if (!this.sound) return;
    await this.sound.pauseAsync();
    this.isPlaying = false;
  }

  async resume() {
    if (!this.sound) return;
    await this.sound.playAsync();
    this.isPlaying = true;
  }
}

export default new AudioService();
