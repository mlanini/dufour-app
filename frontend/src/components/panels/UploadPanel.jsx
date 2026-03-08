/**
 * UploadPanel - Upload QGIS Projects (.qgz)
 * Drag & drop interface with form and progress tracking
 */
import React, { useState, useRef } from 'react';
import { UploadIcon, CheckCircleIcon, AlertCircleIcon } from '../icons/Icons';

const UploadPanel = ({ onClose, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    is_public: false
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Validate and set file
  const handleFile = (selectedFile) => {
    setError(null);
    
    // Check file extension
    if (!selectedFile.name.toLowerCase().endsWith('.qgz')) {
      setError('Only .qgz files are supported');
      return;
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }
    
    setFile(selectedFile);
    
    // Auto-populate name from filename if empty
    if (!formData.name) {
      const filename = selectedFile.name.replace('.qgz', '');
      setFormData(prev => ({
        ...prev,
        name: filename.replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
        title: filename
      }));
    }
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    if (!formData.name) {
      setError('Project name is required');
      return;
    }
    
    // Validate project name (alphanumeric + underscore)
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      setError('Project name can only contain lowercase letters, numbers, and underscores');
      return;
    }
    
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('title', formData.title || formData.name);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      formDataToSend.append('is_public', formData.is_public.toString());
      
      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setUploadComplete(true);
          setUploadProgress(100);
          
          // Parse response
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload successful:', response);
            
            // Notify parent component
            if (onUploadSuccess) {
              onUploadSuccess(response);
            }
            
            // Auto-close after 2 seconds
            setTimeout(() => {
              if (onClose) onClose();
            }, 2000);
          } catch (e) {
            console.error('Failed to parse response:', e);
          }
        } else {
          let errorMsg = 'Upload failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMsg = errorResponse.detail || errorResponse.message || errorMsg;
          } catch (e) {
            errorMsg = xhr.statusText || errorMsg;
          }
          setError(errorMsg);
          setUploading(false);
        }
      });
      
      xhr.addEventListener('error', () => {
        setError('Network error during upload');
        setUploading(false);
      });
      
      xhr.open('POST', `${apiUrl}/api/projects`);
      xhr.send(formDataToSend);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      is_public: false
    });
    setUploadProgress(0);
    setUploadComplete(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '500px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <UploadIcon />
        <h3 style={{ margin: '0 0 0 8px', fontSize: '16px', fontWeight: 600 }}>
          Upload QGIS Project
        </h3>
      </div>
      
      {/* Success message */}
      {uploadComplete && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          color: '#155724'
        }}>
          <CheckCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            Project uploaded successfully!
          </span>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          color: '#721c24'
        }}>
          <AlertCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}
      
      {/* Drag & Drop Area */}
      {!uploadComplete && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '8px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive ? '#eff6ff' : file ? '#f9fafb' : 'white',
            transition: 'all 0.2s',
            marginBottom: '16px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".qgz"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          
          {!file ? (
            <>
              <UploadIcon style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                {dragActive ? 'Drop file here' : 'Drag & drop .qgz file'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                or click to browse (max 50MB)
              </div>
            </>
          ) : (
            <>
              <CheckCircleIcon style={{ width: '36px', height: '36px', margin: '0 auto 8px', color: '#10b981' }} />
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Form */}
      {file && !uploadComplete && (
        <div style={{ marginBottom: '16px' }}>
          {/* Project Name */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151'
            }}>
              Project Name * <span style={{ fontSize: '11px', color: '#6b7280' }}>(lowercase, alphanumeric, underscore)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="my_project"
              disabled={uploading}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Project Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151'
            }}>
              Display Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="My QGIS Project"
              disabled={uploading}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '6px',
              color: '#374151'
            }}>
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Project description..."
              disabled={uploading}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>
          
          {/* Public checkbox */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => handleFormChange('is_public', e.target.checked)}
                disabled={uploading}
                style={{ marginRight: '8px' }}
              />
              <span style={{ color: '#374151' }}>Make this project public</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      {uploading && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Uploading...</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
              {uploadProgress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {!uploadComplete && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: (!file || uploading) ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon style={{ width: '18px', height: '18px' }} />
                Upload Project
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadPanel;
