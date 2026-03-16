import type { AppView } from "../models/types";

interface AppHeaderProps {
  view: AppView;
  onChangeView: (view: AppView) => void;
  onCreateTask: () => void;
  onOpenSettings: () => void;
}

export const AppHeader = ({
  view,
  onChangeView,
  onCreateTask,
  onOpenSettings,
}: AppHeaderProps) => {
  const selectedView = view === "folder" ? "all" : view;

  return (
    <header className="app-header">
      <div>
        <h1>Daily Planner</h1>
        <p>Track tasks, folders, deadlines, and progress in one place.</p>
      </div>

      <div className="header-actions">
        <label className="view-filter">
          <span>View</span>
          <select
            value={selectedView}
            onChange={(event) => onChangeView(event.target.value as AppView)}
          >
            <option value="all">All Tasks</option>
            <option value="today">Today</option>
            <option value="overdue">Overdue Tasks</option>
            <option value="calendar">Calendar</option>
          </select>
        </label>

        <button
          className="primary-btn"
          type="button"
          onClick={onCreateTask}
        >
          + New Task
        </button>
        <button className="ghost-btn" type="button" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </header>
  );
};
