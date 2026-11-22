import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role } from '@/data/types';
import { useCalendarStore } from '@/stores/calendarStore';
import { usePaletteStore } from '@/stores/paletteStore';
import { useUiStore } from '@/stores/uiStore';
import { GO_TO } from './shortcuts';

const SEQUENCE_MS = 1200;
const TYPING = 'input, textarea, select, [contenteditable="true"], [role="combobox"]';
const OVERLAYS = '[role="dialog"], [role="alertdialog"], [role="menu"]';

/**
 * Single-key shortcuts. They use `event.code` (works on the Arabic layout) and stay silent while the
 * user is typing or any dialog, popover or menu is open.
 */
export function useShortcuts(role: Role): void {
  const navigate = useNavigate();
  const goPressedAt = useRef(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest(TYPING) || document.querySelector(OVERLAYS)) return;

      const handled = () => event.preventDefault();
      const ui = useUiStore.getState();

      if (goPressedAt.current && Date.now() - goPressedAt.current < SEQUENCE_MS) {
        goPressedAt.current = 0;
        const path = GO_TO[role][event.code];
        if (path) {
          handled();
          navigate(path);
        }
        return;
      }

      switch (event.code) {
        case 'Slash':
          handled();
          if (event.shiftKey) ui.setShortcutsOpen(true);
          else usePaletteStore.getState().setOpen(true);
          break;
        case 'KeyG':
          goPressedAt.current = Date.now();
          break;
        case 'KeyN':
          if (role === 'receptionist') {
            handled();
            ui.openForm({ mode: 'create' });
          }
          break;
        case 'KeyT':
          handled();
          if (role === 'receptionist') {
            useCalendarStore.getState().goToday();
            navigate('/calendar');
          } else navigate('/my-schedule');
          break;
        case 'BracketLeft':
        case 'BracketRight':
          if (role === 'receptionist' && window.location.hash.startsWith('#/calendar')) {
            handled();
            useCalendarStore.getState().shift(event.code === 'BracketLeft' ? -1 : 1);
          }
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [role, navigate]);
}
