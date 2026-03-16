import type { Folder, Task } from "../models/types";
import { formatShortDate, isTaskDueToday, isTaskOverdue } from "../utils/date";
import { getCategoryClassName } from "../utils/category";

interface TaskCardProps {
  task: Task;
  folder?: Folder;
  enableCompletionTracking: boolean;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard = ({
  task,
  folder,
  enableCompletionTracking,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) => {
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task) && !task.completed;
  const categoryClass = getCategoryClassName(task.category);

  return (
    <article
      className={`task-card ${task.completed ? "completed" : ""} ${
        overdue ? "overdue" : ""
      } ${dueToday ? "due-today" : ""} ${categoryClass}`}
    >
      <div className="task-main">
        <div className="task-title-row">
          <h3 className={task.completed ? "task-title-completed" : ""}>{task.title}</h3>
          <span className={`category-badge ${categoryClass}`}>{task.category}</span>
        </div>
        <p className="task-subject">{task.subject}</p>
        {task.notes ? <p className="task-notes">{task.notes}</p> : null}
      </div>

      <dl className="task-meta">
        <div>
          <dt>Folder</dt>
          <dd>{folder?.name ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt>Date Assigned</dt>
          <dd>{formatShortDate(task.dateAssigned)}</dd>
        </div>
        <div>
          <dt>Due Date</dt>
          <dd>{formatShortDate(task.dueDate)}</dd>
        </div>
      </dl>

      <div className="task-actions">
        {enableCompletionTracking ? (
          <label className="complete-toggle">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task)}
            />
            <span>{task.completed ? "Completed" : "Mark Complete"}</span>
          </label>
        ) : null}
        <button type="button" className="ghost-btn" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button type="button" className="danger-btn" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </article>
  );
};
