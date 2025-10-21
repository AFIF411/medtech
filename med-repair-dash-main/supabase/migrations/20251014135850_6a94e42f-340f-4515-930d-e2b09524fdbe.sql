-- Créer la table pour le suivi de maintenance des équipements
CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES auth.users(id),
  device_name TEXT NOT NULL,
  device_model TEXT,
  serial_number TEXT,
  maintenance_type TEXT NOT NULL, -- 'filter_change', 'battery_change', 'calibration', 'cleaning', 'other'
  description TEXT NOT NULL,
  next_maintenance_date DATE,
  cost DECIMAL(10, 2),
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;

-- Politique pour que les hôpitaux puissent créer leurs propres enregistrements
CREATE POLICY "Hospitals can create their maintenance records"
  ON public.equipment_maintenance
  FOR INSERT
  WITH CHECK (auth.uid() = hospital_id);

-- Politique pour que les hôpitaux puissent voir leurs propres enregistrements
CREATE POLICY "Hospitals can view their maintenance records"
  ON public.equipment_maintenance
  FOR SELECT
  USING (auth.uid() = hospital_id);

-- Politique pour que les admins puissent voir tous les enregistrements
CREATE POLICY "Admins can view all maintenance records"
  ON public.equipment_maintenance
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique pour que les hôpitaux puissent mettre à jour leurs propres enregistrements
CREATE POLICY "Hospitals can update their maintenance records"
  ON public.equipment_maintenance
  FOR UPDATE
  USING (auth.uid() = hospital_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_equipment_maintenance_updated_at
  BEFORE UPDATE ON public.equipment_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();