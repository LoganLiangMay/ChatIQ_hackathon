import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { hybridAgent } from '@/services/ai/HybridAgent';
import { AgentMessage } from '@/services/ai/agent/AIAgent';
import { useAuth } from '@/contexts/AuthContext';

export default function AIAssistantScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentMode, setAgentMode] = useState<'auto' | 'client' | 'server'>('auto');

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: input.trim(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get hybrid agent response (auto-routes between client/server)
      const response = await hybridAgent.generateResponse(
        userMessage.content,
        messages,
        {
          forceMode: agentMode === 'auto' ? undefined : agentMode,
          userId: user?.uid,
        }
      );

      // Add assistant message
      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: response.text,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Agent error:', error);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const renderMessage = ({ item, index }: { item: AgentMessage; index: number }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          index === messages.length - 1 && styles.lastMessage,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantIcon}>
            <Ionicons name="sparkles" size={16} color="#007AFF" />
          </View>
        )}
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>Ask me anything!</Text>
      <Text style={styles.emptySubtext}>
        I can summarize chats, find decisions, extract action items, and more.
      </Text>
      
      {/* Quick suggestions */}
      <View style={styles.suggestionsContainer}>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => handleSuggestion('What decisions were made recently?')}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.suggestionText}>Recent decisions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => handleSuggestion('What action items do I have?')}
        >
          <Ionicons name="list-outline" size={20} color="#007AFF" />
          <Text style={styles.suggestionText}>My action items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => handleSuggestion('Search for API discussions')}
        >
          <Ionicons name="search-outline" size={20} color="#007AFF" />
          <Text style={styles.suggestionText}>Search messages</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={28} color="#007AFF" />
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BETA</Text>
          </View>
        </View>

        {/* Messages */}
        {messages.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `msg-${index}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  suggestionsContainer: {
    gap: 12,
    width: '100%',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  suggestionText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingLeft: 16,
  },
  lastMessage: {
    marginBottom: 4,
  },
  assistantIcon: {
    position: 'absolute',
    left: -4,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFF',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#000',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

