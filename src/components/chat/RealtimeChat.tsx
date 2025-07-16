import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Settings, 
  Send,
  Circle,
  Phone,
  PhoneOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpenAIRealtime } from "@/hooks/useOpenAIRealtime";

const RealtimeChat = () => {
  const API_KEY = "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";
  
  const [inputText, setInputText] = useState("");
  const [showEvents, setShowEvents] = useState(true);
  const eventsScrollRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    isRecording,
    currentTranscription,
    events,
    connectRealtime,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage
  } = useOpenAIRealtime({
    apiKey: API_KEY,
    onEvent: (event) => {
      console.log('Realtime event:', event);
    }
  });

  // Auto scroll events
  useEffect(() => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = eventsScrollRef.current.scrollHeight;
    }
  }, [events]);

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connectRealtime();
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleTextSubmit = useCallback(() => {
    if (inputText.trim()) {
      sendTextMessage(inputText);
      setInputText("");
    }
  }, [inputText, sendTextMessage]);

  const getEventColor = (eventType: string) => {
    if (eventType.includes('connection')) return 'bg-blue-100 text-blue-800';
    if (eventType.includes('recording') || eventType.includes('speech')) return 'bg-purple-100 text-purple-800';
    if (eventType.includes('transcription')) return 'bg-green-100 text-green-800';
    if (eventType.includes('response') || eventType.includes('text')) return 'bg-orange-100 text-orange-800';
    if (eventType.includes('audio')) return 'bg-pink-100 text-pink-800';
    if (eventType.includes('error')) return 'bg-red-100 text-red-800';
    if (eventType.includes('session')) return 'bg-gray-100 text-gray-800';
    if (eventType.includes('realtime')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="h-screen bg-gradient-to-b from-background to-muted flex">
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
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {isConnected ? (
                    <>
                      <PhoneOff className="h-5 w-5 mr-2" />
                      Desconectar Realtime
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5 mr-2" />
                      Conectar Realtime
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                {isConnected 
                  ? "Conectado ao OpenAI Realtime API - Pronto para conversar!" 
                  : "Clique para conectar ao OpenAI Realtime API"
                }
              </p>
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
                      className={cn(
                        "h-20 w-20 rounded-full transition-all duration-200",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" 
                          : "bg-primary hover:bg-primary/90 hover:scale-105"
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
                        ? "🔴 Gravando em tempo real... Solte para parar" 
                        : "Pressione e segure para falar"
                      }
                    </p>
                    <p className="text-xs">
                      Audio streaming em tempo real para OpenAI
                    </p>
                  </div>

                  {currentTranscription && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Transcrição em tempo real:</p>
                      <p className="text-green-700 mt-1">"{currentTranscription}"</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Text Input Alternative */}
            {isConnected && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Ou digite sua mensagem</h3>
                <div className="flex gap-2">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleTextSubmit}
                    disabled={!inputText.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
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
              <h2 className="font-medium">Eventos Realtime</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {events.length} eventos • Streaming em tempo real
              </p>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={eventsScrollRef}>
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={cn("text-xs", getEventColor(event.type))}
                        variant="secondary"
                      >
                        {event.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {event.timestamp}
                      </span>
                    </div>
                    
                    {/* Show transcription if available */}
                    {event.data?.transcript && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-green-900">
                        <strong>Transcrição:</strong> {event.data.transcript}
                      </div>
                    )}
                    
                    {/* Show text delta if available */}
                    {event.data?.delta && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-orange-900">
                        <strong>Resposta:</strong> {event.data.delta}
                      </div>
                    )}

                    {/* Show error if available */}
                    {event.data?.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-red-900">
                        <strong>Erro:</strong> {event.data.error.message || 'Erro desconhecido'}
                      </div>
                    )}
                    
                    <details className="mt-2">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver dados técnicos
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
                
                {events.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aguardando eventos</p>
                    <p className="text-xs mt-1">Conecte-se ao Realtime API para ver eventos em tempo real</p>
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