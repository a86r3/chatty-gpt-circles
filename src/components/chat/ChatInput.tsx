import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Digite sua mensagem..." 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-chat-sidebar/50 backdrop-blur-sm">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[60px] max-h-[120px] resize-none pr-12 rounded-2xl border-2 transition-all duration-200",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              "placeholder:text-muted-foreground/60"
            )}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="sm"
            className={cn(
              "absolute right-2 bottom-2 h-8 w-8 rounded-full bg-gradient-primary",
              "hover:shadow-lg hover:scale-105 transition-all duration-200",
              "disabled:opacity-50 disabled:hover:scale-100"
            )}
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;