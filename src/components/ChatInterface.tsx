import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, StopCircle, Bot, Zap } from 'lucide-react';
import MessageBubble, { Message } from '@/components/MessageBubble';
import ParameterControls, { AIParameters, defaultParameters } from '@/components/ParameterControls';
import { generateChatResponse } from '@/services/aiService';
import { enhanceQueryWithEmbeddings } from '@/services/embeddingService';
import { toast } from "@/hooks/use-toast";
import EmbeddingDatasetManager from '@/components/EmbeddingDatasetManager';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  initialSystemPrompt?: string;
  className?: string;
}

const defaultSystemPrompt = `#角色名称：Danny数字分身

#风格特点：
1. 保持礼貌和耐心。
2. 确保信息的准确性。

#能力限制：
1. 专注于恒盛和芯烨桌面条码打印机的故障排查和FAQ问题回答。
2. 无法处理其他品牌或类型的打印机问题。
3. 只能结合知识库的内容得出回复，不允许调用其他知识源得出回复。如果结合知识库内容无法得出回复，请统一回复："😫针对您这个问题，我暂时还无法进行回答，请联系技术支持或技术支持主管反馈问题。🤞"

能够达成以下用户意图
##意图名称：软件故障排查
##意图描述：用户咨询恒盛或芯烨桌面条码打印机的软件问题
##意图示例："恒盛桌面条码打印机软件故障"
##意图实现：从恒盛或芯烨条码打印机知识库中检索相关信息，提供解决方案。

##意图名称：硬件故障排查
##意图描述：用户咨询恒盛或芯烨桌面条码打印机的硬件问题
##意图示例："芯烨桌面条码打印机紫灯常亮"
##意图实现：从恒盛或芯烨条码打印机知识库中检索相关信息，提供故障排除方法。

##意图名称：FAQ问题回答
##意图描述：回复客户咨询恒盛或芯烨桌面条码打印机的常见问题
##意图示例："恒盛条码打印机纸张卡住"
##意图实现：从恒盛或芯烨条码打印机知识库中检索相关信息，提供解答。`;

const ChatInterface = ({ 
  initialSystemPrompt = defaultSystemPrompt,
  className 
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parameters, setParameters] = useState<AIParameters>(defaultParameters);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>('default'); // Default dataset selected
  const [showDatasetManager, setShowDatasetManager] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 删除这两个自动滚动的 useEffect
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);
  // useEffect(() => {
  //   const scrollElement = messagesEndRef.current;
  //   if (scrollElement && isLoading) {
  //     const scrollOptions = {
  //       behavior: 'auto' as ScrollBehavior,
  //       block: 'end' as ScrollLogicalPosition
  //     };
  //     scrollElement.scrollIntoView(scrollOptions);
  //   }
  // }, [messages, isLoading]);
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setStreamedResponse('');
      
      // 这里调用 enhanceQueryWithEmbeddings 来搜索向量数据库
      const enhancedQuery = await enhanceQueryWithEmbeddings(input, parameters, selectedDatasetId);
      
      // 使用增强后的查询内容发送给 AI
      const messagesForApi = [...messages, {
        ...userMessage,
        content: enhancedQuery  // 这里使用增强后的查询，而不是原始输入
      }];
      
      await generateChatResponse(
        messagesForApi,
        parameters,
        abortControllerRef.current.signal,
        (content) => {
          setStreamedResponse(content);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content } 
              : msg
          ));
        }
      );
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message !== 'Request was aborted') {
          toast({
            variant: "destructive",
            title: "Error getting response",
            description: error.message || "Something went wrong"
          });
        }
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn('flex flex-col w-full h-full', className)}>
      <Card className="flex flex-col h-full border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-secondary/40 px-6 py-3 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-medium">Danny数字分身</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDatasetManager(!showDatasetManager)}
              className="text-xs h-8"
            >
              {showDatasetManager ? 'Hide Datasets' : 'Manage Datasets'}
            </Button>
            
            <ParameterControls 
              parameters={parameters}
              onChange={setParameters}
            />
          </div>
        </div>
        
        {showDatasetManager && (
          <div className="p-4 border-b bg-background/50">
            <EmbeddingDatasetManager 
              onSelectDataset={setSelectedDatasetId}
              selectedDatasetId={selectedDatasetId}
            />
          </div>
        )}
        
        <CardContent className="flex-grow p-0 flex flex-col">
          <ScrollArea className="flex-grow px-2 py-4">
            <div className="space-y-1 pb-4 min-h-[400px]"> {/* 添加最小高度 */}
              {messages.length === 1 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Danny数字分身</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    请随时向我提问关于恒盛或芯烨桌面条码打印机的问题，我会尽力提供帮助。
                  </p>
                </div>
              )}
              
              {messages.filter(m => m.role !== 'system').map((message, index, filteredArr) => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  isLastMessage={index === filteredArr.length - 1}
                />
              ))}
              <div className="h-4" /> {/* 添加底部间距 */}
            </div>
            <div ref={messagesEndRef} className="h-px" /> {/* 添加固定高度 */}
          </ScrollArea>
          
          <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入您关于恒盛或芯烨桌面条码打印机的问题..."
                className="w-full pr-24 resize-none min-h-[60px] max-h-[180px] bg-card border-input"
                disabled={isLoading}
                rows={1}
              />
              <div className="absolute right-2 bottom-1 flex gap-2">
                {isLoading ? (
                  <Button 
                    onClick={handleStopResponse}
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSendMessage}
                    variant="default" 
                    size="icon" 
                    disabled={!input.trim()}
                    className="h-8 w-8"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground text-center flex justify-center items-center gap-2">
              <span>Model: DeepSeek-V3 • Embeddings: BGE-M3</span>
              {selectedDatasetId && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
                  知识库: {selectedDatasetId}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;