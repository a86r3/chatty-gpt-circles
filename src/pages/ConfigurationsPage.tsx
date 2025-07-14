import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, User, Volume2, Mic } from "lucide-react";

const ConfigurationsPage = () => {
  const navigate = useNavigate();

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

          {/* Personalidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personalidade
              </CardTitle>
              <CardDescription>
                Como a Aline se comporta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="font-medium mb-2">Instruções Atuais</div>
                <div className="text-sm text-muted-foreground">
                  "Você é a Aline, uma assistente de voz inteligente que conversa em português brasileiro. Seja natural, amigável e responda de forma clara e concisa."
                </div>
              </div>
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