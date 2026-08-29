import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  locale?: any;
  disablePastDates?: boolean;
  minDate?: Date;
  align?: 'left' | 'right';
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Sélectionner une date", 
  className, 
  locale = fr, 
  disablePastDates = false,
  minDate,
  align = 'left'
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setCurrentMonth(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextYear = () => setCurrentMonth(addYears(currentMonth, 1));
  const prevYear = () => setCurrentMonth(subYears(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    onChange(new Date());
    setIsOpen(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 text-muted-foreground">
          <button type="button" onClick={prevYear} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronsLeft className="w-4 h-4" /></button>
          <button type="button" onClick={prevMonth} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        </div>
        <div className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale }).charAt(0).toUpperCase() + format(currentMonth, 'MMMM yyyy', { locale }).slice(1)}
        </div>
        <div className="flex gap-1 text-muted-foreground">
          <button type="button" onClick={nextMonth} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight className="w-4 h-4" /></button>
          <button type="button" onClick={nextYear} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronsRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "eeeeee"; // Su, Mo, Tu...
    const days = [];
    const startDate = startOfWeek(currentMonth, { locale });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-medium text-xs text-muted-foreground py-1" key={i}>
          {format(addDays(startDate, i), dateFormat, { locale }).substring(0, 2)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale });
    const endDate = endOfWeek(monthEnd, { locale });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isSelected = value ? isSameDay(day, value) : false;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        const isPast = disablePastDates && day < startOfDay(new Date());
        const isBeforeMinDate = minDate && day < startOfDay(minDate);
        const isDisabled = !isCurrentMonth || isPast || isBeforeMinDate;

        days.push(
          <button
            type="button"
            key={day.toString()}
            disabled={isDisabled}
            onClick={() => {
              onChange(cloneDay);
              setIsOpen(false);
            }}
            className={cn(
              "text-sm rounded-lg transition-colors flex items-center justify-center w-8 h-8 mx-auto font-medium",
              isDisabled ? "text-muted-foreground/30 opacity-40 cursor-not-allowed" : "text-foreground hover:bg-muted",
              isSelected && isCurrentMonth && !isDisabled && "border-2 border-muted bg-transparent text-foreground",
              !isSelected && isToday && isCurrentMonth && !isDisabled && "text-primary"
            )}
          >
            {formattedDate}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 h-10 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm",
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-input"
        )}
      >
        <span className={cn("truncate mr-2 text-left flex-1", !value && "text-muted-foreground")}>
          {value ? format(value, 'dd/MM/yyyy') : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <div 
              role="button"
              tabIndex={0}
              className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 w-[280px] p-4 mt-2 bg-card border border-border rounded-xl shadow-lg top-full origin-top animate-in fade-in zoom-in-95 duration-200",
          align === 'right' ? "right-0" : "left-0"
        )}>
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          <div className="mt-2 mb-1 flex justify-center">
            <button
              type="button"
              onClick={goToToday}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors focus:outline-none"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
