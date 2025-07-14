import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
}

const ChatArea = ({ messages, isLoading = false }: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 bg-gradient-background">
      <ScrollArea className="h-full" ref={scrollRef}>
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center space-y-4 p-8">
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Olá! Como posso ajudar?
                  </h2>
                  <p className="text-muted-foreground">
                    Digite sua pergunta abaixo e vamos conversar!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.content}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
              {isLoading && (
                <ChatMessage
                  message=""
                  isUser={false}
                  isLoading={true}
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatArea;