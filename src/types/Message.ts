/**
 * The message type for Chrome extension messaging.
 */
export enum MessageAction {
  PING = 'PING',
  COLOR_SCHEME_CHANGED = 'COLOR_SCHEME_CHANGED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  EXTRACT_CONTENT_START = 'EXTRACT_CONTENT_START',
  EXTRACT_CONTENT_COMPLETE = 'EXTRACT_CONTENT_COMPLETE',
  SUMMARIZE_CONTENT_START = 'SUMMARIZE_CONTENT_START',
  SUMMARIZE_CONTENT_COMPLETE = 'SUMMARIZE_CONTENT_COMPLETE',
  COPY_ARTICLE_TO_CLIPBOARD = 'COPY_ARTICLE_TO_CLIPBOARD',
  TAB_UPDATED = 'TAB_UPDATED',
}

/**
 * The message interface for Chrome extension messaging.
 *
 * @property type - The type of the message.
 * @property payload - The payload of the message.
 */
export type Message<T = any> = {
  action: MessageAction;
  payload?: T;
};

/**
 * The message response interface for Chrome extension messaging.
 *
 * @property success - Whether the message was processed successfully.
 * @property data - The response data.
 * @property error - The error message if the message processing failed.
 */
export type MessageResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};
