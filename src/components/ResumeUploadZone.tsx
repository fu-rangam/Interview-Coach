import React, { useState, useCallback } from 'react';
import { GlassButton } from './ui/glass/GlassButton';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ResumeUploadZone: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
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
              <GlassButton onClick={handleUpload} size="sm">
                Upload
              </GlassButton>
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
            <GlassButton onClick={clearFile} variant="ghost" size="sm" className="text-xs mt-2">
              Replace
            </GlassButton>
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
