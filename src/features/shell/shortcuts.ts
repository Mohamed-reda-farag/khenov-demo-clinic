import type { Role } from '@/data/types';

export type ShortcutGroup = 'general' | 'calendar' | 'goto';

export interface Shortcut {
  id: string;
  group: ShortcutGroup;
  /** Pressed one after the other. `'mod'` is Ctrl (Windows/Linux) or Cmd (Mac). */
  keys: string[];
  roles: Role[];
}

/** Shown in the "?" cheat-sheet. The handlers live in useShortcuts. */
export const SHORTCUTS: Shortcut[] = [
  { id: 'palette', group: 'general', keys: ['mod', 'K'], roles: ['receptionist', 'doctor'] },
  { id: 'search', group: 'general', keys: ['/'], roles: ['receptionist', 'doctor'] },
  { id: 'help', group: 'general', keys: ['?'], roles: ['receptionist', 'doctor'] },
  { id: 'undo', group: 'general', keys: ['mod', 'Z'], roles: ['receptionist', 'doctor'] },
  { id: 'newAppointment', group: 'calendar', keys: ['N'], roles: ['receptionist'] },
  { id: 'today', group: 'calendar', keys: ['T'], roles: ['receptionist', 'doctor'] },
  { id: 'prev', group: 'calendar', keys: ['['], roles: ['receptionist'] },
  { id: 'next', group: 'calendar', keys: [']'], roles: ['receptionist'] },
  { id: 'goDashboard', group: 'goto', keys: ['G', 'D'], roles: ['receptionist', 'doctor'] },
  { id: 'goCalendar', group: 'goto', keys: ['G', 'C'], roles: ['receptionist', 'doctor'] },
  { id: 'goPatients', group: 'goto', keys: ['G', 'P'], roles: ['receptionist'] },
  { id: 'goServices', group: 'goto', keys: ['G', 'S'], roles: ['receptionist'] },
  { id: 'goReports', group: 'goto', keys: ['G', 'R'], roles: ['receptionist', 'doctor'] },
];

/** Where "G then <key>" goes for each role. */
export const GO_TO: Record<Role, Record<string, string>> = {
  receptionist: {
    KeyD: '/dashboard',
    KeyC: '/calendar',
    KeyP: '/patients',
    KeyS: '/services',
    KeyR: '/reports',
  },
  doctor: { KeyD: '/my-day', KeyC: '/my-schedule', KeyR: '/my-reports' },
};
