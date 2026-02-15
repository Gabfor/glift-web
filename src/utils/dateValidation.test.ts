
import { describe, it, expect } from 'vitest';
import { validateDateParts } from './dateValidation';

describe('validateDateParts', () => {
    it('should return the day if it is valid for the given month and year', () => {
        expect(validateDateParts('15', '01', '2024')).toBe('15');
        expect(validateDateParts('31', '01', '2024')).toBe('31');
        expect(validateDateParts('29', '02', '2024')).toBe('29'); // Leap year
        expect(validateDateParts('28', '02', '2023')).toBe('28'); // Non-leap year
    });

    it('should cap the day to the last day of the month if exceeded', () => {
        expect(validateDateParts('32', '01', '2024')).toBe('31');
        expect(validateDateParts('30', '02', '2024')).toBe('29'); // Leap year
        expect(validateDateParts('31', '02', '2024')).toBe('29'); // Leap year
        expect(validateDateParts('29', '02', '2023')).toBe('28'); // Non-leap year
        expect(validateDateParts('31', '04', '2024')).toBe('30'); // April has 30 days
    });

    it('should return the day if month is missing', () => {
        expect(validateDateParts('31', '', '2024')).toBe('31');
    });

    it('should return the day if day is invalid', () => {
        expect(validateDateParts('invalid', '01', '2024')).toBe('invalid');
    });

    it('should assume leap year if year is missing (default behavior implementation choice)', () => {
        // Implementation uses 2024 as default year
        expect(validateDateParts('29', '02', '')).toBe('29');
        expect(validateDateParts('30', '02', '')).toBe('29');
    });
});
