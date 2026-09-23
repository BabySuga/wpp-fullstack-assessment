import { useEffect, useRef, useState } from 'react';
import './TaskDialog.css';

interface TaskDialogProps {
  isOpen: boolean;
  mode?: 'create' | 'edit';
  initialTitle?: string;
  initialDescription?: string;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export function TaskDialog({
  isOpen,
  mode = 'create',
  initialTitle = '',
  initialDescription = '',
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setTitleError(null);
    setSubmitting(false);
  }, [initialTitle, initialDescription, isOpen]);

  // Open/close native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Native dialog Escape key fires 'cancel' event
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault(); // prevent default close so we can handle state reset
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Click on the backdrop (dialog element itself, not its children)
    if (e.target === dialogRef.current) {
      // Only close if nothing entered (avoid data loss)
      if (!title.trim() && !description.trim()) {
        onClose();
      }
    }
  };

  const validateTitle = (value: string): string | null => {
    if (!value.trim()) return 'Task title is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    const validationError = validateTitle(trimmed);
    setTitleError(validationError);
    if (validationError) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed, description.trim());
      // onSubmit success: parent will call onClose
    } catch {
      // Error is handled by parent; just stop submitting
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="task-dialog"
      aria-labelledby="dialog-title-label"
      onClick={handleBackdropClick}
    >
      <div className="dialog-header">
        <h2 id="dialog-title-label" className="dialog-title">{mode === 'edit' ? 'Edit task' : 'Add task'}</h2>
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="dialog-body">
          <div className="dialog-field">
            <label htmlFor="task-title" className="dialog-label">
              Title
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="What needs to be done?"
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? 'task-title-error' : undefined}
              required
            />
            {titleError && (
              <p id="task-title-error" role="alert" className="field-error">
                {titleError}
              </p>
            )}
          </div>

          <div className="dialog-field">
            <label htmlFor="task-description" className="dialog-label">
              Description
              <span className="dialog-label-optional">(optional)</span>
            </label>
            <textarea
              id="task-description"
              className="input dialog-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail…"
              rows={3}
            />
          </div>
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !title.trim()}
          >
            {submitting ? (mode === 'edit' ? 'Saving…' : 'Adding…') : (mode === 'edit' ? 'Save' : 'Add task')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
