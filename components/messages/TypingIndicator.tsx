/**
 * TypingIndicator Component
 * Shows animated "..." when someone is typing
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  userName?: string; // For direct chats
  typingUsers?: string[]; // For group chats
  isGroup?: boolean;
}

export function TypingIndicator({ userName, typingUsers = [], isGroup = false }: TypingIndicatorProps) {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Animated typing dots
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    const animation1 = animateDot(dot1, 0);
    const animation2 = animateDot(dot2, 133);
    const animation3 = animateDot(dot3, 266);
    
    animation1.start();
    animation2.start();
    animation3.start();
    
    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);
  
  const getText = () => {
    if (isGroup && typingUsers.length > 0) {
      if (typingUsers.length === 1) {
        return `${typingUsers[0]} is typing`;
      } else if (typingUsers.length === 2) {
        return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
      } else {
        return `${typingUsers.length} people are typing`;
      }
    }
    
    return userName ? `${userName} is typing` : 'Typing';
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{getText()}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot3,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
  },
});




