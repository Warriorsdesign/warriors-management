import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Student } from '@/lib/data/mockData';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  payment?: {
    id: string;
    date: string;
    amount: number;
    method: string;
    motif?: string;
  };
  payments?: {
    id: string;
    date: string;
    amount: number;
    method: string;
    motif?: string;
  }[];
  organization?: {
    id: string;
    name: string;
    logoUrl?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export function ReceiptModal({ isOpen, onClose, student, payment, payments, organization }: ReceiptModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const orgName = organization?.name || "Centre de Formation";
  const orgInitials = orgName.substring(0, 2).toUpperCase();

  const activePayments = payments || (payment ? [payment] : []);
  const totalAmount = activePayments.reduce((sum, p) => sum + p.amount, 0);
  const firstPaymentDate = activePayments.length > 0 ? new Date(activePayments[0].date) : new Date();
  
  const receiptId = activePayments.length === 1 ? activePayments[0].id.toUpperCase() : `RECU-${student.matricule}-${new Date().getTime().toString().slice(-4)}`;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-background/80 backdrop-blur-sm print:p-0 print:bg-white print:block">
      <div className="absolute inset-0 no-print" onClick={onClose} />
      
      <div className="relative w-full max-w-[600px] flex flex-col max-h-[95vh] print:max-h-none print:w-full print:max-w-none">
        
        <div className="no-print bg-card border border-border rounded-t-xl px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-lg font-semibold text-foreground">Reçu de paiement</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-full transition-colors ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-b-xl sm:rounded-xl shadow-lg border border-border sm:border-t-0 print:border-none print:shadow-none overflow-y-auto print:overflow-hidden flex justify-center">
          
          {/* A5 Container */}
          <div className="w-full bg-white text-black p-8 mx-auto relative print-container flex flex-col" style={{ width: '148mm', height: '210mm' }}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-5 shrink-0">
              <div className="flex items-center gap-3">
                {organization?.logoUrl ? (
                  <img src={organization.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                    {orgInitials}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">{orgName}</h1>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Reçu de paiement</p>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between h-full">
                <h2 className="text-3xl font-light text-gray-300 tracking-widest mb-1">REÇU</h2>
                <div className="text-[11px] text-gray-500 leading-relaxed text-right mt-1">
                  <p className="font-semibold text-gray-800 uppercase">{orgName}</p>
                  {organization?.address ? (
                    organization.address.split(',').map((line, idx) => (
                      <p key={idx}>{line.trim()}</p>
                    ))
                  ) : (
                    <>
                      <p>123 Avenue de la Formation</p>
                      <p>BP 1024, Douala, Cameroun</p>
                    </>
                  )}
                  <p>{organization?.phone || "+237 600 00 00 00"}</p>
                  {organization?.email && <p>{organization.email}</p>}
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex justify-between mb-6 shrink-0">
              <div className="space-y-1 w-1/2 pr-4">
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Délivré à</p>
                <p className="font-bold text-gray-900 text-base uppercase tracking-tight">{student.firstName} {student.lastName}</p>
                <p className="text-[11px] text-gray-600">{student.contact}</p>
                {student.email && <p className="text-[11px] text-gray-600">{student.email}</p>}
                
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Matricule</p>
                  <p className="font-medium text-gray-900 text-[11px]">{student.matricule}</p>
                </div>
              </div>
              
              <div className="w-1/2 pl-4 flex flex-col items-end">
                <div className="bg-gray-50/80 rounded-md p-3 w-full max-w-[180px] space-y-2 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium uppercase tracking-wider text-[9px]">Devise</span>
                    <span className="font-semibold text-gray-900 text-[11px]">FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium uppercase tracking-wider text-[9px]">N° Reçu</span>
                    <span className="font-semibold text-gray-900 text-[11px]">{receiptId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium uppercase tracking-wider text-[9px]">Date</span>
                    <span className="font-semibold text-gray-900 text-[11px]">
                      {firstPaymentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium uppercase tracking-wider text-[9px]">Mode</span>
                    <span className="font-semibold text-gray-900 text-[11px]">{activePayments.length === 1 ? activePayments[0].method : 'Multiple'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area (Flex grow to push footer down) */}
            <div className="flex-1 shrink-0 mb-6">
              <div className="rounded-md overflow-hidden border border-gray-100">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-900 text-white/90 text-[9px] uppercase tracking-wider">
                      <th className="px-4 py-2 text-left font-semibold">Désignation</th>
                      <th className="px-4 py-2 text-center font-semibold">Prix Unitaire</th>
                      <th className="px-4 py-2 text-center font-semibold">Qté</th>
                      <th className="px-4 py-2 text-right font-semibold">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {activePayments.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-50">
                          {(() => {
                            if (!p.motif) return "Frais de scolarité";
                            if (p.motif.toLowerCase().includes("tranche")) {
                              return `Frais de scolarité - ${p.motif}`;
                            }
                            return p.motif;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 border-b border-gray-50">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-center text-gray-600 border-b border-gray-50">1</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 border-b border-gray-50">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-6 shrink-0">
              <div className="w-56 bg-gray-50/80 p-4 rounded-lg border border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between font-medium text-gray-600">
                    <span className="uppercase tracking-wider text-[9px]">Sous-total</span>
                    <span className="text-gray-900 text-[11px]">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-600">
                    <span className="uppercase tracking-wider text-[9px]">Remise</span>
                    <span className="text-gray-900 text-[11px]">0 FCFA</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-600">
                    <span className="uppercase tracking-wider text-[9px]">TVA (0%)</span>
                    <span className="text-gray-900 text-[11px]">0 FCFA</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Total</span>
                      <span className="text-sm font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-gray-100 shrink-0">
              <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Information importante</p>
              <p className="text-[9px] text-gray-500 leading-relaxed text-justify">
                Ce reçu certifie le paiement effectué pour les frais de formation au sein de notre établissement. 
                Veuillez conserver ce document précieusement en cas de litige. Les paiements effectués ne sont 
                ni remboursables ni transférables, conformément au règlement intérieur.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
