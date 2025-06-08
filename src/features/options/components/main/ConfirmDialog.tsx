import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, title, onConfirm, description, confirmText = 'Confirm' }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      transition
      className={`
        fixed inset-0 p-4 flex w-screen items-center justify-center z-50
        bg-black/30
        transition duration-300 ease-out data-closed:opacity-0
      `}
    >
      {/* Backdrop */}
      <DialogBackdrop
        className={`
          fixed inset-0
          bg-white/30 dark:bg-black/30
          backdrop-blur-md
        `}
      />
      {/* Dialog */}
      <DialogPanel
        className={`
          mx-auto max-w-xs p-6 rounded-lg
          bg-white dark:bg-zinc-800
          z-50
        `}
      >
        <DialogTitle className="text-xl font-semibold mb-2">{title}</DialogTitle>
        <Description>{description}</Description>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className={`
                rounded-full px-4 py-2
                font-semibold text-zinc-900 dark:text-zinc-100
                bg-zinc-200 dark:bg-zinc-700
                hover:bg-zinc-300 dark:hover:bg-zinc-600
                transition-colors
                `}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`
                rounded-full px-4 py-2
                font-semibold text-white
                bg-red-600
                hover:bg-red-700
                transition-colors
                `}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
