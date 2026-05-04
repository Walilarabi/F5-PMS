import React, { useEffect, useState, useRef } from 'react';

interface KeyboardShortcutsProps {
  onAction: (action: string, params?: any) => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onAction }) => {
  const [isXPressed, setIsXPressed] = useState(false);
  const xTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isInputFocused = () => {
      const active = document.activeElement;
      return (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable)
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const alt = e.altKey;
      const shift = e.shiftKey;

      // List of handled keys to prevent browser default
      const handledFnKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'];
      const handledSimpleKeys = ['N', 'E', 'I', 'O', 'R', 'A', 'T', 'X'];
      const handledSpecialKeys = ['Escape', 'Delete', 'Backspace'];

      const isHandled = 
        handledFnKeys.includes(key) || 
        (handledSimpleKeys.includes(key.toUpperCase()) && !isInputFocused()) ||
        // Fix : Backspace/Delete ne doivent être interceptés QUE hors d'un champ de saisie
        (handledSpecialKeys.includes(key) && (key === 'Escape' || !isInputFocused())) ||
        (ctrl && ['s', 'z', 'y', 'g', 'h', '+', '-'].includes(key.toLowerCase()));

      if (isHandled) {
        e.preventDefault();
        e.stopPropagation();
      }

      // 1. Fn Keys (Always active)
      switch (key) {
        case 'F1': onAction('show-help'); return;
        case 'F2': onAction('planning-prev'); return;
        case 'F3': onAction('planning-next'); return;
        case 'F4': onAction('open-datepicker'); return;
        case 'F5': onAction('set-view', 'week'); return;
        case 'F6': onAction('set-view', '15days'); return;
        case 'F7': onAction('set-view', 'month'); return;
        case 'F9': onAction('open-history'); return;
        case 'Escape': onAction('close-all'); return;
      }

      // 2. Modifiers
      if (ctrl) {
        switch (key.toLowerCase()) {
          case 's': onAction('save'); return;
          case 'z': onAction('undo'); return;
          case 'y': onAction('redo'); return;
          case 'g': onAction('focus-search'); return;
          case 'h': onAction('show-help'); return;
          case '+': onAction('zoom-in'); return;
          case '-': onAction('zoom-out'); return;
        }
        if (alt && key.toLowerCase() === 'q') {
          onAction('logout');
          return;
        }
      }

      // 3. Multi-Folio (X + 1/2/3)
      if (key.toLowerCase() === 'x' && !isInputFocused()) {
        setIsXPressed(true);
        if (xTimerRef.current) clearTimeout(xTimerRef.current);
        xTimerRef.current = setTimeout(() => setIsXPressed(false), 2000);
        return;
      }

      if (isXPressed && ['1', '2', '3'].includes(key)) {
        onAction('set-folio', key);
        setIsXPressed(false);
        if (xTimerRef.current) clearTimeout(xTimerRef.current);
        return;
      }

      // 4. Simple Keys (No Focus)
      if (!isInputFocused()) {
        switch (key.toUpperCase()) {
          case 'T': onAction('go-today'); break;
          case 'N': onAction('new-reservation'); break;
          case 'E': onAction('edit-selected'); break;
          case 'I': onAction('check-in'); break;
          case 'O': onAction('check-out'); break;
          case 'R': onAction('generate-report'); break;
          case 'A': onAction('open-clients'); break;
          // Delete/Backspace : uniquement hors input (déjà garanti par !isInputFocused)
          case 'DELETE':
          case 'BACKSPACE': onAction('cancel-selected'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Capture phase to be sure
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (xTimerRef.current) clearTimeout(xTimerRef.current);
    };
  }, [onAction, isXPressed]);

  return null;
};
