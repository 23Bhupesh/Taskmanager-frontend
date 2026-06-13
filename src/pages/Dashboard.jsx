// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, updateStatus } from '../services/api';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const priorityColor = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
const statusBg = { TODO: '#e0e7ff', IN_PROGRESS: '#fef9c3', DONE: '#dcfce7' };

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '' });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, dueDate: form.dueDate ? form.dueDate + 'T00:00:00' : null };
    if (editTask) {
      const res = await updateTask(editTask.id, payload);
      setTasks(tasks.map(t => t.id === editTask.id ? res.data : t));
    } else {
      const res = await createTask(payload);
      setTasks([...tasks, res.data]);
    }
    setShowForm(false);
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleStatusChange = async (id, status) => {
    const res = await updateStatus(id, status);
    setTasks(tasks.map(t => t.id === id ? res.data : t));
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
    });
    setShowForm(true);
  };

  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);
  const counts = { TODO: tasks.filter(t => t.status === 'TODO').length, IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length, DONE: tasks.filter(t => t.status === 'DONE').length };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>📋 Task Manager</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>Welcome, {user?.username}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={styles.addBtn} onClick={() => { setEditTask(null); setForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '' }); setShowForm(true); }}>+ New Task</button>
          <button style={styles.logoutBtn} onClick={logoutUser}>Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        {STATUSES.map(s => (
          <div key={s} style={{ ...styles.statCard, background: statusBg[s] }}>
            <div style={styles.statNum}>{counts[s]}</div>
            <div style={styles.statLabel}>{s.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={styles.filters}>
        {['ALL', ...STATUSES].map(f => (
          <button key={f} style={{ ...styles.filterBtn, background: filter === f ? '#4f46e5' : '#e5e7eb', color: filter === f ? '#fff' : '#333' }} onClick={() => setFilter(f)}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? <p style={{ textAlign: 'center' }}>Loading tasks...</p> :
        filteredTasks.length === 0 ? <p style={{ textAlign: 'center', color: '#999' }}>No tasks found. Create one!</p> :
        <div style={styles.taskGrid}>
          {filteredTasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskTop}>
                <span style={{ ...styles.priorityBadge, background: priorityColor[task.priority] }}>{task.priority}</span>
                <span style={{ ...styles.statusBadge, background: statusBg[task.status] }}>{task.status.replace('_', ' ')}</span>
              </div>
              <h4 style={styles.taskTitle}>{task.title}</h4>
              {task.description && <p style={styles.taskDesc}>{task.description}</p>}
              {task.dueDate && <p style={styles.taskDue}>📅 Due: {task.dueDate.substring(0, 10)}</p>}

              <div style={styles.taskActions}>
                <select style={styles.statusSelect} value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <button style={styles.editBtn} onClick={() => openEdit(task)}>✏️</button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(task.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {/* Modal Form */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editTask ? 'Edit Task' : 'New Task'}</h3>
            <form onSubmit={handleSubmit}>
              <input style={styles.input} placeholder="Task title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }} placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <select style={styles.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select style={styles.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <input style={styles.input} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={styles.addBtn} type="submit">{editTask ? 'Update' : 'Create'}</button>
                <button style={styles.logoutBtn} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f2f5', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e', color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem' },
  stats: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { flex: 1, padding: '1rem', borderRadius: '10px', textAlign: 'center' },
  statNum: { fontSize: '2rem', fontWeight: 'bold' },
  statLabel: { fontSize: '12px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' },
  filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.5rem 1rem', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  taskGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  taskCard: { background: '#fff', borderRadius: '10px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  taskTop: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' },
  priorityBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 'bold' },
  statusBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', color: '#333' },
  taskTitle: { margin: '0 0 0.5rem', fontSize: '15px' },
  taskDesc: { fontSize: '13px', color: '#666', margin: '0 0 0.5rem' },
  taskDue: { fontSize: '12px', color: '#888', margin: '0 0 0.75rem' },
  taskActions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  statusSelect: { flex: 1, padding: '0.4rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' },
  editBtn: { background: '#e0e7ff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer' },
  deleteBtn: { background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer' },
  addBtn: { padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  logoutBtn: { padding: '0.6rem 1.2rem', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '440px' },
  input: { width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
};
