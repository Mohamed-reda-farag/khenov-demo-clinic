import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Appointment } from '@/data/types';
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

const active = () => seeded.find((a) => a.status === 'pending')!;

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
    const early = new Date(taken.start);
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
    const error = await failure(repos.patients.create({ name: 'A', phone: '123' }));
    expect(error.code).toBe('validation');
    expect(error.issues.map((i) => i.field).sort()).toEqual(['name', 'phone']);
  });

  it('accepts Arabic-Indic digits, stores Latin digits and rejects duplicates', async () => {
    const created = await repos.patients.create({ name: 'سلمى جمال', phone: '٠١٠٠٩٩٩٨٨٧٧' });
    expect(created).toMatchObject({ phone: '01009998877', age: null });
    const duplicate = await failure(
      repos.patients.create({ name: 'شخص تاني', phone: '01009998877' }),
    );
    expect(duplicate.issues).toEqual([{ field: 'phone', reason: 'duplicate' }]);
  });
});
