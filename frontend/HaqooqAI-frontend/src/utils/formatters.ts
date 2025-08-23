import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format a date for display in conversation list
 */
export const formatConversationDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  // If within the last week, show day name
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return format(date, 'EEEE');
  }
  
  // Otherwise show date
  return format(date, 'MMM d');
};

/**
 * Format a date for message timestamps
 */
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Format quota information for display
 */
export const formatQuotaText = (remaining: number, _limit: number): string => {
  if (remaining === 0) {
    return 'No queries remaining';
  }
  
  if (remaining === 1) {
    return '1 query remaining';
  }
  
  return `${remaining} queries remaining`;
};

/**
 * Format quota reset time
 */
export const formatQuotaResetTime = (resetAt: string): string => {
  const resetDate = new Date(resetAt);
  return formatDistanceToNow(resetDate, { addSuffix: true });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate conversation title from first message
 */
export const generateConversationTitle = (firstMessage: string): string => {
  const maxLength = 50;
  const cleaned = firstMessage.trim().replace(/\n+/g, ' ');
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Try to break at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.7) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};
