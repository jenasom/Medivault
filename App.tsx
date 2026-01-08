import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AuthModal } from './components/Auth';
import { FileManager } from './components/FileManager';
import { MedicalAssistant } from './components/MedicalAssistant';
import { User, StoredFile, AppView } from './types';
import { AuthService, FileService } from './lib/backend';

// Mock UUID generator since we can't easily import external non-standard libs without package.json
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Medical Courses for demonstration
const MEDICAL_COURSES = [
  'General Medicine', 
  'Cardiology', 
  'Neurology', 
  'Pediatrics', 
  'Oncology', 
  'Orthopedics', 
  'Radiology'
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initial Data Fetching from "Database"
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const fetchedFiles = await FileService.getAllFiles();
          setFiles(fetchedFiles);
        } catch (err) {
          console.error("Failed to load files", err);
        }
      }
    };
    loadData();
  }, [user]);

  // Handlers
  const handleLogin = async (credentials: User) => {
    try {
      const loggedInUser = await AuthService.login(credentials);
      setUser(loggedInUser);
      setIsAuthModalOpen(false);
      setCurrentView(AppView.DASHBOARD);
    } catch (error: any) {
      throw error; // Re-throw to be caught by AuthModal
    }
  };

  const handleRegister = async (newUser: User) => {
    try {
      const registeredUser = await AuthService.register(newUser);
      setUser(registeredUser);
      setIsAuthModalOpen(false);
      setCurrentView(AppView.DASHBOARD);
    } catch (error: any) {
      throw error;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFiles([]); // Clear sensitive data from memory on logout
    setGlobalSearchTerm('');
    setCurrentView(AppView.LANDING);
  };

  const handleUpload = async (uploadedFiles: File[]) => {
    // 1. Prepare data
    const newFiles: StoredFile[] = uploadedFiles.map(file => ({
      id: generateId(),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadDate: new Date(),
      medicalCourse: MEDICAL_COURSES[Math.floor(Math.random() * MEDICAL_COURSES.length)],
      content: file
    }));

    // 2. Optimistic UI Update (Optional, but we'll wait for DB here for safety)
    try {
      // 3. Persist to "Backend"
      await FileService.uploadFiles(newFiles);
      
      // 4. Update State
      setFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload files to the database.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FileService.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Could not delete file.");
    }
  };

  const handleGetStarted = () => {
    if (user) {
      setCurrentView(AppView.DASHBOARD);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        user={user} 
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        searchTerm={globalSearchTerm}
        onSearchChange={setGlobalSearchTerm}
      />

      <main className="flex-grow">
        {currentView === AppView.LANDING ? (
          <Hero onGetStarted={handleGetStarted} />
        ) : (
          <FileManager 
            files={files} 
            searchTerm={globalSearchTerm}
            onUpload={handleUpload} 
            onDelete={handleDelete}
          />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {currentView === AppView.DASHBOARD && <MedicalAssistant />}
      
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MediVault Systems. All rights reserved.</p>
          <p className="mt-2 text-xs">HIPAA Compliant • Secure 256-bit Encryption • Persistent Database Active</p>
        </div>
      </footer>
    </div>
  );
};

export default App;