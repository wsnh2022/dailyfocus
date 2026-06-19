import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

export default function SortableTaskCard({ task, onToggleComplete }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity:  isDragging ? 0.35 : 1,
    zIndex:   isDragging ? 50 : 'auto',
    position: 'relative',
  };

  return (
    <li ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </li>
  );
}
