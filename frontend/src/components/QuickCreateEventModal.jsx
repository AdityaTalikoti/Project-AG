import React, { useState } from 'react';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import { useCreateEventMutation } from '../store/apiSlice';

export default function QuickCreateEventModal({ isOpen, onClose, onSuccess }) {
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Study');
  const [color, setColor] = useState('#8B5CF6'); // Violet default
  
  // Initialize start/end times nicely
  const getInitialDateTimeStr = (offsetHours = 0) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours, 0, 0, 0);
    const datePart = d.toISOString().split('T')[0];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return { date: datePart, time: `${hours}:${minutes}` };
  };

  const initialStart = getInitialDateTimeStr(1);
  const initialEnd = getInitialDateTimeStr(2);

  const [startDate, setStartDate] = useState(initialStart.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endDate, setEndDate] = useState(initialEnd.date);
  const [endTime, setEndTime] = useState(initialEnd.time);

  const [validationError, setValidationError] = useState('');

  const categories = [
    { name: 'Study', defaultColor: '#8B5CF6' },
    { name: 'Exam', defaultColor: '#EF4444' },
    { name: 'Assignment', defaultColor: '#F59E0B' },
    { name: 'Interview', defaultColor: '#10B981' },
    { name: 'Meeting', defaultColor: '#3B82F6' },
    { name: 'Personal', defaultColor: '#EC4899' },
  ];

  const handleCategoryChange = (catName) => {
    setCategory(catName);
    const match = categories.find(c => c.name === catName);
    if (match) {
      setColor(match.defaultColor);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Event title is required');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setValidationError('Please select valid start and end dates/times');
      return;
    }

    if (startDateTime >= endDateTime) {
      setValidationError('End date/time must be strictly after the start date/time');
      return;
    }

    try {
      const eventPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        color,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        status: 'upcoming'
      };

      const res = await createEvent(eventPayload).unwrap();
      if (res.success) {
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('Study');
        setColor('#8B5CF6');
        
        if (onSuccess) onSuccess('Event created successfully!');
        onClose();
      }
    } catch (err) {
      console.error(err);
      setValidationError(err?.data?.error || 'Failed to create event. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-900/80 bg-[#0a0e1a]">
          <div className="flex items-center gap-2">
            <Calendar className="text-emerald-400" size={16} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Create Event</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 hover:bg-gray-900 rounded-lg transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh] scrollbar-thin">
          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[11px] font-semibold">
              ⚠️ {validationError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Title *</label>
            <input
              type="text"
              placeholder="e.g. Study Graph Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Description</label>
            <textarea
              rows={2}
              placeholder="Study details, topics to cover..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Start Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* End Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Category Chip Selector */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Tag size={10} /> Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                    category === cat.name
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-900 border-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Indicator */}
          <div className="flex items-center gap-3 bg-[#111625] p-3 rounded-xl border border-gray-900">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex-shrink-0">Event Color</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: color }} />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-800 transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
