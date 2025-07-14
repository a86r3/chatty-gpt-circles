import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Play,
  Pause,
  Volume2,
  Phone,
  PhoneOff,
  Settings,
  X,
  Eye,
  EyeOff,
  Mic,
  MicOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpenAIRealtime } from "@/hooks/useOpenAIRealtime";

// Componente do Visualizador JARVIS
const JarvisVisualizer = ({ isRecording, isConnected, audioLevel }: { 
  isRecording: boolean; 
  isConnected: boolean; 
  audioLevel: number; 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef(Array.from({ length: 32 }, () => Math.random() * 0.5));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Background circle
      ctx.strokeStyle = isConnected ? '#00ff88' : '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 10, 0, Math.PI * 2);
      ctx.stroke();

      // Audio bars in circle
      const bars = barsRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      bars.forEach((bar, i) => {
        const angle = (i / bars.length) * Math.PI * 2;
        const intensity = isRecording ? (bar + audioLevel) : bar * 0.3;
        
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * (radius + intensity * 60);
        const endY = centerY + Math.sin(angle) * (radius + intensity * 60);

        ctx.strokeStyle = isRecording ? '#00ff88' : (isConnected ? '#0088ff' : '#444');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Animate bars
        bars[i] += (Math.random() - 0.5) * 0.1;
        bars[i] = Math.max(0.1, Math.min(1, bars[i]));
      });

      // Center glow
      if (isConnected) {
        const glowSize = isRecording ? 20 + audioLevel * 30 : 15;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
        gradient.addColorStop(0, isRecording ? 'rgba(0, 255, 136, 0.8)' : 'rgba(0, 136, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isConnected, audioLevel]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="w-full h-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          "w-4 h-4 rounded-full transition-all duration-300",
          isConnected ? (isRecording ? "bg-green-500 animate-pulse" : "bg-blue-500") : "bg-gray-500"
        )} />
      </div>
    </div>
  );
};

const RealtimeConsole = () => {
  const API_KEY = "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";
  
  const [vadMode, setVadMode] = useState(true);
  const [showLogs, setShowLogs] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
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
  } = useOpenAIRealtime({
    apiKey: API_KEY,
    onEvent: (event) => {
      console.log('Realtime event:', event);
      // Simular nível de áudio baseado nos eventos
      if (event.type.includes('audio')) {
        setAudioLevel(Math.random() * 0.8 + 0.2);
        setTimeout(() => setAudioLevel(0), 100);
      }
    }
  });

  // Auto scroll events
  useEffect(() => {
    if (eventsScrollRef.current && showLogs) {
      eventsScrollRef.current.scrollTop = eventsScrollRef.current.scrollHeight;
    }
  }, [events, showLogs]);

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connectRealtime();
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('client') || eventType.includes('input_audio_buffer.append')) {
      return '↑';
    }
    if (eventType.includes('server') || eventType.includes('response') || eventType.includes('conversation')) {
      return '↓';
    }
    return '•';
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('client') || eventType.includes('input_audio_buffer.append')) {
      return 'text-blue-600';
    }
    if (eventType.includes('server') || eventType.includes('response') || eventType.includes('conversation')) {
      return 'text-green-600';
    }
    if (eventType.includes('error')) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const formatEventType = (type: string) => {
    return type.replace('realtime.', '');
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary/20" />
            </div>
            <h1 className="text-lg font-medium">JARVIS Realtime Console</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Show Logs</span>
              <Switch checked={showLogs} onCheckedChange={setShowLogs} />
              {showLogs ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </div>
            <span>api key: sk-...</span>
            <Settings className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Visualizador JARVIS Central */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30">
          <div className="w-80 h-80 mb-8">
            <JarvisVisualizer 
              isRecording={isRecording} 
              isConnected={isConnected} 
              audioLevel={audioLevel} 
            />
          </div>
          
          {/* Status e Transcrição */}
          <div className="text-center space-y-4 max-w-2xl px-8">
            <div className="flex items-center justify-center gap-2 text-lg">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className={cn(
                "font-medium",
                isConnected ? "text-green-600" : "text-red-600"
              )}>
                {isConnected ? "JARVIS Online" : "JARVIS Offline"}
              </span>
            </div>
            
            {currentTranscription && (
              <div className="p-4 bg-card border rounded-lg">
                <p className="text-lg font-mono text-center">
                  "{currentTranscription}"
                </p>
              </div>
            )}
            
            {!currentTranscription && isConnected && (
              <p className="text-muted-foreground">
                {isRecording ? "Listening..." : "Ready to listen"}
              </p>
            )}
          </div>
        </div>

        {/* Painel de Controles */}
        <div className="w-80 bg-card border-l flex flex-col">
          {/* Controles Principais */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium mb-4">Controls</h3>
            
            <div className="space-y-4">
              {/* Conexão */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Connection</label>
                <Button
                  variant={isConnected ? "destructive" : "default"}
                  size="lg"
                  onClick={handleConnect}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isConnected ? (
                    <>
                      <PhoneOff className="h-5 w-5" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5" />
                      Connect
                    </>
                  )}
                </Button>
              </div>

              {/* Modo de Detecção */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Detection Mode</label>
                <div className="flex gap-2">
                  <Button
                    variant={vadMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVadMode(true)}
                    className="flex-1"
                  >
                    VAD
                  </Button>
                  <Button
                    variant={!vadMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVadMode(false)}
                    className="flex-1"
                  >
                    Manual
                  </Button>
                </div>
              </div>

              {/* Gravação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recording</label>
                <Button
                  onClick={vadMode ? startRecording : startRecording}
                  onMouseDown={vadMode ? undefined : startRecording}
                  onMouseUp={vadMode ? undefined : stopRecording}
                  disabled={!isConnected}
                  variant={isRecording ? "destructive" : "outline"}
                  size="lg"
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5" />
                      {vadMode ? "Start Recording" : "Hold to Record"}
                    </>
                  )}
                </Button>
                
                {isRecording && (
                  <p className="text-xs text-center text-muted-foreground">
                    {vadMode ? "Automatic voice detection active" : "Hold button to record"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div className="p-6 border-b">
            <h3 className="text-sm font-medium mb-3">API Configuration</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Model:</span>
                <span>gpt-4o-realtime</span>
              </div>
              <div className="flex justify-between">
                <span>Voice:</span>
                <span>alloy</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span>pcm16</span>
              </div>
              <div className="flex justify-between">
                <span>Sample Rate:</span>
                <span>24kHz</span>
              </div>
            </div>
          </div>

          {/* Logs */}
          {showLogs && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="text-sm font-medium">Event Logs</h3>
              </div>
              
              <ScrollArea className="flex-1 p-4" ref={eventsScrollRef}>
                <div className="space-y-1 font-mono text-xs">
                  {events.slice(-100).map((event, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground w-12 shrink-0">
                        {event.timestamp}
                      </span>
                      <span className={cn("w-3 shrink-0", getEventColor(event.type))}>
                        {getEventIcon(event.type)}
                      </span>
                      <span className={cn("flex-1 text-xs", getEventColor(event.type))}>
                        {formatEventType(event.type)}
                        {event.data?.transcript && ` (${event.data.transcript.substring(0, 20)}...)`}
                        {event.data?.delta && ` (${event.data.delta.length}b)`}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeConsole;