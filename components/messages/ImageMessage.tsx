/**
 * ImageMessage Component
 * Displays image messages in chat with:
 * - Loading indicator
 * - Error handling
 * - Tap to view full size
 */

import { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageMessageProps {
  imageUrl: string;
  onPress: () => void;
}

export function ImageMessage({ imageUrl, onPress }: ImageMessageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 200, height: 150 });
  
  const handleLoad = () => {
    setLoading(false);
    
    // Get actual dimensions
    Image.getSize(
      imageUrl,
      (width, height) => {
        // Calculate display dimensions (max 200px width)
        const maxWidth = 200;
        const ratio = Math.min(maxWidth / width, 1);
        setDimensions({
          width: width * ratio,
          height: height * ratio,
        });
      },
      (error) => {
        console.error('Failed to get image size:', error);
      }
    );
  };
  
  const handleError = () => {
    setLoading(false);
    setError(true);
  };
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="image-outline" size={40} color="#999" />
        <Text style={styles.errorText}>Failed to load image</Text>
      </View>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      {loading && (
        <View style={[styles.loadingContainer, { width: dimensions.width, height: dimensions.height }]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: dimensions.width,
            height: dimensions.height,
          },
        ]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />
      
      {/* Overlay icon to indicate tap to view */}
      {!loading && !error && (
        <View style={styles.overlay}>
          <Ionicons name="expand-outline" size={20} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: 200,
    height: 150,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});




