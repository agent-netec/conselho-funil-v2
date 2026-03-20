'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number | string | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Sprint 03.6 — Currency input with R$ mask.
 * Displays formatted BRL (R$ 1.234,56) while storing as number.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = 'Ex: 997,00',
  className,
}: CurrencyInputProps) {
  // Format number to BRL display string
  const formatToBRL = useCallback((val: number | string | null | undefined): string => {
    if (val == null || val === '') return '';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  const [displayValue, setDisplayValue] = useState(() => formatToBRL(value));

  // Parse BRL formatted string to number
  const parseBRL = (str: string): number | null => {
    if (!str.trim()) return null;
    // Remove dots (thousand separator), replace comma with dot (decimal)
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only digits, dots, commas
    const filtered = raw.replace(/[^0-9.,]/g, '');
    setDisplayValue(filtered);
  };

  const handleBlur = () => {
    const parsed = parseBRL(displayValue);
    onChange(parsed);
    // Re-format on blur
    if (parsed !== null) {
      setDisplayValue(formatToBRL(parsed));
    }
  };

  const handleFocus = () => {
    // On focus, show raw number for easier editing
    if (value != null && value !== '') {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(num)) {
        setDisplayValue(String(num).replace('.', ','));
      }
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 pointer-events-none">
        R$
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn('pl-10', className)}
      />
    </div>
  );
}
