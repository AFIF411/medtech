import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Users, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Profile } from '@/types';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TicketsList from '@/components/admin/TicketsList';
import TechniciansValidation from '@/components/admin/TechniciansValidation';
import MaintenanceRequests from '@/components/admin/MaintenanceRequests';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, techniciansRes] = await Promise.all([
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'technician'),
      ]);

      if (ticketsRes.error) throw ticketsRes.error;
      if (techniciansRes.error) throw techniciansRes.error;

      setTickets(ticketsRes.data || []);
      setTechnicians(techniciansRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    pendingTechnicians: technicians.filter(t => !t.is_validated).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.adminSpace')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.overview')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('tickets.total')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.openTickets')}</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.resolvedTickets')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.pendingTechnicians')}</CardTitle>
              <Users className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTechnicians}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">{t('tickets.title')}</TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="w-4 h-4 mr-2" />
              {t('maintenance.request')}
            </TabsTrigger>
            <TabsTrigger value="technicians">
              {t('auth.technician')}
              {stats.pendingTechnicians > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-warning text-warning-foreground rounded-full text-xs">
                  {stats.pendingTechnicians}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <TicketsList tickets={tickets} onUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceRequests />
          </TabsContent>

          <TabsContent value="technicians" className="space-y-4">
            <TechniciansValidation technicians={technicians} onUpdate={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
