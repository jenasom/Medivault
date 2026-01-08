import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AuthModal } from './components/Auth';
import { FileManager } from './components/FileManager';
import { MedicalAssistant } from './components/MedicalAssistant';
import { User, StoredFile, AppView } from './types';
import { AuthService, FileService } from './lib/backend';
import { GoogleGenAI } from "@google/genai";

// Mock UUID generator since we can't easily import external non-standard libs without package.json
const generateId = () => Math.random().toString(36).substr(2, 9);

// Medical Courses for classification
const MEDICAL_COURSES = [
  'General Medicine', 
  'Cardiology', 
  'Neurology', 
  'Pediatrics', 
  'Oncology', 
  'Orthopedics', 
  'Radiology'
];

// --- Classification Logic ---

const classifyFileLocal = (filename: string): string => {
  const lower = filename.toLowerCase();
  if (lower.match(/heart|cardio|ecg|ekg|vascular|bp|aorta/)) return 'Cardiology';
  if (lower.match(/brain|neuro|stroke|spine|nerve|head|mental/)) return 'Neurology';
  if (lower.match(/child|ped|infant|baby|growth|vaccine/)) return 'Pediatrics';
  if (lower.match(/cancer|tumor|chemo|onco|mass|biopsy|malignant/)) return 'Oncology';
  if (lower.match(/bone|fracture|ortho|knee|joint|hip|muscle/)) return 'Orthopedics';
  if (lower.match(/xray|x-ray|mri|ct|scan|ultrasound|image|dicom/)) return 'Radiology';
  return 'General Medicine';
};

const classifyDocument = async (file: File): Promise<string> => {
  // 1. Try AI Classification if Key exists
  if (process.env.API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a medical records administrator. 
        Classify the following document into exactly one of these categories: 
        ${MEDICAL_COURSES.join(', ')}. 
        
        Rules:
        1. Analyze the filename and file type.
        2. If the name contains specific medical terms, map them to the correct specialty.
        3. If it is generic (e.g., "report.pdf"), choose "General Medicine".
        4. Return ONLY the category name string. No markdown, no punctuation.

        Filename: "${file.name}"
        MIME Type: "${file.type}"`,
      });
      
      const text = response.text?.trim();
      // Validate the AI output matches our known courses
      if (text && MEDICAL_COURSES.some(c => c.toLowerCase() === text.toLowerCase())) {
        // Return the matching case-correct string from our array
        return MEDICAL_COURSES.find(c => c.toLowerCase() === text.toLowerCase()) || 'General Medicine';
      }
    } catch (e) {
      console.warn("AI Classification failed, falling back to local heuristics", e);
    }
  }
  
  // 2. Fallback to Local Heuristics
  return classifyFileLocal(file.name);
};

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
    // 1. Process files with intelligent classification
    const newFiles: StoredFile[] = await Promise.all(uploadedFiles.map(async (file) => {
      const category = await classifyDocument(file);
      
      return {
        id: generateId(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadDate: new Date(),
        medicalCourse: category, // Determined by AI or Heuristics
        content: file
      };
    }));

    // 2. Persist to "Backend" & Update State
    try {
      await FileService.uploadFiles(newFiles);
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