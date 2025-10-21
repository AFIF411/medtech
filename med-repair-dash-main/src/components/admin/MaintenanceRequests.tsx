import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wrench, Calendar, DollarSign } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  hospital_id: string;
  device_name: string;
  device_model: string | null;
  serial_number: string | null;
  maintenance_type: string;
  description: string;
  status: string;
  cost: number | null;
  next_maintenance_date: string | null;
  created_at: string;
  profiles?: {
    hospital_name: string | null;
  };
}

const MaintenanceRequests = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [cost, setCost] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('equipment_maintenance')
        .select('*')
        .order('created_at', { ascending: false });

      if (maintenanceError) throw maintenanceError;

      // Récupérer les informations des hôpitaux
      if (maintenanceData && maintenanceData.length > 0) {
        const hospitalIds = [...new Set(maintenanceData.map(m => m.hospital_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, hospital_name')
          .in('id', hospitalIds);

        if (profilesError) throw profilesError;

        // Mapper les noms d'hôpitaux
        const hospitalMap = new Map(profilesData?.map(p => [p.id, p.hospital_name]) || []);
        const requestsWithHospitals = maintenanceData.map(m => ({
          ...m,
          profiles: {
            hospital_name: hospitalMap.get(m.hospital_id) || null
          }
        }));
        
        setRequests(requestsWithHospitals as any);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedRequest || !cost || !maintenanceDate) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('equipment_maintenance')
        .update({
          cost: parseFloat(cost),
          next_maintenance_date: maintenanceDate,
          status: 'scheduled',
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Maintenance planifiée avec succès');
      setSelectedRequest(null);
      setCost('');
      setMaintenanceDate('');
      fetchRequests();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error('Erreur lors de la planification');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      scheduled: { label: 'Planifiée', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      filter_change: 'Changement de filtre',
      battery_change: 'Changement de batterie',
      calibration: 'Calibration',
      cleaning: 'Nettoyage',
      inspection: 'Inspection',
      repair: 'Réparation',
      other: 'Autre',
    };
    return types[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demandes de maintenance</CardTitle>
        <CardDescription>
          Planifiez les maintenances et fixez les coûts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune demande de maintenance
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{request.device_name}</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.profiles?.hospital_name || 'Hôpital'} • {getMaintenanceTypeLabel(request.maintenance_type)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {request.description.substring(0, 100)}...
                  </p>
                  {request.status === 'scheduled' && (
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {request.cost} DH
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.next_maintenance_date!).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {request.status === 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          Planifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Planifier la maintenance</DialogTitle>
                          <DialogDescription>
                            Fixez le coût et la date de maintenance pour {request.device_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="cost">Coût de la maintenance (DH)</Label>
                            <Input
                              id="cost"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={cost}
                              onChange={(e) => setCost(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date">Date de maintenance</Label>
                            <Input
                              id="date"
                              type="date"
                              value={maintenanceDate}
                              onChange={(e) => setMaintenanceDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleSchedule}
                            disabled={updating || !cost || !maintenanceDate}
                            className="flex-1"
                          >
                            {updating ? 'Planification...' : 'Confirmer'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceRequests;
