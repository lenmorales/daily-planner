import { useState, type FormEvent } from "react";

interface FolderModalProps {
  initialName?: string;
  mode: "create" | "rename";
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const FolderModal = ({
  initialName = "",
  mode,
  onClose,
  onSubmit,
}: FolderModalProps) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Folder name is required.");
      return;
    }

    if (trimmed.length > 32) {
      setError("Folder name must be 32 characters or less.");
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true">
        <h2>{mode === "create" ? "Create Folder" : "Rename Folder"}</h2>
        <form onSubmit={submit} className="modal-form">
          <label>
            Folder Name
            <input
              autoFocus
              value={name}
              onChange={(event) => {
                setError("");
                setName(event.target.value);
              }}
              placeholder="e.g. School"
              maxLength={32}
            />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {mode === "create" ? "Create Folder" : "Save Name"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
