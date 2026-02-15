import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignToText() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedText, setDetectedText] = useState("Waiting for sign...");
  const [confidence, setConfidence] = useState(0);
  const [serverIp, setServerIp] = useState(""); // Update with your laptop's IP
  const cameraRef = useRef<any>(null);
  const captureIntervalRef = useRef<any>(null);

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

  const captureAndPredict = async () => {
    if (!cameraRef.current) return;

    try {
      // Capture photo from camera (no shutter sound, not stored anywhere)
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true,
        exif: false,
      });

      // Send to backend
      const response = await fetch(`http://${serverIp}:5000/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: photo.base64,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setDetectedText(`Error: ${data.error}`);
        return;
      }

      // Update UI with prediction
      setDetectedText(data.character);
      setConfidence(data.confidence);
    } catch (error) {
      console.error("Prediction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setDetectedText(`Connection error: ${errorMessage}`);
    }
  };

  const startCapturing = () => {
    setIsCapturing(true);
    setDetectedText("Detecting...");

    // Capture and predict every 1 second
    captureIntervalRef.current = setInterval(() => {
      captureAndPredict();
    }, 1000);
  };

  const stopCapturing = () => {
    setIsCapturing(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setDetectedText("Stopped");
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`http://${serverIp}:5000/health`);
      const data = await response.json();
      Alert.alert(
        "Connection Test",
        `Status: ${data.status}\nModel Loaded: ${data.model_loaded ? "Yes" : "No"}`,
        [{ text: "OK" }],
      );
    } catch (error) {
      Alert.alert(
        "Connection Failed",
        `Cannot connect to server at ${serverIp}:5000\n\nMake sure:\n1. Backend is running\n2. Your phone and laptop are on same WiFi\n3. IP address is correct`,
        [{ text: "OK" }],
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign to Text</Text>

      {/* Server IP Configuration */}
      <View style={styles.configContainer}>
        <Text style={styles.label}>Server IP Address:</Text>
        <View style={styles.ipRow}>
          <TextInput
            style={styles.ipInput}
            value={serverIp}
            onChangeText={setServerIp}
            placeholder="192.168.1.100"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.testButton} onPress={testConnection}>
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        {isCapturing ? (
          <CameraView
            style={styles.camera}
            facing="front"
            ref={cameraRef}
            animateShutter={false}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📹</Text>
            <Text style={styles.placeholderSubtext}>
              Camera preview will appear here
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, isCapturing && styles.stopButton]}
        onPress={() => (isCapturing ? stopCapturing() : startCapturing())}
      >
        <Text style={styles.buttonText}>
          {isCapturing ? "Stop Capturing" : "Start Camera"}
        </Text>
      </TouchableOpacity>

      <View style={styles.textBox}>
        <Text style={styles.label}>Detected Sign:</Text>
        <Text
          style={[
            styles.detectedText,
            confidence > 0.5 ? styles.highConfidence : styles.lowConfidence,
          ]}
        >
          {detectedText}
        </Text>
        {confidence > 0 && (
          <Text style={styles.confidenceText}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 20,
    textAlign: "center",
  },
  configContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  ipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  testButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  testButtonText: {
    color: "white",
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#e9ecef",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 64,
  },
  placeholderSubtext: {
    color: "#6c757d",
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  textBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
    minHeight: 100,
  },
  label: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 5,
    fontWeight: "600",
  },
  detectedText: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 10,
  },
  highConfidence: {
    color: "#28a745",
  },
  lowConfidence: {
    color: "#6c757d",
  },
  confidenceText: {
    fontSize: 14,
    color: "#6c757d",
  },
  message: {
    fontSize: 16,
    color: "#212529",
    marginBottom: 20,
    textAlign: "center",
  },
});
