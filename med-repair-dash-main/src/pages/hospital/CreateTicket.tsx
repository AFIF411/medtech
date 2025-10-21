import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { TicketType, PriorityLevel } from '@/types';

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    deviceName: '',
    deviceModel: '',
    serialNumber: '',
    symptoms: '',
    priority: 'medium' as PriorityLevel,
    ticketType: '' as TicketType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour créer un ticket');
      return;
    }

    if (!formData.ticketType) {
      toast.error('Veuillez sélectionner un type de demande');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('tickets')
        .insert([{
          hospital_id: user.id,
          device_name: formData.deviceName,
          device_model: formData.deviceModel,
          serial_number: formData.serialNumber,
          symptoms: formData.symptoms,
          priority: formData.priority,
          ticket_type: formData.ticketType,
        }] as any);

      if (error) throw error;

      toast.success('Ticket créé avec succès !');
      navigate('/hospital/dashboard');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erreur lors de la création du ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/hospital/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Créer un nouveau ticket</CardTitle>
            <CardDescription>
              Remplissez les informations sur la panne ou le problème rencontré
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">
                    Nom de l'appareil <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="deviceName"
                    placeholder="Ex: Scanner IRM, Échographe..."
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceModel">Modèle</Label>
                    <Input
                      id="deviceModel"
                      placeholder="Modèle de l'appareil"
                      value={formData.deviceModel}
                      onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Numéro de série</Label>
                    <Input
                      id="serialNumber"
                      placeholder="N° de série"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">
                    Description du problème <span className="text-danger">*</span>
                  </Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Décrivez en détail les symptômes, le contexte et les circonstances de la panne..."
                    rows={5}
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">
                      Priorité <span className="text-danger">*</span>
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: PriorityLevel) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Basse
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            Moyenne
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            Haute
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Urgente
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticketType">
                      Type de demande <span className="text-danger">*</span>
                    </Label>
                    <Select
                      value={formData.ticketType}
                      onValueChange={(value: TicketType) => setFormData({ ...formData, ticketType: value })}
                    >
                      <SelectTrigger id="ticketType">
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">
                          <div>
                            <div className="font-medium">Consultation</div>
                            <div className="text-xs text-muted-foreground">
                              Demander un conseil technique
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="quote">
                          <div>
                            <div className="font-medium">Devis</div>
                            <div className="text-xs text-muted-foreground">
                              Obtenir un devis pour la réparation
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="intervention">
                          <div>
                            <div className="font-medium">Intervention</div>
                            <div className="text-xs text-muted-foreground">
                              Demander une intervention sur site
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/hospital/dashboard')}
                  disabled={loading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateTicket;
