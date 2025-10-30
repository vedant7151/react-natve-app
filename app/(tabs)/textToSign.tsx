import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface VideoItem {
  file_name: string;
  url: string;
}

export default function TextToSign() {
  const [inputText, setInputText] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [allPlayed, setAllPlayed] = useState(false);
  const videoRef = useRef<Video>(null);

  const searchVideos = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError('');
    setVideos([]);
    setCurrentVideoIndex(0);
    setAllPlayed(false);

    try {
      const response = await fetch('https://python-23-october.vercel.app/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputText.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.videos && data.videos.length > 0) {
        setVideos(data.videos);
      } else {
        setError(data.message || 'No videos found for your query');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish && !status.isLooping) {
      if (currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      } else {
        setAllPlayed(true);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && videos.length > 0 && !allPlayed) {
      videoRef.current.playAsync();
    }
  }, [currentVideoIndex, videos]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Text to Sign</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter words or sentences..."
        value={inputText}
        onChangeText={setInputText}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={searchVideos}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Searching...' : 'Show Signs'}
        </Text>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {videos.length > 0 && !allPlayed ? (
        <View style={styles.videoContainer}>
          <Text style={styles.videoTitle}>
            {videos[currentVideoIndex].file_name}
          </Text>
          <Video
            ref={videoRef}
            source={{ uri: videos[currentVideoIndex].url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          <Text style={styles.videoProgress}>
            Video {currentVideoIndex + 1} of {videos.length}
          </Text>
        </View>
      ) : null}

      {allPlayed ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ All videos played once</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 20,
    minHeight: 80,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f5c2c7',
  },
  errorText: {
    color: '#842029',
    fontSize: 14,
  },
  videoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 20,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  video: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  videoProgress: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 10,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#d1e7dd',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#badbcc',
  },
  successText: {
    color: '#0f5132',
    fontSize: 16,
    fontWeight: '600',
  },
});