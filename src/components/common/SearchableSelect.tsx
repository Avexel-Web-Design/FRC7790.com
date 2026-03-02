import { useState, useRef, useEffect, useCallback } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  required = false,
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display label for selected value
  const selectedOption = options.find((o) => o.value === value);
  const displayText = open ? query : selectedOption?.label ?? value;

  const filtered = options.filter((o) => {
    const q = query.toLowerCase();
    return o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false);
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (filtered[highlightIndex]) {
          select(filtered[highlightIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setQuery('');
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={displayText}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-baywatch-orange focus:outline-none"
        onFocus={() => {
          setOpen(true);
          setQuery('');
          setHighlightIndex(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightIndex(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {/* Chevron */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </span>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-lg"
        >
          {filtered.map((option, idx) => (
            <li
              key={option.value}
              className={`cursor-pointer px-3 py-2 text-sm ${
                idx === highlightIndex ? 'bg-baywatch-orange/20 text-white' : 'text-gray-300 hover:bg-gray-800'
              } ${option.value === value ? 'font-semibold text-baywatch-orange' : ''}`}
              onMouseEnter={() => setHighlightIndex(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                select(option.value);
              }}
            >
              <span>{option.label}</span>
              {option.sublabel && <span className="ml-2 text-xs text-gray-500">{option.sublabel}</span>}
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-sm text-gray-500">
          No results
        </div>
      )}
    </div>
  );
}
