
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
}

const MessageBubble = ({ message, isLastMessage = false }: MessageBubbleProps) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  const isUser = message.role === 'user';
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (isLastMessage && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isLastMessage, message.content]);

  return (
    <div
      ref={bubbleRef}
      className={cn(
        'w-full max-w-3xl mx-auto p-4 mb-3 flex flex-col animate-slide-in',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div className="flex items-center gap-2 mb-1 px-2">
        <div className={cn(
          'text-xs font-medium text-muted-foreground',
          isUser ? 'order-2' : 'order-1'
        )}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className={cn(
          'text-xs text-muted-foreground/60',
          isUser ? 'order-1' : 'order-2'
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      <div
        className={cn(
          'rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 max-w-[80%] break-words',
          isUser 
            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
            : 'bg-secondary text-secondary-foreground rounded-tl-sm'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};

export default MessageBubble;
