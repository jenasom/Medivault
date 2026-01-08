import { createClient } from '@supabase/supabase-js';
import { User, StoredFile } from '../types';

// --- CONFIGURATION ---
// To enable Cross-Device Login:
// 1. Create a project at https://supabase.com
// 2. Add your SUPABASE_URL and SUPABASE_ANON_KEY to your environment variables
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Check if Cloud Mode is possible
export const isCloudEnabled = !!(SUPABASE_URL && SUPABASE_KEY);

// Initialize Supabase Client if keys exist
const supabase = isCloudEnabled 
  ? createClient(SUPABASE_URL!, SUPABASE_KEY!) 
  : null;

// --- LOCAL STORAGE IMPLEMENTATION (Fallback) ---
const DB_USERS_KEY = 'medivault_users';
const DB_FILES_KEY = 'medivault_files';

const DEFAULT_ADMIN: User = { 
  username: 'admin', 
  password: 'password123', 
  email: 'admin@medivault.com' 
};

// Initialize Local DB
if (!isCloudEnabled) {
  try {
    const localUsers = localStorage.getItem(DB_USERS_KEY);
    if (!localUsers || JSON.parse(localUsers).length === 0) {
      localStorage.setItem(DB_USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
    }
  } catch (e) {
    console.error("Local storage init error", e);
  }
}

const LocalBackend = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_USERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveUsers: (users: User[]) => localStorage.setItem(DB_USERS_KEY, JSON.stringify(users)),
  getFiles: (): any[] => {
    const data = localStorage.getItem(DB_FILES_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveFiles: (files: any[]) => localStorage.setItem(DB_FILES_KEY, JSON.stringify(files))
};

// --- SERVICE LAYER ---

export const AuthService = {
  async login(credentials: User): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency

    if (isCloudEnabled && supabase) {
      // Cloud Login
      // For demo purposes, we map username to a fake email if email isn't provided
      // In a real app, you'd ask for email directly.
      const emailToUse = credentials.email || `${credentials.username.replace(/\s+/g, '').toLowerCase()}@medivault.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: credentials.password || ''
      });

      if (error) throw new Error(error.message);
      
      return {
        username: credentials.username, // Supabase user metadata would usually hold this
        email: data.user.email
      };
    } else {
      // Local Login
      const users = LocalBackend.getUsers();
      const user = users.find(u => u.username === credentials.username && u.password === credentials.password);
      if (!user) throw new Error("Invalid username or password");
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
  },

  async register(newUser: User): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isCloudEnabled && supabase) {
      // Cloud Registration
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email!,
        password: newUser.password!,
        options: {
          data: { username: newUser.username }
        }
      });

      if (error) throw new Error(error.message);
      
      return {
        username: newUser.username,
        email: newUser.email
      };
    } else {
      // Local Registration
      const users = LocalBackend.getUsers();
      if (users.some(u => u.username === newUser.username)) throw new Error("Username is already taken");
      users.push(newUser);
      LocalBackend.saveUsers(users);
      const { password, ...safeUser } = newUser;
      return safeUser as User;
    }
  }
};

export const FileService = {
  async getAllFiles(): Promise<StoredFile[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isCloudEnabled && supabase) {
      // Cloud Fetch
      const { data, error } = await supabase.from('files').select('*');
      if (error) {
        console.warn("Could not fetch files from Supabase (Ensure 'files' table exists):", error.message);
        return [];
      }
      return data?.map((f: any) => ({
        ...f,
        uploadDate: new Date(f.created_at),
        content: new File(["(Cloud Content)"], f.name, { type: f.type })
      })) || [];
    } else {
      // Local Fetch
      const rawFiles = LocalBackend.getFiles();
      return rawFiles.map(f => ({
        ...f,
        uploadDate: new Date(f.uploadDate),
        content: new File(["(File content unavailable in demo persistence mode)"], f.name, { type: f.type }) 
      }));
    }
  },

  async uploadFiles(newFiles: StoredFile[]): Promise<StoredFile[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isCloudEnabled && supabase) {
      // Cloud Upload (Metadata only for this demo)
      // In a real app, you would upload to supabase.storage first
      const rows = newFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        medical_course: f.medicalCourse,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase.from('files').insert(rows);
      if (error) throw new Error("Database Upload Failed: " + error.message);
      
      return newFiles;
    } else {
      // Local Upload
      const existingFiles = LocalBackend.getFiles();
      const filesToStore = newFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        uploadDate: f.uploadDate,
        medicalCourse: f.medicalCourse
      }));
      LocalBackend.saveFiles([...existingFiles, ...filesToStore]);
      return newFiles;
    }
  },

  async deleteFile(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (isCloudEnabled && supabase) {
      // Cloud Delete
      // Note: Assuming 'id' matches the UUID in postgres
      await supabase.from('files').delete().match({ id });
    } else {
      // Local Delete
      const files = LocalBackend.getFiles();
      const filtered = files.filter(f => f.id !== id);
      LocalBackend.saveFiles(filtered);
    }
  }
};