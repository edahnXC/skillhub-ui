export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'InProgress' | 'WaitingOnUser' | 'Resolved' | 'Closed';
export type TicketCategory = 'CourseContent' | 'PaymentBilling' | 'AccountAccess' | 'TechnicalIssue' | 'GeneralInquiry';

export interface TicketMessage {
  id: number;
  ticketId: number;
  senderUserId: number;
  senderName: string;
  senderRole: string;
  messageText: string;
  isInternalNote: boolean;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  ticketNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  subject: string;
  category: TicketCategory | string;
  priority: TicketPriority | string;
  status: TicketStatus | string;
  assignedAdminId?: number | null;
  assignedAdminName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  resolvedAt?: string | null;
  messagesCount: number;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: TicketMessage[];
}

export interface CreateTicketRequest {
  subject: string;
  category: string;
  priority: string;
  initialMessage: string;
  attachmentUrl?: string | null;
}

export interface AddTicketMessageRequest {
  messageText: string;
  isInternalNote: boolean;
  attachmentUrl?: string | null;
}

export interface UpdateTicketStatusRequest {
  status: string;
}

export interface AssignTicketRequest {
  assignedAdminId?: number | null;
}
