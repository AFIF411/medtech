import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket } from '@/types';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const TechnicianDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_validated) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_technician_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_validated) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Compte en attente de validation</CardTitle>
            <CardDescription>
              Votre compte technicien sera activé après validation par l'administrateur
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <p className="text-muted-foreground">
              Vous recevrez une notification par email une fois votre compte validé.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const todoTickets = tickets.filter(t => t.status === 'assigned');
  const workingTickets = tickets.filter(t => t.status === 'working');
  const doneTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'working': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'À faire';
      case 'working': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Clôturé';
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes interventions</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos tickets et rapports d'intervention
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">À faire</CardTitle>
              <ClipboardList className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoTickets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workingTickets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doneTickets.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="todo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todo">
              À faire ({todoTickets.length})
            </TabsTrigger>
            <TabsTrigger value="working">
              En cours ({workingTickets.length})
            </TabsTrigger>
            <TabsTrigger value="done">
              Terminées ({doneTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo">
            <Card>
              <CardHeader>
                <CardTitle>Interventions à faire</CardTitle>
                <CardDescription>
                  Tickets qui vous ont été assignés
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todoTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune intervention en attente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todoTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/technician/jobs/${ticket.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{ticket.ticket_number}</span>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            {ticket.priority === 'urgent' && (
                              <Badge variant="destructive">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.device_name} - {ticket.symptoms.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="working">
            <Card>
              <CardHeader>
                <CardTitle>Interventions en cours</CardTitle>
                <CardDescription>
                  Tickets sur lesquels vous travaillez actuellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workingTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune intervention en cours
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workingTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/technician/jobs/${ticket.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{ticket.ticket_number}</span>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.device_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done">
            <Card>
              <CardHeader>
                <CardTitle>Interventions terminées</CardTitle>
                <CardDescription>
                  Historique de vos interventions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doneTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune intervention terminée
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doneTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/technician/jobs/${ticket.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{ticket.ticket_number}</span>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.device_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TechnicianDashboard;
