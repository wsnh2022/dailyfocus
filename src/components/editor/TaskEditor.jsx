import { useState, useRef, useEffect } from 'react';
import { addTask, updateTask, deleteTask, saveLog, getAllTasks, addTaskToDateLog } from '../../db/queries';
import { useAppStore } from '../../store/useAppStore';
import { todayStr, tomorrowStr, getISOWeek } from '../../utils/dateHelpers';
import { getColor } from '../../constants/colors';
import ColorPicker from './ColorPicker';
import TimerTypeSelect from './TimerTypeSelect';
import Modal from '../shared/Modal';

const VALIDATION = {
  name:     { min: 1, max: 30 },
  duration: { min: 1, max: 999 },
  workMin:  { min: 1, max: 120 },
  breakMin: { min: 1, max: 60 },
  sets:     { min: 1, max: 10 },
};

export default function TaskEditor({ task, onSave, onDelete, onCancel, nextSortOrder, initialTargetDate = null }) {
  const showToast      = useAppStore(s => s.showToast);
  const todayTasks     = useAppStore(s => s.todayTasks);
  const setTodayTasks  = useAppStore(s => s.setTodayTasks);
  const todayDayState  = useAppStore(s => s.todayDayState);
  const isEdit = !!task;

  const persistToday = async (updatedTasks) => {
    setTodayTasks(updatedTasks);
    const today = todayStr();
    await saveLog({
      date:       today,
      dayState:   todayDayState,
      tasks:      updatedTasks,
      weekNumber: getISOWeek(today),
      createdAt:  new Date().toISOString(),
    });
  };

  const today    = todayStr();
  const tomorrow = tomorrowStr();

  const [name, setName]                     = useState(task?.name ?? '');
  const [emoji, setEmoji]                   = useState(task?.emoji ?? '🎯');
  const [color, setColor]                   = useState(task?.color ?? 'green');
  const [taskType, setTaskType]             = useState(task?.taskType ?? 'checkbox');
  const [duration, setDuration]             = useState(task?.duration ?? 30);
  const [durationUnit, setDurationUnit]     = useState(task?.durationUnit ?? 'min');
  const [workMin, setWorkMin]               = useState(task?.workMin ?? 25);
  const [breakMin, setBreakMin]             = useState(task?.breakMin ?? 5);
  const [sets, setSets]                     = useState(task?.sets ?? 4);
  const [subtasks, setSubtasks]             = useState(task?.subtasks ?? []);
  const [subtaskInput, setSubtaskInput]     = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskVal, setEditingSubtaskVal] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [targetDate, setTargetDate]         = useState(initialTargetDate ?? today);
  const [templates, setTemplates]           = useState([]);

  useEffect(() => {
    if (!isEdit) getAllTasks().then(setTemplates).catch(() => {});
  }, [isEdit]);

  const emojiInputRef = useRef(null);

  const handleEmojiInput = (e) => {
    const val = e.target.value;
    if (!val) return;
    let first = val;
    try {
      const segs = [...new Intl.Segmenter().segment(val)];
      if (segs.length) first = segs[0].segment;
    } catch {
      first = [...val][0] ?? val[0];
    }
    setEmoji(first);
    e.target.value = '';
    e.target.blur();
  };

  const validate = () => {
    if (name.trim().length < VALIDATION.name.min) {
      showToast('Task name is required', 'error'); return false;
    }
    if (name.trim().length > VALIDATION.name.max) {
      showToast('Name must be 30 characters or less', 'error'); return false;
    }
    if (taskType === 'countdown') {
      const d = Number(duration);
      if (d < VALIDATION.duration.min || d > VALIDATION.duration.max) {
        showToast('Duration must be between 1 and 999', 'error'); return false;
      }
    }
    if (taskType === 'pomodoro') {
      if (Number(workMin) < VALIDATION.workMin.min || Number(workMin) > VALIDATION.workMin.max) {
        showToast('Work minutes must be between 1 and 120', 'error'); return false;
      }
      if (Number(breakMin) < VALIDATION.breakMin.min || Number(breakMin) > VALIDATION.breakMin.max) {
        showToast('Break minutes must be between 1 and 60', 'error'); return false;
      }
      if (Number(sets) < VALIDATION.sets.min || Number(sets) > VALIDATION.sets.max) {
        showToast('Sets must be between 1 and 10', 'error'); return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const data = {
        name: name.trim(),
        emoji,
        color,
        taskType,
        duration:     (taskType === 'countdown' || taskType === 'checkbox') ? (Number(duration) || null) : null,
        durationUnit: (taskType === 'countdown' || taskType === 'checkbox') ? durationUnit : null,
        workMin:      taskType === 'pomodoro'  ? Number(workMin) : null,
        breakMin:     taskType === 'pomodoro'  ? Number(breakMin) : null,
        sets:         taskType === 'pomodoro'  ? Number(sets) : null,
        subtasks:     taskType === 'checkbox'  ? subtasks : [],
        sortOrder:    task?.sortOrder ?? nextSortOrder,
      };

      if (targetDate !== today) {
        // Future date - save only as a one-time snapshot to that day's log, no template created
        await addTaskToDateLog(targetDate, data);
        const label = targetDate === tomorrow ? 'tomorrow' : targetDate;
        showToast(`Task added for ${label}`);
        onSave();
        return;
      }

      if (isEdit) {
        await updateTask(task.id, data);
        showToast('Task updated');
        const updated = todayTasks.map(t => t.id === task.id ? { ...t, ...data } : t);
        await persistToday(updated);
      } else {
        const newId = await addTask(data);
        showToast('Task added');
        const updated = [...todayTasks, { ...data, id: newId, completed: false }];
        await persistToday(updated);
      }
      onSave();
    } catch {
      showToast('Failed to save task', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      showToast('Task deleted');
      const updated = todayTasks.filter(t => t.id !== task.id);
      await persistToday(updated);
      onDelete();
    } catch {
      showToast('Failed to delete task', 'error');
    }
  };

  const colorObj = getColor(color);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onCancel} className="text-slate-500 dark:text-slate-300 text-sm font-medium">← Back</button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Edit Task' : 'New Task'}</h1>
        <div className="w-12" />
      </div>

      <div className="space-y-5">
        {/* Date label - create mode only */}
        {!isEdit && (
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {targetDate === today
                ? 'Today'
                : targetDate === tomorrow
                  ? 'Tomorrow'
                  : new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        {/* Template quick-pick - shown when scheduling for a future date */}
        {!isEdit && targetDate !== today && templates.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Quick assign from your tasks</label>
            <div className="flex gap-2 mt-1 overflow-x-auto pb-1 -mx-1 px-1">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setName(tmpl.name);
                    setEmoji(tmpl.emoji);
                    setColor(tmpl.color);
                    setTaskType(tmpl.taskType);
                    if (tmpl.duration)     setDuration(tmpl.duration);
                    if (tmpl.durationUnit) setDurationUnit(tmpl.durationUnit);
                    if (tmpl.workMin)      setWorkMin(tmpl.workMin);
                    if (tmpl.breakMin)     setBreakMin(tmpl.breakMin);
                    if (tmpl.sets)         setSets(tmpl.sets);
                    if (tmpl.subtasks)    setSubtasks(tmpl.subtasks);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 active:bg-slate-100 dark:active:bg-white/10"
                >
                  <span>{tmpl.emoji}</span>
                  <span className="font-medium">{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hidden input for native emoji keyboard - sr-only keeps it focusable but invisible */}
        <input
          ref={emojiInputRef}
          type="text"
          className="sr-only"
          aria-hidden="true"
          onChange={handleEmojiInput}
          onBlur={e => { e.target.value = ''; }}
        />

        {/* Emoji + Name */}
        <div className="flex gap-3 items-start">
          <button
            onClick={() => emojiInputRef.current?.focus()}
            className={`w-14 h-14 rounded-2xl ${colorObj.bg} flex items-center justify-center text-2xl flex-shrink-0 active:scale-95 transition-transform`}
          >
            {emoji}
          </button>
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Task Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Morning Run"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-white/30 bg-white dark:bg-slate-900 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1 text-right">{name.length}/30</p>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Color</label>
          <ColorPicker selected={color} onChange={setColor} />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Type</label>
          <TimerTypeSelect value={taskType} onChange={setTaskType} />
        </div>

        {/* Duration - required for countdown, optional for checkbox */}
        {(taskType === 'countdown' || taskType === 'checkbox') && (
          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Duration{taskType === 'checkbox' && <span className="normal-case font-normal text-slate-300 dark:text-slate-600 ml-1">(optional)</span>}
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                min={1}
                max={999}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-white/30 bg-white dark:bg-slate-900"
              />
              <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                {['min', 'hrs'].map(u => (
                  <button
                    key={u}
                    onClick={() => setDurationUnit(u)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                      durationUnit === u ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pomodoro fields */}
        {taskType === 'pomodoro' && (
          <div className="space-y-3">
            {[
              { label: 'Work (minutes)',  value: workMin,  onChange: setWorkMin,  min: 1, max: 120 },
              { label: 'Break (minutes)', value: breakMin, onChange: setBreakMin, min: 1, max: 60  },
              { label: 'Number of Sets',  value: sets,     onChange: setSets,     min: 1, max: 10  },
            ].map(({ label, value, onChange, min, max }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  min={min}
                  max={max}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-white/30 bg-white dark:bg-slate-900"
                />
              </div>
            ))}
          </div>
        )}

        {/* Subtasks - checkbox type only */}
        {taskType === 'checkbox' && (
          <div>
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Subtasks
              <span className="normal-case font-normal text-slate-300 dark:text-slate-600 ml-1">(optional, max 6)</span>
            </label>
            <div className="mt-2 space-y-2">
              {subtasks.map(s => {
                const isEditing = editingSubtaskId === s.id;
                const commitEdit = () => {
                  const trimmed = editingSubtaskVal.trim().slice(0, 40);
                  if (trimmed) setSubtasks(prev => prev.map(x => x.id === s.id ? { ...x, label: trimmed } : x));
                  setEditingSubtaskId(null);
                  setEditingSubtaskVal('');
                };
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingSubtaskVal}
                        onChange={e => setEditingSubtaskVal(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                          if (e.key === 'Escape') { setEditingSubtaskId(null); setEditingSubtaskVal(''); }
                        }}
                        maxLength={40}
                        className="flex-1 text-sm text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/30 focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingSubtaskId(s.id); setEditingSubtaskVal(s.label); }}
                        className="flex-1 text-sm text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 truncate text-left active:bg-slate-100 dark:active:bg-white/10"
                      >
                        {s.label}
                      </button>
                    )}
                    <button
                      onClick={() => setSubtasks(prev => prev.filter(x => x.id !== s.id))}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 dark:text-red-300/70 bg-red-50 dark:bg-red-400/10 active:scale-95 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {subtasks.length < 6 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={e => setSubtaskInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && subtaskInput.trim()) {
                        setSubtasks(prev => [...prev, { id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: subtaskInput.trim().slice(0, 40) }]);
                        setSubtaskInput('');
                      }
                    }}
                    maxLength={40}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-white/30 bg-white dark:bg-slate-900 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                  <button
                    onClick={() => {
                      if (!subtaskInput.trim()) return;
                      setSubtasks(prev => [...prev, { id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: subtaskInput.trim().slice(0, 40) }]);
                      setSubtaskInput('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold active:scale-[0.98]"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          {isEdit
            ? 'Save Changes'
            : targetDate === today
              ? 'Add Task'
              : `Add for ${targetDate === tomorrow ? 'Tomorrow' : targetDate}`}
        </button>

        {isEdit && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 rounded-2xl border border-red-200 dark:border-red-400/30 text-red-500 dark:text-red-300 font-medium text-sm"
          >
            Delete Task
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Delete this task?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">This removes it from your task list. History data is preserved.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
