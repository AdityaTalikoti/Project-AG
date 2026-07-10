import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Clock, 
  Tag, 
  Check, 
  AlertCircle,
  CalendarDays,
  FileText
} from 'lucide-react';
import { 
  useGetEventsQuery, 
  useCreateEventMutation, 
  useUpdateEventMutation, 
  useDeleteEventMutation 
} from '../store/apiSlice';

// --- Color Configuration ---
const COLORS = [
  { value: '#10B981', name: 'Emerald', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotClass: 'bg-emerald-500' },
  { value: '#3B82F6', name: 'Blue', bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dotClass: 'bg-blue-500' },
  { value: '#F59E0B', name: 'Amber', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dotClass: 'bg-amber-500' },
  { value: '#EF4444', name: 'Red', bgClass: 'bg-red-500/10 text-red-400 border-red-500/20', dotClass: 'bg-red-500' },
  { value: '#8B5CF6', name: 'Purple', bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dotClass: 'bg-purple-500' },
  { value: '#06B6D4', name: 'Cyan', bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dotClass: 'bg-cyan-500' },
  { value: '#EC4899', name: 'Pink', bgClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20', dotClass: 'bg-pink-500' }
];

// --- Predefined Categories ---
const CATEGORIES = ['Study', 'Exam', 'Assignment', 'Interview', 'Meeting', 'Personal', 'General'];

// --- Helper Functions ---
const getLocalDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getLocalTimeString = (date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

const getCombinedDateTime = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr || '00:00'}`);
};

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // 'month' | 'week' | 'day'
  
  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit' | 'details' | 'delete' | null
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCellDate, setSelectedCellDate] = useState(null);
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  
  // Form input states
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    category: 'Study',
    color: '#10B981',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    status: 'upcoming'
  });
  const [formErrors, setFormErrors] = useState({});

  // RTK Query hooks
  const { data: eventsRes, isLoading: isEventsLoading } = useGetEventsQuery();
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  const events = eventsRes?.data || [];

  // --- Add Toast Notification ---
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- Keyboard navigation & Dialog escape support ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Open Create Event Modal ---
  const handleOpenCreate = (date = new Date()) => {
    setSelectedCellDate(date);
    const dateStr = getLocalDateString(date);
    setFormValues({
      title: '',
      description: '',
      category: 'Study',
      color: '#10B981',
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '10:00',
      status: 'upcoming'
    });
    setFormErrors({});
    setActiveModal('create');
  };

  // --- Open Edit Event Modal ---
  const handleOpenEdit = (event) => {
    setSelectedEvent(event);
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    setFormValues({
      title: event.title,
      description: event.description || '',
      category: event.category || 'Study',
      color: event.color || '#10B981',
      startDate: getLocalDateString(start),
      startTime: getLocalTimeString(start),
      endDate: getLocalDateString(end),
      endTime: getLocalTimeString(end),
      status: event.status || 'upcoming'
    });
    setFormErrors({});
    setActiveModal('edit');
  };

  // --- Open Event Details Dialog ---
  const handleOpenDetails = (event) => {
    setSelectedEvent(event);
    setActiveModal('details');
  };

  const closeModals = () => {
    setActiveModal(null);
    setSelectedEvent(null);
  };

  // --- Form Input Validations ---
  const validateForm = () => {
    const errors = {};
    if (!formValues.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formValues.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!formValues.startTime) {
      errors.startTime = 'Start time is required';
    }
    if (!formValues.endDate) {
      errors.endDate = 'End date is required';
    }
    if (!formValues.endTime) {
      errors.endTime = 'End time is required';
    }

    if (formValues.startDate && formValues.startTime && formValues.endDate && formValues.endTime) {
      const start = getCombinedDateTime(formValues.startDate, formValues.startTime);
      const end = getCombinedDateTime(formValues.endDate, formValues.endTime);
      if (end < start) {
        errors.endDate = 'End date/time cannot be before start date/time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Create Event Submission ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const startDateTime = getCombinedDateTime(formValues.startDate, formValues.startTime).toISOString();
      const endDateTime = getCombinedDateTime(formValues.endDate, formValues.endTime).toISOString();

      const res = await createEvent({
        ...formValues,
        startDateTime,
        endDateTime
      }).unwrap();

      if (res.success) {
        addToast('Event created successfully', 'success');
        closeModals();
      }
    } catch (err) {
      console.error(err);
      addToast(err?.data?.message || 'Failed to create event', 'error');
    }
  };

  // --- Update Event Submission ---
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const startDateTime = getCombinedDateTime(formValues.startDate, formValues.startTime).toISOString();
      const endDateTime = getCombinedDateTime(formValues.endDate, formValues.endTime).toISOString();

      const res = await updateEvent({
        id: selectedEvent._id,
        ...formValues,
        startDateTime,
        endDateTime
      }).unwrap();

      if (res.success) {
        addToast('Event updated successfully', 'success');
        closeModals();
      }
    } catch (err) {
      console.error(err);
      addToast(err?.data?.message || 'Failed to update event', 'error');
    }
  };

  // --- Delete Event Execution ---
  const handleDeleteExecute = async () => {
    if (!selectedEvent) return;
    try {
      const res = await deleteEvent(selectedEvent._id).unwrap();
      if (res.success) {
        addToast('Event deleted successfully', 'success');
        closeModals();
      }
    } catch (err) {
      console.error(err);
      addToast(err?.data?.message || 'Failed to delete event', 'error');
    }
  };

  // --- Toolbar Date Navigation ---
  const handleNavigate = (direction) => {
    const nextDate = new Date(currentDate);
    if (currentView === 'month') {
      nextDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      nextDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (currentView === 'day') {
      nextDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(nextDate);
  };

  const handleNavigateToday = () => {
    setCurrentDate(new Date());
  };

  // --- Date Math Helpers ---
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const displayYear = currentDate.getFullYear();

  // Grid calculation helper (42 days representation)
  const getMonthGridDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = firstDayOfMonth.getDay(); // Day of week (0-6)
    
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const daysInCurrMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrMonth; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding
    const totalRemaining = 42 - grid.length;
    for (let i = 1; i <= totalRemaining; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return grid;
  };

  const getWeekDaysList = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  // Filter events of a specific day
  const getEventsForDay = (date) => {
    return events.filter(e => {
      const eventStart = new Date(e.startDateTime);
      const eventEnd = new Date(e.endDateTime);
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const checkStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const checkEnd = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
      
      return targetDate >= checkStart && targetDate <= checkEnd;
    });
  };

  // Color formatter utility
  const getEventStyles = (colorHex) => {
    const cfg = COLORS.find(c => c.value.toLowerCase() === colorHex.toLowerCase()) || COLORS[0];
    return {
      borderLeft: `4px solid ${colorHex}`,
      backgroundColor: `${colorHex}10`,
      color: colorHex
    };
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#1f2937]/40 border border-gray-800 p-4 rounded-2xl backdrop-blur-md">
        
        {/* Navigation Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleNavigateToday}
            className="px-4 py-2 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition duration-200 cursor-pointer"
          >
            Today
          </button>
          
          <div className="flex items-center bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden ml-2">
            <button 
              onClick={() => handleNavigate('prev')}
              className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition duration-200 cursor-pointer border-r border-gray-800"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => handleNavigate('next')}
              className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition duration-200 cursor-pointer"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white ml-2">
            {monthName} <span className="text-gray-400 font-normal">{displayYear}</span>
          </h2>
        </div>

        {/* View Switches & Add Event button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-900/50 border border-gray-800 rounded-xl p-0.5">
            {['month', 'week', 'day'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition duration-200 cursor-pointer ${
                  currentView === view 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 shadow-lg shadow-emerald-950/20 cursor-pointer"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE / VIEWS ── */}
      {isEventsLoading ? (
        // Loading Skeleton State
        <div className="bg-[#1f2937]/10 border border-gray-800 rounded-2xl p-6 min-h-[400px] flex flex-col gap-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-800 rounded-lg" />
          <div className="grid grid-cols-7 gap-3 mt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-5 bg-gray-800 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3 flex-1 mt-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-800/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : events.length === 0 ? (
        // Empty State
        <div className="bg-[#1f2937]/10 border border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="p-4 bg-emerald-500/5 rounded-full border border-emerald-500/10 text-emerald-400">
            <CalendarIcon size={32} />
          </div>
          <div className="max-w-xs space-y-2">
            <h3 className="text-white font-semibold">No events scheduled yet</h3>
            <p className="text-xs text-gray-500">Plan study sessions, assignments, exams, or personal meetings inside your custom dashboard calendar.</p>
          </div>
          <button 
            onClick={() => handleOpenCreate()}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer"
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        // Event Grid
        <div className="bg-[#1f2937]/15 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          
          {/* 1. MONTH VIEW */}
          {currentView === 'month' && (
            <div className="flex flex-col">
              {/* Day names */}
              <div className="grid grid-cols-7 border-b border-gray-800 bg-[#1f2937]/20 py-2.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {d}
                  </div>
                ))}
              </div>
              
              {/* Day cells */}
              <div className="grid grid-cols-7 grid-rows-6 border-collapse divide-x divide-y divide-gray-800/80">
                {getMonthGridDays().map(({ date, isCurrentMonth }, idx) => {
                  const dayEvents = getEventsForDay(date);
                  const isToday = isSameDay(date, new Date());
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleOpenCreate(date)}
                      className={`min-h-[90px] sm:min-h-[110px] p-2 flex flex-col gap-1 transition duration-150 group cursor-pointer hover:bg-gray-800/20 ${
                        isCurrentMonth ? 'text-gray-200' : 'text-gray-600 bg-gray-900/10'
                      }`}
                    >
                      <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full self-end ${
                        isToday ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20' : ''
                      } ${!isCurrentMonth && isToday ? 'opacity-55' : ''}`}>
                        {date.getDate()}
                      </span>
                      
                      {/* Events list */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] scrollbar-none">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(event);
                            }}
                            style={getEventStyles(event.color)}
                            className="px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded border truncate transition duration-150 hover:brightness-110 shadow-sm"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-gray-500 font-bold ml-1">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW */}
          {currentView === 'week' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 border-collapse divide-x divide-gray-800">
              {getWeekDaysList().map((date, idx) => {
                const dayEvents = getEventsForDay(date);
                const isToday = isSameDay(date, new Date());
                const name = date.toLocaleString('default', { weekday: 'short' });
                
                return (
                  <div key={idx} className="flex flex-col min-h-[250px] sm:min-h-[400px]">
                    {/* Day Column Header */}
                    <div className={`p-3 text-center border-b border-gray-800 bg-[#1f2937]/25 flex flex-col items-center gap-1 ${
                      isToday ? 'bg-emerald-500/5' : ''
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{name}</span>
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Column events list */}
                    <div 
                      onClick={() => handleOpenCreate(date)}
                      className={`flex-1 p-3 flex flex-col gap-2 overflow-y-auto cursor-pointer hover:bg-gray-800/10 transition duration-150 ${
                        isToday ? 'bg-emerald-500/[0.01]' : ''
                      }`}
                    >
                      {dayEvents.map(event => {
                        const sTime = new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div
                            key={event._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(event);
                            }}
                            style={getEventStyles(event.color)}
                            className="p-2.5 rounded-xl border flex flex-col gap-1 transition duration-150 hover:brightness-110 shadow-sm"
                          >
                            <span className="text-[11px] font-bold leading-tight line-clamp-2">{event.title}</span>
                            <div className="flex items-center justify-between text-[9px] opacity-75 font-mono">
                              <span className="font-semibold">{event.category}</span>
                              <span>{sTime}</span>
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length === 0 && (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pointer-events-none">Empty</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. DAY VIEW */}
          {currentView === 'day' && (
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-800 min-h-[400px]">
              
              {/* Day Details Bar */}
              <div className="w-full sm:w-64 p-6 bg-[#1f2937]/15 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentDate.toLocaleString('default', { weekday: 'long' })}</h3>
                    <p className="text-xs text-gray-400">{monthName} {currentDate.getDate()}, {displayYear}</p>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Day stats</span>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Events Scheduled</span>
                    <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded-full">{getEventsForDay(currentDate).length}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpenCreate(currentDate)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-emerald-950/20"
                >
                  <Plus size={14} /> Add Event Today
                </button>
              </div>

              {/* Day Timeline */}
              <div 
                onClick={() => handleOpenCreate(currentDate)}
                className="flex-1 p-6 space-y-4 overflow-y-auto cursor-pointer hover:bg-gray-800/10 transition duration-150"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Schedule Timeline</span>
                {getEventsForDay(currentDate).map(event => {
                  const sTime = new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const eTime = new Date(event.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div
                      key={event._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(event);
                      }}
                      style={getEventStyles(event.color)}
                      className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition duration-150 hover:brightness-110 shadow-sm"
                    >
                      <div className="space-y-1 max-w-lg">
                        <span className="text-xs font-bold text-white block">{event.title}</span>
                        {event.description && (
                          <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-gray-400 bg-gray-900/60 border border-gray-800 px-3 py-1 rounded-xl">
                          <Tag size={12} className="text-emerald-400" />
                          <span>{event.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 bg-gray-900/60 border border-gray-800 px-3 py-1 rounded-xl font-mono">
                          <Clock size={12} className="text-amber-500" />
                          <span>{sTime} - {eTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {getEventsForDay(currentDate).length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-2 pointer-events-none">
                    <span className="text-xs font-bold text-gray-500">Free Day</span>
                    <p className="text-[10px] text-gray-600">No events or sessions booked for this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS & OVERLAYS ── */}
      
      {/* 1. CREATE EVENT MODAL */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button onClick={closeModals} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition cursor-pointer">
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <Plus size={20} className="text-emerald-400" />
              <h3 className="text-base font-bold text-white">Create New Event</h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Event Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Algorithms Revision Session"
                  value={formValues.title}
                  onChange={(e) => setFormValues(p => ({ ...p, title: e.target.value }))}
                  className={`w-full bg-[#111625] border rounded-xl px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500 ${
                    formErrors.title ? 'border-red-500' : 'border-[#1b2237]'
                  }`}
                />
                {formErrors.title && <span className="text-[9px] font-semibold text-red-400">{formErrors.title}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Description (Optional)</label>
                <textarea 
                  placeholder="Describe context, links, or subtopics..."
                  value={formValues.description}
                  onChange={(e) => setFormValues(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Category</label>
                  <select
                    value={formValues.category}
                    onChange={(e) => setFormValues(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Event Tag Color</label>
                  <div className="flex items-center gap-1.5 h-8">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormValues(p => ({ ...p, color: c.value }))}
                        className={`w-5 h-5 rounded-full border transition flex items-center justify-center cursor-pointer ${
                          formValues.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                      >
                        {formValues.color === c.value && <Check size={10} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Start Date</label>
                  <input 
                    type="date"
                    required
                    value={formValues.startDate}
                    onChange={(e) => setFormValues(p => ({ ...p, startDate: e.target.value, endDate: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Start Time</label>
                  <input 
                    type="time"
                    required
                    value={formValues.startTime}
                    onChange={(e) => setFormValues(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">End Date</label>
                  <input 
                    type="date"
                    required
                    value={formValues.endDate}
                    onChange={(e) => setFormValues(p => ({ ...p, endDate: e.target.value }))}
                    className={`w-full bg-[#111625] border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 ${
                      formErrors.endDate ? 'border-red-500' : 'border-[#1b2237]'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">End Time</label>
                  <input 
                    type="time"
                    required
                    value={formValues.endTime}
                    onChange={(e) => setFormValues(p => ({ ...p, endTime: e.target.value }))}
                    className={`w-full bg-[#111625] border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 ${
                      formErrors.endDate ? 'border-red-500' : 'border-[#1b2237]'
                    }`}
                  />
                </div>
                {formErrors.endDate && (
                  <div className="col-span-2 flex items-center gap-1 text-[9px] font-semibold text-red-400">
                    <AlertCircle size={10} />
                    <span>{formErrors.endDate}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-2.5 mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isCreating ? 'Creating Event...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT EVENT MODAL */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button onClick={closeModals} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition cursor-pointer">
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <Edit3 size={18} className="text-emerald-400" />
              <h3 className="text-base font-bold text-white">Edit Event Details</h3>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Event Title</label>
                <input 
                  type="text"
                  required
                  value={formValues.title}
                  onChange={(e) => setFormValues(p => ({ ...p, title: e.target.value }))}
                  className={`w-full bg-[#111625] border rounded-xl px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500 ${
                    formErrors.title ? 'border-red-500' : 'border-[#1b2237]'
                  }`}
                />
                {formErrors.title && <span className="text-[9px] font-semibold text-red-400">{formErrors.title}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Description (Optional)</label>
                <textarea 
                  value={formValues.description}
                  onChange={(e) => setFormValues(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Category</label>
                  <select
                    value={formValues.category}
                    onChange={(e) => setFormValues(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Event Tag Color</label>
                  <div className="flex items-center gap-1.5 h-8">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormValues(p => ({ ...p, color: c.value }))}
                        className={`w-5 h-5 rounded-full border transition flex items-center justify-center cursor-pointer ${
                          formValues.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                      >
                        {formValues.color === c.value && <Check size={10} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Start Date</label>
                  <input 
                    type="date"
                    required
                    value={formValues.startDate}
                    onChange={(e) => setFormValues(p => ({ ...p, startDate: e.target.value, endDate: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Start Time</label>
                  <input 
                    type="time"
                    required
                    value={formValues.startTime}
                    onChange={(e) => setFormValues(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">End Date</label>
                  <input 
                    type="date"
                    required
                    value={formValues.endDate}
                    onChange={(e) => setFormValues(p => ({ ...p, endDate: e.target.value }))}
                    className={`w-full bg-[#111625] border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 ${
                      formErrors.endDate ? 'border-red-500' : 'border-[#1b2237]'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">End Time</label>
                  <input 
                    type="time"
                    required
                    value={formValues.endTime}
                    onChange={(e) => setFormValues(p => ({ ...p, endTime: e.target.value }))}
                    className={`w-full bg-[#111625] border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 ${
                      formErrors.endDate ? 'border-red-500' : 'border-[#1b2237]'
                    }`}
                  />
                </div>
                {formErrors.endDate && (
                  <div className="col-span-2 flex items-center gap-1 text-[9px] font-semibold text-red-400">
                    <AlertCircle size={10} />
                    <span>{formErrors.endDate}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setActiveModal('delete')}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EVENT DETAILS DIALOG */}
      {activeModal === 'details' && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button onClick={closeModals} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition cursor-pointer">
              <X size={18} />
            </button>

            <div className="flex items-start gap-3.5 pb-2 border-b border-gray-800">
              <span className="w-4 h-4 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: selectedEvent.color }} />
              <div>
                <h3 className="text-base font-bold text-white leading-tight">{selectedEvent.title}</h3>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block mt-1">
                  {selectedEvent.category}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300">
              {selectedEvent.description && (
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Description</span>
                  <p className="bg-[#111625] border border-gray-900/60 p-3 rounded-xl leading-relaxed text-gray-300 font-normal">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-500" />
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Schedule</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedEvent.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEvent.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-gray-500" />
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Date</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedEvent.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-500" />
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Status</span>
                    <span className="font-bold uppercase text-[10px] text-emerald-400">{selectedEvent.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-500" />
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Created On</span>
                    <span className="font-semibold text-gray-400">
                      {new Date(selectedEvent.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <button 
                onClick={() => handleOpenEdit(selectedEvent)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                Edit Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION DIALOG */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Delete Event?</h3>
              <p className="text-xs text-gray-400">Are you sure you want to delete this event? This action is permanent and cannot be undone.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setActiveModal('edit')}
                className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-800 transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteExecute}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-red-950/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ALERTS OVERLAY ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-3.5 rounded-2xl border text-xs font-semibold shadow-xl flex items-center gap-2.5 pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 ${
              t.type === 'error' 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {t.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
