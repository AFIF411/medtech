
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('hospital', 'admin', 'technician');

-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('received', 'processing', 'assigned', 'working', 'resolved', 'closed');

-- Create enum for ticket type
CREATE TYPE public.ticket_type AS ENUM ('consultation', 'quote', 'intervention');

-- Create enum for priority
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role app_role NOT NULL,
  is_validated BOOLEAN DEFAULT FALSE,
  hospital_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  hospital_id UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_technician_id UUID REFERENCES public.profiles(id),
  device_name TEXT NOT NULL,
  device_model TEXT,
  serial_number TEXT,
  symptoms TEXT NOT NULL,
  priority priority_level DEFAULT 'medium',
  ticket_type ticket_type NOT NULL,
  status ticket_status DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create ticket_messages table
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create ticket_files table
CREATE TABLE public.ticket_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_files ENABLE ROW LEVEL SECURITY;

-- Create interventions table
CREATE TABLE public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  technician_id UUID REFERENCES public.profiles(id) NOT NULL,
  work_done TEXT NOT NULL,
  parts_replaced TEXT,
  duration_minutes INTEGER,
  signature_data TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Trigger to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_validated)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'role')::app_role,
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role')::app_role = 'technician' THEN FALSE
      ELSE TRUE
    END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE SEQUENCE ticket_number_seq;

CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tickets
CREATE POLICY "Hospitals can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = hospital_id);

CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view assigned tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = assigned_technician_id);

CREATE POLICY "Hospitals can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = hospital_id);

CREATE POLICY "Admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can update assigned tickets"
  ON public.tickets FOR UPDATE
  USING (auth.uid() = assigned_technician_id);

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages for their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND (t.hospital_id = auth.uid() OR t.assigned_technician_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create messages for their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = ticket_id
        AND (t.hospital_id = auth.uid() OR t.assigned_technician_id = auth.uid())
      ) OR public.has_role(auth.uid(), 'admin')
    )
  );

-- RLS Policies for ticket_files
CREATE POLICY "Users can view files for their tickets"
  ON public.ticket_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND (t.hospital_id = auth.uid() OR t.assigned_technician_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can upload files for their tickets"
  ON public.ticket_files FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND (
      EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = ticket_id
        AND (t.hospital_id = auth.uid() OR t.assigned_technician_id = auth.uid())
      ) OR public.has_role(auth.uid(), 'admin')
    )
  );

-- RLS Policies for interventions
CREATE POLICY "Technicians can view their interventions"
  ON public.interventions FOR SELECT
  USING (auth.uid() = technician_id);

CREATE POLICY "Admins can view all interventions"
  ON public.interventions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hospitals can view interventions for their tickets"
  ON public.interventions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.hospital_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can create interventions"
  ON public.interventions FOR INSERT
  WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "Technicians can update their interventions"
  ON public.interventions FOR UPDATE
  USING (auth.uid() = technician_id);
