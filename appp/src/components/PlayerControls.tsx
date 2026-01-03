import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Track } from '../services/AudioService';

type Props = {
  track: any;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
};

export default function PlayerControls({
  track,
  isPlaying,
  onPlay,
  onPause,
}: Props) {
  if (!track) return null;

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{track.title}</Text>
        {track.artist && <Text style={styles.artist}>{track.artist}</Text>}
      </View>

      <Pressable
        style={styles.button}
        onPress={isPlaying ? onPause : onPlay}
      >
        <Text style={styles.buttonText}>
          {isPlaying ? 'Pause' : 'Play'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0b0b0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
