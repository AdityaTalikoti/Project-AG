import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetTasksQuery, 
  useCreateTaskMutation, 
  useUpdateTaskMutation, 
  useDeleteTaskMutation,
  useGetStudentsQuery,
  useSubmitTaskMutation,
  useGetTaskSubmissionsQuery,
  useReviewSubmissionMutation
} from '../store/apiSlice';
import { 
  Plus, 
  X, 
  Calendar, 
  User, 
  Trash2, 
  Edit, 
  Check, 
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Timer,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import TaskSubmissionModal from '../components/TaskSubmissionModal';
import TaskReviewModal from '../components/TaskReviewModal';
import TaskViewModalEnhanced from '../components/TaskViewModalEnhanced';

export default function TasksPage() {
  const { user } = useSelector((state) => state.auth);
  const { data: tasksResponse, isLoading } = useGetTasksQuery();
  const { data: studentsResponse } = useGetStudentsQuery();
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [submitTask] = useSubmitTaskMutation();
  const [reviewSubmission] = useReviewSubmissionMutation();

  const tasks = tasksResponse?.data || [];
  const students = studentsResponse?.data || [];

  // Separate tasks
  const selfTasks = tasks.filter(t => t.source === 'self');
  const mentorTasks = tasks.filter(t => t.source === 'mentor');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    source: 'self',
    assignedTo: '',
    timeLimit: ''
  });

  // Submission form state
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // Review form state
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [validationError, setValidationError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      source: 'self',
      assignedTo: '',
      timeLimit: ''
    });
    setValidationError('');
  };

  const resetSubmissionForm = () => {
    setSubmissionFiles([]);
    setSubmissionNote('');
  };

  const resetReviewForm = () => {
    setReviewFeedback('');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.title.trim()) {
      setValidationError('Task title is required');
      return;
    }

    if (formData.source === 'mentor' && !formData.assignedTo) {
      setValidationError('Please select a student to assign this task');
      return;
    }

    try {
      const taskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        priority: formData.priority,
        source: formData.source,
        assignedTo: formData.source === 'mentor' ? formData.assignedTo : undefined,
        timeLimit: formData.source === 'mentor' && formData.timeLimit ? Number(formData.timeLimit) : undefined
      };

      await createTask(taskPayload).unwrap();
      showToast('Task created successfully!');
      setCreateModalOpen(false);
      resetForm();
    } catch (err) {
      setValidationError(err?.data?.message || 'Failed to create task');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.title.trim()) {
      setValidationError('Task title is required');
      return;
    }

    try {
      await updateTask({
        id: selectedTask._id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        priority: formData.priority
      }).unwrap();
      showToast('Task updated successfully!');
      setEditModalOpen(false);
      resetForm();
      setSelectedTask(null);
    } catch (err) {
      setValidationError(err?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId).unwrap();
      showToast('Task deleted successfully!');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to delete task');
    }
  };

  const handleToggleComplete = async (task) => {
    // Prevent students from marking mentor tasks as complete
    if (task.source === 'mentor' && task.createdBy._id !== user._id) {
      showToast('Mentor-assigned tasks can only be completed through mentor approval');
      return;
    }

    try {
      await updateTask({
        id: task._id,
        status: task.status === 'completed' ? 'pending' : 'completed'
      }).unwrap();
    } catch (err) {
      showToast(err?.data?.message || 'Failed to update task status');
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!submissionFiles || submissionFiles.length === 0) {
      setValidationError('Please select at least one file to upload');
      return;
    }

    // Check file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    for (const file of submissionFiles) {
      if (!allowedTypes.includes(file.type)) {
        setValidationError('Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('File size must not exceed 10MB');
        return;
      }
    }

    setSubmissionLoading(true);
    try {
      const formDataToSend = new FormData();
      submissionFiles.forEach(file => {
        formDataToSend.append('files', file);
      });
      formDataToSend.append('note', submissionNote);

      await submitTask({ id: selectedTask._id, formData: formDataToSend }).unwrap();
      showToast('Task submitted successfully!');
      setSubmitModalOpen(false);
      setViewModalOpen(false);
      resetSubmissionForm();
    } catch (err) {
      setValidationError(err?.data?.message || 'Failed to submit task');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleReviewSubmission = async (action) => {
    setValidationError('');

    if (action === 'reject' && !reviewFeedback.trim()) {
      setValidationError('Feedback is required when rejecting a submission');
      return;
    }

    setReviewLoading(true);
    try {
      await reviewSubmission({
        submissionId: selectedSubmission._id,
        action,
        feedback: reviewFeedback
      }).unwrap();
      showToast(action === 'approve' ? 'Submission approved!' : 'Submission rejected');
      setReviewModalOpen(false);
      setViewModalOpen(false);
      resetReviewForm();
    } catch (err) {
      setValidationError(err?.data?.message || 'Failed to review submission');
    } finally {
      setReviewLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority,
      source: task.source,
      assignedTo: task.assignedTo?._id || ''
    });
    setEditModalOpen(true);
  };

  const openViewModal = (task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };

  const openSubmitModal = (task) => {
    setSelectedTask(task);
    resetSubmissionForm();
    setSubmitModalOpen(true);
  };

  const openReviewModal = (task, submission) => {
    setSelectedTask(task);
    setSelectedSubmission(submission);
    resetReviewForm();
    setReviewModalOpen(true);
  };

  // Helper to calculate remaining time
  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;

    if (diffMs <= 0) return 'expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Helper to check if task is expired
  const isTaskExpired = (task) => {
    if (!task.expiresAt) return false;
    return new Date() > new Date(task.expiresAt);
  };

  // Helper to get status badge color
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return { color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: 'Pending' };
      case 'submitted': return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Awaiting Review' };
      case 'needs_revision': return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Needs Revision' };
      case 'completed': return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Completed' };
      case 'expired': return { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Time Expired' };
      default: return { color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: status };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const TaskCard = ({ task, canEdit = false }) => {
    const isMentorTask = task.source === 'mentor';
    const isAssignedToMe = task.assignedTo?._id === user?._id;
    const canToggleComplete = !isMentorTask || !isAssignedToMe;
    const statusBadge = getStatusBadge(task.status);

    return (
      <div className="bg-[#0d1222] border border-[#161d31] rounded-xl p-4 hover:border-[#1e2639] transition group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {canToggleComplete ? (
              <button
                onClick={() => handleToggleComplete(task)}
                className="mt-0.5 flex-shrink-0 cursor-pointer"
              >
                {task.status === 'completed' ? (
                  <CheckCircle size={20} className="text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600 hover:border-emerald-400 transition" />
                )}
              </button>
            ) : (
              <div className="mt-0.5 flex-shrink-0">
                {task.status === 'completed' ? (
                  <CheckCircle size={20} className="text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-700 opacity-50" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
            <h4 
              className={`text-sm font-semibold mb-1 cursor-pointer hover:text-emerald-400 transition truncate ${
                task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'
              }`}
              onClick={() => openViewModal(task)}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Show status badge for mentor tasks */}
              {isMentorTask && task.status !== 'pending' && (
                <span className={`px-2 py-0.5 rounded-lg border font-semibold ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-lg border font-semibold ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(task.dueDate)}
                </span>
              )}
              {/* Show remaining time for mentor tasks */}
              {isMentorTask && task.expiresAt && (
                <span className={`flex items-center gap-1 ${
                  isTaskExpired(task) ? 'text-red-400' : 'text-blue-400'
                }`}>
                  <Timer size={12} />
                  {getRemainingTime(task.expiresAt) === 'expired' ? 'Expired' : getRemainingTime(task.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => openEditModal(task)}
              className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition cursor-pointer"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteTask(task._id)}
              className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

  const TaskFormModal = ({ isOpen, onClose, onSubmit, isEdit = false }) => {
    if (!isOpen) return null;

    const isMentor = user?.role === 'Mentor';

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          // Close modal only if clicking the backdrop, not the modal content
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-[#0b0e17] border border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-5 border-b border-gray-900 bg-[#0a0e1a]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isEdit ? 'Edit Task' : 'Create Task'}
            </h3>
            <button 
              type="button"
              onClick={onClose} 
              className="text-gray-500 hover:text-white p-1 hover:bg-gray-900 rounded-lg transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            {validationError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
                ⚠️ {validationError}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="task-title" className="text-xs text-gray-400 font-semibold">Title *</label>
              <input
                id="task-title"
                type="text"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-description" className="text-xs text-gray-400 font-semibold">Description</label>
              <textarea
                id="task-description"
                rows={3}
                placeholder="Task description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {!isEdit && isMentor && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Task Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, source: 'self', assignedTo: '' })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        formData.source === 'self'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, source: 'mentor' })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        formData.source === 'mentor'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Assign to Student
                    </button>
                  </div>
                </div>

                {formData.source === 'mentor' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-semibold">Assign To *</label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                        required
                      >
                        <option value="">Select a student</option>
                        {students.map(student => (
                          <option key={student._id} value={student._id}>
                            {student.name} ({student.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-semibold">Time Limit (optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="24"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                          className="flex-1 bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                        <span className="flex items-center px-3 bg-[#111625] border border-gray-800 rounded-xl text-xs text-gray-400">
                          hours
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Task will expire after this duration from assignment time
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-semibold rounded-xl text-xs hover:bg-gray-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                {isEdit ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TaskViewModal = ({ isOpen, onClose, task }) => {
    if (!isOpen || !task) return null;

    // Use the enhanced modal for mentor tasks, simple view for self tasks
    if (task.source === 'mentor') {
      return null; // Will be replaced by TaskViewModalEnhanced below
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-5 border-b border-gray-900 bg-[#0a0e1a]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Task Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-1 hover:bg-gray-900 rounded-lg transition cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">{task.title}</h4>
              {task.description && (
                <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-900">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Status:</span>
                <span className={`px-2 py-1 rounded-lg font-semibold border ${
                  task.status === 'completed' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {task.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Priority:</span>
                <span className={`px-2 py-1 rounded-lg border font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              {task.dueDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Due Date:</span>
                  <span className="text-gray-300">{formatDate(task.dueDate)}</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-semibold rounded-xl text-xs hover:bg-gray-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829]">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-800 rounded w-1/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-xs text-gray-400 mt-1">Manage your tasks and assignments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-3 px-5 rounded-xl text-xs transition shadow-lg cursor-pointer"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Tasks */}
        <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Your Tasks</h2>
            <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded-lg">
              {selfTasks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {selfTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-[#0d1222]/20 border border-[#161d31]/40 border-dashed rounded-2xl">
                <div className="w-10 h-10 bg-gray-900 border border-gray-800 text-gray-500 rounded-full flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">No Tasks Yet</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Create your first task to get started with organizing your work.
                  </p>
                </div>
              </div>
            ) : (
              selfTasks.map(task => <TaskCard key={task._id} task={task} canEdit={true} />)
            )}
          </div>
        </div>

        {/* Assigned by Mentor */}
        <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Assigned by Mentor</h2>
            <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded-lg">
              {mentorTasks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {mentorTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-[#0d1222]/20 border border-[#161d31]/40 border-dashed rounded-2xl">
                <div className="w-10 h-10 bg-gray-900 border border-gray-800 text-gray-500 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">No Mentor Tasks</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Tasks assigned by your mentor will appear here.
                  </p>
                </div>
              </div>
            ) : (
              mentorTasks.map(task => <TaskCard key={task._id} task={task} canEdit={false} />)
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal 
        isOpen={createModalOpen} 
        onClose={() => { setCreateModalOpen(false); resetForm(); }} 
        onSubmit={handleCreateTask}
        isEdit={false}
      />

      <TaskFormModal 
        isOpen={editModalOpen} 
        onClose={() => { setEditModalOpen(false); resetForm(); setSelectedTask(null); }} 
        onSubmit={handleEditTask}
        isEdit={true}
      />

      {/* Use simple modal for self tasks, enhanced for mentor tasks */}
      {selectedTask?.source === 'self' && (
        <TaskViewModal 
          isOpen={viewModalOpen} 
          onClose={() => { setViewModalOpen(false); setSelectedTask(null); }} 
          task={selectedTask}
        />
      )}

      {selectedTask?.source === 'mentor' && (
        <TaskViewModalEnhanced 
          isOpen={viewModalOpen} 
          onClose={() => { setViewModalOpen(false); setSelectedTask(null); }} 
          task={selectedTask}
          user={user}
          onSubmit={(task) => {
            setViewModalOpen(false);
            openSubmitModal(task);
          }}
          onReview={(task, submission) => {
            setViewModalOpen(false);
            openReviewModal(task, submission);
          }}
          getPriorityColor={getPriorityColor}
        />
      )}

      {/* Submission Modal */}
      <TaskSubmissionModal
        isOpen={submitModalOpen}
        onClose={() => {
          setSubmitModalOpen(false);
          resetSubmissionForm();
          setValidationError('');
        }}
        task={selectedTask}
        onSubmit={handleSubmitTask}
        isLoading={submissionLoading}
        validationError={validationError}
      />

      {/* Review Modal */}
      {selectedTask && selectedSubmission && (
        <TaskReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            resetReviewForm();
            setValidationError('');
          }}
          task={selectedTask}
          submissions={[selectedSubmission]}
          onApprove={(submissionId, feedback) => handleReviewSubmission('approve')}
          onReject={(submissionId, feedback) => handleReviewSubmission('reject')}
          isLoading={reviewLoading}
          validationError={validationError}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
