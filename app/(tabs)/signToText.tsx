import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SignToText() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign to Text</Text>
      
      <View style={styles.cameraContainer}>
        {isCapturing ? (
          <CameraView style={styles.camera} facing="front" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📹</Text>
            <Text style={styles.placeholderSubtext}>Camera preview will appear here</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, isCapturing && styles.stopButton]}
        onPress={() => setIsCapturing(!isCapturing)}
      >
        <Text style={styles.buttonText}>
          {isCapturing ? 'Stop Capturing' : 'Start Camera'}
        </Text>
      </TouchableOpacity>

      <View style={styles.textBox}>
        <Text style={styles.label}>Detected Text:</Text>
        <Text style={styles.detectedText}>
          [Motion capture active - Backend integration pending]
        </Text>
      </View>
    </View>
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
  cameraContainer: {
    flex: 1,
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  placeholderSubtext: {
    color: '#6c757d',
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  textBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 80,
  },
  label: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
    fontWeight: '600',
  },
  detectedText: {
    fontSize: 16,
    color: '#212529',
  },
  message: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
});