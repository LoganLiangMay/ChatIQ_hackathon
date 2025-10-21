/**
 * Utility functions for formatting timestamps and other data
 */

/**
 * Format timestamp for message display
 * - Today: "2:34 PM"
 * - This week: "Mon", "Tue", etc.
 * - Older: "Dec 15"
 */
export function formatTimestamp(timestamp: number): string {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
  
  // Today - show time
  if (diffInHours < 24 && now.getDate() === messageDate.getDate()) {
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  }
  
  // This week - show day
  if (diffInHours < 168) {
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'short' 
    });
  }
  
  // Older - show date
  return messageDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format last seen timestamp
 * - "5 minutes ago"
 * - "Yesterday at 2:34 PM"
 * - etc.
 */
export function formatLastSeen(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days === 1) {
    const time = new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
    return `Yesterday at ${time}`;
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

/**
 * Get initials from display name
 * "John Doe" -> "JD"
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}




