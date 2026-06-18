import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllTasks, getTaskById } from '../../db/queries';
import { useAppStore } from '../../store/useAppStore';
import { MAX_TASKS } from '../../constants/dayStates';
import { getColor } from '../../constants/colors';
import TaskEditor from './TaskEditor';

export default function EditorScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useAppStore(s => s.showToast);

  const [tasks, setTasks]           = useState([]);
  const [editingTask, setEditingTask] = useState(undefined); // undefined = loading
  const [showAddForm, setShowAddForm] = useState(false);

  const loadTasks = async () => {
    try {
      setTasks(await getAllTasks());
    } catch {
      showToast('Failed to load tasks', 'error');
    }
  };

  useEffect(() => { loadTasks(); }, []);

  useEffect(() => {
    if (!id) { setEditingTask(null); return; }
    getTaskById(parseInt(id)).then(t => setEditingTask(t ?? null));
  }, [id]);

  // Edit mode (via /editor/:id)
  if (id) {
    if (editingTask === undefined) {
      return <div className="p-4 text-sm text-slate-400">Loading…</div>;
    }
    if (editingTask === null) {
      return (
        <div className="p-4">
          <p className="text-slate-500">Task not found.</p>
          <button onClick={() => navigate('/editor')} className="text-sm text-slate-600 mt-2">← Back</button>
        </div>
      );
    }
    return (
      <TaskEditor
        task={editingTask}
        onSave={() => { loadTasks(); navigate('/editor'); }}
        onDelete={() => navigate('/editor')}
        onCancel={() => navigate('/editor')}
        nextSortOrder={tasks.length}
      />
    );
  }

  // Add mode (inline form)
  if (showAddForm) {
    return (
      <TaskEditor
        task={null}
        onSave={() => { loadTasks(); setShowAddForm(false); }}
        onDelete={() => {}}
        onCancel={() => setShowAddForm(false)}
        nextSortOrder={tasks.length}
      />
    );
  }

  // List view
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">My Tasks</h1>
        <span className="text-sm font-medium text-slate-500">{tasks.length} / {MAX_TASKS}</span>
      </div>

      <button
        onClick={() => {
          if (tasks.length >= MAX_TASKS) {
            showToast('Maximum 8 tasks reached', 'error');
            return;
          }
          setShowAddForm(true);
        }}
        disabled={tasks.length >= MAX_TASKS}
        className="w-full py-3 rounded-2xl bg-slate-800 text-white font-semibold text-sm mb-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
      >
        + Add New Task
      </button>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm text-slate-400">No tasks yet. Add your first task above.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map(task => {
            const c = getColor(task.color);
            return (
              <li key={task.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                  {task.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate text-sm">{task.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{task.taskType}</p>
                </div>
                <button
                  onClick={() => navigate(`/editor/${task.id}`)}
                  className="text-slate-400 p-2 text-lg"
                  aria-label={`Edit ${task.name}`}
                >
                  ✏️
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
