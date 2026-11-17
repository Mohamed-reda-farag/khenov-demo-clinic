import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useCallback, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { BrandMark } from '@/components/ui/BrandMark';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { repositories } from '@/data/repository';
import type { Session } from '@/data/types';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { useAsync } from '@/lib/useAsync';
import { usePrefsStore } from '@/stores/prefsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { SIDEBAR_MAX, SIDEBAR_MIN, SIDEBAR_STEP } from '@/theme/layout';
import { navFor, type NavItem } from './nav';

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation();
  const lang = usePrefsStore((state) => state.lang);
  const Icon = item.icon;
  const label = t(item.labelKey);

  const link = (
    <NavLink
      to={item.path}
      aria-label={collapsed ? label : undefined}
      className={cn(
        'press flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted hover:bg-sunken hover:text-fg aria-[current=page]:bg-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-primary-strong',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip label={label} side={lang === 'ar' ? 'left' : 'right'}>
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function DoctorName({ id }: { id: string }) {
  const localize = useLocalized();
  const load = useCallback(() => repositories.doctors.getById(id), [id]);
  const state = useAsync(load);
  if (state.status !== 'success' || !state.data)
    return <span aria-hidden className="skeleton inline-block h-4 w-24 rounded-md align-middle" />;
  return <>{localize(state.data.name)}</>;
}

function UserChip({ session, collapsed }: { session: Session; collapsed: boolean }) {
  const { t } = useTranslation();
  const logout = useSessionStore((state) => state.logout);
  const roleLabel = t(`roles.${session.role}`);

  return (
    <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong"
      >
        {roleLabel.charAt(0)}
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">
            {session.doctorId ? <DoctorName id={session.doctorId} /> : roleLabel}
          </p>
          <p className="truncate text-xs text-muted">
            {session.doctorId ? roleLabel : t('shell.demoSession')}
          </p>
        </div>
      )}
      <Tooltip label={t('shell.signOut')}>
        <IconButton aria-label={t('shell.signOut')} onClick={() => void logout()}>
          <LogOut className="size-5 rtl:-scale-x-100" aria-hidden />
        </IconButton>
      </Tooltip>
    </div>
  );
}

function ResizeHandle() {
  const { t } = useTranslation();
  const width = usePrefsStore((state) => state.sidebarWidth);
  const setWidth = usePrefsStore((state) => state.setSidebarWidth);
  const resetWidth = usePrefsStore((state) => state.resetSidebarWidth);
  const [dragging, setDragging] = useState(false);
  const isRtl = () => document.documentElement.dir === 'rtl';

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setWidth(isRtl() ? window.innerWidth - event.clientX : event.clientX);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const grow = isRtl() ? 'ArrowLeft' : 'ArrowRight';
    const shrink = isRtl() ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === grow) setWidth(width + SIDEBAR_STEP);
    else if (event.key === shrink) setWidth(width - SIDEBAR_STEP);
    else if (event.key === 'Home') setWidth(SIDEBAR_MIN);
    else if (event.key === 'End') setWidth(SIDEBAR_MAX);
    else return;
    event.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t('shell.resizeSidebar')}
      aria-valuemin={SIDEBAR_MIN}
      aria-valuemax={SIDEBAR_MAX}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={resetWidth}
      onKeyDown={onKeyDown}
      className={cn(
        'absolute inset-y-0 -end-1 z-10 w-2 cursor-col-resize hover:bg-primary-soft',
        dragging && 'bg-primary-soft',
      )}
    />
  );
}

export function Sidebar({ session }: { session: Session }) {
  const { t } = useTranslation();
  const collapsed = usePrefsStore((state) => state.sidebarCollapsed);
  const setCollapsed = usePrefsStore((state) => state.setSidebarCollapsed);
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar');
  const items = navFor(session.role);
  const main = items.filter((item) => item.id !== 'settings');
  const settings = items.filter((item) => item.id === 'settings');

  return (
    <aside className="relative flex min-h-0 flex-col border-e border-line bg-surface">
      <div className={cn('flex h-16 items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
        <BrandMark
          name={collapsed ? undefined : t('app.name')}
          className="min-w-0 flex-1 justify-start"
        />
        {!collapsed && (
          <Tooltip label={toggleLabel}>
            <IconButton
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(true)}
            >
              <Toggle className="size-5 rtl:-scale-x-100" aria-hidden />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {collapsed && (
        <div className="flex justify-center pb-2">
          <Tooltip label={toggleLabel} side="bottom">
            <IconButton
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(false)}
            >
              <Toggle className="size-5 rtl:-scale-x-100" aria-hidden />
            </IconButton>
          </Tooltip>
        </div>
      )}

      <nav
        aria-label={t('shell.mainNav')}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-2"
      >
        {main.map((item) => (
          <SidebarLink key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t border-line p-3">
        {settings.map((item) => (
          <SidebarLink key={item.id} item={item} collapsed={collapsed} />
        ))}
        <UserChip session={session} collapsed={collapsed} />
      </div>

      {!collapsed && <ResizeHandle />}
    </aside>
  );
}
