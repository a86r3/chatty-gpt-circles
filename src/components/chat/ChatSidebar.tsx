import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  Trash2,
  Edit,
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

const ChatSidebar = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession 
}: ChatSidebarProps) => {
  return (
    <div className="w-64 h-full bg-chat-sidebar border-r flex flex-col shadow-chat">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewChat}
          className="w-full bg-gradient-primary hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Chat Sessions */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-muted/50",
                currentSessionId === session.id && "bg-muted"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">
                    {session.title}
                  </h3>
                  {session.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {session.lastMessage}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {session.timestamp.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {onDeleteSession && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;