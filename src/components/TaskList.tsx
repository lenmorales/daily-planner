import type { Folder, Task, TaskCategory } from "../models/types";
import { CategoryFilterControl } from "./CategoryFilterControl";
import { EmptyState } from "./EmptyState";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  folders: Folder[];
  title: string;
  description: string;
  categoryFilter: "all" | TaskCategory;
  onChangeCategoryFilter: (value: "all" | TaskCategory) => void;
  enableCompletionTracking: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export const TaskList = ({
  tasks,
  folders,
  title,
  description,
  categoryFilter,
  onChangeCategoryFilter,
  enableCompletionTracking,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
}: TaskListProps) => {
  const folderById = folders.reduce<Record<string, Folder>>((accumulator, folder) => {
    accumulator[folder.id] = folder;
    return accumulator;
  }, {});

  return (
    <section className="content-panel">
      <div className="panel-title">
        <div className="panel-title-main">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <CategoryFilterControl
          value={categoryFilter}
          onChange={onChangeCategoryFilter}
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks here yet"
          description="Create a task to populate this view and stay on top of deadlines."
        />
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              folder={task.folderId ? folderById[task.folderId] : undefined}
              enableCompletionTracking={enableCompletionTracking}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </section>
  );
};
