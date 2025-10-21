import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TechniciansValidationProps {
  technicians: Profile[];
  onUpdate: () => void;
}

const TechniciansValidation = ({ technicians, onUpdate }: TechniciansValidationProps) => {
  const handleValidate = async (technicianId: string, validate: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_validated: validate })
        .eq('id', technicianId);

      if (error) throw error;

      toast.success(
        validate 
          ? 'Technicien validé avec succès' 
          : 'Technicien suspendu avec succès'
      );
      onUpdate();
    } catch (error) {
      console.error('Error updating technician:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const pendingTechnicians = technicians.filter(t => !t.is_validated);
  const validatedTechnicians = technicians.filter(t => t.is_validated);

  return (
    <div className="space-y-4">
      {pendingTechnicians.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Techniciens en attente de validation</CardTitle>
            <CardDescription>
              Validez les nouveaux comptes techniciens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tech.full_name}</p>
                    <p className="text-sm text-muted-foreground">{tech.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      En attente
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success border-success hover:bg-success/10"
                      onClick={() => handleValidate(tech.id, true)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-danger border-danger hover:bg-danger/10"
                      onClick={() => handleValidate(tech.id, false)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Techniciens validés</CardTitle>
          <CardDescription>
            Liste des techniciens actifs sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validatedTechnicians.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun technicien validé pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {validatedTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tech.full_name}</p>
                    <p className="text-sm text-muted-foreground">{tech.email}</p>
                    <Badge variant="outline" className="mt-1 text-success border-success">
                      Validé
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger border-danger hover:bg-danger/10"
                    onClick={() => handleValidate(tech.id, false)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Suspendre
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechniciansValidation;
