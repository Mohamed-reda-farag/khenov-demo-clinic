import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Appointment } from '@/data/types';
import { setClock } from '@/lib/clock';
import type { RepositoryError } from './errors';
import type { Repositories } from './interfaces';

// The demo kit reads `window` for ?demo=fast and falls back to in-memory storage without it.
vi.stubGlobal('window', { location: { search: '?demo=fast' } });

let repos: Repositories;
let resetData: () => void;
let seeded: Appointment[];

beforeAll(async () => {
  ({ repositories: repos, resetData } = await import('./index'));
});

beforeEach(async () => {
  setClock(null);
  resetData();
  seeded = await repos.appointments.list();
});

async function failure(promise: Promise<unknown>): Promise<RepositoryError> {
  try {
    await promise;
  } catch (error) {
    return error as RepositoryError;
  }
  throw new Error('expected the repository call to fail');
}

/** A pending appointment far enough in the future that moving or re-booking its time is allowed. */
const active = () =>
  seeded.find(
    (a) => a.status === 'pending' && new Date(a.start).getTime() > Date.now() + 3 * 3_600_000,
  )!;

describe('appointment repository rules', () => {
  it('rejects a booking that overlaps the doctor', async () => {
    const taken = active();
    const patient = (await repos.patients.list()).find((p) => p.id !== taken.patientId)!;
    const error = await failure(
      repos.appointments.create({
        id: 'ap-new',
        patientId: patient.id,
        doctorId: taken.doctorId,
        serviceId: taken.serviceId,
        start: taken.start,
      }),
    );
    expect(error.code).toBe('conflict');
    expect(error.conflicts.map((c) => c.code)).toContain('doctor_overlap');
  });

  it('rejects a move outside working hours', async () => {
    const taken = active();
    const early = new Date();
    early.setDate(early.getDate() + 40);
    early.setHours(7, 0, 0, 0);
    const error = await failure(
      repos.appointments.update(taken.id, { start: early.toISOString() }),
    );
    expect(error.code).toBe('conflict');
    expect(error.conflicts.map((c) => c.code)).toContain('outside_hours');
  });

  it('enforces the status flow', async () => {
    const pending = active();
    expect((await failure(repos.appointments.update(pending.id, { status: 'done' }))).code).toBe(
      'invalid_transition',
    );
    const confirmed = await repos.appointments.update(pending.id, { status: 'confirmed' });
    expect(confirmed.status).toBe('confirmed');
  });

  it('restores a deleted appointment exactly as it was', async () => {
    const target = active();
    await repos.appointments.remove(target.id);
    expect((await repos.appointments.list()).some((a) => a.id === target.id)).toBe(false);
    await repos.appointments.restore(target);
    expect((await repos.appointments.list()).find((a) => a.id === target.id)).toEqual(target);
  });

  it('reports not_found for unknown ids', async () => {
    expect((await failure(repos.appointments.remove('ap-missing'))).code).toBe('not_found');
  });

  it('books new appointments as pending with the service duration', async () => {
    const [doctor] = await repos.doctors.list();
    const [patient] = await repos.patients.list();
    const service = (await repos.services.list()).find(
      (s) => s.specialtyKey === doctor!.specialtyKey,
    )!;
    const start = new Date(2031, 0, 5, 10, 0).toISOString();
    const created = await repos.appointments.create({
      id: 'ap-new',
      patientId: patient!.id,
      doctorId: doctor!.id,
      serviceId: service.id,
      start,
    });
    expect(created).toMatchObject({ status: 'pending', durationMin: service.durationMin });
  });
});

describe('patient quick add', () => {
  it('validates name and phone', async () => {
    const error = await failure(
      repos.patients.create({ name: { ar: 'أ', en: 'A' }, phone: '123', age: null }),
    );
    expect(error.code).toBe('validation');
    expect(error.issues.map((i) => i.field).sort()).toEqual(['name', 'phone']);
  });

  it('accepts Arabic-Indic digits, stores Latin digits and rejects duplicates', async () => {
    const created = await repos.patients.create({
      name: { ar: 'سلمى جمال', en: 'Salma Gamal' },
      phone: '٠١٠٠٩٩٩٨٨٧٧',
      age: null,
    });
    expect(created).toMatchObject({ phone: '01009998877', age: null });
    const duplicate = await failure(
      repos.patients.create({
        name: { ar: 'شخص تاني', en: 'Someone Else' },
        phone: '01009998877',
        age: null,
      }),
    );
    expect(duplicate.issues).toEqual([{ field: 'phone', reason: 'duplicate' }]);
  });
});

describe('guards and rules added in M2', () => {
  it('blocks deleting a patient with upcoming appointments, then deletes the rest with their history', async () => {
    const patients = await repos.patients.list();
    const now = Date.now();
    const busy = seeded.find(
      (a) => ['pending', 'confirmed'].includes(a.status) && new Date(a.start).getTime() > now,
    )!;
    const blocked = await failure(repos.patients.remove(busy.patientId));
    expect(blocked.code).toBe('in_use');
    expect(blocked.count).toBeGreaterThan(0);

    const free = patients.find(
      (p) =>
        !seeded.some(
          (a) =>
            a.patientId === p.id &&
            ['pending', 'confirmed', 'arrived'].includes(a.status) &&
            new Date(a.start).getTime() >= now,
        ),
    )!;
    const history = seeded.filter((a) => a.patientId === free.id).map((a) => a.id);
    const removed = await repos.patients.remove(free.id);
    expect(removed.removedAppointmentIds.sort()).toEqual(history.sort());
    expect((await repos.appointments.list()).some((a) => a.patientId === free.id)).toBe(false);
  });

  it('blocks deleting a service that upcoming appointments use and locks its duration', async () => {
    const now = Date.now();
    const used = seeded.find(
      (a) => ['pending', 'confirmed'].includes(a.status) && new Date(a.start).getTime() > now,
    )!;
    const service = (await repos.services.list()).find((s) => s.id === used.serviceId)!;
    expect((await failure(repos.services.remove(service.id))).code).toBe('in_use');
    const longer = {
      name: service.name,
      specialtyKey: service.specialtyKey,
      durationMin: service.durationMin + 15,
      priceEgp: service.priceEgp,
    };
    expect((await failure(repos.services.update(service.id, longer))).code).toBe('in_use');
    const cheaper = await repos.services.update(service.id, {
      ...longer,
      durationMin: service.durationMin,
      priceEgp: 1,
    });
    expect(cheaper.priceEgp).toBe(1);

    const fresh = await repos.services.create({
      name: { ar: 'خدمة جديدة', en: 'New service' },
      specialtyKey: 'dental',
      durationMin: 30,
      priceEgp: 300,
    });
    expect((await repos.services.remove(fresh.id)).id).toBe(fresh.id);
  });

  it('validates services', async () => {
    const error = await failure(
      repos.services.create({
        name: { ar: 'خ', en: 'S' },
        specialtyKey: 'dental',
        durationMin: 20,
        priceEgp: -5,
      }),
    );
    expect(error.issues.map((i) => i.field).sort()).toEqual(['duration', 'name', 'price']);
  });

  it('enforces doctor working hours when editing and when booking', async () => {
    const [doctor] = await repos.doctors.list();
    const input = {
      name: doctor!.name,
      specialtyKey: doctor!.specialtyKey,
      workStart: '09:00',
      workEnd: '21:00',
      active: true,
    };
    expect(
      (await failure(repos.doctors.update(doctor!.id, { ...input, workStart: '07:00' }))).issues[0],
    ).toEqual({ field: 'hours', reason: 'range' });
    expect(
      (await failure(repos.doctors.update(doctor!.id, { ...input, workEnd: '09:30' }))).code,
    ).toBe('validation');
    // Upcoming appointments fall outside very short hours.
    expect(
      (await failure(repos.doctors.update(doctor!.id, { ...input, workEnd: '10:00' }))).code,
    ).toBe('in_use');

    const target = new Date();
    target.setDate(target.getDate() + 40);
    target.setHours(20, 45, 0, 0);
    const [patient] = await repos.patients.list();
    const service = (await repos.services.list()).find(
      (s) => s.specialtyKey === doctor!.specialtyKey && s.durationMin === 30,
    )!;
    const draft = {
      id: 'ap-late',
      patientId: patient!.id,
      doctorId: doctor!.id,
      serviceId: service.id,
      start: target.toISOString(),
    };
    expect((await failure(repos.appointments.create(draft))).conflicts[0]?.code).toBe(
      'outside_hours',
    );
  });

  it('refuses new bookings with an inactive doctor but keeps existing ones editable', async () => {
    const [doctor] = await repos.doctors.list();
    await repos.doctors.update(doctor!.id, {
      name: doctor!.name,
      specialtyKey: doctor!.specialtyKey,
      workStart: doctor!.workStart,
      workEnd: doctor!.workEnd,
      active: false,
    });
    const [patient] = await repos.patients.list();
    const service = (await repos.services.list()).find(
      (s) => s.specialtyKey === doctor!.specialtyKey,
    )!;
    const target = new Date();
    target.setDate(target.getDate() + 40);
    target.setHours(10, 0, 0, 0);
    expect(
      (
        await failure(
          repos.appointments.create({
            id: 'ap-x',
            patientId: patient!.id,
            doctorId: doctor!.id,
            serviceId: service.id,
            start: target.toISOString(),
          }),
        )
      ).code,
    ).toBe('inactive');
    const existing = seeded.find((a) => a.doctorId === doctor!.id && a.status === 'pending')!;
    expect((await repos.appointments.update(existing.id, { status: 'confirmed' })).status).toBe(
      'confirmed',
    );
  });

  it('keeps visit notes within 200 characters', async () => {
    const target = seeded.find((a) => a.status === 'confirmed')!;
    expect(
      (await repos.appointments.update(target.id, { visitNote: 'تمت المراجعة' })).visitNote,
    ).toBe('تمت المراجعة');
    expect(
      (await failure(repos.appointments.update(target.id, { visitNote: 'ا'.repeat(201) })))
        .issues[0],
    ).toEqual({ field: 'visitNote', reason: 'too_long' });
  });

  it('stores notifications newest first and tracks read state', async () => {
    const before = await repos.notifications.list();
    const added = await repos.notifications.add({
      type: 'deleted',
      patientId: null,
      appointmentId: null,
      status: null,
      when: null,
      count: null,
    });
    const list = await repos.notifications.list();
    expect(list[0]?.id).toBe(added.id);
    expect(list).toHaveLength(before.length + 1);
    await repos.notifications.markAllRead();
    expect((await repos.notifications.list()).every((n) => n.read)).toBe(true);
  });
});

describe('no booking in the past', () => {
  const draftAt = async (start: Date) => {
    const [doctor] = await repos.doctors.list();
    const [patient] = await repos.patients.list();
    const service = (await repos.services.list()).find(
      (s) => s.specialtyKey === doctor!.specialtyKey && s.durationMin === 30,
    )!;
    return {
      id: 'ap-time',
      patientId: patient!.id,
      doctorId: doctor!.id,
      serviceId: service.id,
      start: start.toISOString(),
    };
  };
  const day = (d: number, h: number, m = 0) => new Date(2031, 0, d, h, m);

  it('refuses create at the current time of day and accepts the next quarter hour (injected clock)', async () => {
    setClock(() => day(10, 12, 16));
    expect((await failure(repos.appointments.create(await draftAt(day(10, 12, 15))))).code).toBe(
      'past_time',
    );
    expect((await failure(repos.appointments.create(await draftAt(day(10, 12, 29))))).code).toBe(
      'past_time',
    );
    expect((await repos.appointments.create(await draftAt(day(10, 12, 30)))).status).toBe(
      'pending',
    );
  });

  it('accepts exactly now when now is on a quarter hour', async () => {
    setClock(() => day(11, 12, 15));
    expect((await repos.appointments.create(await draftAt(day(11, 12, 15)))).id).toBe('ap-time');
  });

  it('refuses any earlier day and accepts later days', async () => {
    setClock(() => day(10, 8, 0));
    expect((await failure(repos.appointments.create(await draftAt(day(9, 15))))).code).toBe(
      'past_time',
    );
    expect((await repos.appointments.create(await draftAt(day(11, 9)))).status).toBe('pending');
  });

  it('refuses moving an appointment into the past but still lets its status change', async () => {
    const target = active();
    setClock(() => new Date(new Date(target.start).getTime() + 10 * 86_400_000));
    // The appointment is now in the past: its time cannot move to another past time...
    const earlier = new Date(new Date(target.start).getTime() + 3_600_000);
    expect(
      (await failure(repos.appointments.update(target.id, { start: earlier.toISOString() }))).code,
    ).toBe('past_time');
    // ...but its status and note can still change.
    expect((await repos.appointments.update(target.id, { status: 'confirmed' })).status).toBe(
      'confirmed',
    );
    expect(
      (await repos.appointments.update(target.id, { start: target.start, status: 'arrived' }))
        .status,
    ).toBe('arrived');
    // And it can be moved to a future time.
    const future = new Date(new Date(target.start).getTime() + 20 * 86_400_000);
    expect(
      (await repos.appointments.update(target.id, { start: future.toISOString() })).start,
    ).toBe(future.toISOString());
  });

  it('lets undo restore a snapshot even when its time has since passed', async () => {
    const target = active();
    await repos.appointments.remove(target.id);
    setClock(() => new Date(new Date(target.start).getTime() + 86_400_000));
    expect((await repos.appointments.restore(target)).id).toBe(target.id);
  });
});

describe('locked finished appointments', () => {
  const FUTURE_MS = 20 * 86_400_000;

  /** Takes a future appointment to Done, Cancelled or No-show (No-show needs the clock past its end). */
  async function finish(status: 'done' | 'cancelled' | 'no_show'): Promise<Appointment> {
    const target = active();
    if (status === 'cancelled') return repos.appointments.update(target.id, { status });
    if (status === 'done') {
      await repos.appointments.update(target.id, { status: 'confirmed' });
      await repos.appointments.update(target.id, { status: 'arrived' });
      return repos.appointments.update(target.id, { status });
    }
    setClock(() => new Date(new Date(target.start).getTime() + target.durationMin * 60_000));
    const result = await repos.appointments.update(target.id, { status });
    setClock(null);
    return result;
  }

  it.each(['done', 'cancelled', 'no_show'] as const)(
    'refuses to move, reschedule or edit a %s appointment (LOCKED_STATUS)',
    async (status) => {
      const finished = await finish(status);
      const others = (await repos.doctors.list()).filter((d) => d.id !== finished.doctorId);
      const future = new Date(new Date(finished.start).getTime() + FUTURE_MS).toISOString();
      const patient = (await repos.patients.list()).find((p) => p.id !== finished.patientId)!;

      for (const patch of [
        { start: future },
        { doctorId: others[0]!.id },
        { serviceId: 'sv-other' },
        { patientId: patient.id },
      ]) {
        expect((await failure(repos.appointments.update(finished.id, patch))).code).toBe(
          'locked_status',
        );
      }
      // Nothing changed.
      const stored = (await repos.appointments.list()).find((a) => a.id === finished.id)!;
      expect(stored).toEqual(finished);
    },
  );

  it('also refuses to move a locked appointment into the past and any status change out of it', async () => {
    const finished = await finish('done');
    const past = new Date(new Date(finished.start).getTime() - 40 * 86_400_000).toISOString();
    expect((await failure(repos.appointments.update(finished.id, { start: past }))).code).toBe(
      'locked_status',
    );
    for (const status of ['pending', 'confirmed', 'cancelled', 'no_show'] as const) {
      expect((await failure(repos.appointments.update(finished.id, { status }))).code).toBe(
        'invalid_transition',
      );
    }
  });

  it('still lets the doctor write a visit note on a finished appointment, and undo restore it', async () => {
    const finished = await finish('done');
    const noted = await repos.appointments.update(finished.id, {
      visitNote: 'Come back in a week',
    });
    expect(noted.visitNote).toBe('Come back in a week');
    // Undo (toast) puts the snapshot back, even from a locked status.
    const before = { ...finished, status: 'arrived' as const };
    expect((await repos.appointments.restore(before)).status).toBe('arrived');
  });

  it('keeps pending, confirmed and arrived appointments editable', async () => {
    const target = active();
    const future = new Date(new Date(target.start).getTime() + FUTURE_MS).toISOString();
    expect((await repos.appointments.update(target.id, { start: future })).start).toBe(future);
  });
});

describe('no-show transition', () => {
  const endOfAppointment = (a: Appointment) => new Date(a.start).getTime() + a.durationMin * 60_000;

  it('is refused before the end time and accepted from the exact end time (injected clock)', async () => {
    const target = active();
    setClock(() => new Date(endOfAppointment(target) - 1));
    expect((await failure(repos.appointments.update(target.id, { status: 'no_show' }))).code).toBe(
      'invalid_transition',
    );
    setClock(() => new Date(endOfAppointment(target)));
    expect((await repos.appointments.update(target.id, { status: 'no_show' })).status).toBe(
      'no_show',
    );
  });

  it('works from Confirmed too, but never from Arrived or Done', async () => {
    const target = active();
    await repos.appointments.update(target.id, { status: 'confirmed' });
    setClock(() => new Date(endOfAppointment(target) + 3_600_000));
    expect((await repos.appointments.update(target.id, { status: 'no_show' })).status).toBe(
      'no_show',
    );

    const other = seeded.find(
      (a) => a.id !== target.id && a.status === 'pending' && new Date(a.start) > new Date(),
    )!;
    await repos.appointments.update(other.id, { status: 'confirmed' });
    await repos.appointments.update(other.id, { status: 'arrived' });
    setClock(() => new Date(endOfAppointment(other) + 3_600_000));
    expect((await failure(repos.appointments.update(other.id, { status: 'no_show' }))).code).toBe(
      'invalid_transition',
    );
  });

  it('is final, and Undo restores the previous status', async () => {
    const target = active();
    setClock(() => new Date(endOfAppointment(target) + 60_000));
    const marked = await repos.appointments.update(target.id, { status: 'no_show' });
    expect(
      (await failure(repos.appointments.update(target.id, { status: 'confirmed' }))).code,
    ).toBe('invalid_transition');
    expect((await repos.appointments.restore(target)).status).toBe('pending');
    expect(marked.status).toBe('no_show');
  });
});

describe('doctor report (scoped by the session)', () => {
  async function loginAs(doctorId: string | null) {
    const { demoStorage } = await import('@/lib/demo/storage');
    demoStorage.set('session', { role: 'doctor', doctorId });
  }

  it('is forbidden without a doctor session', async () => {
    expect((await failure(repos.reports.myReport('30d'))).code).toBe('forbidden');
    await repos.session.login('receptionist');
    expect((await failure(repos.reports.myReport('30d'))).code).toBe('forbidden');
    await loginAs(null);
    expect((await failure(repos.reports.myReport('30d'))).code).toBe('forbidden');
  });

  it('only ever contains the logged-in doctor, and has no way to ask for another one', async () => {
    const doctors = await repos.doctors.list();
    const everyone = await repos.appointments.list();
    const { buildDoctorReport, resolveRange } = await import('@/lib/reports/aggregate');
    const { now } = await import('@/lib/clock');
    let sum = 0;
    for (const doctor of doctors) {
      await loginAs(doctor.id);
      const report = await repos.reports.myReport('30d');
      const expected = buildDoctorReport(
        everyone.filter((a) => a.doctorId === doctor.id),
        resolveRange('30d', now()),
        doctor.id,
      );
      expect(report).toEqual(expected);
      expect('byDoctor' in report).toBe(false);
      sum += report.total;
    }
    // Each doctor sees a strict part of the clinic; together they add up to the clinic total.
    const clinic = everyone.filter((a) => a.start >= resolveRange('30d', now()).from.toISOString());
    expect(sum).toBe(
      clinic.filter(
        (a) => new Date(a.start) < new Date(resolveRange('30d', now()).to.getTime() + 86_400_000),
      ).length,
    );
    await loginAs(doctors[0]!.id);
    expect((await repos.reports.myReport('30d')).total).toBeLessThan(sum);
  });

  it('counts no-shows separately', async () => {
    const doctors = await repos.doctors.list();
    let noShows = 0;
    for (const doctor of doctors) {
      await loginAs(doctor.id);
      const report = await repos.reports.myReport('30d');
      expect(report.byStatus.no_show).toBe(report.noShow);
      noShows += report.noShow;
    }
    expect(noShows).toBeGreaterThan(0);
  });
});
