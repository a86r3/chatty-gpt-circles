import { useRef, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface UseOpenAIRealtimeProps {
  apiKey: string;
  onEvent?: (event: RealtimeEvent) => void;
}

export const useOpenAIRealtime = ({ apiKey, onEvent }: UseOpenAIRealtimeProps) => {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const addEvent = useCallback((type: string, data: any) => {
    const event: RealtimeEvent = {
      type,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setEvents(prev => [...prev, event]);
    onEventRef.current?.(event);
  }, []);

  const connectRealtime = useCallback(async () => {
    try {
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      const ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${apiKey}`,
        'openai-beta.realtime-v1'
      ]);
      
      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime');
        setIsConnected(true);
        addEvent('connection.established', { url: wsUrl });

        // Configurar sessão
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Você é a Aline, uma assistente de voz inteligente que conversa em português brasileiro. Seja natural, amigável e responda de forma clara e concisa.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.3,
              prefix_padding_ms: 600,
              silence_duration_ms: 1500
            }
          }
        };

        ws.send(JSON.stringify(sessionConfig));

        toast({
          title: 'Conectado!',
          description: 'Aline está online e pronta para conversar'
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
          addEvent('error.parse', { error: error.message });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addEvent('connection.error', { error });
        toast({
          title: 'Erro de conexão',
          description: 'Falha ao conectar com Realtime API',
          variant: 'destructive'
        });
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsRecording(false);
        addEvent('connection.closed', { code: event.code, reason: event.reason });
      };

      wsRef.current = ws;

    } catch (error) {
      console.error('Connection error:', error);
      addEvent('connection.failed', { error: error.message });
      toast({
        title: 'Erro',
        description: 'Não foi possível conectar ao serviço',
        variant: 'destructive'
      });
    }
  }, [apiKey, addEvent, toast]);

  const handleRealtimeMessage = useCallback((message: any) => {
    console.log('Realtime message:', message.type);
    addEvent(`realtime.${message.type}`, message);

    switch (message.type) {
      case 'session.created':
        addEvent('session.ready', message.session);
        break;
        
      case 'session.updated':
        addEvent('session.configured', message.session);
        break;

      case 'input_audio_buffer.speech_started':
        addEvent('speech.started', {});
        break;

      case 'input_audio_buffer.speech_stopped':
        addEvent('speech.stopped', {});
        break;

      case 'conversation.item.input_audio_transcription.completed':
        setCurrentTranscription(message.transcript || '');
        addEvent('transcription.completed', { transcript: message.transcript });
        break;

      case 'response.audio.delta':
        if (message.delta) {
          playAudioDelta(message.delta);
          addEvent('audio.delta.received', { size: message.delta.length });
        }
        break;

      case 'response.text.delta':
        addEvent('text.delta.received', { delta: message.delta });
        break;

      case 'response.done':
        addEvent('response.completed', message.response);
        break;

      case 'error':
        console.error('Realtime API error:', message.error);
        addEvent('api.error', message.error);
        toast({
          title: 'Erro da API',
          description: message.error.message || 'Erro desconhecido',
          variant: 'destructive'
        });
        break;
    }
  }, [addEvent, toast]);

  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Combinar vários deltas em um buffer maior para reduzir fragmentação
      const combinedDeltas = audioQueueRef.current.splice(0, Math.min(5, audioQueueRef.current.length));
      let totalBytes = 0;

      // Calcular tamanho total necessário
      const decodedBuffers = combinedDeltas.map(delta => {
        const binaryString = atob(delta);
        totalBytes += binaryString.length;
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      });

      // Combinar em um único buffer
      const combinedBytes = new Uint8Array(totalBytes);
      let offset = 0;
      decodedBuffers.forEach(buffer => {
        combinedBytes.set(buffer, offset);
        offset += buffer.length;
      });

      // Converter PCM16 para AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, combinedBytes.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      const dataView = new DataView(combinedBytes.buffer);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      // Reproduzir áudio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        // Processar próximo batch se houver
        setTimeout(() => processAudioQueue(), 10);
      };
      
      source.start();

    } catch (error) {
      console.error('Audio playback error:', error);
      addEvent('audio.playback.error', { error: error.message });
      isPlayingRef.current = false;
    }
  }, [addEvent]);

  const playAudioDelta = useCallback(async (delta: string) => {
    // Adicionar à fila de áudio
    audioQueueRef.current.push(delta);
    
    // Processar fila se não estiver tocando
    processAudioQueue();
  }, [processAudioQueue]);

  const startRecording = useCallback(async () => {
    if (!isConnected || !wsRef.current) {
      addEvent('recording.failed', { reason: 'not_connected' });
      return;
    }

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

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Usar AudioWorklet para captura de áudio em tempo real
      try {
        await audioContextRef.current.audioWorklet.addModule(
          'data:application/javascript,' + encodeURIComponent(`
            class RealtimeProcessor extends AudioWorkletProcessor {
              process(inputs, outputs, parameters) {
                const input = inputs[0];
                if (input.length > 0) {
                  const inputData = input[0];
                  
                  // Converter para Int16Array
                  const int16Data = new Int16Array(inputData.length);
                  for (let i = 0; i < inputData.length; i++) {
                    const sample = Math.max(-1, Math.min(1, inputData[i]));
                    int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                  }
                  
                  // Enviar para main thread
                  this.port.postMessage(int16Data.buffer);
                }
                return true;
              }
            }
            registerProcessor('realtime-processor', RealtimeProcessor);
          `)
        );

        const source = audioContextRef.current.createMediaStreamSource(stream);
        workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'realtime-processor');

        workletNodeRef.current.port.onmessage = (event) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const base64 = btoa(String.fromCharCode(...new Uint8Array(event.data)));
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64
            }));
          }
        };

        source.connect(workletNodeRef.current);

      } catch (workletError) {
        // Fallback para ScriptProcessorNode se AudioWorklet falhar
        console.warn('AudioWorklet failed, using ScriptProcessor:', workletError);
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const inputBuffer = event.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);
            
            const int16Buffer = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const sample = Math.max(-1, Math.min(1, inputData[i]));
              int16Buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            }
            
            const base64 = btoa(String.fromCharCode(...new Uint8Array(int16Buffer.buffer)));
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64
            }));
          }
        };

        source.connect(processor);
        processor.connect(audioContextRef.current.destination);
      }

      setIsRecording(true);
      addEvent('recording.started', { sampleRate: 24000 });

    } catch (error) {
      console.error('Recording error:', error);
      addEvent('recording.error', { error: error.message });
      toast({
        title: 'Erro de gravação',
        description: 'Não foi possível acessar o microfone',
        variant: 'destructive'
      });
    }
  }, [isConnected, addEvent, toast]);

  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
      
      wsRef.current.send(JSON.stringify({
        type: 'response.create'
      }));
    }

    setIsRecording(false);
    addEvent('recording.stopped', {});
  }, [addEvent]);

  const disconnect = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    // Limpar fila de áudio
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setIsConnected(false);
    setIsRecording(false);
    addEvent('session.disconnected', {});
  }, [addEvent]);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addEvent('text.send.failed', { reason: 'not_connected' });
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    }));

    wsRef.current.send(JSON.stringify({
      type: 'response.create'
    }));

    addEvent('text.message.sent', { text });
  }, [addEvent]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Estado
    isConnected,
    isRecording,
    currentTranscription,
    events,
    
    // Métodos
    connectRealtime,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    addEvent
  };
};