import React from 'react';
import { ShieldCheck, FileText, Database, ArrowRight, FileHeart } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onGendocAccess: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onGendocAccess }) => {
  return (
    <div className="relative overflow-hidden bg-medical-50 pt-16 pb-32">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-medical-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            HIPAA Compliant Standard
          </div>
          <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl mb-6">
            Secure Cloud Storage for <br/>
            <span className="text-medical-600">Medical Professionals</span>
          </h1>
          <p className="mt-4 max-w-md mx-auto text-base text-slate-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Store, manage, and share sensitive patient records, PDFs, and medical documentation with enterprise-grade encryption and ease.
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:max-w-none flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-medical-600 hover:bg-medical-700 md:py-4 md:text-lg md:px-10 shadow-xl shadow-medical-200 transition-all hover:scale-105"
            >
              Access Portal
              <ArrowRight className="ml-2 -mr-1" size={20} />
            </button>
            
            {/* GENDOC Button */}
            <button
              onClick={onGendocAccess}
              className="w-full flex items-center justify-center px-8 py-3 border border-teal-200 bg-white text-base font-medium rounded-full text-teal-700 hover:bg-teal-50 hover:border-teal-300 md:py-4 md:text-lg md:px-10 shadow-sm transition-all hover:scale-105"
            >
              <FileHeart className="mr-2" size={20} />
              GENDOC Guest
            </button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="text-teal-600" size={32} />}
            title="Secure Encryption"
            description="End-to-end encryption ensures your medical data remains private and compliant."
          />
          <FeatureCard
            icon={<FileText className="text-medical-600" size={32} />}
            title="Universal Format"
            description="Support for DICOM, PDF, DOCX, and specialized medical imaging formats."
          />
          <FeatureCard
            icon={<Database className="text-indigo-600" size={32} />}
            title="Instant Retrieval"
            description="Powerful indexing allows you to find patient records in milliseconds."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);