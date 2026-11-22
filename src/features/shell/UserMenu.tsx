import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Keyboard, LogOut, Repeat, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@/data/types';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useResetDemo } from '@/features/demo/useResetDemo';
import { useLocalized } from '@/i18n/useLocalized';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore } from '@/stores/uiStore';
import { homePathFor } from './nav';

const ITEM =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-fg outline-none data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary-strong';

/** Name, role switch (no data reset), shortcuts, reset demo and sign out. */
export function UserMenu({ session }: { session: Session }) {
  const { t } = useTranslation();
  const localize = useLocalized();
  const navigate = useNavigate();
  const login = useSessionStore((state) => state.login);
  const logout = useSessionStore((state) => state.logout);
  const setShortcutsOpen = useUiStore((state) => state.setShortcutsOpen);
  const resetDemo = useResetDemo();
  const { doctorById } = useCatalogMaps();

  const roleLabel = t(`roles.${session.role}`);
  const doctor = session.doctorId ? doctorById.get(session.doctorId) : undefined;
  const name = doctor ? localize(doctor.name) : roleLabel;
  const otherRole = session.role === 'receptionist' ? 'doctor' : 'receptionist';

  const switchRole = async () => {
    await login(otherRole);
    navigate(homePathFor(otherRole));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="press flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-sunken"
        >
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong"
          >
            {name.replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}
          </span>
          <span className="hidden min-w-0 text-start xl:block">
            <span className="block max-w-40 truncate text-sm font-semibold text-fg">{name}</span>
            <span className="block text-xs text-muted">{roleLabel}</span>
          </span>
          <ChevronDown className="size-4 text-muted" aria-hidden />
          <span className="sr-only">{t('shell.userMenu')}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="panel z-[60] w-64 rounded-lg border border-line bg-surface p-2 shadow-lg"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block truncate text-sm font-semibold text-fg">{name}</span>
            <span className="block text-xs text-muted">{t('shell.demoSession')}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={ITEM} onSelect={() => void switchRole()}>
            <Repeat className="size-4" aria-hidden />
            {t('shell.switchTo', { role: t(`roles.${otherRole}`) })}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={ITEM} onSelect={() => setShortcutsOpen(true)}>
            <Keyboard className="size-4" aria-hidden />
            {t('shell.shortcuts')}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={ITEM} onSelect={() => void resetDemo()}>
            <RotateCcw className="size-4" aria-hidden />
            {t('palette.resetDemo')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={ITEM} onSelect={() => void logout()}>
            <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
            {t('shell.signOut')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
