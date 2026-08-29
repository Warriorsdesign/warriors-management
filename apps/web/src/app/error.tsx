"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg border border-red-100 flex flex-col items-center text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Une erreur est survenue
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {error.message || "Une erreur inattendue s'est produite lors du chargement de la page."}
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
