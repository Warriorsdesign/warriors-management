"use client";

import React from "react";
import { useUIStore } from "@/lib/store/useUIStore";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle, Mail } from "lucide-react";

export function GlobalErrorModal() {
  const { errorModal, hideErrorModal } = useUIStore();

  if (!errorModal?.isOpen) return null;

  return (
    <Modal isOpen={true} onClose={hideErrorModal} title="">
      <div className="p-2 space-y-6 text-center pb-4 animate-in fade-in zoom-in duration-200">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-red-100">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-foreground">{errorModal.title}</h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
            {errorModal.message}
          </p>
        </div>

        <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 flex items-start gap-3 text-left">
          <Mail className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <span className="font-semibold block mb-1">Besoin d'aide ?</span>
            Contactez l'administrateur de Warriors Management via <a href="mailto:admin@warriors-management.com" className="font-semibold hover:underline">admin@warriors-management.com</a> pour régulariser votre compte.
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={hideErrorModal}
            className="w-full px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
