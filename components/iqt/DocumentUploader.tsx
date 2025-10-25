/**
 * DocumentUploader Component
 * Upload and embed documents into user's knowledge base
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  chunks: number;
  characters: number;
  uploadedAt: any;
  status: 'embedded' | 'error';
  error?: string;
}

export function DocumentUploader() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to user's uploaded documents
    const db = getFirestore();
    const docsQuery = query(
      collection(db, `users/${user.uid}/documents`),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(docsQuery, snapshot => {
      const docs: UploadedDocument[] = [];
      snapshot.forEach(doc => {
        docs.push({
          id: doc.id,
          ...doc.data()
        } as UploadedDocument);
      });
      setDocuments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUploadDocument = async () => {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.uri) {
        Alert.alert('Error', 'Failed to access document');
        return;
      }

      // Check file size (max 5MB)
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      setUploading(true);

      // Upload to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `docs/${user!.uid}/${Date.now()}_${asset.name}`
      );

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log('📄 File uploaded to Storage:', downloadURL);

      // Call embedDoc function
      const functions = getFunctions();
      const embedDoc = httpsCallable(functions, 'embedDoc');

      const embedResult = await embedDoc({
        fileUrl: downloadURL,
        userId: user!.uid,
        fileName: asset.name
      });

      console.log('✅ Document embedded:', embedResult.data);

      Alert.alert(
        'Success',
        `Document "${asset.name}" embedded successfully!\n` +
          `${(embedResult.data as any).chunks} chunks created.`
      );
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to upload and embed document'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${fileName}"? This will remove it from your knowledge base.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              await deleteDoc(doc(db, `users/${user!.uid}/documents`, docId));
              // Note: This only deletes the Firestore doc, not the Pinecone embeddings
              // A cloud function or background job should handle cleanup
            } catch (error) {
              console.error('Failed to delete document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  const renderDocument = ({ item }: { item: UploadedDocument }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentIcon}>
        <Ionicons
          name={item.status === 'embedded' ? 'document-text' : 'alert-circle'}
          size={24}
          color={item.status === 'embedded' ? '#007AFF' : '#FF3B30'}
        />
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.fileName}
        </Text>
        <Text style={styles.documentMeta}>
          {item.status === 'embedded'
            ? `${item.chunks} chunks • ${(item.characters / 1000).toFixed(1)}k chars`
            : `Error: ${item.error || 'Unknown error'}`}
        </Text>
        {item.uploadedAt && (
          <Text style={styles.documentDate}>
            {new Date(
              item.uploadedAt.toDate?.() || item.uploadedAt
            ).toLocaleDateString()}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteDocument(item.id, item.fileName)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleUploadDocument}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <ActivityIndicator color="#FFF" />
            <Text style={styles.uploadButtonText}>Uploading...</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color="#FFF" />
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
        <Text style={styles.infoText}>
          Upload text files or PDFs to expand your knowledge base. Maximum 5MB per file.
        </Text>
      </View>

      {/* Documents List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#007AFF" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No documents uploaded yet</Text>
          <Text style={styles.emptySubtext}>
            Upload documents to enhance your AI's knowledge base
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={item => item.id}
          style={styles.documentsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12
  },
  uploadButtonDisabled: {
    backgroundColor: '#C7C7CC'
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  },
  documentsList: {
    flex: 1
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  documentInfo: {
    flex: 1
  },
  documentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  documentDate: {
    fontSize: 11,
    color: '#999'
  },
  deleteButton: {
    padding: 8
  }
});
