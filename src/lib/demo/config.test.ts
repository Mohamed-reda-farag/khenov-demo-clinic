import { describe, expect, it } from 'vitest';
import { SEED_VERSION, isStaleNamespaceKey, parseDemoFlags } from './config';

describe('demo switches', () => {
  it('reads one or several comma separated flags', () => {
    expect([...parseDemoFlags('?demo=fast')]).toEqual(['fast']);
    expect([...parseDemoFlags('?demo=fast,error')].sort()).toEqual(['error', 'fast']);
    expect([...parseDemoFlags('?demo= EMPTY , fast ')].sort()).toEqual(['empty', 'fast']);
  });

  it('is empty without the parameter', () => {
    expect(parseDemoFlags('').size).toBe(0);
    expect(parseDemoFlags('?other=1').size).toBe(0);
  });
});

describe('stale storage keys', () => {
  it('purges older seed versions (normal and empty) but keeps the current one and the preferences', () => {
    expect(isStaleNamespaceKey(`khenov-demo:clinic:v${SEED_VERSION - 1}:patients`)).toBe(true);
    expect(isStaleNamespaceKey(`khenov-demo:clinic:v${SEED_VERSION - 1}-empty:patients`)).toBe(
      true,
    );
    expect(isStaleNamespaceKey(`khenov-demo:clinic:v${SEED_VERSION}:patients`)).toBe(false);
    expect(isStaleNamespaceKey(`khenov-demo:clinic:v${SEED_VERSION}-empty:patients`)).toBe(false);
    expect(isStaleNamespaceKey('khenov-demo:clinic:prefs:prefs')).toBe(false);
    expect(isStaleNamespaceKey('other-app:v1:x')).toBe(false);
  });
});
