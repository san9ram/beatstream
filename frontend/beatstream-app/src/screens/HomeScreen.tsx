import React, { useCallback, useRef, useState } from "react";
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import type { Beat } from "../types/Beat";

const SAMPLE_BEATS: Beat[] = [
  {
    id: "1",
    title: "Midnight Drive",
    producer: "DJ Nova",
    bpm: 140,
    // Public demo MP3 for testing:
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Trap Sky",
    producer: "808 Kid",
    bpm: 150,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
];

function BeatCard({ beat, onPlay, isPlaying }: {
  beat: Beat; onPlay: (beat: Beat) => void; isPlaying: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{beat.title}</Text>
      <Text style={styles.meta}>by {beat.producer} • {beat.bpm} BPM</Text>
      <TouchableOpacity onPress={() => onPlay(beat)} style={styles.button}>
        <Text style={styles.buttonText}>{isPlaying ? "Pause" : "Play Preview"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stopAndUnload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(async (beat: Beat) => {
    if (currentId === beat.id) {
      await stopAndUnload();
      setCurrentId(null);
      return;
    }
    await stopAndUnload();
    const { sound } = await Audio.Sound.createAsync({ uri: beat.previewUrl });
    soundRef.current = sound;
    setCurrentId(beat.id);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if ("didJustFinish" in status && status.didJustFinish) {
        setCurrentId(null);
        stopAndUnload();
      }
    });
  }, [currentId, stopAndUnload]);

  React.useEffect(() => {
    return () => { stopAndUnload(); };
  }, [stopAndUnload]);

  return (
    <FlatList
      data={SAMPLE_BEATS}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <BeatCard beat={item} onPlay={handlePlay} isPlaying={currentId === item.id} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: { color: "white", fontSize: 18, fontWeight: "600" },
  meta: { color: "#9CA3AF", marginTop: 4 },
  button: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },
});
