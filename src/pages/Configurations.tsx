import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, RotateCcw, Volume2, Mic, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAlineConfig } from "@/contexts/AlineConfigContext";
import { useToast } from "@/hooks/use-toast";

const ConfigurationsPage = () => {
  const navigate = useNavigate();
  const { config, updateConfig, resetConfig } = useAlineConfig();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  const handleConfigChange = (key: string, value: any) => {
    updateConfig({ [key]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    toast({
      title: "Configurações salvas!",
      description: "As configurações da Aline foram atualizadas com sucesso.",
    });
  };

  const handleReset = () => {
    resetConfig();
    setHasChanges(false);
    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações foram restauradas para os valores padrão.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Configurações da Aline</h1>
                <p className="text-muted-foreground">Personalize a IA e configurações de áudio</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personalidade
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Detecção de Voz
            </TabsTrigger>
          </TabsList>

          {/* Sistema */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configure as funcionalidades básicas e comportamento da Aline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Uso de Ferramentas</Label>
                    <div className="text-sm text-muted-foreground">
                      Permite que a Aline use ferramentas e funções disponíveis
                    </div>
                  </div>
                  <Switch
                    checked={config.toolUse}
                    onCheckedChange={(value) => handleConfigChange('toolUse', value)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo da IA</Label>
                  <Select
                    value={config.model}
                    onValueChange={(value) => handleConfigChange('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-realtime-preview-2024-10-01">
                        GPT-4o Realtime Preview
                      </SelectItem>
                      <SelectItem value="gpt-4o-realtime-preview-2024-12-17">
                        GPT-4o Realtime Preview (Dec 2024)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={config.language}
                    onValueChange={(value) => handleConfigChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstMessage">Primeira Mensagem</Label>
                  <Textarea
                    id="firstMessage"
                    value={config.firstMessage}
                    onChange={(e) => handleConfigChange('firstMessage', e.target.value)}
                    placeholder="Mensagem inicial que a Aline falará ao conectar"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personalidade */}
          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instruções do Sistema</CardTitle>
                <CardDescription>
                  Define como a Aline deve se comportar e responder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={config.instructions}
                  onChange={(e) => handleConfigChange('instructions', e.target.value)}
                  placeholder="Instruções detalhadas para a IA..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personalidade</CardTitle>
                <CardDescription>
                  Define o tom e estilo de comunicação da Aline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={config.personality}
                  onChange={(e) => handleConfigChange('personality', e.target.value)}
                  placeholder="Características de personalidade..."
                  rows={6}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Áudio */}
          <TabsContent value="audio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Voz</CardTitle>
                <CardDescription>
                  Ajuste a voz e qualidade do áudio da Aline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Voz</Label>
                  <Select
                    value={config.voice}
                    onValueChange={(value) => handleConfigChange('voice', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato de Entrada</Label>
                    <Select
                      value={config.inputAudioFormat}
                      onValueChange={(value) => handleConfigChange('inputAudioFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcm16">PCM16</SelectItem>
                        <SelectItem value="g711_ulaw">G.711 μ-law</SelectItem>
                        <SelectItem value="g711_alaw">G.711 A-law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de Saída</Label>
                    <Select
                      value={config.outputAudioFormat}
                      onValueChange={(value) => handleConfigChange('outputAudioFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcm16">PCM16</SelectItem>
                        <SelectItem value="g711_ulaw">G.711 μ-law</SelectItem>
                        <SelectItem value="g711_alaw">G.711 A-law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Amostragem: {config.sampleRate}Hz</Label>
                  <Select
                    value={config.sampleRate.toString()}
                    onValueChange={(value) => handleConfigChange('sampleRate', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16000">16kHz</SelectItem>
                      <SelectItem value="24000">24kHz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detecção de Voz */}
          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações VAD</CardTitle>
                <CardDescription>
                  Ajuste a detecção automática de voz (Voice Activity Detection)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Limite de Detecção: {config.vadThreshold}</Label>
                  <Slider
                    value={[config.vadThreshold]}
                    onValueChange={([value]) => handleConfigChange('vadThreshold', value)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sensibilidade para detectar quando você começa a falar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Preenchimento Inicial: {config.vadPrefixPadding}ms</Label>
                  <Slider
                    value={[config.vadPrefixPadding]}
                    onValueChange={([value]) => handleConfigChange('vadPrefixPadding', value)}
                    min={100}
                    max={1000}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de áudio capturado antes da detecção de fala
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Duração do Silêncio: {config.vadSilenceDuration}ms</Label>
                  <Slider
                    value={[config.vadSilenceDuration]}
                    onValueChange={([value]) => handleConfigChange('vadSilenceDuration', value)}
                    min={500}
                    max={3000}
                    step={250}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de silêncio antes de considerar que você parou de falar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ConfigurationsPage;