import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
  label: string;
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function MultiSelect({ label, options, selectedValues, onChange, className }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const displayText = selectedValues.length === 0 
    ? label
    : selectedValues.length === 1
      ? options.find(o => o.value === selectedValues[0])?.label
      : `${selectedValues.length} sélectionnés`;

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 h-9 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
          isOpen ? "border-primary ring-1 ring-primary" : "border-border"
        )}
      >
        <span className="truncate mr-2 text-foreground text-left flex-1">{displayText}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedValues.length > 0 && (
            <div 
              role="button"
              tabIndex={0}
              className="p-0.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full p-1 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-56 overflow-y-auto">
          {options.map(option => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-4 h-4 flex-shrink-0 mr-3 border rounded-sm",
                  isSelected ? "bg-primary border-primary" : "border-input"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
