import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  isSearchable?: boolean;
}

export function Select({ options, value, onChange, className, placeholder = "Sélectionner...", disabled = false, isSearchable = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = isSearchable 
    ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isSearchable]);

  return (
    <div className={cn("relative w-full", className, disabled && "opacity-50 cursor-not-allowed")} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setIsOpen(!isOpen) }}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
          isOpen ? "border-primary ring-1 ring-primary" : "border-border",
          disabled ? "cursor-not-allowed bg-muted/50 text-muted-foreground" : ""
        )}
      >
        <span className={cn("truncate mr-2 text-left flex-1", (!selectedOption || disabled) && "text-muted-foreground")}>
          {displayText}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full p-1 mt-1 bg-card border border-border rounded-md shadow-xl max-h-[400px] flex flex-col">
          {isSearchable && (
            <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">Aucun résultat</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer text-sm transition-colors",
                      isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
