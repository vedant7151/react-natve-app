import { Audio, ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


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
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  
  const videoRef = useRef<Video>(null);
  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web Speech API for web platform
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          setInputText(prev => {
            // For final results, add to existing text
            if (event.results[0].isFinal) {
              return prev ? prev + ' ' + transcript : transcript;
            }
            return prev;
          });
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error !== 'no-speech') {
            Alert.alert('Recognition Error', event.error);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        setRecognitionSupported(true);
      } else {
        setRecognitionSupported(false);
      }
    } else {
      // For mobile (Expo Go), we'll use audio recording
      checkAudioPermissions();
    }
  }, []);

  const checkAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setRecognitionSupported(false);
      }
    } catch (err) {
      console.error('Permission error:', err);
      setRecognitionSupported(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (Platform.OS === 'web' && recognitionRef.current) {
        // Web Speech API
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        // For mobile - start audio recording
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please allow microphone access to use voice input');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await recording.startAsync();
        
        recordingRef.current = recording;
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      Alert.alert('Error', 'Failed to start voice recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (Platform.OS === 'web' && recognitionRef.current) {
        recognitionRef.current.stop();
      } else if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        // IMPORTANT: Replace with your actual backend URL
        // For local testing: http://YOUR_COMPUTER_IP:3000/transcribe
        // Example: http://192.168.0.108:3000/transcribe
        const BACKEND_URL = 'http://192.168.0.108:3000/transcribe';

        Alert.alert(
          'Audio Recorded',
          `Audio saved at: ${uri}\n\nTo enable transcription:\n1. Set up the backend server (see guide)\n2. Update BACKEND_URL in the code\n\nFor now, would you like to add sample text?`,
          [
            {
              text: 'Add Sample Text',
              onPress: () => {
                const sampleTexts = [
                  'Hello world',
                  'How are you today',
                  'Thank you very much',
                  'Good morning',
                  'See you later',
                  'Nice to meet you',
                  'Have a great day'
                ];
                const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                setInputText(prev => prev ? prev + ' ' + randomText : randomText);
              }
            },
            {
              text: 'Try Transcription',
              onPress: async () => {
                try {
                  // Send audio to backend for transcription
                  const formData = new FormData();
                  formData.append('audio', {
                    uri: uri,
                    type: 'audio/m4a',
                    name: 'recording.m4a',
                  } as any);

                  const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    body: formData,
                  });

                  const data = await response.json();
                  
                  if (data.success && data.transcription) {
                    setInputText(prev => prev ? prev + ' ' + data.transcription : data.transcription);
                    Alert.alert('Success', 'Audio transcribed successfully!');
                  } else {
                    Alert.alert('Error', data.error || 'Failed to transcribe audio');
                  }
                } catch (error: any) {
                  console.error('Transcription error:', error);
                  Alert.alert(
                    'Connection Error', 
                    `Cannot reach backend server.\n\nMake sure:\n1. Backend is running\n2. URL is correct: ${BACKEND_URL}\n3. Phone and computer are on same WiFi\n\nError: ${error.message}`
                  );
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

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

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter words or sentences..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
        />
        
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording && styles.micButtonActive
          ]}
          onPress={toggleVoiceInput}
        >
          <Text style={styles.micButtonText}>
            {isRecording ? '⏹️' : '🎤'}
          </Text>
        </TouchableOpacity>
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingText}>
            🔴 {Platform.OS === 'web' ? 'Listening... Speak now!' : 'Recording... Tap stop when done'}
          </Text>
        </View>
      )}

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
          {/* Removed: videoTitle which showed the "hello" text above the video */}
          <Video
            ref={videoRef}
            source={{ uri: videos[currentVideoIndex].url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          {/* Removed: videoProgress which showed "Video X of X" */}
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
  inputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    paddingRight: 60,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 80,
  },
  micButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#dc3545',
  },
  micButtonText: {
    fontSize: 20,
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#b3d7ff',
  },
  infoText: {
    color: '#004085',
    fontSize: 13,
    textAlign: 'center',
  },
  recordingIndicator: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffc107',
    alignItems: 'center',
  },
  recordingText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
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