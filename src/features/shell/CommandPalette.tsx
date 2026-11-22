import * as Dialog from '@radix-ui/react-dialog';
import { Search, SearchX } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Kbd } from '@/components/ui/Kbd';
import type { Role } from '@/data/types';
import { cn } from '@/lib/cn';
import { normalizeSearch as normalize } from '@/lib/text';
import { usePaletteStore } from '@/stores/paletteStore';
import { COMMAND_GROUPS, useCommands, type Command } from './useCommands';
import { useSearchItems } from './useSearchItems';

function PaletteBody({ role, onClose }: { role: Role; onClose: () => void }) {
  const { t } = useTranslation();
  const commands = useCommands(role);
  const [query, setQuery] = useState('');
  const searchItems = useSearchItems(query, role);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const needle = normalize(query);
  const filtered = commands.filter(
    (command) => !needle || normalize(`${command.label} ${command.keywords}`).includes(needle),
  );
  const everything = [...filtered, ...searchItems];
  const groups = COMMAND_GROUPS.map((group) => ({
    group,
    items: everything.filter((command) => command.group === group),
  })).filter(({ items }) => items.length > 0);
  const flat = groups.flatMap(({ items }) => items);
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));
  const activeCommand = flat[activeIndex];

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, query]);

  const run = (command: Command) => {
    onClose();
    command.run();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (flat.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + flat.length) % flat.length);
    } else if (event.key === 'Enter' && activeCommand) {
      event.preventDefault();
      run(activeCommand);
    }
  };

  let position = -1;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-5 shrink-0 text-subtle" aria-hidden />
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls="palette-list"
          aria-activedescendant={activeCommand ? `palette-${activeCommand.id}` : undefined}
          aria-label={t('palette.title')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={t('palette.placeholder')}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg placeholder:text-subtle focus:outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>

      <div ref={listRef} id="palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
        {flat.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <SearchX className="size-6 text-subtle" aria-hidden />
            <p className="text-sm font-semibold text-fg">{t('palette.noResults')}</p>
            <p className="text-sm text-muted">{t('palette.noResultsHint')}</p>
          </div>
        ) : (
          groups.map(({ group, items }) => (
            <div
              key={group}
              role="group"
              aria-label={t(`palette.groups.${group}`)}
              className="mb-1"
            >
              <p className="px-3 py-1 text-xs font-semibold text-subtle" aria-hidden>
                {t(`palette.groups.${group}`)}
              </p>
              {items.map((command) => {
                position += 1;
                const index = position;
                const Icon = command.icon;
                return (
                  <div
                    key={command.id}
                    id={`palette-${command.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => run(command)}
                    onMouseMove={() => setActive(index)}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-md px-3 py-1 text-sm text-fg',
                      index === activeIndex && 'bg-primary-soft text-primary-strong',
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate">{command.label}</span>
                      {command.description && (
                        <span className="block truncate text-xs text-muted">
                          {command.description}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <Kbd>↑↓</Kbd>
          {t('palette.hintNavigate')}
        </span>
        <span className="inline-flex items-center gap-2">
          <Kbd>↵</Kbd>
          {t('palette.hintSelect')}
        </span>
        <span className="inline-flex items-center gap-2">
          <Kbd>Esc</Kbd>
          {t('palette.hintClose')}
        </span>
      </div>
    </>
  );
}

export function CommandPalette({ role }: { role: Role }) {
  const { t } = useTranslation();
  const open = usePaletteStore((state) => state.open);
  const setOpen = usePaletteStore((state) => state.setOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay grid place-items-start justify-center p-4 pt-[12vh]">
          <Dialog.Content
            aria-describedby={undefined}
            className="panel w-full max-w-xl overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            <Dialog.Title className="sr-only">{t('palette.title')}</Dialog.Title>
            <PaletteBody role={role} onClose={() => setOpen(false)} />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
