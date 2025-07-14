import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Play,
  Pause,
  Volume2,
  Phone,
  PhoneOff,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpenAIRealtime } from "@/hooks/useOpenAIRealtime";

const RealtimeConsole = () => {
  const API_KEY = "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";
  
  const [vadMode, setVadMode] = useState(true);
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
    <div className="h-screen bg-background flex">
      {/* Main Console */}
      <div className="flex-1 flex flex-col max-w-2xl">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary/20" />
              </div>
              <h1 className="text-lg font-medium">realtime console</h1>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>api key: sk-...</span>
              <Settings className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-sm font-medium text-muted-foreground">events</h2>
          </div>
          
          <ScrollArea className="flex-1 p-4" ref={eventsScrollRef}>
            <div className="space-y-1 font-mono text-sm">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {event.timestamp}
                  </span>
                  <span className={cn("w-4 shrink-0", getEventColor(event.type))}>
                    {getEventIcon(event.type)}
                  </span>
                  <span className={cn("flex-1", getEventColor(event.type))}>
                    {formatEventType(event.type)}
                    {event.data?.transcript && ` (transcript: "${event.data.transcript}")`}
                    {event.data?.delta && ` (${event.data.delta.length} chars)`}
                    {typeof event.data === 'object' && Object.keys(event.data).length > 0 && !event.data.transcript && !event.data.delta && 
                      ` (${Object.keys(event.data).length} props)`
                    }
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation Section */}
        <div className="border-t">
          <div className="p-4 border-b">
            <h2 className="text-sm font-medium text-muted-foreground">conversation</h2>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Play className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono">0:00 / 0:00</span>
              <div className="flex-1 h-1 bg-muted rounded-full">
                <div className="h-full bg-primary rounded-full w-0"></div>
              </div>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="border-t">
          <div className="p-4 border-b">
            <h2 className="text-sm font-medium text-muted-foreground">user</h2>
          </div>
          
          <div className="p-4">
            <div className="text-sm text-muted-foreground mb-4">
              {currentTranscription ? `"${currentTranscription}"` : "(awaiting transcript)"}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Play className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono">0:00 / 0:01</span>
              <div className="flex-1 h-1 bg-muted rounded-full">
                <div className="h-full bg-primary rounded-full w-0"></div>
              </div>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={vadMode ? "default" : "outline"}
                size="sm"
                onClick={() => setVadMode(!vadMode)}
              >
                vad
              </Button>
              <Button
                variant={!vadMode ? "default" : "outline"}
                size="sm"
                onClick={() => setVadMode(!vadMode)}
              >
                manual
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnect}
              className="flex items-center gap-2"
            >
              {isConnected ? (
                <>
                  disconnect
                  <X className="h-4 w-4" />
                </>
              ) : (
                <>
                  connect
                  <Phone className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Functions/Tools */}
      <div className="w-80 bg-muted/30 border-l">
        <div className="p-4 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Connection Status</h3>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Voice Controls</h3>
            <div className="space-y-2">
              <Button
                onClick={vadMode ? startRecording : startRecording}
                onMouseUp={vadMode ? undefined : stopRecording}
                disabled={!isConnected}
                className={cn(
                  "w-full",
                  isRecording && "bg-red-500 hover:bg-red-600"
                )}
              >
                {isRecording ? "Recording..." : "Start Recording"}
              </Button>
              
              {isRecording && (
                <div className="text-xs text-center text-muted-foreground">
                  {vadMode ? "VAD Mode - Automatic detection" : "Hold to record"}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">API Configuration</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>Model: gpt-4o-realtime-preview-2024-10-01</div>
              <div>Voice: alloy</div>
              <div>Format: pcm16</div>
              <div>Sample Rate: 24kHz</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RealtimeConsole;