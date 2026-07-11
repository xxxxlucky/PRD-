import React from 'react';
import type { ChatMessage } from '../../../shared/types';
import { ReportPreview } from './ReportPreview';

interface Props {
  message: ChatMessage;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
        isUser
          ? 'bg-blue-500 text-white rounded-br-sm'
          : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReportPreview markdown={message.content} isStreaming={message.isStreaming} />
        )}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
};
