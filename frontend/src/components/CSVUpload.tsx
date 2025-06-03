import React, { useState, useCallback } from 'react';
import api from '../services/api';

const CSVUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      await handleFileUpload(file);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      await api.uploadCSV(file);
      setSuccess('File uploaded successfully!');
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card-default border border-border-subtle rounded-md w-full max-w-2xl mx-auto p-6">
      <div
        className={`border-2 border-dashed rounded-md p-8 text-center ${
          isDragging ? 'border-accent bg-accent/10' : 'border-border-blue bg-card-default'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-accent-gray border-b border-border-blue pb-2 mb-2">
            {uploading ? 'Uploading...' : 'Upload your sales data'}
          </h3>
          <p className="text-cyan-200">
            Drag and drop your CSV file here, or click to select a file
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg cursor-pointer hover:bg-primary transition-colors"
          >
            Select File
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
          {success}
        </div>
      )}
    </div>
  );
};

export default CSVUpload; 