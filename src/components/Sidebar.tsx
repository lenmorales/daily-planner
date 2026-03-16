import type { Folder } from "../models/types";

interface SidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  taskCountByFolder: Record<string, number>;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
}

export const Sidebar = ({
  folders,
  selectedFolderId,
  taskCountByFolder,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: SidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Folders</h2>
        <button type="button" className="secondary-btn" onClick={onCreateFolder}>
          + Folder
        </button>
      </div>

      {folders.length === 0 ? (
        <p className="sidebar-empty">
          No folders yet. Add one to start organizing your tasks.
        </p>
      ) : (
        <ul className="folder-list">
          {folders.map((folder) => (
            <li
              key={folder.id}
              className={
                selectedFolderId === folder.id ? "folder-item active" : "folder-item"
              }
            >
              <button
                type="button"
                className="folder-select"
                onClick={() => onSelectFolder(folder.id)}
              >
                <span className="folder-name">{folder.name}</span>
                <span className="folder-count">{taskCountByFolder[folder.id] ?? 0}</span>
              </button>
              <div className="folder-actions">
                <button type="button" onClick={() => onRenameFolder(folder)}>
                  Rename
                </button>
                <button type="button" onClick={() => onDeleteFolder(folder)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};
