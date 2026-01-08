import React, { useState, useRef, useMemo } from 'react';
import { UploadCloud, File, FileText, Download, Trash2, Search, Plus, ArrowUp, ArrowDown, ArrowUpDown, CheckCircle } from 'lucide-react';
import { StoredFile } from '../types';

interface FileManagerProps {
  files: StoredFile[];
  searchTerm: string;
  onUpload: (files: File[]) => void;
  onDelete: (id: string) => void;
}

type SortKey = 'name' | 'medicalCourse' | 'size' | 'uploadDate';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export const FileManager: React.FC<FileManagerProps> = ({ files, searchTerm, onUpload, onDelete }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'uploadDate', direction: 'desc' });
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateUploads = (newFiles: File[]) => {
    const newUploads = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    newUploads.forEach(uploadItem => {
      let currentProgress = 0;
      // Simulate upload speed variability
      const speed = 5 + Math.random() * 15; 
      
      const interval = setInterval(() => {
        currentProgress += speed;
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          setUploadingFiles(prev => prev.map(item => 
            item.id === uploadItem.id ? { ...item, progress: 100, status: 'success' } : item
          ));

          // Notify parent to add to main list immediately upon completion
          onUpload([uploadItem.file]);

          // Remove from upload list after a delay to show success state
          setTimeout(() => {
             setUploadingFiles(prev => prev.filter(item => item.id !== uploadItem.id));
          }, 1500);
        } else {
           setUploadingFiles(prev => prev.map(item => 
            item.id === uploadItem.id ? { ...item, progress: currentProgress } : item
          ));
        }
      }, 200);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUploads(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      simulateUploads(Array.from(e.target.files));
      // Reset input so same file can be selected again if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDownload = (file: StoredFile) => {
    const url = URL.createObjectURL(file.content);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedFiles = useMemo(() => {
    // First filter using props searchTerm
    const filtered = files.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.medicalCourse.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Then sort
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [files, searchTerm, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-medical-600" />
      : <ArrowDown size={14} className="ml-1 text-medical-600" />;
  };

  const SortableHeader = ({ label, columnKey, className = "" }: { label: string, columnKey: SortKey, className?: string }) => (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 hover:text-medical-600 transition-colors select-none ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Documents</h2>
          <p className="text-slate-500 mt-1">Manage, sort, and secure your medical files.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Upload New</span>
          </button>
        </div>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 mb-8 text-center transition-all ${
          dragActive 
            ? 'border-medical-500 bg-medical-50 scale-[1.01]' 
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          className="hidden" 
          onChange={handleChange} 
          accept=".pdf,.doc,.docx,.jpg,.png"
        />
        <div className="flex flex-col items-center justify-center cursor-pointer" onClick={() => inputRef.current?.click()}>
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <UploadCloud className="text-medical-500" size={32} />
          </div>
          <p className="text-lg font-medium text-slate-700">Click to upload or drag and drop</p>
          <p className="text-sm text-slate-500 mt-1">PDF, DOC, DOCX, JPG or PNG (Max 10MB)</p>
        </div>
      </div>

      {/* Upload Progress Section */}
      {uploadingFiles.length > 0 && (
        <div className="mb-8 space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-600 px-1">Uploading {uploadingFiles.length} file{uploadingFiles.length !== 1 ? 's' : ''}...</h3>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="bg-medical-50 p-2 rounded-lg text-medical-600">
                <File size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 truncate pr-2">{file.file.name}</span>
                  <span className={`text-xs font-semibold ${file.status === 'success' ? 'text-teal-600' : 'text-slate-500'}`}>
                    {file.status === 'success' ? 'Completed' : `${Math.round(file.progress)}%`}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ease-out ${
                      file.status === 'success' ? 'bg-teal-500' : 'bg-medical-500'
                    }`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
              {file.status === 'success' && (
                <div className="flex-shrink-0 animate-scale-in">
                  <CheckCircle className="text-teal-500" size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {files.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <File className="text-slate-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No documents yet</h3>
            <p className="text-slate-500 mt-1">Upload patient records to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <SortableHeader label="Document Name" columnKey="name" />
                  <SortableHeader label="Medical Course" columnKey="medicalCourse" />
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <SortableHeader label="Size" columnKey="size" />
                  <SortableHeader label="Uploaded" columnKey="uploadDate" />
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAndSortedFiles.length > 0 ? (
                  filteredAndSortedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-medical-50 text-medical-600">
                            <FileText size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{file.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {file.medicalCourse}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {file.uploadDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleDownload(file)}
                            className="text-medical-600 hover:text-medical-900 transition-colors p-1 hover:bg-medical-50 rounded"
                            title="Download"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => onDelete(file.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No documents found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};