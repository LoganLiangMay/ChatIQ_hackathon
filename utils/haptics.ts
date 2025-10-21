/**
 * Haptic Feedback Utility
 * Provides tactile feedback for user interactions
 */

import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback (e.g., button taps, selection changes)
 */
export function lightHaptic() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics may not be available on all devices
    console.log('Haptics not available:', error);
  }
}

/**
 * Medium haptic feedback (e.g., sending messages, completing actions)
 */
export function mediumHaptic() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}

/**
 * Heavy haptic feedback (e.g., errors, important notifications)
 */
export function heavyHaptic() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}

/**
 * Success notification haptic
 */
export function successHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}

/**
 * Warning notification haptic
 */
export function warningHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}

/**
 * Error notification haptic
 */
export function errorHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}

/**
 * Selection changed haptic (e.g., scrolling through options)
 */
export function selectionHaptic() {
  try {
    Haptics.selectionAsync();
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}

