/**
 * ImageService
 * Handles image operations:
 * - Upload images to Firebase Storage
 * - Generate thumbnails
 * - Get download URLs
 * - Delete images
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as ImageManipulator from 'expo-image-manipulator';

const storage = getStorage();

class ImageService {
  /**
   * Upload an image to Firebase Storage
   * @param uri Local file URI
   * @param chatId Chat ID for organizing images
   * @returns Download URL
   */
  async uploadImage(uri: string, chatId: string): Promise<string> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Generate unique filename
      const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storagePath = `chats/${chatId}/images/${filename}`;
      
      // Compress image before upload
      const compressedUri = await this.compressImage(uri);
      
      // Convert URI to blob
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('✅ Image uploaded:', downloadURL);
      return downloadURL;
      
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }
  
  /**
   * Compress image to reduce file size
   * @param uri Local file URI
   * @returns Compressed image URI
   */
  async compressImage(uri: string): Promise<string> {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1200 } }, // Max width 1200px, maintains aspect ratio
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      return manipulatedImage.uri;
      
    } catch (error) {
      console.error('Failed to compress image:', error);
      // Return original URI if compression fails
      return uri;
    }
  }
  
  /**
   * Generate thumbnail for an image
   * @param uri Local file URI
   * @returns Thumbnail URI
   */
  async generateThumbnail(uri: string): Promise<string> {
    try {
      const thumbnail = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 200 } }, // Small thumbnail
        ],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      return thumbnail.uri;
      
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return uri;
    }
  }
  
  /**
   * Delete an image from Firebase Storage
   * @param imageUrl Download URL or storage path
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract storage path from URL
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      
      console.log('✅ Image deleted:', imageUrl);
      
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }
  
  /**
   * Get storage path from download URL
   * @param downloadURL Download URL from Firebase Storage
   * @returns Storage path
   */
  getStoragePathFromURL(downloadURL: string): string | null {
    try {
      const url = new URL(downloadURL);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      console.error('Failed to parse storage path:', error);
      return null;
    }
  }
  
  /**
   * Validate image file
   * @param uri Local file URI
   * @returns True if valid
   */
  async validateImage(uri: string): Promise<boolean> {
    try {
      // Check if file exists
      const response = await fetch(uri);
      if (!response.ok) {
        return false;
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Image validation failed:', error);
      return false;
    }
  }
}

export const imageService = new ImageService();




