import { useState, type FormEvent } from "react";
import type { Folder, Task, TaskCategory } from "../models/types";
import { TASK_CATEGORIES } from "../utils/category";

interface TaskFormValues {
  title: string;
  subject: string;
  category: TaskCategory;
  dueDate: string;
  dateAssigned: string;
  folderId: string | null;
  notes: string;
}

interface TaskFormModalProps {
  folders: Folder[];
  defaultFolderId: string | null;
  editingTask: Task | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

const emptyValues: TaskFormValues = {
  title: "",
  subject: "",
  category: "Assignment",
  dueDate: "",
  dateAssigned: "",
  folderId: "",
  notes: "",
};

export const TaskFormModal = ({
  folders,
  defaultFolderId,
  editingTask,
  onClose,
  onSubmit,
}: TaskFormModalProps) => {
  const [values, setValues] = useState<TaskFormValues>(() => {
    if (editingTask) {
      return {
        title: editingTask.title,
        subject: editingTask.subject,
        category: editingTask.category ?? "Assignment",
        dueDate: editingTask.dueDate,
        dateAssigned: editingTask.dateAssigned,
        folderId: editingTask.folderId,
        notes: editingTask.notes,
      };
    }

    return {
      ...emptyValues,
      folderId: defaultFolderId ?? folders[0]?.id ?? "",
      dateAssigned: new Date().toISOString().slice(0, 10),
    };
  });
  const [error, setError] = useState("");

  const update = (field: keyof TaskFormValues, value: string | null) => {
    if (error) {
      setError("");
    }
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.title.trim() || !values.subject.trim() || !values.dueDate || !values.dateAssigned) {
      setError("Please fill in all required fields.");
      return;
    }

    if (values.title.trim().length > 80) {
      setError("Title must be 80 characters or less.");
      return;
    }

    onSubmit({
      ...values,
      title: values.title.trim(),
      subject: values.subject.trim(),
      folderId: values.folderId || null,
      notes: values.notes.trim(),
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel wide" role="dialog" aria-modal="true">
        <h2>{editingTask ? "Edit Task" : "Create Task"}</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="grid-form">
            <label>
              Title *
              <input
                value={values.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Task title"
                maxLength={80}
                required
              />
            </label>

            <label>
              Subject *
              <input
                value={values.subject}
                onChange={(event) => update("subject", event.target.value)}
                placeholder="e.g. Math, Work, Personal"
                required
              />
            </label>

            <label>
              Category *
              <select
                value={values.category}
                onChange={(event) => update("category", event.target.value as TaskCategory)}
                required
              >
                {TASK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}s
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date Assigned *
              <input
                type="date"
                value={values.dateAssigned}
                onChange={(event) => update("dateAssigned", event.target.value)}
                required
              />
            </label>

            <label>
              Due Date *
              <input
                type="date"
                value={values.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
                required
              />
            </label>

            <label>
              Folder (optional)
              <select
                value={values.folderId ?? ""}
                onChange={(event) => update("folderId", event.target.value || null)}
              >
                <option value="">
                  No folder yet
                </option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Notes
            <textarea
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={4}
              placeholder="Optional notes"
            />
          </label>

          {error ? <p className="field-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" type="submit">
              {editingTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
