import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AppHeader } from "./components/AppHeader";
import { CalendarView } from "./components/CalendarView";
import { FolderModal } from "./components/FolderModal";
import { SettingsModal } from "./components/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { TaskFormModal } from "./components/TaskFormModal";
import { TaskList } from "./components/TaskList";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { AppSettings, AppView, Folder, Task, TaskCategory } from "./models/types";
import { isTaskOverdue, sortByDueDate, toDateKey } from "./utils/date";
import { createId } from "./utils/id";

const FOLDERS_KEY = "planner-folders";
const TASKS_KEY = "planner-tasks";
const SETTINGS_KEY = "planner-settings";

function App() {
  const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_KEY, []);
  const [tasks, setTasks] = useLocalStorage<Task[]>(TASKS_KEY, []);
  const [settings, setSettings] = useLocalStorage<AppSettings>(SETTINGS_KEY, {
    enableTaskCompletionTracking: true,
  });
  const [view, setView] = useState<AppView>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TaskCategory>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<string | null>(toDateKey(new Date()));

  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const taskCountByFolder = useMemo(() => {
    return tasks.reduce<Record<string, number>>((accumulator, task) => {
      if (!task.folderId) {
        return accumulator;
      }
      accumulator[task.folderId] = (accumulator[task.folderId] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [tasks]);

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
  const allTasksUnsorted = tasks.map((task) => ({
    ...task,
    category: task.category ?? "Assignment",
    completed: task.completed ?? false,
    completedAt: task.completedAt ?? null,
  }));
  const applyCategoryFilter = (items: Task[]) => {
    if (categoryFilter === "all") {
      return items;
    }
    return items.filter((task) => task.category === categoryFilter);
  };
  const allTasks = sortByDueDate(allTasksUnsorted);
  const overdueTasks = sortByDueDate(allTasks.filter((task) => isTaskOverdue(task)));
  const todayKey = toDateKey(new Date(clockTick));
  const todayDueTasks = sortByDueDate(
    allTasks.filter((task) => task.dueDate === todayKey && !task.completed),
  );
  const todayViewTasks = [...overdueTasks, ...todayDueTasks.filter((task) => !isTaskOverdue(task))];
  const folderTasks = sortByDueDate(
    allTasks.filter((task) => task.folderId === selectedFolderId),
  );

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = (values: {
    title: string;
    subject: string;
    category: TaskCategory;
    dueDate: string;
    dateAssigned: string;
    folderId: string | null;
    notes: string;
  }) => {
    const now = new Date().toISOString();

    if (editingTask) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                ...values,
                updatedAt: now,
              }
            : task,
        ),
      );
      closeTaskModal();
      return;
    }

    const nextTask: Task = {
      id: createId(),
      title: values.title,
      subject: values.subject,
      category: values.category,
      dueDate: values.dueDate,
      dateAssigned: values.dateAssigned,
      folderId: values.folderId,
      completed: false,
      completedAt: null,
      notes: values.notes,
      createdAt: now,
      updatedAt: now,
    };

    setTasks((previous) => [...previous, nextTask]);
    closeTaskModal();
  };

  const handleDeleteTask = (task: Task) => {
    const approved = window.confirm(`Delete task "${task.title}"?`);
    if (!approved) {
      return;
    }

    setTasks((previous) => previous.filter((item) => item.id !== task.id));
  };

  const handleToggleComplete = (task: Task) => {
    if (!settings.enableTaskCompletionTracking) {
      return;
    }

    const now = new Date().toISOString();
    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: item.completed ? null : now,
              updatedAt: now,
            }
          : item,
      ),
    );
  };

  const handleOpenCreateFolder = () => {
    setRenamingFolder(null);
    setFolderModalOpen(true);
  };

  const handleOpenRenameFolder = (folder: Folder) => {
    setRenamingFolder(folder);
    setFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    setFolderModalOpen(false);
    setRenamingFolder(null);
  };

  const handleFolderSubmit = (name: string) => {
    const exists = folders.some(
      (folder) =>
        folder.name.toLowerCase() === name.toLowerCase() &&
        folder.id !== renamingFolder?.id,
    );

    if (exists) {
      window.alert("Folder name already exists.");
      return;
    }

    if (renamingFolder) {
      setFolders((previous) =>
        previous.map((folder) =>
          folder.id === renamingFolder.id ? { ...folder, name } : folder,
        ),
      );
      closeFolderModal();
      return;
    }

    const folder: Folder = {
      id: createId(),
      name,
      createdAt: new Date().toISOString(),
    };
    setFolders((previous) => [...previous, folder]);
    closeFolderModal();
  };

  const handleDeleteFolder = (folder: Folder) => {
    const approved = window.confirm(
      `Delete folder "${folder.name}" and all tasks inside it?`,
    );
    if (!approved) {
      return;
    }

    setFolders((previous) => previous.filter((item) => item.id !== folder.id));
    setTasks((previous) => previous.filter((task) => task.folderId !== folder.id));

    if (selectedFolderId === folder.id) {
      setSelectedFolderId(null);
      setView("all");
    }
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setView("folder");
  };

  const renderMainContent = () => {
    if (view === "calendar") {
      return (
        <CalendarView
          tasks={applyCategoryFilter(allTasks)}
          folders={folders}
          selectedDate={calendarDate}
          categoryFilter={categoryFilter}
          onChangeCategoryFilter={setCategoryFilter}
          enableCompletionTracking={settings.enableTaskCompletionTracking}
          onToggleComplete={handleToggleComplete}
          onSelectDate={(date) => setCalendarDate(date)}
        />
      );
    }

    if (view === "today") {
      return (
        <TaskList
          tasks={applyCategoryFilter(todayViewTasks)}
          folders={folders}
          title="Today View"
          description="Overdue tasks first, followed by tasks due today."
          categoryFilter={categoryFilter}
          onChangeCategoryFilter={setCategoryFilter}
          enableCompletionTracking={settings.enableTaskCompletionTracking}
          onEditTask={openEditTask}
          onDeleteTask={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      );
    }

    if (view === "overdue") {
      return (
        <TaskList
          tasks={applyCategoryFilter(overdueTasks)}
          folders={folders}
          title="Overdue Tasks"
          description="Tasks past due date and not completed."
          categoryFilter={categoryFilter}
          onChangeCategoryFilter={setCategoryFilter}
          enableCompletionTracking={settings.enableTaskCompletionTracking}
          onEditTask={openEditTask}
          onDeleteTask={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      );
    }

    if (view === "folder" && selectedFolder) {
      return (
        <TaskList
          tasks={applyCategoryFilter(folderTasks)}
          folders={folders}
          title={selectedFolder.name}
          description="Tasks assigned to this folder."
          categoryFilter={categoryFilter}
          onChangeCategoryFilter={setCategoryFilter}
          enableCompletionTracking={settings.enableTaskCompletionTracking}
          onEditTask={openEditTask}
          onDeleteTask={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      );
    }

    return (
      <TaskList
        tasks={applyCategoryFilter(allTasks)}
        folders={folders}
        title="All Tasks"
        description="Everything across every folder, sorted by due date."
        categoryFilter={categoryFilter}
        onChangeCategoryFilter={setCategoryFilter}
        enableCompletionTracking={settings.enableTaskCompletionTracking}
        onEditTask={openEditTask}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
      />
    );
  };

  return (
    <div className="app-shell">
      <AppHeader
        view={view}
        onChangeView={setView}
        onCreateTask={openCreateTask}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="layout">
        <Sidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          taskCountByFolder={taskCountByFolder}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={handleOpenCreateFolder}
          onRenameFolder={handleOpenRenameFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        {renderMainContent()}
      </div>

      {isTaskModalOpen ? (
        <TaskFormModal
          folders={folders}
          defaultFolderId={selectedFolderId}
          editingTask={editingTask}
          onClose={closeTaskModal}
          onSubmit={handleTaskSubmit}
        />
      ) : null}

      {isFolderModalOpen ? (
        <FolderModal
          mode={renamingFolder ? "rename" : "create"}
          initialName={renamingFolder?.name}
          onClose={closeFolderModal}
          onSubmit={handleFolderSubmit}
        />
      ) : null}

      {isSettingsOpen ? (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onToggleCompletionTracking={() =>
            setSettings((previous) => ({
              ...previous,
              enableTaskCompletionTracking: !previous.enableTaskCompletionTracking,
            }))
          }
        />
      ) : null}
    </div>
  );
}

export default App;
