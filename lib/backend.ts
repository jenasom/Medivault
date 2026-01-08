import { User, StoredFile } from '../types';

// Constants for LocalStorage Keys (Our "Database Tables")
const DB_USERS_KEY = 'medivault_users';
const DB_FILES_KEY = 'medivault_files';

// Initial Seed Data
const DEFAULT_ADMIN: User = { 
  username: 'admin', 
  password: 'password123', 
  email: 'admin@medivault.com' 
};

// --- Database Helpers (Low-level DB operations) ---

const getTable = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Database Error reading ${key}:`, error);
    return [];
  }
};

const saveTable = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Database Error writing ${key}:`, error);
  }
};

// Initialize DB with admin if empty
if (getTable(DB_USERS_KEY).length === 0) {
  saveTable(DB_USERS_KEY, [DEFAULT_ADMIN]);
}

// --- Backend Services (API Layer) ---

export const AuthService = {
  async login(credentials: User): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getTable<User>(DB_USERS_KEY);
    const user = users.find(u => u.username === credentials.username && u.password === credentials.password);

    if (!user) {
      throw new Error("Invalid username or password");
    }
    
    // Return user without password for security simulation
    const { password, ...safeUser } = user;
    return safeUser as User;
  },

  async register(newUser: User): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = getTable<User>(DB_USERS_KEY);
    
    if (users.some(u => u.username === newUser.username)) {
      throw new Error("Username is already taken");
    }

    users.push(newUser);
    saveTable(DB_USERS_KEY, users);

    const { password, ...safeUser } = newUser;
    return safeUser as User;
  }
};

export const FileService = {
  async getAllFiles(): Promise<StoredFile[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const rawFiles = getTable<any>(DB_FILES_KEY);
    
    // Hydrate the data (convert string dates back to Date objects)
    // Note: LocalStorage cannot store actual File blobs safely due to size limits.
    // We reconstruct a dummy file object for the UI if the session was refreshed.
    return rawFiles.map(f => ({
      ...f,
      uploadDate: new Date(f.uploadDate),
      content: new File(["(File content unavailable in demo persistence mode)"], f.name, { type: f.type }) 
    }));
  },

  async uploadFiles(newFiles: StoredFile[]): Promise<StoredFile[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const existingFiles = getTable<StoredFile>(DB_FILES_KEY);
    
    // We only store metadata in localStorage to avoid quota limits
    const filesToStore = newFiles.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      uploadDate: f.uploadDate,
      medicalCourse: f.medicalCourse
      // We intentionally skip 'content' here
    }));

    const updatedDatabase = [...existingFiles, ...filesToStore];
    saveTable(DB_FILES_KEY, updatedDatabase);

    return newFiles; // Return the full objects (with content) for the current session
  },

  async deleteFile(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const files = getTable<StoredFile>(DB_FILES_KEY);
    const filtered = files.filter(f => f.id !== id);
    saveTable(DB_FILES_KEY, filtered);
  }
};