-- Ajouter un champ status à la table equipment_maintenance
ALTER TABLE public.equipment_maintenance 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'));

-- Mettre à jour la politique admin pour permettre les updates
CREATE POLICY "Admins can update maintenance records"
  ON public.equipment_maintenance
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));