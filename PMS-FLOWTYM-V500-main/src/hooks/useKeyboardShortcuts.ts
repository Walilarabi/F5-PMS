import { useEffect } from 'react';

interface ShortcutHandlers {
  onNew?: () => void;
  onEdit?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onReport?: () => void;
  onClients?: () => void;
  onToday?: () => void;
  onPrevPeriod?: () => void;
  onNextPeriod?: () => void;
  onCustomPeriod?: () => void;
  onSearchFocus?: () => void;
  onCancel?: () => void;
  onDuplicate?: () => void;
  onCloseModal?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName);
      
      // Global keys
      if (e.key === 'F1' || (e.ctrlKey && e.key === '?')) {
        e.preventDefault();
        handlers.onHelp?.();
        return;
      }

      if (e.key === 'Escape') {
        handlers.onCloseModal?.();
        return;
      }

      if (!isInput) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handlers.onNew?.();
            break;
          case 'e':
            e.preventDefault();
            handlers.onEdit?.();
            break;
          case 'i':
            e.preventDefault();
            handlers.onCheckIn?.();
            break;
          case 'o':
            e.preventDefault();
            handlers.onCheckOut?.();
            break;
          case 'r':
            e.preventDefault();
            handlers.onReport?.();
            break;
          case 'a':
            e.preventDefault();
            handlers.onClients?.();
            break;
          case 't':
            e.preventDefault();
            handlers.onToday?.();
            break;
          case 'delete':
            e.preventDefault();
            handlers.onCancel?.();
            break;
        }
      }

      // Function keys
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          handlers.onPrevPeriod?.();
          break;
        case 'F3':
          e.preventDefault();
          handlers.onNextPeriod?.();
          break;
        case 'F4':
          e.preventDefault();
          handlers.onCustomPeriod?.();
          break;
      }

      // Control shortcuts
      if (e.ctrlKey) {
        if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          handlers.onSearchFocus?.();
        }
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handlers.onDuplicate?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
