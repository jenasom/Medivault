import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AuthModal } from './components/Auth';
import { FileManager } from './components/FileManager';
import { MedicalAssistant } from './components/MedicalAssistant';
import { User, StoredFile, AppView } from './types';
import { v4 as uuidv4 } from 'uuid'; // Normally use uuid library, but for simplicity here we'll mock it

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
  
  // Mock Database for Registered Users
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([
    { username: 'admin', password: 'password123', email: 'admin@medivault.com' }
  ]);
  
  // File System State
  const [files, setFiles] = useState<StoredFile[]>([]);
  
  // Global Search State
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Handlers
  const handleLogin = (credentials: User) => {
    // Basic verification against mock database
    const foundUser = registeredUsers.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (foundUser) {
      setUser(foundUser);
      setIsAuthModalOpen(false);
      setCurrentView(AppView.DASHBOARD);
    } else {
      throw new Error("Invalid username or password");
    }
  };

  const handleRegister = (newUser: User) => {
    // Check if user already exists
    if (registeredUsers.some(u => u.username === newUser.username)) {
      throw new Error("Username is already taken");
    }

    setRegisteredUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setIsAuthModalOpen(false);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    setGlobalSearchTerm('');
    setCurrentView(AppView.LANDING);
  };

  const handleUpload = (uploadedFiles: File[]) => {
    const newFiles: StoredFile[] = uploadedFiles.map(file => ({
      id: generateId(),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadDate: new Date(),
      medicalCourse: MEDICAL_COURSES[Math.floor(Math.random() * MEDICAL_COURSES.length)], // Randomly assign for demo
      content: file
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
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

      {/* Only show AI assistant on Dashboard or if requested, here we show globally for demo but visually it fits best in dashboard */}
      {currentView === AppView.DASHBOARD && <MedicalAssistant />}
      
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MediVault Systems. All rights reserved.</p>
          <p className="mt-2 text-xs">HIPAA Compliant • Secure 256-bit Encryption</p>
        </div>
      </footer>
    </div>
  );
};

export default App;