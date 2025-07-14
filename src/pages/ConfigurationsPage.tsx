import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, User, Volume2, Mic, Save, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ConfigurationsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado local para as configurações
  const [isEditingPersonality, setIsEditingPersonality] = useState(false);
  const [personalityInstructions, setPersonalityInstructions] = useState(() => {
    return localStorage.getItem('aline-personality') || 
    `Você é a Aline, uma assistente de voz inteligente que conversa em português brasileiro. 

Características principais:
- Seja natural, amigável e responda de forma clara e concisa
- Demonstre curiosidade e interesse genuíno pelas conversas
- Use um tom caloroso e acolhedor
- Seja prestativa e sempre tente ajudar
- Mantenha conversas envolventes e interessantes

Instruções específicas:
- Responda sempre em português brasileiro
- Use linguagem natural e não muito formal
- Seja proativa em fazer perguntas relevantes
- Demonstre empatia quando apropriado
- Mantenha as respostas concisas mas informativas`;
  });

  // Carregar configurações salvas
  useEffect(() => {
    const saved = localStorage.getItem('aline-personality');
    if (saved) {
      setPersonalityInstructions(saved);
    }
  }, []);

  const handleSavePersonality = () => {
    localStorage.setItem('aline-personality', personalityInstructions);
    setIsEditingPersonality(false);
    toast({
      title: "Personalidade salva!",
      description: "As novas instruções da Aline foram aplicadas. Reconecte para aplicar as mudanças.",
    });
  };

  const handleCancelEdit = () => {
    const saved = localStorage.getItem('aline-personality');
    if (saved) {
      setPersonalityInstructions(saved);
    }
    setIsEditingPersonality(false);
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sistema
              </CardTitle>
              <CardDescription>
                Configurações básicas da Aline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Modelo</div>
                    <div className="text-sm text-muted-foreground">gpt-4o-realtime-preview-2024-10-01</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Idioma</div>
                    <div className="text-sm text-muted-foreground">Português (Brasil)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalidade - Agora Editável */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personalidade
                </div>
                {!isEditingPersonality && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPersonality(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Editar
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Como a Aline se comporta e responde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingPersonality ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="personality">Instruções da Personalidade</Label>
                    <Textarea
                      id="personality"
                      value={personalityInstructions}
                      onChange={(e) => setPersonalityInstructions(e.target.value)}
                      placeholder="Descreva como a Aline deve se comportar..."
                      rows={12}
                      className="font-mono text-sm resize-vertical"
                    />
                    <p className="text-xs text-muted-foreground">
                      Descreva em detalhes como a Aline deve se comportar, seu tom de voz, 
                      estilo de comunicação e instruções específicas.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSavePersonality}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium mb-2">Instruções Atuais</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {personalityInstructions}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Áudio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Áudio
              </CardTitle>
              <CardDescription>
                Configurações de voz e áudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Voz</div>
                  <div className="text-sm text-muted-foreground">Alloy</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Formato</div>
                  <div className="text-sm text-muted-foreground">PCM16</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detecção de Voz */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Detecção de Voz
              </CardTitle>
              <CardDescription>
                Configurações VAD (Voice Activity Detection)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Threshold</div>
                  <div className="text-sm text-muted-foreground">0.3</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Padding</div>
                  <div className="text-sm text-muted-foreground">600ms</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Silêncio</div>
                  <div className="text-sm text-muted-foreground">1500ms</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Configurações em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm">
                  <strong>Em breve:</strong> Interface completa para editar todas as configurações da Aline em tempo real.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationsPage;