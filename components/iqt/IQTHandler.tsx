/**
 * IQTHandler Component
 * Global handler for IQT Mode - monitors messages and shows response previews
 */

import React, { useState } from 'react';
import { useIQTListener } from '@/hooks/useIQTListener';
import { ResponsePreviewModal } from './ResponsePreviewModal';
import { MessageService } from '@/services/messages/MessageService';

const messageService = MessageService.getInstance();

export function IQTHandler() {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>(null);

  const { isEnabled, settings, pendingResponse, clearPendingResponse } = useIQTListener(
    (response) => {
      console.log('🎯 IQT: Response ready for user', {
        chatId: response.chatId,
        confidence: response.response.confidence,
        autoSend: settings?.autoSend
      });

      // If auto-send is enabled and confidence is high, send immediately
      if (settings?.autoSend && response.response.confidence >= 0.8) {
        handleAutoSend(response);
      } else {
        // Otherwise, show the preview modal
        setCurrentResponse(response);
        setModalVisible(true);
      }
    }
  );

  const handleAutoSend = async (response: any) => {
    try {
      console.log('📤 IQT: Auto-sending response to chat', response.chatId);

      await messageService.sendMessage(
        response.chatId,
        response.response.responseText,
        'text'
      );

      console.log('✅ IQT: Response sent automatically');
    } catch (error) {
      console.error('Failed to auto-send IQT response:', error);
    }
  };

  const handleSend = async (text: string) => {
    if (!currentResponse) return;

    try {
      await messageService.sendMessage(
        currentResponse.chatId,
        text,
        'text'
      );

      console.log('✅ IQT: Response sent by user');
    } catch (error) {
      console.error('Failed to send IQT response:', error);
      throw error;
    }
  };

  const handleIgnore = () => {
    console.log('🚫 IQT: User ignored response');
    setModalVisible(false);
    setCurrentResponse(null);
    clearPendingResponse();
  };

  const handleClose = () => {
    setModalVisible(false);
    setCurrentResponse(null);
    clearPendingResponse();
  };

  // Don't render anything if IQT is disabled or no response
  if (!isEnabled || !currentResponse) {
    return null;
  }

  return (
    <ResponsePreviewModal
      visible={modalVisible}
      responseText={currentResponse.response.responseText || ''}
      confidence={currentResponse.response.confidence}
      sources={currentResponse.response.sources}
      reason={currentResponse.response.reason}
      chatId={currentResponse.chatId}
      onSend={handleSend}
      onIgnore={handleIgnore}
      onClose={handleClose}
    />
  );
}
