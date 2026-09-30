import React, { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader } from 'lucide-react';

export default function TaskSubmissionModal({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit, 
  isLoading,
  validationError 
}) {
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState('');

  if (!isOpen || !task) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ files, note });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-[#0b0e17] border border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-900 bg-[#0a0e1a]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Submit Task</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-500 hover:text-white p-1 hover:bg-gray-900 rounded-lg transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              ⚠️ {validationError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-semibold">Upload Files *</label>
            <div className="border-2 border-dashed border-gray-800 rounded-xl p-4 hover:border-emerald-500/50 transition">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="file-upload" 
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload size={24} className="text-gray-500 mb-2" />
                <p className="text-xs text-gray-400 text-center">
                  Click to upload images or PDF files
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Max 10MB per file • Up to 5 files
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-[#111625] rounded-lg border border-gray-800">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon size={16} className="text-blue-400" />
                    ) : (
                      <FileText size={16} className="text-red-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-gray-500 hover:text-red-400 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="submission-note" className="text-xs text-gray-400 font-semibold">
              Note (optional)
            </label>
            <textarea
              id="submission-note"
              rows={3}
              placeholder="Add any notes about your submission..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-semibold rounded-xl text-xs hover:bg-gray-800 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || files.length === 0}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl text-xs transition shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
