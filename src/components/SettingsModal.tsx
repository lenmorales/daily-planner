import type { AppSettings } from "../models/types";

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onToggleCompletionTracking: () => void;
}

export const SettingsModal = ({
  settings,
  onClose,
  onToggleCompletionTracking,
}: SettingsModalProps) => {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true">
        <h2>App Settings</h2>
        <div className="settings-list">
          <label className="setting-row">
            <span>
              <strong>Enable Task Completion Tracking</strong>
              <small>
                Show completion checkboxes and track completed timestamps.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.enableTaskCompletionTracking}
              onChange={onToggleCompletionTracking}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
