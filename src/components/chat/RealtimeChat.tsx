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
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const RealtimeChat = () => {
  const { toast } = useToast();
  const API_KEY = "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";
  
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [inputText, setInputText] = useState("");
  const [showEvents, setShowEvents] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll events
  useEffect(() => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = eventsScrollRef.current.scrollHeight;
    }
  }, [events]);

  const addEvent = useCallback((type: string, data: any) => {
    const event = {
      type,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setEvents(prev => [...prev, event]);
    console.log('Event:', type, data);
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Parar imediatamente, só queremos a permissão
      setIsConnected(true);
      addEvent('microphone.permission.granted', { status: 'success' });
      
      toast({
        title: "Microfone ativado",
        description: "Agora você pode usar comandos de voz"
      });
    } catch (error) {
      console.error('Microphone permission error:', error);
      addEvent('microphone.permission.denied', { error: error.message });
      
      toast({
        title: "Erro de microfone",
        description: "Permissão negada para acessar o microfone",
        variant: "destructive"
      });
    }
  }, [addEvent, toast]);

  const startRecording = useCallback(async () => {
    if (!isConnected) {
      await requestMicrophonePermission();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      addEvent('recording.started', { format: 'audio/webm' });
      
    } catch (error) {
      console.error('Recording error:', error);
      addEvent('recording.error', { error: error.message });
      
      toast({
        title: "Erro de gravação",
        description: "Não foi possível iniciar a gravação",
        variant: "destructive"
      });
    }
  }, [isConnected, requestMicrophonePermission, addEvent, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addEvent('recording.stopped', {});
    }
  }, [isRecording, addEvent]);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    addEvent('audio.processing.started', { size: audioBlob.size });

    try {
      // 1. Transcrever áudio usando Whisper
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription error: ${transcriptionResponse.status}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcription = transcriptionData.text;
      
      setCurrentTranscription(transcription);
      addEvent('audio.transcription.completed', { transcript: transcription });

      if (transcription.trim()) {
        // 2. Enviar para ChatGPT
        await sendToGPT(transcription);
      }

    } catch (error) {
      console.error('Audio processing error:', error);
      addEvent('audio.processing.error', { error: error.message });
      
      toast({
        title: "Erro de processamento",
        description: "Não foi possível processar o áudio",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [API_KEY, addEvent, toast]);

  const sendToGPT = useCallback(async (message: string) => {
    addEvent('gpt.request.started', { message });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente útil que conversa em português brasileiro. Seja natural, amigável e responda de forma clara e concisa.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`GPT error: ${response.status}`);
      }

      const data = await response.json();
      const gptResponse = data.choices[0].message.content;
      
      addEvent('gpt.response.completed', { response: gptResponse });
      
      // 3. Converter resposta para áudio
      await convertToSpeech(gptResponse);

    } catch (error) {
      console.error('GPT error:', error);
      addEvent('gpt.error', { error: error.message });
      
      toast({
        title: "Erro do ChatGPT",
        description: "Não foi possível obter resposta",
        variant: "destructive"
      });
    }
  }, [API_KEY, addEvent, toast]);

  const convertToSpeech = useCallback(async (text: string) => {
    addEvent('tts.request.started', { text });

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        })
      });

      if (!response.ok) {
        throw new Error(`TTS error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.play();
      
      addEvent('tts.playback.started', { size: audioBlob.size });

      audio.onended = () => {
        addEvent('tts.playback.completed', {});
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error('TTS error:', error);
      addEvent('tts.error', { error: error.message });
      
      toast({
        title: "Erro de síntese de voz",
        description: "Não foi possível reproduzir o áudio",
        variant: "destructive"
      });
    }
  }, [API_KEY, addEvent, toast]);

  const handleTextSubmit = useCallback(async () => {
    if (inputText.trim()) {
      await sendToGPT(inputText);
      setInputText("");
    }
  }, [inputText, sendToGPT]);

  const getEventColor = (eventType: string) => {
    if (eventType.includes('microphone')) return 'bg-blue-100 text-blue-800';
    if (eventType.includes('recording')) return 'bg-purple-100 text-purple-800';
    if (eventType.includes('transcription')) return 'bg-green-100 text-green-800';
    if (eventType.includes('gpt')) return 'bg-orange-100 text-orange-800';
    if (eventType.includes('tts')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-screen bg-gradient-background flex">
      {/* Main Console */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-chat-sidebar border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Chat de Voz com GPT</h1>
              <div className="flex items-center gap-2">
                <Circle className={cn(
                  "h-3 w-3",
                  isConnected ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Microfone ativo" : "Microfone inativo"}
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
                  onClick={isConnected ? () => setIsConnected(false) : requestMicrophonePermission}
                  className={cn(
                    "h-12 px-8",
                    isConnected 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-gradient-primary"
                  )}
                >
                  <Mic className="h-5 w-5 mr-2" />
                  {isConnected ? "Microfone Ativo" : "Ativar Microfone"}
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
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      disabled={isProcessing}
                      className={cn(
                        "h-20 w-20 rounded-full transition-all duration-200",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" 
                          : "bg-gradient-primary hover:scale-105",
                        isProcessing && "opacity-50"
                      )}
                    >
                      {isProcessing ? (
                        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
                      ) : isRecording ? (
                        <MicOff className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {isProcessing 
                        ? "⚙️ Processando..." 
                        : isRecording 
                        ? "🔴 Gravando... Solte para parar" 
                        : "Pressione e segure para falar"
                      }
                    </p>
                  </div>

                  {currentTranscription && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Última transcrição:</p>
                      <p className="text-green-700 mt-1">"{currentTranscription}"</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Text Input Alternative */}
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
                  disabled={!inputText.trim() || isProcessing}
                  className="bg-gradient-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
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
                {events.length} eventos
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
                    
                    {/* Show response if available */}
                    {event.data?.response && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-orange-900">
                        <strong>Resposta:</strong> {event.data.response}
                      </div>
                    )}
                    
                    <details className="mt-2">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver dados
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
                    <p>Nenhum evento ainda</p>
                    <p className="text-xs mt-1">Ative o microfone para começar</p>
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