/**
 * App Information Constants
 * Version, build number, and app metadata
 */

import Constants from 'expo-constants';

export const APP_INFO = {
  name: 'ChatIQ',
  version: '1.0.0',
  buildNumber: '1',
  environment: __DEV__ ? 'development' : 'production',
  
  // Expo info
  expoVersion: Constants.expoVersion,
  platform: Constants.platform,
  
  // Features
  features: {
    messaging: true,
    groupChat: true,
    imageMessages: true,
    voiceMessages: false, // Future
    videoMessages: false, // Future
    offlineSupport: true,
    notifications: true,
    search: true,
    typing: true,
    readReceipts: true,
    deliveryReceipts: true,
    onlineStatus: true,
  },
  
  // Support
  supportEmail: 'support@chatiq.com',
  privacyPolicyUrl: 'https://chatiq.com/privacy',
  termsOfServiceUrl: 'https://chatiq.com/terms',
  
  // API
  apiVersion: 'v1',
  minServerVersion: '1.0.0',
};

/**
 * Get full version string
 */
export function getVersionString(): string {
  return `${APP_INFO.version} (${APP_INFO.buildNumber})`;
}

/**
 * Get app info for debug/support
 */
export function getDebugInfo(): string {
  return `
ChatIQ Debug Info
=================
Version: ${getVersionString()}
Environment: ${APP_INFO.environment}
Expo SDK: ${APP_INFO.expoVersion}
Platform: ${Constants.platform?.os} ${Constants.platform?.osVersion}
Device: ${Constants.deviceName}
  `.trim();
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof APP_INFO.features): boolean {
  return APP_INFO.features[feature];
}

