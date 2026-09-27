'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreVertical, Edit2, Trash2, X, Mail, Phone, MoreHorizontal, User as UserIcon, Copy, ShieldAlert } from 'lucide-react';
import { useUsers, createUser, updateUser, deleteUser } from '@/lib/hooks/useUsers';
import { useCenters } from '@/lib/hooks/useCenters';
import { useCan } from '@/lib/hooks/useSession';
import { ApiClientError } from '@/lib/api/client';
import type { UserDTO } from '@/lib/api/types';
import { useRoles } from '@/lib/hooks/useRoles';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { CardGridItemSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store/useUIStore';

const roleColors: Record<string, string> = {
  "ADMIN": "bg-cyan-50 text-cyan-600",
  "GESTIONNAIRE": "bg-blue-50 text-blue-600",
  "COMPTABLE": "bg-amber-50 text-amber-600"
};

const getRoleColor = (roleName: string) => {
  return roleColors[roleName] || "bg-secondary text-secondary-foreground";
};

export default function UsersPage() {
  const { users, isLoading, error } = useUsers();
  const { roles, isLoading: isRolesLoading } = useRoles();
  const { centers } = useCenters();
  const canWrite = useCan('users', 'write');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserInfo, setNewUserInfo] = useState<{ matricule: string; password: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as Element).closest('.action-dropdown-container')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState<{
    matricule: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    status: string;
    centerIds: string[];
  }>({
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    roles: [],
    status: 'actif',
    centerIds: [],
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      matricule: '',
      firstName: '',
      lastName: '',
      email: '',
      roles: [],
      status: 'actif',
      centerIds: [],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserDTO) => {
    setEditingUser(user);
    setFormData({
      matricule: user.matricule || '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      status: user.status,
      centerIds: user.centers.map(c => c.id),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCenterToggle = (centerId: string) => {
    setFormData(prev => {
      if (prev.centerIds.includes(centerId)) {
        return { ...prev, centerIds: prev.centerIds.filter(id => id !== centerId) };
      } else {
        return { ...prev, centerIds: [...prev.centerIds, centerId] };
      }
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Veuillez renseigner ce champ.";
    if (!formData.lastName.trim()) newErrors.lastName = "Veuillez renseigner ce champ.";
    if (!formData.email.trim()) newErrors.email = "Veuillez renseigner ce champ.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          roles: formData.roles,
          status: formData.status as 'actif' | 'inactif',
          centerIds: formData.centerIds,
        });
        useUIStore.getState().showToast("Utilisateur modifié avec succès.", "success");
        setIsModalOpen(false);
      } else {
        const { user, provisionalPassword } = await createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          roles: formData.roles,
          status: formData.status as 'actif' | 'inactif',
          centerIds: formData.centerIds,
        });
        setIsModalOpen(false);
        setNewUserInfo({ matricule: user.matricule || '', password: provisionalPassword });
      }
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    try {
      await deleteUser(editingUser.id);
      useUIStore.getState().showToast("Utilisateur supprimé avec succès.", "success");
      setIsDeleteModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        useUIStore.getState().showToast("Désactivez plutôt que de supprimer : cet utilisateur a des paiements/dépenses enregistrés.", "error");
      } else {
        useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
      }
      setIsDeleteModalOpen(false);
    }
  };

  if (error instanceof ApiClientError && error.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <ShieldAlert className="w-10 h-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Accès refusé</h2>
        <p className="text-sm text-muted-foreground max-w-sm">Vous n'avez pas les droits nécessaires pour consulter cette page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.roles.includes(roleFilter);
    const matchesCenter = centerFilter === 'all' || u.centers.some(c => c.id === centerFilter);
    return matchesSearch && matchesRole && matchesCenter;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les accès et les rôles de votre équipe.</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 hover:shadow-md hover:border-primary/50 focus:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:ml-auto">
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { label: 'Tous les rôles', value: 'all' },
              ...roles.map(r => ({ label: r.name, value: r.name }))
            ]}
          />
          <Select
            value={centerFilter}
            onChange={setCenterFilter}
            options={[
              { label: 'Tous les centres', value: 'all' },
              ...centers.map(c => ({ label: c.name, value: c.id }))
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <CardGridItemSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="pt-6 pb-0 overflow-visible relative group flex flex-col items-center bg-card border-border hover:shadow-md transition-shadow rounded-xl shadow-sm">
              {canWrite && (
                <div className="absolute right-3 top-3 action-dropdown-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openDropdownId === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-background border border-border rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={() => {
                          openEditModal(user);
                          setOpenDropdownId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary w-full text-left"
                      >
                        <Edit2 className="w-4 h-4" /> Modifier
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setIsDeleteModalOpen(true);
                          setOpenDropdownId(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                      >
                        <Trash2 className="w-4 h-4" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 overflow-hidden shadow-sm">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* User Info */}
              <h3 className="text-base font-semibold text-foreground px-4 text-center truncate w-full">
                {user.firstName} {user.lastName}
              </h3>
              {user.matricule && (
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5 px-4 text-center">
                  {user.matricule}
                </p>
              )}

              <p
                className="text-[11px] text-muted-foreground/80 mt-0.5 px-4 text-center truncate w-full"
                title={user.centers.length > 0 ? user.centers.map(c => c.name).join(", ") : "Tous les centres"}
              >
                {user.centers.length > 0 ? user.centers.map(c => c.name).join(", ") : "Tous les centres"}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mt-3 mb-6">
                {user.roles.map((r) => (
                  <Badge key={r} variant="outline" className={`px-3 py-0.5 rounded-full text-[10px] font-medium border-none ${getRoleColor(r)}`}>
                    {r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()}
                  </Badge>
                ))}
                <Badge variant="outline" className={`px-3 py-0.5 rounded-full text-[10px] font-medium border-none ${user.status === 'actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {user.status === 'actif' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-auto border-t border-border">
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  title={user.email}
                >
                  <Mail className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{user.email}</span>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl shadow-sm">
          Aucun utilisateur trouvé.
        </div>
      )}

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editingUser && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Matricule</label>
                <input
                  type="text"
                  value={formData.matricule}
                  disabled
                  className="w-full bg-muted/30 text-muted-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none cursor-not-allowed opacity-80"
                />
              </div>
            )}

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
                  errors.firstName ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
                )}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.firstName}</p>
              )}
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
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.lastName}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Adresse Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={cn(
                  "w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
                  errors.email ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Rôles</label>
              <div className="flex flex-wrap gap-2">
                {isRolesLoading ? (
                  <span className="text-xs text-muted-foreground animate-pulse">Chargement des rôles...</span>
                ) : roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      let newRoles = [...formData.roles];
                      if (role.name === 'ADMIN') {
                        newRoles = newRoles.includes('ADMIN') ? [] : ['ADMIN'];
                      } else {
                        newRoles = newRoles.filter(r => r !== 'ADMIN');
                        if (newRoles.includes(role.name)) {
                          newRoles = newRoles.filter(r => r !== role.name);
                        } else {
                          newRoles.push(role.name);
                        }
                      }
                      setFormData({ ...formData, roles: newRoles });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
                      formData.roles.includes(role.name) 
                        ? (role.name === 'ADMIN' ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "bg-primary text-primary-foreground border-primary") 
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <Select
                value={formData.status}
                onChange={(val: string) => setFormData({ ...formData, status: val })}
                options={[
                  { label: 'Actif', value: 'actif' },
                  { label: 'Inactif', value: 'inactif' },
                ]}
              />
            </div>

            <div className="space-y-2 sm:col-span-2 mt-2">
              <label className="text-xs font-medium text-muted-foreground">Centres affectés</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-border rounded-md p-3 max-h-40 overflow-y-auto">
                {centers.map(center => (
                  <label key={center.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded-md">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary"
                      checked={formData.centerIds.includes(center.id)}
                      onChange={() => handleCenterToggle(center.id)}
                    />
                    <span>{center.name}</span>
                  </label>
                ))}
                {centers.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-full">Aucun centre disponible. Veuillez d'abord créer un centre.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : (editingUser ? "Enregistrer" : "Créer")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Supprimer l'utilisateur"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer l'utilisateur <span className="font-semibold text-foreground">{editingUser?.firstName} {editingUser?.lastName}</span>.
              <br />Cette action est <span className="text-destructive font-medium">définitive</span> et supprimera toutes les données associées.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              Oui, supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Mot de Passe */}
      <Modal
        isOpen={newUserInfo !== null}
        onClose={() => setNewUserInfo(null)}
        title="Compte créé avec succès"
      >
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              L'utilisateur a été ajouté. Voici ses identifiants de connexion. <br />
              <span className="font-semibold text-rose-500">Ce mot de passe devra être changé lors de la première connexion.</span>
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 grid grid-cols-[180px_1fr] gap-y-3 items-center">
            <span className="text-sm font-medium text-muted-foreground">Matricule</span>
            <span className="text-sm font-bold text-foreground font-mono">{newUserInfo?.matricule}</span>

            <div className="col-span-2 border-t border-border/50 my-1"></div>

            <span className="text-sm font-medium text-muted-foreground">Mot de passe provisoire</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground font-mono bg-background px-2 py-1 rounded border border-border shadow-sm">
                {newUserInfo?.password}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (newUserInfo?.password) {
                    navigator.clipboard.writeText(newUserInfo.password);
                    useUIStore.getState().showToast('Mot de passe copié', 'success');
                  }
                }}
                className="p-1.5 hover:bg-black/5 rounded-md text-muted-foreground transition-colors"
                title="Copier le mot de passe"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setNewUserInfo(null)}
              className="px-6 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
