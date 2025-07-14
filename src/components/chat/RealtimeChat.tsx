import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Settings, 
  Phone, 
  PhoneOff,
  Circle,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";

const RealtimeChat = () => {
  const API_KEY = "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";
  
  const {
    connectConversation,
    disconnectConversation,
    startRecording,
    stopRecording,
    canPushToTalk,
    isRecording,
    isConnected,
    realtimeEvents,
    items
  } = useRealtime(API_KEY);

  const [showEvents, setShowEvents] = useState(true);
  const eventsScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll events
  useEffect(() => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = eventsScrollRef.current.scrollHeight;
    }
  }, [realtimeEvents]);

  const handleConnect = async () => {
    if (isConnected) {
      disconnectConversation();
    } else {
      await connectConversation();
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatEvent = (event: any) => {
    const { type, ...data } = event;
    return { type, data };
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('input')) return 'bg-blue-100 text-blue-800';
    if (eventType.includes('response')) return 'bg-green-100 text-green-800';
    if (eventType.includes('conversation')) return 'bg-purple-100 text-purple-800';
    if (eventType.includes('session')) return 'bg-gray-100 text-gray-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="h-screen bg-gradient-background flex">
      {/* Main Console */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-chat-sidebar border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">OpenAI Realtime Console</h1>
              <div className="flex items-center gap-2">
                <Circle className={cn(
                  "h-3 w-3",
                  isConnected ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEvents(!showEvents)}
              >
                {showEvents ? "Ocultar" : "Mostrar"} Eventos
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Console Area */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Connection Controls */}
            <Card className="p-6">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={handleConnect}
                  className={cn(
                    "h-12 px-8",
                    isConnected 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-gradient-primary"
                  )}
                >
                  {isConnected ? (
                    <>
                      <PhoneOff className="h-5 w-5 mr-2" />
                      Desconectar
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5 mr-2" />
                      Conectar
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Voice Controls */}
            {isConnected && (
              <Card className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">Controle de Voz</h3>
                  
                  <div className="flex justify-center">
                    <Button
                      onMouseDown={handleToggleRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={handleToggleRecording}
                      onTouchEnd={stopRecording}
                      disabled={!canPushToTalk}
                      className={cn(
                        "h-20 w-20 rounded-full transition-all duration-200",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" 
                          : "bg-gradient-primary hover:scale-105"
                      )}
                    >
                      {isRecording ? (
                        <MicOff className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {isRecording 
                        ? "🔴 Gravando... Solte para parar" 
                        : "Pressione e segure para falar"
                      }
                    </p>
                    <p className="text-xs">
                      Push-to-talk ativado
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Conversation Items */}
            {items.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Conversa</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.role || 'system'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.type || 'unknown'}
                          </Badge>
                        </div>
                        {item.formatted && (
                          <div className="text-sm">
                            {item.formatted.transcript || item.formatted.text || 'Processando...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Events Panel */}
      {showEvents && (
        <>
          <Separator orientation="vertical" />
          <div className="w-96 bg-chat-sidebar border-l flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-medium">Eventos em Tempo Real</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {realtimeEvents.length} eventos
              </p>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={eventsScrollRef}>
              <div className="space-y-2">
                {realtimeEvents.map((event, index) => {
                  const formatted = formatEvent(event);
                  return (
                    <div key={index} className="p-3 rounded-lg bg-muted/30 text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          className={cn("text-xs", getEventColor(formatted.type))}
                          variant="secondary"
                        >
                          {formatted.type}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* Show transcription if available */}
                      {event.transcript && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-900">
                          <strong>Transcrição:</strong> {event.transcript}
                        </div>
                      )}
                      
                      {/* Show response text if available */}
                      {event.delta && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-green-900">
                          <strong>Resposta:</strong> {event.delta}
                        </div>
                      )}
                      
                      <details className="mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver dados
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(formatted.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })}
                
                {realtimeEvents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum evento ainda</p>
                    <p className="text-xs mt-1">Conecte-se para ver eventos em tempo real</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};

export default RealtimeChat;