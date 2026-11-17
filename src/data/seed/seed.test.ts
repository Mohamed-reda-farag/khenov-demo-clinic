import { addDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { findConflicts } from '@/lib/scheduling/conflicts';
import { buildAppointments } from './appointments';
import { doctors } from './doctors';
import { patients } from './patients';
import { services } from './services';

describe('seed data', () => {
  // 21 consecutive anchor days cover every weekday and the Friday / DST edges.
  const anchors = Array.from({ length: 21 }, (_, i) => addDays(new Date(2026, 2, 20), i * 11));

  it.each(anchors.map((d) => [d.toDateString(), d] as const))(
    'has ~40 valid, conflict-free appointments anchored on %s',
    (_label, anchor) => {
      const appointments = buildAppointments(anchor);
      expect(appointments).toHaveLength(40);

      for (const appointment of appointments) {
        const doctor = doctors.find((d) => d.id === appointment.doctorId)!;
        const service = services.find((s) => s.id === appointment.serviceId)!;
        expect(patients.some((p) => p.id === appointment.patientId)).toBe(true);
        expect(service.specialtyKey).toBe(doctor.specialtyKey);
        expect(
          findConflicts(
            {
              doctorId: doctor.id,
              patientId: appointment.patientId,
              start: new Date(appointment.start),
              durationMin: appointment.durationMin,
              ignoreId: appointment.id,
            },
            appointments,
            doctor,
          ),
        ).toEqual([]);
      }
    },
  );

  it('always has appointments on the anchor day itself', () => {
    const anchor = new Date(2026, 10, 20, 15, 0);
    const today = buildAppointments(anchor).filter(
      (a) => new Date(a.start).toDateString() === anchor.toDateString(),
    );
    expect(today).toHaveLength(8);
  });
});
