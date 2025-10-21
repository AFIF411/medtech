import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Send, UserPlus, MessageCircle } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Ticket, Profile, TicketMessage } from '@/types';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketData();
    }
  }, [id]);

  const fetchTicketData = async () => {
    try {
      const [ticketRes, messagesRes, techniciansRes] = await Promise.all([
        supabase.from('tickets').select('*').eq('id', id).single(),
        supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('role', 'technician').eq('is_validated', true),
      ]);

      if (ticketRes.error) throw ticketRes.error;
      if (messagesRes.error) throw messagesRes.error;
      if (techniciansRes.error) throw techniciansRes.error;

      setTicket(ticketRes.data);
      setMessages(messagesRes.data || []);
      setTechnicians(techniciansRes.data || []);
    } catch (error) {
      console.error('Error fetching ticket data:', error);
      toast.error('Erreur lors du chargement du ticket');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !ticket) return;

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: ticket.id,
          sender_id: user.id,
          message: newMessage,
        }] as any);

      if (error) throw error;

      setNewMessage('');
      fetchTicketData();
      toast.success('Message envoyé');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const assignTechnician = async () => {
    if (!selectedTechnician || !ticket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          assigned_technician_id: selectedTechnician,
          status: 'assigned',
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success('Technicien assigné avec succès');
      setAssignDialogOpen(false);
      fetchTicketData();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const updateStatus = async (newStatus: 'received' | 'processing' | 'assigned' | 'working' | 'resolved' | 'closed') => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success('Statut mis à jour');
      fetchTicketData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'quote': return 'Devis';
      case 'intervention': return 'Intervention';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'quote': return 'bg-purple-100 text-purple-800';
      case 'intervention': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Ticket non trouvé</p>
        </div>
      </DashboardLayout>
    );
  }

  const isConsultationOrQuote = ticket.ticket_type === 'consultation' || ticket.ticket_type === 'quote';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{ticket.ticket_number}</CardTitle>
                    <CardDescription className="mt-2">
                      Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </div>
                  <Badge className={getTypeColor(ticket.ticket_type)}>
                    {getTypeLabel(ticket.ticket_type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Appareil</h3>
                  <p className="text-muted-foreground">{ticket.device_name}</p>
                  {ticket.device_model && (
                    <p className="text-sm text-muted-foreground">Modèle: {ticket.device_model}</p>
                  )}
                  {ticket.serial_number && (
                    <p className="text-sm text-muted-foreground">N° série: {ticket.serial_number}</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description du problème</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{ticket.symptoms}</p>
                </div>

                <div className="flex gap-2">
                  <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    Priorité: {ticket.priority}
                  </Badge>
                  <Badge variant="outline">
                    Statut: {ticket.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Messagerie
                </CardTitle>
                <CardDescription>
                  {isConsultationOrQuote 
                    ? 'Communiquez avec l\'hôpital pour fournir le conseil ou le devis'
                    : 'Historique des messages'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun message pour le moment
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground ml-8'
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder={isConsultationOrQuote ? "Écrivez votre réponse à l'hôpital..." : "Écrire un message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isConsultationOrQuote ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ce ticket nécessite une réponse par message à l'hôpital.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => updateStatus('processing')}
                      disabled={ticket.status === 'processing'}
                    >
                      Marquer comme en traitement
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={() => updateStatus('resolved')}
                      disabled={ticket.status === 'resolved'}
                    >
                      Marquer comme résolu
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ce ticket nécessite l'intervention d'un technicien.
                    </p>
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={!!ticket.assigned_technician_id}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {ticket.assigned_technician_id ? 'Technicien assigné' : 'Assigner un technicien'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assigner un technicien</DialogTitle>
                          <DialogDescription>
                            Sélectionnez un technicien validé pour cette intervention
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un technicien" />
                            </SelectTrigger>
                            <SelectContent>
                              {technicians.map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>
                                  {tech.full_name} - {tech.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            className="w-full" 
                            onClick={assignTechnician}
                            disabled={!selectedTechnician}
                          >
                            Confirmer l'assignation
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {ticket.assigned_technician_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Technicien assigné</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">
                    ID: {ticket.assigned_technician_id.substring(0, 8)}...
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetail;
