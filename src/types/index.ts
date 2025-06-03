export interface Candidate {
  id?: string;
  name: string;
  phoneNumber: string;
  email: string;
  resumeLink: string;
  currentCompany: string;
  experience: string;
  skills: string[];
  expectedSalary: string;
  location: string;
  notes: string;
  customFields?: Record<string, string>;
  createdAt?: string;
}

export interface VisibilityToggle {
  client: boolean;
  internal: boolean;
  superiors: boolean;
}

export interface FieldVisibility {
  [key: string]: VisibilityToggle;
}

export interface RecipientSelections {
  candidateId: string;
  fieldVisibility: FieldVisibility;
}

export interface EmailContent {
  recipientType: 'client' | 'internal' | 'superiors';
  recipientEmail: string;
  subject?: string;
  content?: string;
}

export interface EmailDraft {
  candidateId: string;
  emailContent: Record<string, EmailContent>;
  createdAt: string;
  updatedAt: string;
}

export type RecipientType = 'client' | 'internal' | 'superiors';