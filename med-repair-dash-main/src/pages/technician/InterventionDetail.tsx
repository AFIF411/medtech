import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Send, MessageCircle, CheckCircle, PlayCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Ticket, TicketMessage } from '@/types';

const InterventionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchTicketData();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('ticket_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${id}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchTicketData = async () => {
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        supabase.from('tickets').select('*').eq('id', id).single(),
        supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
      ]);

      if (ticketRes.error) throw ticketRes.error;
      if (messagesRes.error) throw messagesRes.error;

      setTicket(ticketRes.data);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Error fetching ticket data:', error);
      toast.error('Erreur lors du chargement de l\'intervention');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
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
      toast.success('Message envoyé');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const updateStatus = async (newStatus: 'working' | 'resolved') => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success(newStatus === 'working' ? 'Intervention commencée' : 'Intervention marquée comme résolue');
      fetchTicketData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigné';
      case 'working': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Clôturé';
      default: return status;
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
          <p className="text-muted-foreground">Intervention non trouvée</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/technician/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{ticket.ticket_number}</CardTitle>
                <CardDescription className="mt-2">
                  Assigné le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              <Badge>
                {getStatusLabel(ticket.status)}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              {ticket.status === 'assigned' && (
                <Button 
                  onClick={() => updateStatus('working')}
                  className="flex-1"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Commencer l'intervention
                </Button>
              )}
              
              {ticket.status === 'working' && (
                <>
                  <Button 
                    onClick={() => updateStatus('resolved')}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer comme résolu
                  </Button>
                </>
              )}

              {ticket.status === 'resolved' && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span>Intervention terminée</span>
                </div>
              )}
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
              Communiquez avec l'équipe support et l'hôpital
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
                  placeholder="Écrire un message..."
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
    </DashboardLayout>
  );
};

export default InterventionDetail;
