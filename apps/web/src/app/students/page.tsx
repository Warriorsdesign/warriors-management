"use client"
import React, { useState, useMemo } from "react";
import { Search, Plus, CheckCircle2, X, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { mockStudents, mockClasses, mockFormations, mockPaymentSchedules, mockPayments, Student, StudentStatus, getComputedClassStatus, ClassGroup, Formation, Payment, PaymentSchedule, PaymentStatus } from "@/lib/data/mockData";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [classes, setClasses] = useState<ClassGroup[]>(mockClasses);
  const [formations, setFormations] = useState<Formation[]>(mockFormations);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    try {
      const storedStudents = localStorage.getItem('warriors_mock_students');
      if (storedStudents) setStudents(JSON.parse(storedStudents));
      else localStorage.setItem('warriors_mock_students', JSON.stringify(mockStudents));

      const storedClasses = localStorage.getItem('warriors_mock_classes');
      if (storedClasses) setClasses(JSON.parse(storedClasses));
      else localStorage.setItem('warriors_mock_classes', JSON.stringify(mockClasses));

      const storedFormations = localStorage.getItem('warriors_mock_formations');
      if (storedFormations) setFormations(JSON.parse(storedFormations));
      else localStorage.setItem('warriors_mock_formations', JSON.stringify(mockFormations));
    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male' as "Male" | "Female",
    contact: '',
    matricule: '',
    formationId: '',
    classId: '',
    currentLevel: '',
    currentStatus: 'nouvel_inscrit' as StudentStatus,
    enrollmentDate: new Date().toISOString().split('T')[0],
    registrationFee: '',
    paymentMethod: 'Espèces' as Payment["method"],
    installmentsCount: '3',
    installmentInterval: '1_mois'
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as Element).closest('.action-dropdown-container')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getStudentStatusBadge = (status: string) => {
    switch (status) {
      case "en_cours":
      case "nouvel_inscrit":
        return <Badge variant="success" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>En cours</Badge>;
      case "abandonne":
        return <Badge variant="destructive" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5"></span>Abandonné</Badge>;
      case "reinscrit":
        return <Badge variant="warning" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Réinscrit</Badge>;
      default:
        return <Badge variant="outline" className="px-2 py-0.5 text-[11px] whitespace-nowrap">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "en_retard":
        return <Badge variant="destructive" className="px-2 py-0.5 text-[11px] bg-rose-50 text-rose-600 border-none whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>En retard</Badge>;
      case "solde":
        return <Badge className="px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Soldé</Badge>;
      case "a_jour":
        return <Badge className="px-2 py-0.5 text-[11px] bg-indigo-50 text-primary border-none hover:bg-indigo-100 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>À jour</Badge>;
      default:
        return null;
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const classGroup = classes.find(c => c.id === student.classId);
      const formation = formations.find(f => f.id === classGroup?.formationId);

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.matricule.toLowerCase().includes(searchLower);

      const matchesFormation = selectedFormations.length === 0 || (formation && selectedFormations.includes(formation.id));
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(student.currentStatus);

      return matchesSearch && matchesFormation && matchesStatus;
    });
  }, [students, classes, formations, searchQuery, selectedFormations, selectedStatuses]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFormations, selectedStatuses]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      firstName: "",
      lastName: "",
      gender: "Male",
      contact: "",
      matricule: `WM${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      formationId: "",
      classId: "",
      currentLevel: "",
      currentStatus: "nouvel_inscrit",
      enrollmentDate: new Date().toISOString().split('T')[0],
      registrationFee: '',
      paymentMethod: 'Espèces',
      installmentsCount: '3',
      installmentInterval: '1_mois'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    const classGroup = classes.find(c => c.id === student.classId);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender as "Male" | "Female",
      contact: student.contact || "",
      matricule: student.matricule,
      formationId: classGroup ? classGroup.formationId : "",
      classId: student.classId,
      currentLevel: student.currentLevel || "",
      currentStatus: student.currentStatus,
      enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
      registrationFee: '',
      paymentMethod: 'Espèces',
      installmentsCount: '3',
      installmentInterval: '1_mois'
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'Male',
      contact: '',
      matricule: '',
      formationId: '',
      classId: '',
      currentLevel: '',
      currentStatus: 'nouvel_inscrit',
      enrollmentDate: new Date().toISOString().split('T')[0],
      registrationFee: '',
      paymentMethod: 'Espèces',
      installmentsCount: '3',
      installmentInterval: '1_mois'
    });
    setErrors({});
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Veuillez renseigner le prénom.";
    if (!formData.lastName.trim()) newErrors.lastName = "Veuillez renseigner le nom.";
    if (!formData.contact.trim()) newErrors.contact = "Veuillez renseigner le contact.";
    if (!formData.formationId) newErrors.formationId = "Veuillez sélectionner une formation.";
    if (!formData.classId) newErrors.classId = "Veuillez sélectionner une classe.";
    
    if (!editingStudent) {
      if (!formData.registrationFee || parseInt(formData.registrationFee) <= 0) {
        newErrors.registrationFee = "Veuillez renseigner les frais d'inscription.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let updatedStudents;
      if (editingStudent) {
        updatedStudents = students.map(s =>
          s.id === editingStudent.id ? {
            ...s,
            firstName: formData.firstName,
            lastName: formData.lastName,
            contact: formData.contact,
            classId: formData.classId,
            currentStatus: formData.currentStatus,
            enrollmentDate: formData.enrollmentDate,
            gender: formData.gender
          } : s
        );
      } else {
        const newStudent: Student = {
          id: `stu_${Date.now()}`,
          matricule: formData.matricule,
          firstName: formData.firstName,
          lastName: formData.lastName,
          contact: formData.contact,
          email: "",
          gender: formData.gender,
          classId: formData.classId,
          currentLevel: formData.currentLevel || undefined,
          currentStatus: formData.currentStatus,
          enrollmentDate: formData.enrollmentDate,
        };

        const registrationFeeNum = parseInt(formData.registrationFee) || 0;
        const classGroup = classes.find(c => c.id === formData.classId);
        const formation = formations.find(f => f.id === classGroup?.formationId);
        const totalCost = formation?.totalCost || 0;
        const remainingAmount = Math.max(0, totalCost - registrationFeeNum);

        if (registrationFeeNum > 0) {
          const newPayment: Payment = {
            id: `pay_${Date.now()}_1`,
            studentId: newStudent.id,
            amount: registrationFeeNum,
            date: formData.enrollmentDate || new Date().toISOString().split('T')[0],
            method: formData.paymentMethod,
            recordedBy: "Admin",
            motif: "Frais d'inscription"
          };
          const storedPaymentsStr = localStorage.getItem('warriors_mock_payments');
          const paymentsToUpdate = storedPaymentsStr ? JSON.parse(storedPaymentsStr) : mockPayments;
          paymentsToUpdate.unshift(newPayment);
          localStorage.setItem('warriors_mock_payments', JSON.stringify(paymentsToUpdate));
        }

        if (totalCost > 0) {
          const installmentsCount = parseInt(formData.installmentsCount) || 1;
          const installmentAmount = Math.round(remainingAmount / installmentsCount);

          const installments = [];
          const currentDate = new Date(formData.enrollmentDate || new Date());

          for (let i = 0; i < installmentsCount; i++) {
            if (formData.installmentInterval.includes('semaine')) {
              const weeks = parseInt(formData.installmentInterval.split('_')[0]);
              currentDate.setDate(currentDate.getDate() + weeks * 7);
            } else if (formData.installmentInterval.includes('mois')) {
              const months = parseInt(formData.installmentInterval.split('_')[0]);
              currentDate.setMonth(currentDate.getMonth() + months);
            }

            const isLate = new Date(currentDate) < new Date();

            installments.push({
              amount: installmentAmount,
              dueDate: currentDate.toISOString().split('T')[0],
              status: (isLate ? "en_retard" : "a_jour") as PaymentStatus
            });
          }

          const hasLateInstallment = installments.some(i => i.status === "en_retard");

          const newSchedule: PaymentSchedule = {
            id: `sch_${Date.now()}`,
            studentId: newStudent.id,
            totalAmount: totalCost,
            paidAmount: registrationFeeNum,
            remainingAmount: remainingAmount,
            status: remainingAmount === 0 ? "solde" : (hasLateInstallment ? "en_retard" : "a_jour"),
            installments: installments
          };

          const storedSchedulesStr = localStorage.getItem('warriors_mock_payment_schedules');
          const schedulesToUpdate = storedSchedulesStr ? JSON.parse(storedSchedulesStr) : mockPaymentSchedules;
          schedulesToUpdate.unshift(newSchedule);
          localStorage.setItem('warriors_mock_payment_schedules', JSON.stringify(schedulesToUpdate));
        }

        updatedStudents = [newStudent, ...students];
      }

      setStudents(updatedStudents);
      localStorage.setItem('warriors_mock_students', JSON.stringify(updatedStudents));
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving student", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formationOptions = formations.map(f => ({ label: f.name, value: f.id }));
  const statusOptions = [
    { label: "En cours", value: "en_cours" },
    { label: "Nouvel inscrit", value: "nouvel_inscrit" },
    { label: "Abandonné", value: "abandonne" },
    { label: "Réinscrit", value: "reinscrit" },
  ];

  const selectedClassForForm = classes.find(c => c.id === formData.classId);
  const selectedFormationForForm = formations.find(f => f.id === selectedClassForForm?.formationId);
  const totalCost = selectedFormationForForm?.totalCost || 0;
  const registrationFeeNum = parseInt(formData.registrationFee) || 0;
  const remainingAmount = Math.max(0, totalCost - registrationFeeNum);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Étudiants</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les inscriptions et les dossiers des élèves</p>
        </div>

        {isLoading && (
          <div className="flex-1 text-center text-sm text-muted-foreground animate-pulse">
            Chargement des données...
          </div>
        )}
        <button
          onClick={() => {
            setEditingStudent(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex justify-center items-center gap-2 bg-primary text-primary-foreground h-9 px-4 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nouvel étudiant
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
        <div className="relative w-full md:w-1/2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher (nom, mat., tel)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 hover:shadow-md hover:border-primary/50 focus:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto ml-auto">
          <MultiSelect
            label="Formations"
            options={formationOptions}
            selectedValues={selectedFormations}
            onChange={setSelectedFormations}
            className="w-full sm:w-48"
          />
          <MultiSelect
            label="Statuts"
            options={statusOptions}
            selectedValues={selectedStatuses}
            onChange={setSelectedStatuses}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      <Card className="shadow-none rounded-xl border-border overflow-hidden">
        <div className="overflow-x-auto rounded-t-xl min-h-[300px] pb-24">
          <table className="w-full min-w-[1000px] text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-muted-foreground text-xs font-medium">
                <th className="px-4 py-3 whitespace-nowrap">Étudiant</th>
                <th className="px-4 py-3 whitespace-nowrap">Formation</th>
                <th className="px-4 py-3 whitespace-nowrap">Classe</th>
                <th className="px-4 py-3 whitespace-nowrap">Statut</th>
                <th className="px-4 py-3 whitespace-nowrap">Paiement</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Reste à payer</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun étudiant trouvé.
                  </td>
                </tr>
              ) : (
                currentStudents.map((student, idx) => {
                  const classGroup = classes.find(c => c.id === student.classId);
                  const formation = formations.find(f => f.id === classGroup?.formationId);

                  const storedSchedulesStr = localStorage.getItem('warriors_mock_payment_schedules');
                  const currentSchedules = storedSchedulesStr ? JSON.parse(storedSchedulesStr) : mockPaymentSchedules;
                  const paymentSchedule = currentSchedules.find((p: PaymentSchedule) => p.studentId === student.id);

                  return (
                    <tr key={student.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/students/${student.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <div className="w-9 h-9 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-xs">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground leading-tight hover:underline">{student.firstName} {student.lastName}</p>
                            <p className="text-[11px] text-muted-foreground">{student.matricule}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formation?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{classGroup?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStudentStatusBadge(student.currentStatus)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {paymentSchedule && getPaymentStatusBadge(paymentSchedule.status)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {paymentSchedule ? (
                          <span className="font-semibold text-foreground">
                            {formatCurrency(paymentSchedule.remainingAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-flex items-center action-dropdown-container">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === student.id ? null : student.id);
                            }}
                            className="action-dropdown-trigger p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {openDropdownId === student.id && (
                            <div className={`absolute right-0 w-32 bg-background border border-border rounded-md shadow-lg py-1 z-50 ${idx >= currentStudents.length - 2 && currentStudents.length > 2 ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                              <Link
                                href={`/students/${student.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary w-full text-left"
                              >
                                <Eye className="w-4 h-4" /> Détails
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openEditModal(student);
                                  setOpenDropdownId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary w-full text-left"
                              >
                                <Edit className="w-4 h-4" /> Modifier
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStudentToDelete(student);
                                  setOpenDropdownId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                              >
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-secondary/20">
          <div className="text-xs text-muted-foreground">
            Affichage de <span className="font-medium text-foreground">{Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}</span> à <span className="font-medium text-foreground">{Math.min(filteredStudents.length, currentPage * itemsPerPage)}</span> sur <span className="font-medium text-foreground">{filteredStudents.length}</span> résultats
          </div>
          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Suivant
              </button>
            </nav>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "Modifier l'étudiant" : "Ajouter un étudiant"}
      >
        <form className="space-y-6" onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium text-sm pb-2 border-b border-border">
              <CheckCircle2 className="w-4 h-4" />
              Informations générales
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  className={cn(
                    "w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
                    errors.firstName ? "border-red-500 focus:ring-red-500/50" : "border-border focus:ring-primary"
                  )}
                  placeholder="Ex: Jean"
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  className={cn(
                    "w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
                    errors.lastName ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
                  )}
                  placeholder="Ex: Dupont"
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Sexe</label>
                <Select
                  value={formData.gender}
                  onChange={(val) => setFormData({ ...formData, gender: val as "Male" | "Female" })}
                  options={[
                    { label: 'Masculin', value: 'Male' },
                    { label: 'Féminin', value: 'Female' },
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => {
                    setFormData({ ...formData, contact: e.target.value });
                    if (errors.contact) setErrors({ ...errors, contact: '' });
                  }}
                  className={cn(
                    "w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
                    errors.contact ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
                  )}
                  placeholder="Ex: +237..."
                />
                {errors.contact && <p className="text-xs text-red-500">{errors.contact}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium text-sm pb-2 border-b border-border">
              <CheckCircle2 className="w-4 h-4" />
              Détails de l'inscription
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Formation</label>
                <Select
                  value={formData.formationId}
                  onChange={(val) => {
                    setFormData({ ...formData, formationId: val, classId: '' });
                    if (errors.formationId) setErrors({ ...errors, formationId: '' });
                  }}
                  placeholder="Sélectionner une formation"
                  options={formations.map(f => ({ label: f.name, value: f.id }))}
                  className={errors.formationId ? "border-red-500 animate-shake" : ""}
                />
                {errors.formationId && <p className="text-xs text-red-500">{errors.formationId}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Classe</label>
                <Select
                  value={formData.classId}
                  onChange={(val) => {
                    setFormData({ ...formData, classId: val });
                    if (errors.classId) setErrors({ ...errors, classId: '' });
                  }}
                  placeholder="Sélectionner une classe"
                  disabled={!formData.formationId}
                  options={classes
                    .filter(c => {
                      if (c.formationId !== formData.formationId) return false;
                      if (editingStudent && c.id === editingStudent.classId) return true;
                      const status = getComputedClassStatus(c);
                      return status === 'ouverte';
                    })
                    .map(c => {
                      return { label: c.name, value: c.id };
                    })
                  }
                  className={errors.classId ? "border-red-500 animate-shake" : ""}
                />
                {errors.classId && <p className="text-xs text-red-500">{errors.classId}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Statut initial</label>
                <Select
                  value={formData.currentStatus}
                  onChange={(val) => setFormData({ ...formData, currentStatus: val as StudentStatus })}
                  options={[
                    { label: 'Nouvel inscrit', value: 'nouvel_inscrit' },
                    { label: 'Réinscrit', value: 'reinscrit' },
                    { label: 'En cours', value: 'en_cours' },
                  ]}
                />
              </div>

              {selectedFormationForForm?.hasLevels && selectedFormationForForm.levels && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Niveau initial</label>
                  <Select
                    value={formData.currentLevel}
                    onChange={(val) => setFormData({ ...formData, currentLevel: val })}
                    placeholder="Sélectionner un niveau"
                    options={selectedFormationForForm.levels.map((lvl: any) => ({ label: lvl.name, value: lvl.name }))}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date d'inscription</label>
                <DatePicker
                  disablePastDates={true}
                  value={formData.enrollmentDate ? new Date(formData.enrollmentDate) : undefined}
                  onChange={(d) => {
                    if (d) {
                      const localDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                      setFormData({ ...formData, enrollmentDate: localDate });
                    } else {
                      setFormData({ ...formData, enrollmentDate: '' });
                    }
                  }}
                />
              </div>

              {!editingStudent && formData.classId && (
                <div className="sm:col-span-2 pt-4 border-t border-border mt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Configuration du paiement</span>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Coût total : {formatCurrency(totalCost)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Frais d'inscription (1er paiement)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.registrationFee}
                          onChange={(e) => {
                            setFormData({ ...formData, registrationFee: e.target.value });
                            if (errors.registrationFee) setErrors({ ...errors, registrationFee: '' });
                          }}
                          className={cn(
                            "w-full bg-background border rounded-md pl-3 pr-16 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
                            errors.registrationFee ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
                          )}
                          placeholder="Montant payé aujourd'hui"
                          min="0"
                          max={totalCost}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-xs text-muted-foreground font-medium">FCFA</span>
                        </div>
                      </div>
                      {errors.registrationFee && <p className="text-xs text-red-500">{errors.registrationFee}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Mode de paiement</label>
                      <Select
                        value={formData.paymentMethod}
                        onChange={(val) => setFormData({ ...formData, paymentMethod: val as Payment["method"] })}
                        options={[
                          { label: 'Espèces', value: 'Espèces' },
                          { label: 'Mobile Money', value: 'Mobile Money' },
                          { label: 'Virement bancaire', value: 'Virement' },
                          { label: 'Chèque', value: 'Chèque' }
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Nombre d'échéances</label>
                      <input
                        type="number"
                        value={formData.installmentsCount}
                        onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        min="1"
                        max="12"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Intervalle</label>
                      <Select
                        value={formData.installmentInterval}
                        onChange={(val) => setFormData({ ...formData, installmentInterval: val })}
                        options={[
                          { label: '1 semaine', value: '1_semaine' },
                          { label: '2 semaines', value: '2_semaines' },
                          { label: '3 semaines', value: '3_semaines' },
                          { label: '1 mois', value: '1_mois' },
                          { label: '2 mois', value: '2_mois' },
                          { label: '3 mois', value: '3_mois' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-3 border border-border flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">Reste à payer</span>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(remainingAmount)}</span>
                    </div>
                    {remainingAmount > 0 && parseInt(formData.installmentsCount) > 0 && (
                      <div className="text-right flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium">Soit par échéance</span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(Math.round(remainingAmount / (parseInt(formData.installmentsCount) || 1)))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {editingStudent ? "Enregistrer" : "Ajouter l'étudiant"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Supprimer cet étudiant ?"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer <span className="font-semibold text-foreground">{studentToDelete?.firstName} {studentToDelete?.lastName}</span>.
              <br />Cette action est <span className="text-destructive font-medium">définitive</span> et supprimera toutes les données associées.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setStudentToDelete(null)}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                if (studentToDelete) {
                  try {
                    const updated = students.filter(s => s.id !== studentToDelete.id);
                    setStudents(updated);
                    localStorage.setItem('warriors_mock_students', JSON.stringify(updated));
                    setStudentToDelete(null);
                  } catch (error) {
                    console.error("Failed to delete student", error);
                    alert("Une erreur est survenue lors de la suppression.");
                  }
                }
              }}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              Oui, supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
