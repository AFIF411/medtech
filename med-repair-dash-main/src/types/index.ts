export type AppRole = 'hospital' | 'admin' | 'technician';

export type TicketStatus = 
  | 'received' 
  | 'processing' 
  | 'assigned' 
  | 'working' 
  | 'resolved' 
  | 'closed';

export type TicketType = 'consultation' | 'quote' | 'intervention';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
  is_validated: boolean;
  hospital_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  hospital_id: string;
  assigned_technician_id: string | null;
  device_name: string;
  device_model: string | null;
  serial_number: string | null;
  symptoms: string;
  priority: PriorityLevel;
  ticket_type: TicketType;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface TicketFile {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Intervention {
  id: string;
  ticket_id: string;
  technician_id: string;
  work_done: string;
  parts_replaced: string | null;
  duration_minutes: number | null;
  signature_data: string | null;
  completed_at: string;
}
