import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTaskById, getAllTasks } from '../../db/queries';
import { useAppStore } from '../../store/useAppStore';
import TaskEditor from './TaskEditor';

export default function EditorScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromHome   = location.state?.fromHome === true;
  const targetDate = location.state?.targetDate ?? null;
  const showToast = useAppStore(s => s.showToast);

  const [taskCount, setTaskCount]     = useState(0);
  const [editingTask, setEditingTask] = useState(undefined); // undefined = loading

  useEffect(() => {
    getAllTasks().then(t => setTaskCount(t.length)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) { setEditingTask(null); return; }
    getTaskById(parseInt(id)).then(t => setEditingTask(t ?? null));
  }, [id]);

  // Add mode - only reached via home "+ Add task" button
  if (!id) {
    if (editingTask === null || fromHome) {
      return (
        <TaskEditor
          task={null}
          initialTargetDate={targetDate}
          onSave={() => navigate('/')}
          onDelete={() => {}}
          onCancel={() => navigate('/')}
          nextSortOrder={taskCount}
        />
      );
    }
    // Fallback: redirect stray direct /editor visits to home
    return null;
  }

  // Edit mode - reached via long-press on task card
  if (editingTask === undefined) {
    return <div className="p-4 text-sm text-slate-400 dark:text-slate-500">Loading…</div>;
  }
  if (editingTask === null) {
    return (
      <div className="p-4">
        <p className="text-slate-500 dark:text-slate-300">Task not found.</p>
        <button onClick={() => navigate('/')} className="text-sm text-slate-600 dark:text-slate-400 mt-2">← Back</button>
      </div>
    );
  }
  return (
    <TaskEditor
      task={editingTask}
      onSave={() => navigate('/')}
      onDelete={() => navigate('/')}
      onCancel={() => navigate('/')}
      nextSortOrder={taskCount}
    />
  );
}
