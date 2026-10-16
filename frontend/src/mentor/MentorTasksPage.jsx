import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetTasksQuery, useGetStudentsQuery, useCreateTaskMutation, useDeleteTaskMutation, useUpdateTaskMutation } from '../store/apiSlice';

/**
 * Mentor Tasks Page — Phase 4.
 *
 * Displays mentor-created tasks and provides task assignment management.
 * Accessible only to authenticated mentors via MentorProtectedRoute.
 */

export default function MentorTasksPage() {
  const { user } = useSelector((state) => state.auth);

  // Fetch mentor-created tasks
  const { data: tasksRes, isLoading: tasksLoading, isError: tasksError, refetch } = useGetTasksQuery();

  // Fetch students authorized for this mentor
  const { data: studentsRes, isLoading: studentsLoading, isError: studentsError } = useGetStudentsQuery();

  // Mutations
  const [createTaskMutate] = useCreateTaskMutation();
  const [deleteTaskMutate] = useDeleteTaskMutation();
  const [updateTaskMutate] = useUpdateTaskMutation();

  // State for open assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    timeLimit: null,
  });
  const [assignError, setAssignError] = useState('');

  // Filter: only show mentor-created tasks.
  // GET /api/tasks returns { success, count, data: [...] }.
  // createdBy is populated by the backend as { _id, name, ... }; use _id if
  // present, fall back to the raw value for unpopulated cases.
  const allTasks = Array.isArray(tasksRes?.data) ? tasksRes.data : [];
  const mentorTasks = allTasks.filter(
    (t) =>
      t &&
      t.source === 'mentor' &&
      t.createdBy &&
      String(t.createdBy?._id ?? t.createdBy) === String(user?.id)
  );


  // Helper: safe set form field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAssignForm({ ...assignForm, [name]: value });
  };

  // Handle assign task submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignError('');

    const { title, description, assignedTo, dueDate, priority, timeLimit } = assignForm;

    if (!title || !title.trim()) {
      setAssignError('Task title is required');
      return;
    }

    if (!assignedTo) {
      setAssignError('Student assignment is required');
      return;
    }

    try {
      await createTaskMutate({
        title: title.trim(),
        description: description ? description.trim() : '',
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        source: 'mentor',
        createdBy: user?.id,
        assignedTo: assignedTo,
        ...(timeLimit && timeLimit > 0 && { timeLimit }),
        status: 'pending',
      }).unwrap();
      setShowAssignModal(false);
      setAssignForm({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        timeLimit: null,
      });
      refetch();
    } catch (err) {
      // RTK Query surfaces the parsed response body at err.data
      setAssignError(
        err?.data?.message || 'Failed to create task. Please try again.'
      );
    }
  };

  // Handle delete task
  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTaskMutate(taskId).unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || 'Failed to delete task');
    }
  };

  // Handle update task status/priority
  const handleUpdate = async (taskId, updates) => {
    try {
      await updateTaskMutate({ id: taskId, ...updates }).unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || 'Failed to update task');
    }
  };

  // --- Loading / error states ---
  if (tasksError) return <div style={{ padding: '2rem' }}>Error loading tasks.</div>;
  if (studentsError) return <div style={{ padding: '2rem' }}>Error loading students.</div>;

  if (tasksLoading || studentsLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  // --- Empty state ---
  if (mentorTasks.length === 0 && !showAssignModal) {
    return (
      <div
        style={{
          minHeight: '400px',
          background: '#0f172a',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>Tasks</h1>
        <p>No mentor-created tasks found. Use the form below to assign a new task.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '400px',
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '1.5rem',
      }}
    >
      <h1 style={{ color: '#a78bfa', marginBottom: '1rem' }}>Tasks</h1>

      {/* Assign New Task Form */}
      {showAssignModal ? (
        <div style={{ background: '#1e1b2e', border: '1px solid #2d2a45', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <h2 style={{ color: '#a78bfa', marginBottom: '0.75rem' }}>Assign New Task</h2>
          <form onSubmit={handleAssignSubmit}>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                name="title"
                value={assignForm.title}
                onChange={handleChange}
                required
                style={{
                  background: '#0f172a',
                  border: '1px solid #2d2a45',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  width: '100%',
                }}
              />

              <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>Description</label>
              <textarea
                name="description"
                value={assignForm.description}
                onChange={handleChange}
                style={{
                  background: '#0f172a',
                  border: '1px solid #2d2a45',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  width: '100%',
                  height: '100px',
                }}
              />

              <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>Assign To <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                name="assignedTo"
                value={assignForm.assignedTo}
                onChange={handleChange}
                required
                style={{
                  background: '#0f172a',
                  border: '1px solid #2d2a45',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  width: '100%',
                }}
              >
                <option value="">-- Select Student --</option>
                {/* useGetStudentsQuery returns { success, data: [...] } */}
                {Array.isArray(studentsRes?.data) && studentsRes.data.length > 0
                  ? studentsRes.data.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name || s.email}
                      </option>
                    ))
                  : (
                    <option disabled>No students authorized</option>
                  )}
              </select>

              <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={assignForm.dueDate}
                onChange={handleChange}
                style={{
                  background: '#0f172a',
                  border: '1px solid #2d2a45',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  width: '100%',
                }}
              />

              <label style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>Priority</label>
              <select
                name="priority"
                value={assignForm.priority}
                onChange={handleChange}
                style={{
                  background: '#0f172a',
                  border: '1px solid #2d2a45',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  width: '100%',
                  appearance: 'none',
                  backgroundImage: 'data:image/svg+xml;charset=some,svg'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '1rem',
                background: '#7c3aed',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.75rem 1.5rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                width: '100%',
                cursor: 'pointer',
              }}
            >
              Assign Task
            </button>

            {assignError && (
              <p style={{ color: '#f87171', marginTop: '0.5rem', fontSize: '0.75rem' }}>{assignError}</p>
            )}

            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: '1px solid #2d2a45',
                borderRadius: '0.375rem',
                padding: '0.5rem',
                color: '#8884d8',
                fontSize: '0.875rem',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <button
          style={{
            marginBottom: '1rem',
            background: 'none',
            border: '1px solid #7c3aed',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
            color: '#7c3aed',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onClick={() => setShowAssignModal(true)}
        >
          Assign New Task
        </button>
      )}

      {/* Task Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#8884d8', fontSize: '0.75rem' }}>
              <th style={{ padding: '0.5rem 1rem' }}>Title</th>
              <th style={{ padding: '0.5rem 1rem' }}>Assigned Student</th>
              <th style={{ padding: '0.5rem 1rem' }}>Due Date</th>
              <th style={{ padding: '0.5rem 1rem' }}>Status</th>
              <th style={{ padding: '0.5rem 1rem' }}>Priority</th>
              <th style={{ padding: '0.5rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentorTasks.length === 0 && !showAssignModal && (
              <tr>
                <td colspan="6" style={{ textAlign: 'center', color: '#6b7280' }}>
                  No mentor-created tasks
                </td>
              </tr>
            )}
            {mentorTasks.map((t) => (
              <tr key={t._id} style={{ background: '#16132a', fontSize: '0.75rem' }}>
                <td style={{ padding: '0.5rem 1rem' }}>{t.title || '—'}</td>
<td style={{ padding: '0.5rem 1rem' }}>
                  {t.assignedTo
                    ? (() => {
                        // assignedTo may be a populated object or a plain ID string.
                        // studentsRes API returns { success, data: [...] }
                        const assignedId = String(t.assignedTo?._id ?? t.assignedTo);
                        const students = Array.isArray(studentsRes?.data) ? studentsRes.data : [];
                        return students.find((s) => String(s._id || s.id) === assignedId)?.name || assignedId.slice(-6);
                      })()
                    : '—'}
                </td>
                <td style={{ padding: '0.5rem 1rem' }}>
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '0.5rem 1rem' }}>
                  {t.status === 'completed' && 'Completed' ||
                    t.status === 'submitted' && 'Submitted' ||
                    t.status === 'needs_revision' && 'Needs Revision' ||
                    t.status === 'expired' && 'Expired' ||
                    'Pending'}
                </td>
                <td style={{ padding: '0.5rem 1rem' }}>
                  {t.priority || '—'}
                </td>
                <td style={{ padding: '0.5rem 1rem' }}>
                  <button
                    style={{
                      background: 'none',
                      border: '1px solid #ef4444',
                      borderRadius: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleDelete(t._id)}
                  >
                    Delete
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: '1px solid #a78bfa',
                      borderRadius: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      color: '#a78bfa',
                      fontSize: '0.75rem',
                      marginLeft: '0.25rem',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      handleUpdate(t._id, {
                        priority: t.priority === 'high' ? 'medium' : 'high',
                      })
                    }
                  >
                    Toggle Priority
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}