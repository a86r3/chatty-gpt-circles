import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceChatButtonProps {
  onTranscription?: (text: string) => void;
  disabled?: boolean;
  isAutoMode?: boolean;
  onToggleAutoMode?: () => void;
}

const VoiceChatButton = ({ 
  onTranscription, 
  disabled = false, 
  isAutoMode = false,
  onToggleAutoMode 
}: VoiceChatButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const OPENAI_API_KEY = "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";

  const connectToOpenAI = useCallback(async () => {
    try {
      const ws = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", [
        "realtime",
        `Bearer.${OPENAI_API_KEY}`
      ]);

      ws.onopen = () => {
        console.log("Conectado ao OpenAI Realtime API");
        setIsConnected(true);
        
        // Configurar sessão
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: "Você é um assistente útil que conversa em português brasileiro. Seja natural e amigável.",
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: isAutoMode ? {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            } : null
          }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Mensagem recebida:", data.type);

        switch (data.type) {
          case "conversation.item.input_audio_transcription.completed":
            if (data.transcript && onTranscription) {
              onTranscription(data.transcript);
            }
            break;
          case "response.audio.delta":
            if (data.delta) {
              playAudioDelta(data.delta);
            }
            break;
          case "response.done":
            setIsSpeaking(false);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error("Erro WebSocket:", error);
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao OpenAI Realtime API",
          variant: "destructive"
        });
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsRecording(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Erro ao conectar:", error);
      toast({
        title: "Erro",
        description: "Falha ao conectar com o serviço de voz",
        variant: "destructive"
      });
    }
  }, [isAutoMode, onTranscription, toast]);

  const playAudioDelta = useCallback(async (delta: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioData = Uint8Array.from(atob(delta), c => c.charCodeAt(0));
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.buffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
      setIsSpeaking(true);
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          sampleSize: 16
        } 
      });

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Enviar áudio em tempo real para OpenAI
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onload = () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              
              wsRef.current?.send(JSON.stringify({
                type: "input_audio_buffer.append",
                audio: base64
              }));
            };
            reader.readAsArrayBuffer(event.data);
          }
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "input_audio_buffer.commit"
          }));
        }
      };

      mediaRecorder.start(100); // Capturar dados a cada 100ms
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast({
        title: "Erro de microfone",
        description: "Não foi possível acessar o microfone",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleButtonPress = useCallback(() => {
    if (!isConnected) {
      connectToOpenAI();
      return;
    }

    if (isAutoMode) {
      // Modo automático - alternar conexão
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else {
      // Modo manual - press and hold
      startRecording();
    }
  }, [isConnected, isAutoMode, isRecording, connectToOpenAI, startRecording, stopRecording]);

  const handleButtonRelease = useCallback(() => {
    if (!isAutoMode && isRecording) {
      stopRecording();
    }
  }, [isAutoMode, isRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Botão principal de voz */}
      <div className="relative">
        <Button
          onMouseDown={handleButtonPress}
          onMouseUp={handleButtonRelease}
          onTouchStart={handleButtonPress}
          onTouchEnd={handleButtonRelease}
          disabled={disabled}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-200 shadow-lg",
            isRecording 
              ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" 
              : "bg-gradient-primary hover:scale-105",
            isSpeaking && "ring-4 ring-blue-300 ring-opacity-75",
            !isConnected && "opacity-70"
          )}
        >
          {isRecording ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Indicador de status */}
        <div className={cn(
          "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
          isConnected ? "bg-green-500" : "bg-gray-400"
        )} />
      </div>

      {/* Controles adicionais */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAutoMode}
          className={cn(
            "text-xs",
            isAutoMode && "bg-primary text-primary-foreground"
          )}
        >
          {isAutoMode ? "Auto" : "Manual"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          {isSpeaking ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default VoiceChatButton;