"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useStudent,
  updateStudent,
  changeStudentStatus,
  changeStudentLevel,
  recordStudentPayment,
} from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useFormations } from "@/lib/hooks/useFormations";
import { useSession, useCan, useStudentFinanceLevel } from "@/lib/hooks/useSession";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { PaymentDTO } from "@/lib/api/types";
import type { StudentStatus, PaymentMethod } from "@/lib/types/enums";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ReceiptModal } from "@/components/ui/receipt-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { student, isLoading, error } = useStudent(studentId);
  const { organization } = useSession();
  const { classes: allClasses } = useClasses();
  const { formations: allFormations } = useFormations();
  const canWriteStudent = useCan("students", "write");
  // Finances de la fiche selon le rôle : aucune, statut seulement, ou détail complet.
  const financeLevel = useStudentFinanceLevel();
  const showFinanceDetail = financeLevel === "full";
  const canCollectOnSheet = useCan("students.collect", "write");
  const canWritePayments = useCan("payments", "write");
  const canWritePayment = showFinanceDetail && (canCollectOnSheet || canWritePayments);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isNoPaymentWarningOpen, setIsNoPaymentWarningOpen] = useState(false);
  const [isNextLevelModalOpen, setIsNextLevelModalOpen] = useState(false);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevStudentId, setPrevStudentId] = useState<string | null>(null);
  const [nextStudentId, setNextStudentId] = useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<PaymentDTO | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', method: 'Espèces' as PaymentMethod, motif: 'Tranche' });
  const [studentFormData, setStudentFormData] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    formationId: '',
    classId: '',
    enrollmentDate: ''
  });
  const [levelFormData, setLevelFormData] = useState({ levelId: '' });
  const [statusFormData, setStatusFormData] = useState({ status: 'abandonne' as StudentStatus, motif: '' });

  // Navigation Précédent/Suivant scopée à la page de liste depuis laquelle on est arrivé
  // (stashée dans sessionStorage par students/page.tsx au clic sur une ligne).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('students_nav_context');
      if (!raw) return;
      const { ids } = JSON.parse(raw) as { ids: string[] };
      const idx = ids.indexOf(studentId);
      if (idx === -1) return;
      setPrevStudentId(idx > 0 ? ids[idx - 1] : null);
      setNextStudentId(idx < ids.length - 1 ? ids[idx + 1] : null);
    } catch {
      // ignore
    }
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-40 rounded-lg" />)}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-3">
              <Skeleton className="h-5 w-32 mb-2" />
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-3">
              <Skeleton className="h-5 w-48 mb-2" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error instanceof ApiClientError && error.status === 404 || !student) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4 text-foreground">Étudiant introuvable</h2>
        <Link href="/students" className="text-primary hover:underline">Retour à la liste</Link>
      </div>
    );
  }

  const classData = student.classGroup;
  const formation = student.classGroup?.formation;
  const center = student.classGroup?.center;
  const schedule = student.schedule;
  const payments = student.payments;

  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

  let progressPercentage = 0;
  if (schedule && schedule.totalAmount > 0) {
    progressPercentage = Math.round((schedule.paidAmount / schedule.totalAmount) * 100);
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "en_cours": return "En cours";
      case "formation_terminee": return "Formation terminée";
      case "niveau_terminee": return "Niveau terminé";
      case "suspendu": return "Suspendu";
      case "nouvel_inscrit": return "Nouvel inscrit";
      case "reinscrit": return "Réinscrit";
      case "abandonne": return "Abandonné";
      case "a_jour": return "À jour";
      case "en_retard": return "En retard";
      case "solde": return "Réglée";
      default: return status.replace(/_/g, ' ');
    }
  };

  const handleApiError = (err: unknown) => {
    useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(paymentFormData.amount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await recordStudentPayment(studentId, {
        amount,
        method: paymentFormData.method,
        motif: paymentFormData.motif,
      });
      useUIStore.getState().showToast("Paiement enregistré avec succès.", "success");
      setIsPaymentModalOpen(false);
      setPaymentFormData({ amount: '', method: 'Espèces', motif: 'Tranche' });
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateStudent(studentId, {
        firstName: studentFormData.firstName,
        lastName: studentFormData.lastName,
        contact: studentFormData.contact,
        email: studentFormData.email,
        classId: studentFormData.classId,
        enrollmentDate: studentFormData.enrollmentDate,
      });
      useUIStore.getState().showToast("Étudiant modifié avec succès.", "success");
      setIsEditStudentModalOpen(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelFormData.levelId) return;
    setIsSubmitting(true);
    try {
      await changeStudentLevel(studentId, levelFormData.levelId);
      useUIStore.getState().showToast("Niveau mis à jour avec succès.", "success");
      setIsNextLevelModalOpen(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await changeStudentStatus(studentId, statusFormData.status, statusFormData.motif || undefined);
      useUIStore.getState().showToast("Statut mis à jour avec succès.", "success");
      setIsChangeStatusModalOpen(false);
      setStatusFormData({ status: 'abandonne', motif: '' });
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Retour à la liste
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Fiche étudiant</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {showFinanceDetail
              ? "Consulter et gérer l’ensemble des informations d’un étudiant : parcours, solde, échéancier, paiements."
              : "Consulter et gérer les informations d’un étudiant : identité, classe et parcours."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Previous Student */}
          <div className="relative group">
            <button
              onClick={() => prevStudentId && router.push(`/students/${prevStudentId}`)}
              disabled={!prevStudentId}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:shadow-md hover:border-primary/50 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 group-hover:-translate-x-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap shadow-md">
                Étudiant précédent
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>

          {/* Next Student */}
          <div className="relative group">
            <button
              onClick={() => nextStudentId && router.push(`/students/${nextStudentId}`)}
              disabled={!nextStudentId}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:shadow-md hover:border-primary/50 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 group-hover:translate-x-1"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap shadow-md">
                Étudiant suivant
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{student.firstName} {student.lastName}</h2>
                <p className="text-sm text-muted-foreground">{student.matricule} • {center?.name || 'Centre inconnu'}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-medium text-foreground">{student.contact}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{student.email || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Formation</span>
                <span className="font-medium text-foreground">{formation?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Classe</span>
                <span className="font-medium text-foreground">{classData?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Statut courant</span>
                <span className="font-medium text-foreground capitalize">{formatStatus(student.currentStatus)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50 border-transparent">
                <span className="text-muted-foreground">Niveau courant</span>
                <span className="font-medium text-foreground">{formation?.levels?.find(l => l.id === student.currentLevel)?.name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Progression History */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">Historique de progression</h3>
              <p className="text-xs text-muted-foreground mt-1">Journal chronologique, jamais écrasé</p>
            </div>

            <div className="relative pl-6 before:absolute before:inset-0 before:ml-[7px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent space-y-6">
              {student.progressionLogs && student.progressionLogs.length > 0 ? (
                student.progressionLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[30px] top-1 flex items-center justify-center w-3 h-3 rounded-full border-2 border-background bg-primary z-10"></div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <time className="text-xs font-medium text-muted-foreground">{new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</time>
                        <div className="text-sm font-medium text-foreground">
                          {formatStatus(log.status)} {log.level ? `— ${formation?.name}, ${formation?.levels?.find(l => l.id === log.level)?.name || log.level}` : ''}
                        </div>
                      </div>
                      {log.reason && (
                        <div className="text-xs text-muted-foreground">
                          {log.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Aucun historique disponible.</div>
              )}
            </div>

            {canWriteStudent && (
              <div className="mt-8 flex gap-2">
                <button
                  onClick={() => setIsChangeStatusModalOpen(true)}
                  className="flex-1 bg-background border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Changer de statut
                </button>
                {formation?.hasLevels && formation?.levels && formation.levels.length > 0 && (
                  <button
                    onClick={() => {
                      setLevelFormData({ levelId: student.currentLevel || '' });
                      setIsNextLevelModalOpen(true);
                    }}
                    className="flex-1 bg-background border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Niveau suivant
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary (montants : détail complet ; statut : dès le niveau "statut") */}
          {(financeLevel !== "none" || canWriteStudent) && (
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            {showFinanceDetail ? (
            <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frais applicables • FCFA</p>
                <p className="text-2xl font-bold text-foreground">{schedule ? formatCurrency(schedule.totalAmount) : '0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Montant payé • FCFA</p>
                <p className="text-2xl font-bold text-foreground">{schedule ? formatCurrency(schedule.paidAmount) : '0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reste à payer • FCFA</p>
                <p className="text-2xl font-bold text-rose-600">{schedule ? formatCurrency(schedule.remainingAmount) : '0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Statut paiement</p>
                <p className="text-xl font-bold text-foreground capitalize">{student.paymentStatus ? formatStatus(student.paymentStatus) : '-'}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {progressPercentage} % des frais réglés - {schedule ? formatCurrency(schedule.remainingAmount) : '0'} restants
              </p>
            </div>
            </>
            ) : financeLevel === "status" ? (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Statut paiement</p>
                <p className="text-xl font-bold text-foreground capitalize">{student.paymentStatus ? formatStatus(student.paymentStatus) : '-'}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {canWritePayment && (
                <button
                  onClick={() => {
                    let defaultAmount = '';
                    let defaultMotif = 'Tranche 1';
                    if (schedule && schedule.installments) {
                      const firstUnpaidIndex = schedule.installments.findIndex(i => i.status !== 'solde');
                      if (firstUnpaidIndex !== -1) {
                        defaultAmount = schedule.installments[firstUnpaidIndex].amount.toString();
                        defaultMotif = `Tranche ${firstUnpaidIndex + 1}`;
                      }
                    }
                    setPaymentFormData({ amount: defaultAmount, method: 'Espèces', motif: defaultMotif });
                    setIsPaymentModalOpen(true);
                  }}
                  className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Enregistrer un paiement
                </button>
              )}
              {showFinanceDetail && (
              <button
                onClick={() => {
                  if (payments.length === 0) {
                    setIsNoPaymentWarningOpen(true);
                  } else {
                    setSelectedPayment(null);
                    setIsReceiptModalOpen(true);
                  }
                }}
                className="bg-background border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors"
              >
                Reçu total (Tous les paiements)
              </button>
              )}
              {canWriteStudent && (
                <>
                  <button
                    onClick={() => {
                      setStudentFormData({
                        firstName: student.firstName,
                        lastName: student.lastName,
                        contact: student.contact || '',
                        email: student.email || '',
                        formationId: formation?.id || '',
                        classId: student.classId || '',
                        enrollmentDate: student.enrollmentDate.split('T')[0]
                      });
                      setIsEditStudentModalOpen(true);
                    }}
                    className="bg-background border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors"
                  >
                    Modifier
                  </button>
                </>
              )}
            </div>
          </div>

          )}

          {showFinanceDetail && (
          <>
          {/* Echéancier */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">Échéancier</h3>
              <p className="text-sm text-muted-foreground mt-1">Échéances définies pour cette inscription</p>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">ÉCHÉANCE</th>
                    <th className="px-4 py-3 font-medium">DATE PRÉVUE</th>
                    <th className="px-4 py-3 font-medium">ATTENDU</th>
                    <th className="px-4 py-3 font-medium">REÇU</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg">ÉTAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {schedule?.installments && schedule.installments.length > 0 ? (
                    schedule.installments.map((inst, idx) => {
                      const isPaid = inst.status === 'solde';
                      const received = inst.plannedAmount - inst.amount;
                      return (
                        <tr key={idx} className="hover:bg-secondary/10">
                          <td className="px-4 py-4 font-medium text-foreground">Échéance {idx + 1}</td>
                          <td className="px-4 py-4 text-muted-foreground">{new Date(inst.dueDate).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-4 text-foreground">{formatCurrency(inst.plannedAmount)}</td>
                          <td className="px-4 py-4 text-foreground">{formatCurrency(received)}</td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className={
                              isPaid
                                ? 'border-foreground/20 text-foreground bg-background font-medium'
                                : inst.status === 'en_retard'
                                ? 'border-rose-500/30 text-rose-600 bg-rose-500/10 font-medium'
                                : 'border-border text-muted-foreground font-medium'
                            }>
                              {isPaid ? 'Soldé' : inst.status === 'en_retard' ? 'En retard' : 'À venir'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Aucun échéancier défini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">Historique des paiements</h3>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">REÇU</th>
                    <th className="px-4 py-3 font-medium">DATE</th>
                    <th className="px-4 py-3 font-medium">MODE</th>
                    <th className="px-4 py-3 font-medium">SAISI PAR</th>
                    <th className="px-4 py-3 font-medium text-right">MONTANT</th>
                    <th className="px-4 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/10">
                        <td className="px-4 py-4 text-muted-foreground">{p.motif || `RC-${new Date(p.date).getFullYear()}-${p.id.slice(-4)}`}</td>
                        <td className="px-4 py-4 font-medium text-foreground">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-4 text-muted-foreground">{p.method}</td>
                        <td className="px-4 py-4 text-muted-foreground">{p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : '-'}</td>
                        <td className="px-4 py-4 text-right font-bold text-foreground">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setIsReceiptModalOpen(true);
                            }}
                            className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                          >
                            Reçu
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Aucun paiement enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        student={student}
        payment={selectedPayment || undefined}
        payments={!selectedPayment ? payments : undefined}
        organization={organization}
      />

      <Modal isOpen={isPaymentModalOpen} onClose={() => !isSubmitting && setIsPaymentModalOpen(false)} title="Enregistrer un paiement">
        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant (FCFA)</label>
            <input
              type="number"
              required
              value={paymentFormData.amount}
              onChange={e => setPaymentFormData({...paymentFormData, amount: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Méthode de paiement</label>
            <Select
              value={paymentFormData.method}
              onChange={val => setPaymentFormData({...paymentFormData, method: val as PaymentMethod})}
              options={[
                { label: 'Espèces', value: 'Espèces' },
                { label: 'Mobile Money', value: 'Mobile Money' },
                { label: 'Virement bancaire', value: 'Virement' },
                { label: 'Chèque', value: 'Chèque' }
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motif</label>
            <input
              type="text"
              value={paymentFormData.motif}
              onChange={e => setPaymentFormData({...paymentFormData, motif: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" disabled={isSubmitting} onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border rounded-md">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditStudentModalOpen} onClose={() => !isSubmitting && setIsEditStudentModalOpen(false)} title="Modifier l'étudiant">
        <form onSubmit={handleEditStudentSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prénom</label>
            <input
              required type="text"
              value={studentFormData.firstName}
              onChange={e => setStudentFormData({...studentFormData, firstName: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom</label>
            <input
              required type="text"
              value={studentFormData.lastName}
              onChange={e => setStudentFormData({...studentFormData, lastName: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact</label>
            <input
              type="text"
              value={studentFormData.contact}
              onChange={e => setStudentFormData({...studentFormData, contact: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={studentFormData.email}
              onChange={e => setStudentFormData({...studentFormData, email: e.target.value})}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Formation</label>
            <Select
              value={studentFormData.formationId}
              onChange={(val) => setStudentFormData({...studentFormData, formationId: val, classId: ''})}
              placeholder="Sélectionner une formation"
              options={allFormations.map(f => ({ label: f.name, value: f.id }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Classe</label>
            <Select
              value={studentFormData.classId}
              onChange={(val) => setStudentFormData({...studentFormData, classId: val})}
              placeholder="Sélectionner une classe"
              disabled={!studentFormData.formationId}
              options={allClasses
                .filter(c => c.formationId === studentFormData.formationId)
                .map(c => ({ label: c.name, value: c.id }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date d'inscription</label>
            <DatePicker
              value={studentFormData.enrollmentDate ? new Date(studentFormData.enrollmentDate) : undefined}
              onChange={(d) => {
                if (d) {
                  const localDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                  setStudentFormData({...studentFormData, enrollmentDate: localDate});
                } else {
                  setStudentFormData({...studentFormData, enrollmentDate: ''});
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" disabled={isSubmitting} onClick={() => setIsEditStudentModalOpen(false)} className="px-4 py-2 border rounded-md">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
              {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNextLevelModalOpen} onClose={() => !isSubmitting && setIsNextLevelModalOpen(false)} title="Passer au niveau suivant">
        <form onSubmit={handleNextLevelSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sélectionner le niveau</label>
            <Select
              value={levelFormData.levelId}
              onChange={val => setLevelFormData({ levelId: val })}
              options={formation?.levels?.map(l => ({ label: l.name, value: l.id })) || []}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" disabled={isSubmitting} onClick={() => setIsNextLevelModalOpen(false)} className="px-4 py-2 border rounded-md">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
              {isSubmitting ? "Confirmation..." : "Confirmer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isChangeStatusModalOpen} onClose={() => !isSubmitting && setIsChangeStatusModalOpen(false)} title="Changer le statut de l'étudiant">
        <form onSubmit={handleChangeStatusSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau statut</label>
            <Select
              value={statusFormData.status}
              onChange={val => setStatusFormData({...statusFormData, status: val as StudentStatus})}
              options={[
                { label: 'En cours', value: 'en_cours' },
                { label: 'Suspendu', value: 'suspendu' },
                { label: 'Abandonné', value: 'abandonne' },
                { label: 'Formation terminée', value: 'formation_terminee' }
              ]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motif / Commentaire (optionnel)</label>
            <input
              type="text"
              value={statusFormData.motif}
              onChange={e => setStatusFormData({...statusFormData, motif: e.target.value})}
              placeholder="Ex: Raisons de santé, diplôme obtenu..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" disabled={isSubmitting} onClick={() => setIsChangeStatusModalOpen(false)} className="px-4 py-2 border rounded-md">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
              {isSubmitting ? "Confirmation..." : "Confirmer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNoPaymentWarningOpen} onClose={() => setIsNoPaymentWarningOpen(false)} title="">
        <div className="pt-2 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Aucun paiement</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cet étudiant n'a encore effectué aucun paiement. Il est donc impossible de générer un reçu.
            </p>
          </div>
          <div className="w-full pt-4">
            <button
              onClick={() => setIsNoPaymentWarningOpen(false)}
              className="w-full px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
