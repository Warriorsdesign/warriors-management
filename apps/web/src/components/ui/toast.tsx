"use client";

import React, { useEffect } from "react";
import { useUIStore } from "@/lib/store/useUIStore";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toastMessage, toastType, hideToast } = useUIStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, hideToast]);

  if (!toastMessage) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 md:bottom-10 md:right-10 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 border",
        toastType === 'success' 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200"
      )}
    >
      {toastType === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
      )}
      <p className="text-sm font-medium">{toastMessage}</p>
    </div>
  );
}
