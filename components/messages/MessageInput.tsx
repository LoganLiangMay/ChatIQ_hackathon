/**
 * MessageInput component
 * Text input with send button for composing messages
 */

import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { mediumHaptic, successHaptic, errorHaptic } from '@/utils/haptics';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendImage?: (imageUri: string) => Promise<void>;
  disabled?: boolean;
  sending?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInput({ 
  onSendMessage,
  onSendImage,
  disabled = false, 
  sending = false,
  onTypingStart,
  onTypingStop 
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // Call typing callbacks
    if (newText.length > 0 && text.length === 0) {
      // User started typing (first character)
      onTypingStart?.();
    } else if (newText.length === 0 && text.length > 0) {
      // User cleared input
      onTypingStop?.();
    } else if (newText.length > 0) {
      // User is still typing
      onTypingStart?.();
    }
  };
  
  const handleSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || sending) return;
    
    // Haptic feedback on tap
    mediumHaptic();
    
    try {
      await onSendMessage(trimmedText);
      setText(''); // Clear input after send
      onTypingStop?.(); // Stop typing indicator when message sent
      successHaptic(); // Success feedback
    } catch (error) {
      console.error('Failed to send message:', error);
      errorHaptic(); // Error feedback
      // Keep text in input so user can retry
    }
  };
  
  const handleImagePicker = () => {
    Alert.alert(
      'Choose Image',
      'Select image source',
      [
        {
          text: 'Camera',
          onPress: pickFromCamera,
        },
        {
          text: 'Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };
  
  const pickFromCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        await handleImageSelected(result.assets[0].uri);
      }
      
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };
  
  const pickFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos');
        return;
      }
      
      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        await handleImageSelected(result.assets[0].uri);
      }
      
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };
  
  const handleImageSelected = async (uri: string) => {
    if (!onSendImage) return;
    
    setUploadingImage(true);
    mediumHaptic(); // Feedback when starting upload
    
    try {
      await onSendImage(uri);
      successHaptic(); // Success feedback
    } catch (error) {
      console.error('Failed to send image:', error);
      errorHaptic(); // Error feedback
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        {/* Image button */}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleImagePicker}
          disabled={disabled || sending || uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="image-outline" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!disabled && !sending && !uploadingImage}
          returnKeyType="default"
          blurOnSubmit={false}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || sending || uploadingImage) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending || uploadingImage}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6, // Minimal padding for compact keyboard layout
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

