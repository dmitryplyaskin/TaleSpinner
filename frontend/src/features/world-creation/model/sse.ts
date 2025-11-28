/**
 * SSE (Server-Sent Events) поддержка для world generation streaming
 */

import { getGenerationStreamUrl } from '../api';
import type { StreamEvent } from './types';
import { setClarificationRequest, updateProgress, setError } from './events';

export function startGenerationStream(sessionId: string) {
  const url = getGenerationStreamUrl(sessionId);
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data: StreamEvent = JSON.parse(event.data);

      // Обработка разных типов событий
      if (data.type === 'done') {
        eventSource.close();
        return;
      }

      if (data.type === 'error') {
        setError(data.error || 'Unknown error occurred');
        eventSource.close();
        return;
      }

      // Обработка узлов генерации
      if (data.node) {
        switch (data.status) {
          case 'started':
            // Можно добавить индикацию начала
            break;

          case 'completed':
            // Обновление прогресса
            if (data.data) {
              updateProgress(data.data);
            }
            break;

          case 'waiting_for_input':
            // HITL - нужен ответ пользователя
            if (data.clarification) {
              setClarificationRequest(data.clarification);
            }
            eventSource.close();
            break;

          case 'error':
            setError(`Error in node ${data.node}`);
            eventSource.close();
            break;
        }
      }
    } catch (error) {
      console.error('Failed to parse SSE event:', error);
      setError('Failed to parse server event');
      eventSource.close();
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    setError('Connection to server lost');
    eventSource.close();
  };

  return eventSource;
}
