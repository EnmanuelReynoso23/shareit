import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CameraControls = ({
  onCapture,
  onFlashToggle,
  onCameraSwitch,
  onGalleryOpen,
  flashMode,
  isRecording = false,
  disabled = false,
  captureAnimation,
  style,
}) => {
  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash-auto';
      default:
        return 'flash-off';
    }
  };

  const getCaptureButtonStyle = () => {
    if (isRecording) {
      return [styles.captureButton, styles.recordingButton];
    }
    return styles.captureButton;
  };

  const getCaptureInnerStyle = () => {
    if (isRecording) {
      return [styles.captureInner, styles.recordingInner];
    }
    return styles.captureInner;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Gallery Button */}
      <TouchableOpacity
        style={styles.sideButton}
        onPress={onGalleryOpen}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="images" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Capture Button */}
      <Animated.View style={{ transform: [{ scale: captureAnimation }] }}>
        <TouchableOpacity
          style={getCaptureButtonStyle()}
          onPress={onCapture}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View style={getCaptureInnerStyle()} />
        </TouchableOpacity>
      </Animated.View>

      {/* Controls Container */}
      <View style={styles.controlsContainer}>
        {/* Flash Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onFlashToggle}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name={getFlashIcon()} size={24} color="#fff" />
        </TouchableOpacity>

        {/* Camera Switch Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onCameraSwitch}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#ff4757',
    borderColor: 'rgba(255, 71, 87, 0.5)',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
  },
  recordingInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  controlsContainer: {
    width: 60,
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default CameraControls;
