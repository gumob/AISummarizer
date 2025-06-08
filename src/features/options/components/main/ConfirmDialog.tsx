import { Fragment } from 'react';

import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';

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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop
            className={`
              fixed inset-0
              bg-white/30 dark:bg-black/30
              backdrop-blur-md
            `}
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={`
                mx-auto max-w-xs p-6 rounded-lg
                bg-white dark:bg-zinc-800
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
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
