import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import "./App.css";
import Auth from "./Auth";
import { AppHeader } from "./components/AppHeader";
import { CalendarView } from "./components/CalendarView";
import { FolderModal } from "./components/FolderModal";
import { SettingsModal } from "./components/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { TaskFormModal } from "./components/TaskFormModal";
import { TaskList } from "./components/TaskList";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  createFolder,
  deleteFolder as deleteFolderInDb,
  getFolders,
} from "./lib/folders";
import {
  createTask as createTaskInDb,
  deleteTask as deleteTaskInDb,
  getTasks,
  updateTask as updateTaskInDb,
} from "./lib/tasks";
import { supabase } from "./lib/supabase";
import type { AppSettings, AppView, Folder, Task, TaskCategory } from "./models/types";
import { isTaskOverdue, sortByDueDate, toDateKey } from "./utils/date";

const SETTINGS_KEY = "planner-settings";

function PlannerApp() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  const mapDbTaskToTask = (task: Record<string, unknown>): Task => ({
    id: String(task.id),
    title: String(task.title ?? ""),
    subject: String(task.subject ?? ""),
    category: (task.category as TaskCategory) ?? "Assignment",
    dueDate: String(task.due_date ?? ""),
    dateAssigned: String(task.date_assigned ?? ""),
    folderId: task.folder_id ? String(task.folder_id) : null,
    completed: Boolean(task.completed),
    completedAt: task.completed_at ? String(task.completed_at) : null,
    notes: String(task.notes ?? ""),
    createdAt: String(task.created_at ?? new Date().toISOString()),
    updatedAt: String(task.updated_at ?? new Date().toISOString()),
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    getFolders().then((data) => {
      const normalizedFolders = (data ?? [])
        .filter((folder) => folder.id && folder.name && folder.created_at)
        .map((folder) => ({
          id: String(folder.id),
          name: String(folder.name),
          createdAt: String(folder.created_at),
        }));

      if (normalizedFolders.length > 0) {
        setFolders(normalizedFolders);
      }
    });
  }, [setFolders]);

  useEffect(() => {
    getTasks().then((data) => {
      const normalizedTasks = (data ?? [])
        .filter((task) => task.id)
        .map((task) => mapDbTaskToTask(task as Record<string, unknown>));

      setTasks(normalizedTasks);
    });
  }, [setTasks]);

  useEffect(() => {
    const refreshFolders = async () => {
      const data = await getFolders();
      const normalizedFolders = (data ?? [])
        .filter((folder) => folder.id && folder.name && folder.created_at)
        .map((folder) => ({
          id: String(folder.id),
          name: String(folder.name),
          createdAt: String(folder.created_at),
        }));

      setFolders(normalizedFolders);
    };

    const refreshTasks = async () => {
      const data = await getTasks();
      const normalizedTasks = (data ?? [])
        .filter((task) => task.id)
        .map((task) => mapDbTaskToTask(task as Record<string, unknown>));

      setTasks(normalizedTasks);
    };

    const channel = supabase
      .channel("planner-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        () => {
          refreshTasks();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        () => {
          refreshTasks();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tasks" },
        () => {
          refreshTasks();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "folders" },
        () => {
          refreshFolders();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "folders" },
        () => {
          refreshFolders();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "folders" },
        () => {
          refreshFolders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setFolders, setTasks]);

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

  const handleTaskSubmit = async (values: {
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
      const updated = await updateTaskInDb({
        id: editingTask.id,
        title: values.title,
        subject: values.subject,
        category: values.category,
        due_date: values.dueDate,
        date_assigned: values.dateAssigned,
        folder_id: values.folderId,
        notes: values.notes,
        updated_at: now,
      });
      const updatedRecord = updated?.[0];
      if (!updatedRecord) {
        return;
      }
      const normalized = mapDbTaskToTask(updatedRecord as Record<string, unknown>);
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingTask.id ? normalized : task,
        ),
      );
      closeTaskModal();
      return;
    }

    const created = await createTaskInDb({
      title: values.title,
      subject: values.subject,
      category: values.category,
      due_date: values.dueDate,
      date_assigned: values.dateAssigned,
      folder_id: values.folderId,
      completed: false,
      completed_at: null,
      notes: values.notes,
      created_at: now,
      updated_at: now,
    });
    const createdRecord = created?.[0];
    if (!createdRecord) {
      return;
    }
    const normalized = mapDbTaskToTask(createdRecord as Record<string, unknown>);
    setTasks((previous) => [...previous, normalized]);
    closeTaskModal();
  };

  const handleDeleteTask = async (task: Task) => {
    const approved = window.confirm(`Delete task "${task.title}"?`);
    if (!approved) {
      return;
    }

    await deleteTaskInDb(task.id);
    setTasks((previous) => previous.filter((item) => item.id !== task.id));
  };

  const handleToggleComplete = async (task: Task) => {
    if (!settings.enableTaskCompletionTracking) {
      return;
    }

    const now = new Date().toISOString();
    const updated = await updateTaskInDb({
      id: task.id,
      completed: !task.completed,
      completed_at: task.completed ? null : now,
      updated_at: now,
    });
    const updatedRecord = updated?.[0];
    if (!updatedRecord) {
      return;
    }
    const normalized = mapDbTaskToTask(updatedRecord as Record<string, unknown>);
    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id ? normalized : item,
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

  const handleFolderSubmit = async (name: string) => {
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

    const created = await createFolder(name);
    const createdRecord = created?.[0];

    if (!createdRecord) {
      console.error("Failed to create folder in Supabase.");
      window.alert("Could not save folder to Supabase. Please try again.");
      return;
    }

    const folder: Folder = {
      id: String(createdRecord.id),
      name: String(createdRecord.name),
      createdAt: String(createdRecord.created_at),
    };

    setFolders((previous) => [...previous, folder]);
    closeFolderModal();
  };

  const handleDeleteFolder = async (folder: Folder) => {
    const approved = window.confirm(
      `Delete folder "${folder.name}" and all tasks inside it?`,
    );
    if (!approved) {
      return;
    }

    await deleteFolderInDb(folder.id);
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

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoadingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loadingSession) {
    return (
      <div className="app-shell">
        <div className="content-panel">
          <div className="panel-title">
            <div className="panel-title-main">
              <h2>Loading...</h2>
              <p>Checking your session.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <PlannerApp />;
}

export default App;

