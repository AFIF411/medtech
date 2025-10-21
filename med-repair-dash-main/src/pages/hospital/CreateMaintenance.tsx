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
import { ArrowLeft, Wrench } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const CreateMaintenance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    deviceName: '',
    deviceModel: '',
    serialNumber: '',
    maintenanceType: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!formData.maintenanceType) {
      toast.error('Veuillez sélectionner un type de maintenance');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('equipment_maintenance')
        .insert([{
          hospital_id: user.id,
          device_name: formData.deviceName,
          device_model: formData.deviceModel || null,
          serial_number: formData.serialNumber || null,
          maintenance_type: formData.maintenanceType,
          description: formData.description,
          status: 'pending',
        }] as any);

      if (error) throw error;

      toast.success('Demande de maintenance envoyée à l\'administration');
      navigate('/hospital/dashboard');
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast.error('Erreur lors de la création de l\'enregistrement');
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
            <CardTitle className="text-2xl">Demander une maintenance</CardTitle>
            <CardDescription>
              Envoyez une demande de maintenance à l'administration qui fixera le coût et la date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">
                    Nom de l'équipement <span className="text-danger">*</span>
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
                      placeholder="Modèle de l'équipement"
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
                  <Label htmlFor="maintenanceType">
                    Type de maintenance <span className="text-danger">*</span>
                  </Label>
                  <Select
                    value={formData.maintenanceType}
                    onValueChange={(value) => setFormData({ ...formData, maintenanceType: value })}
                  >
                    <SelectTrigger id="maintenanceType">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filter_change">Changement de filtre</SelectItem>
                      <SelectItem value="battery_change">Changement de batterie</SelectItem>
                      <SelectItem value="calibration">Calibration</SelectItem>
                      <SelectItem value="cleaning">Nettoyage</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="repair">Réparation</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description des travaux <span className="text-danger">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez les travaux de maintenance effectués..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
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
                  <Wrench className="w-4 h-4 mr-2" />
                  {loading ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateMaintenance;
