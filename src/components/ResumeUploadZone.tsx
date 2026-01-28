import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResumeUploadZoneProps {
  compact?: boolean;
}

export const ResumeUploadZone: React.FC<ResumeUploadZoneProps> = ({ compact = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null);
      setUploadSuccess(false);

      // Check file type (PDF or DOCX)
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or DOCX file.');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      setFile(file);
      // Auto-upload simulation for better UX flow in compact mode
      if (compact) {
        setTimeout(() => {
          setUploading(false);
          setUploadSuccess(true);
          console.log('File uploaded:', file.name);
        }, 1500);
        setUploading(true);
      }
    },
    [compact]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndSetFile(e.dataTransfer.files[0]);
      }
    },
    [validateAndSetFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    // Simulate upload delay
    setTimeout(() => {
      setUploading(false);
      setUploadSuccess(true);
      // Here you would normally send the file to backend
      console.log('File uploaded:', file.name);
    }, 2000);
  };

  const clearFile = () => {
    setFile(null);
    setUploadSuccess(false);
    setError(null);
  };

  // -- Compact Layout --
  if (compact) {
    return (
      <div className="w-full">
        {!file && (
          <div
            className={cn(
              'relative flex items-center gap-4 px-4 py-3 rounded-lg border-2 border-dashed transition-all cursor-pointer group',
              dragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              accept=".pdf,.docx"
              disabled={uploading || uploadSuccess}
            />
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Upload size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Click to upload resume</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                PDF or DOCX • Max 5MB
              </p>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {file && uploading && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/50 rounded-lg border border-white/5 animate-pulse">
            <Loader2 size={20} className="text-cyan-400 animate-spin" />
            <div>
              <p className="text-sm text-white">Uploading {file.name}...</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {file && uploadSuccess && (
          <div className="flex items-center justify-between px-4 py-3 bg-green-900/20 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-400" />
              <div>
                <p className="text-sm font-bold text-green-200">Resume uploaded</p>
                <p className="text-xs text-green-200/60 max-w-[200px] truncate">{file.name}</p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="text-xs text-green-400 hover:text-green-200 underline"
            >
              Replace
            </button>
          </div>
        )}
        {error && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 animate-fade-in">
            <AlertCircle size={12} />
            {error}
          </div>
        )}
      </div>
    );
  }

  // -- Standard Layout --
  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-400/10'
            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".pdf,.docx"
          disabled={uploading || uploadSuccess}
        />

        {!file && !uploadSuccess && (
          <>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-cyan-500/20 transition-colors">
              <Upload size={24} className="text-gray-400 group-hover:text-cyan-400" />
            </div>
            <p className="text-sm text-gray-300 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PDF or DOCX (Max 5MB)</p>
          </>
        )}

        {file && !uploadSuccess && !uploading && (
          <div className="flex flex-col items-center z-10 pointer-events-none">
            <FileText size={32} className="text-cyan-400 mb-2" />
            <p className="text-base font-medium text-white mb-0.5">{file.name}</p>
            <p className="text-xs text-gray-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

            <div className="flex gap-2 pointer-events-auto">
              <Button onClick={handleUpload} size="sm">
                Upload
              </Button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearFile();
                }}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex flex-col items-center">
            <Loader2 size={32} className="text-cyan-400 animate-spin mb-2" />
            <p className="text-sm font-medium text-white">Uploading...</p>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex flex-col items-center z-10">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
              <CheckCircle2 size={24} className="text-green-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Upload Complete!</h3>
            <Button onClick={clearFile} variant="ghost" size="sm" className="text-xs mt-2">
              Replace
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-200 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
