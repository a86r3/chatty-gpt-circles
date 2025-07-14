import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  isLoading?: boolean;
}

const ChatMessage = ({ message, isUser, timestamp, isLoading = false }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex gap-3 p-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 bg-muted">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3 shadow-message",
          isUser
            ? "bg-gradient-message text-chat-message-user-text animate-slide-in-right"
            : "bg-chat-message-assistant text-chat-message-assistant-text animate-slide-in-left",
          isLoading && "opacity-70"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="animate-pulse">Digitando</span>
              <span className="flex">
                <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s] ml-1"></span>
                <span className="w-1 h-1 bg-current rounded-full animate-bounce ml-1"></span>
              </span>
            </span>
          ) : (
            message
          )}
        </p>
        {timestamp && !isLoading && (
          <p className="text-xs opacity-60 mt-1">
            {timestamp.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;