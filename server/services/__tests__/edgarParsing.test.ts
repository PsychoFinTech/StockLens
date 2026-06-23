import { describe, it, expect } from 'vitest';
import { cleanText, parseMoney, isFootnote } from '../edgarParsing.js';

describe('edgarParsing helpers', () => {
  describe('cleanText', () => {
    it('should trim and normalize whitespace', () => {
      expect(cleanText('  hello   world  ')).toBe('hello world');
    });

    it('should strip zero-width characters', () => {
      expect(cleanText('hello\u200Bworld')).toBe('helloworld');
    });

    it('should return empty string for falsy input', () => {
      expect(cleanText('')).toBe('');
    });
  });

  describe('parseMoney', () => {
    it('should parse simple numbers', () => {
      expect(parseMoney('12345')).toBe(12345);
    });

    it('should parse currency formatted numbers', () => {
      expect(parseMoney('$123,456.78')).toBe(123456.78);
    });

    it('should parse negative numbers represented in parentheses', () => {
      expect(parseMoney('$(1,200)')).toBe(-1200);
    });

    it('handles parenthetical negatives properly', () => {
      expect(parseMoney('(1,000.50)')).toBe(-1000.5);
      expect(parseMoney(' ( 500 ) ')).toBe(-500);
    });

    it('handles "N/A" and "—" gracefully (returns null)', () => {
      expect(parseMoney('N/A')).toBeNull();
      expect(parseMoney('—')).toBeNull();
      expect(parseMoney('-')).toBeNull();
      expect(parseMoney('')).toBeNull();
    });
  });

  describe('isFootnote', () => {
    it('should identify footnote symbols', () => {
      expect(isFootnote('*')).toBe(true);
      expect(isFootnote('†')).toBe(true);
      expect(isFootnote('(1)')).toBe(true);
    });

    it('should return false for standard text', () => {
      expect(isFootnote('This is text')).toBe(false);
    });
  });
});
