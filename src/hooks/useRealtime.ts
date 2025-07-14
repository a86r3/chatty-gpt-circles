import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private url: string;
  private isConnected: boolean = false;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, ['realtime', `Bearer.${this.apiKey}`]);
        
        this.ws.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          this.isConnected = true;
          this.emit('open', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received:', message.type);
            this.emit(message.type, message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from OpenAI Realtime API');
          this.isConnected = false;
          this.emit('close', {});
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  send(event: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
      console.log('Sent:', event.type);
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  updateSession(session: any) {
    this.send({
      type: 'session.update',
      session
    });
  }

  sendUserAudioAppend(audio: ArrayBuffer) {
    const int16Array = new Int16Array(audio);
    const base64 = this.arrayBufferToBase64(int16Array.buffer);
    
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  createResponse() {
    this.send({
      type: 'response.create'
    });
  }

  commitUserAudio() {
    this.send({
      type: 'input_audio_buffer.commit'
    });
  }
}

interface UseRealtimeResult {
  client: RealtimeClient | null;
  connectConversation: () => Promise<void>;
  disconnectConversation: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  canPushToTalk: boolean;
  isRecording: boolean;
  isConnected: boolean;
  realtimeEvents: any[];
  items: any[];
  memoryKv: Record<string, any>;
}

export const useRealtime = (apiKey: string): UseRealtimeResult => {
  const { toast } = useToast();
  const clientRef = useRef<RealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [memoryKv, setMemoryKv] = useState<Record<string, any>>({});

  const connectConversation = useCallback(async () => {
    try {
      if (!clientRef.current) {
        clientRef.current = new RealtimeClient(apiKey);
      }

      const client = clientRef.current;

      // Set up event handlers
      client.on('open', () => {
        setIsConnected(true);
        setCanPushToTalk(true);
        
        // Configure session
        client.updateSession({
          modalities: ['text', 'audio'],
          instructions: 'Você é um assistente útil que conversa em português brasileiro. Seja natural e amigável. Responda de forma clara e concisa.',
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200
          }
        });
      });

      client.on('close', () => {
        setIsConnected(false);
        setCanPushToTalk(false);
        setIsRecording(false);
      });

      client.on('error', (error: any) => {
        console.error('Client error:', error);
        toast({
          title: 'Erro de conexão',
          description: 'Falha na conexão com o OpenAI Realtime API',
          variant: 'destructive'
        });
      });

      // Handle realtime events
      client.on('conversation.item.input_audio_transcription.completed', (event: any) => {
        setRealtimeEvents(prev => [...prev, event]);
        console.log('Transcription:', event.transcript);
      });

      client.on('conversation.item.created', (event: any) => {
        setItems(prev => [...prev, event.item]);
        setRealtimeEvents(prev => [...prev, event]);
      });

      client.on('response.audio.delta', (event: any) => {
        if (event.delta) {
          playAudioDelta(event.delta);
        }
      });

      client.on('response.text.delta', (event: any) => {
        setRealtimeEvents(prev => [...prev, event]);
      });

      client.on('response.done', (event: any) => {
        setRealtimeEvents(prev => [...prev, event]);
      });

      await client.connect();
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível conectar ao serviço',
        variant: 'destructive'
      });
    }
  }, [apiKey, toast]);

  const disconnectConversation = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    setIsRecording(false);
    setCanPushToTalk(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!canPushToTalk || !clientRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processorRef.current.onaudioprocess = (event) => {
        if (isRecording && clientRef.current) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // Convert to Int16Array
          const int16Buffer = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            int16Buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          
          clientRef.current.sendUserAudioAppend(int16Buffer.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: 'Erro de microfone',
        description: 'Não foi possível acessar o microfone. Verifique as permissões.',
        variant: 'destructive'
      });
    }
  }, [canPushToTalk, isRecording, toast]);

  const stopRecording = useCallback(() => {
    if (clientRef.current && isRecording) {
      clientRef.current.commitUserAudio();
      clientRef.current.createResponse();
    }
    
    setIsRecording(false);
  }, [isRecording]);

  const playAudioDelta = useCallback(async (delta: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const binaryData = atob(delta);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectConversation();
    };
  }, [disconnectConversation]);

  return {
    client: clientRef.current,
    connectConversation,
    disconnectConversation,
    startRecording,
    stopRecording,
    canPushToTalk,
    isRecording,
    isConnected,
    realtimeEvents,
    items,
    memoryKv
  };
};