import { useState, useCallback } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ChatInput from "@/components/chat/ChatInput";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  messages: Message[];
}

const Chat = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Primeira conversa",
      lastMessage: "Olá! Como posso ajudar?",
      timestamp: new Date(),
      messages: []
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const simulateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    // Simulação de resposta da IA
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      "Entendo sua pergunta! Deixe-me pensar em uma resposta útil para você.",
      "Essa é uma questão interessante. Vou fazer o meu melhor para te ajudar.",
      "Obrigado por perguntar! Aqui está o que eu penso sobre isso...",
      "Excelente pergunta! Vou explicar isso de forma clara e detalhada.",
      "Posso definitivamente te ajudar com isso. Vamos lá!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content,
      isUser: true,
      timestamp: new Date()
    };

    // Adiciona mensagem do usuário
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            messages: [...session.messages, userMessage],
            lastMessage: content,
            title: session.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : session.title
          }
        : session
    ));

    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(content);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: [...session.messages, assistantMessage],
              lastMessage: aiResponse
            }
          : session
      ));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível obter uma resposta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, simulateAIResponse, toast]);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nova conversa",
      timestamp: new Date(),
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        // Se não há mais sessões, cria uma nova
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: "Nova conversa",
          timestamp: new Date(),
          messages: []
        };
        setCurrentSessionId(newSession.id);
        return [newSession];
      }
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      
      return filtered;
    });

    toast({
      title: "Conversa excluída",
      description: "A conversa foi removida com sucesso."
    });
  }, [currentSessionId, toast]);

  return (
    <div className="h-screen flex bg-chat-background">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatArea
          messages={currentSession?.messages || []}
          isLoading={isLoading}
        />
        
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Aguardando resposta..." : "Digite sua mensagem..."}
        />
      </div>
    </div>
  );
};

export default Chat;