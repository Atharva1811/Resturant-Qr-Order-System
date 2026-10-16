import { describe, it, expect } from 'vitest';
import { isValidTransition } from '../controllers/kitchen.controller.js';
import { OrderStatus } from '@prisma/client';

describe('Order State Machine Transition Unit Tests', () => {
  it('allows valid forward progress transitions', () => {
    expect(isValidTransition('NEW', 'ACCEPTED')).toBe(true);
    expect(isValidTransition('ACCEPTED', 'PREPARING')).toBe(true);
    expect(isValidTransition('PREPARING', 'READY')).toBe(true);
    expect(isValidTransition('READY', 'COMPLETED')).toBe(true);
  });

  it('allows cancellation from early states', () => {
    expect(isValidTransition('NEW', 'CANCELLED')).toBe(true);
    expect(isValidTransition('ACCEPTED', 'CANCELLED')).toBe(true);
    expect(isValidTransition('PREPARING', 'CANCELLED')).toBe(true);
  });

  it('blocks skipping mandatory preparation steps', () => {
    expect(isValidTransition('NEW', 'PREPARING')).toBe(false);
    expect(isValidTransition('NEW', 'READY')).toBe(false);
    expect(isValidTransition('NEW', 'COMPLETED')).toBe(false);
    expect(isValidTransition('ACCEPTED', 'READY')).toBe(false);
    expect(isValidTransition('ACCEPTED', 'COMPLETED')).toBe(false);
  });

  it('blocks backwards transitions and modifying terminal states', () => {
    expect(isValidTransition('COMPLETED', 'NEW')).toBe(false);
    expect(isValidTransition('COMPLETED', 'READY')).toBe(false);
    expect(isValidTransition('CANCELLED', 'NEW')).toBe(false);
    expect(isValidTransition('CANCELLED', 'ACCEPTED')).toBe(false);
    expect(isValidTransition('READY', 'PREPARING')).toBe(false);
  });
});
