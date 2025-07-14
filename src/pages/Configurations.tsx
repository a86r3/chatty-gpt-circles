import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Configurations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
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
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">
            As configurações serão adicionadas após resolver problemas de compatibilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Configurations;