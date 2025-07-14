import { createContext, useContext, useState, ReactNode } from 'react';

export interface AlineConfig {
  // System Settings
  toolUse: boolean;
  
  // Instructions
  instructions: string;
  
  // Personality
  personality: string;
  
  // Audio Settings
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  inputAudioFormat: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  sampleRate: 24000 | 16000;
  
  // VAD Settings
  vadThreshold: number;
  vadPrefixPadding: number;
  vadSilenceDuration: number;
  
  // General Settings
  model: string;
  language: string;
  firstMessage: string;
}

const defaultConfig: AlineConfig = {
  toolUse: true,
  instructions: `You are an artificial intelligence agent responsible for helping test realtime voice capabilities
- Please make sure to respond with a helpful voice via audio
- Be kind, helpful, and curteous
- It is okay to ask the user questions
- Use tools and functions you have available liberally, it is part of the training apparatus
- Be open to exploration and conversation
- Remember: this is just for fun and testing!`,
  personality: `Be upbeat and genuine
- Try speaking quickly as if excited`,
  voice: 'alloy',
  inputAudioFormat: 'pcm16',
  outputAudioFormat: 'pcm16',
  sampleRate: 24000,
  vadThreshold: 0.3,
  vadPrefixPadding: 600,
  vadSilenceDuration: 1500,
  model: 'gpt-4o-realtime-preview-2024-10-01',
  language: 'pt-BR',
  firstMessage: 'Olá! Eu sou a Aline, sua assistente de voz em tempo real. Como posso ajudar você hoje?'
};

interface AlineConfigContextType {
  config: AlineConfig;
  updateConfig: (updates: Partial<AlineConfig>) => void;
  resetConfig: () => void;
}

const AlineConfigContext = createContext<AlineConfigContextType | undefined>(undefined);

export const AlineConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<AlineConfig>(() => {
    const savedConfig = localStorage.getItem('aline-config');
    return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
  });

  const updateConfig = (updates: Partial<AlineConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    localStorage.setItem('aline-config', JSON.stringify(newConfig));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.setItem('aline-config', JSON.stringify(defaultConfig));
  };

  return (
    <AlineConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </AlineConfigContext.Provider>
  );
};

export const useAlineConfig = () => {
  const context = useContext(AlineConfigContext);
  if (context === undefined) {
    throw new Error('useAlineConfig must be used within an AlineConfigProvider');
  }
  return context;
};