import { Check, Lock, Pencil, StickyNote, UserCheck, UserX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { Appointment } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { canMarkNoShow, isLockedStatus } from '@/lib/scheduling/status';
import { useAppointmentActions } from './useAppointmentActions';

export const VISIT_NOTE_MAX = 200;

function NoteEditor({ appointment, onDone }: { appointment: Appointment; onDone: () => void }) {
  const { t } = useTranslation();
  const format = useFormat();
  const actions = useAppointmentActions();
  const [note, setNote] = useState(appointment.visitNote ?? '');
  const id = `note-${appointment.id}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onDone();
    void actions.saveNote(appointment, note);
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-md border border-line bg-canvas p-3"
    >
      <label htmlFor={id} className="text-sm font-semibold text-fg">
        {t('myDay.note.label')}
      </label>
      <textarea
        id={id}
        autoFocus
        rows={3}
        maxLength={VISIT_NOTE_MAX}
        value={note}
        placeholder={t('myDay.note.placeholder')}
        aria-describedby={`${id}-hint`}
        onChange={(event) => setNote(event.target.value)}
        className="w-full resize-none rounded-md border border-line-strong bg-surface p-3 text-sm text-fg placeholder:text-subtle"
      />
      <div
        id={`${id}-hint`}
        className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted"
      >
        <span>{t('myDay.note.hint')}</span>
        <span aria-live="polite">
          {t('myDay.note.counter', {
            used: format.number(note.length),
            max: format.number(VISIT_NOTE_MAX),
          })}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          {t('form.cancel')}
        </Button>
        <Button type="submit">{t('myDay.note.save')}</Button>
      </div>
    </form>
  );
}

/**
 * What the doctor can do with one appointment. Shared by "My day" and by the appointment panel that
 * opens from "My schedule", so both always offer the same actions under the same rules:
 * - Patient arrived (Confirmed) and Complete visit (Arrived), as before;
 * - Did not attend, only once the end time has passed and the status is still Pending / Confirmed
 *   (no confirm dialog: the toast offers Undo);
 * - a short visit note while the visit is not cancelled or a no-show;
 * - a read-only note for finished appointments (Done, Cancelled, No-show).
 */
export function VisitActions({ appointment, now }: { appointment: Appointment; now: Date }) {
  const { t } = useTranslation();
  const actions = useAppointmentActions();
  const [editing, setEditing] = useState(false);
  const status = appointment.status;
  const locked = isLockedStatus(status);
  const noteApplicable = status !== 'cancelled' && status !== 'no_show';

  if (editing) return <NoteEditor appointment={appointment} onDone={() => setEditing(false)} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === 'confirmed' && (
          <Button onClick={() => void actions.changeStatus(appointment, 'arrived')}>
            <UserCheck className="size-4" aria-hidden />
            {t('myDay.markArrived')}
          </Button>
        )}
        {status === 'arrived' && (
          <Button onClick={() => void actions.changeStatus(appointment, 'done')}>
            <Check className="size-4" aria-hidden />
            {t('myDay.markDone')}
          </Button>
        )}
        {canMarkNoShow(appointment, now) && (
          <Button
            variant="secondary"
            onClick={() => void actions.changeStatus(appointment, 'no_show')}
          >
            <UserX className="size-4" aria-hidden />
            {t('myDay.markNoShow')}
          </Button>
        )}
        {status === 'pending' && (
          <p className="text-sm text-muted">{t('myDay.waitingConfirmation')}</p>
        )}
        {noteApplicable && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {appointment.visitNote ? (
              <Pencil className="size-4" aria-hidden />
            ) : (
              <StickyNote className="size-4" aria-hidden />
            )}
            {appointment.visitNote ? t('myDay.note.edit') : t('myDay.note.add')}
          </Button>
        )}
      </div>
      {locked && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-md bg-sunken p-3 text-sm text-muted"
        >
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t('appointment.panel.locked')}</span>
        </p>
      )}
    </div>
  );
}
