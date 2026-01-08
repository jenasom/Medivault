export interface User {
  username: string;
  email?: string;
  password?: string; // Added for mock auth validation
}

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  medicalCourse: string;
  content: File; // In a real app, this would be a URL or blob reference
}

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}