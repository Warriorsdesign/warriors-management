'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreVertical, Edit2, Trash2, X, Mail, Phone, MoreHorizontal, User as UserIcon, Copy } from 'lucide-react';
import { mockUsers, User, mockCenters, Center, Role, UserStatus } from '@/lib/data/mockData';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store/useUIStore';

const roleColors: Record<Role, string> = {
  "ADMIN": "bg-cyan-50 text-cyan-600",
  "GESTIONNAIRE": "bg-blue-50 text-blue-600",
  "COMPTABLE": "bg-amber-50 text-amber-600",
  "AGENT": "bg-slate-100 text-slate-600"
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    role: string;
    status: string;
    centerIds: string[];
  }>({
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'AGENT',
    status: 'actif',
    centerIds: [],
  });

  useEffect(() => {
    // Load Users
    const savedUsers = localStorage.getItem('warriors_mock_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(mockUsers);
      localStorage.setItem('warriors_mock_users', JSON.stringify(mockUsers));
    }

    // Load Centers
    const savedCenters = localStorage.getItem('warriors_mock_centers');
    if (savedCenters) {
      setCenters(JSON.parse(savedCenters));
    } else {
      setCenters(mockCenters);
    }
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    const currentYear = new Date().getFullYear().toString();
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    const matricule = `WM${currentYear}${randomPart}`;
    setFormData({
      matricule,
      firstName: '',
      lastName: '',
      email: '',
      role: 'AGENT',
      status: 'actif',
      centerIds: [],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      matricule: user.matricule || '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      centerIds: user.centerIds || [],
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Veuillez renseigner ce champ.";
    if (!formData.lastName.trim()) newErrors.lastName = "Veuillez renseigner ce champ.";
    if (!formData.email.trim()) newErrors.email = "Veuillez renseigner ce champ.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? {
        ...u,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role as Role,
        status: formData.status as UserStatus,
        centerIds: formData.centerIds
      } : u);
      setUsers(updated);
      localStorage.setItem('warriors_mock_users', JSON.stringify(updated));
      setIsModalOpen(false);
    } else {
      const defaultPassword = formData.matricule;

      const newUser: User = {
        id: `u-${Date.now()}`,
        matricule: formData.matricule,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role as Role,
        status: formData.status as UserStatus,
        centerIds: formData.centerIds
      };
      
      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem('warriors_mock_users', JSON.stringify(updated));
      setIsModalOpen(false);
      setNewUserInfo({ matricule: formData.matricule, password: defaultPassword });
    }
  };

  const handleDelete = () => {
    if (editingUser) {
      const updated = users.filter(u => u.id !== editingUser.id);
      setUsers(updated);
      localStorage.setItem('warriors_mock_users', JSON.stringify(updated));
      setIsDeleteModalOpen(false);
      setEditingUser(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCenter = centerFilter === 'all' || u.centerIds.includes(centerFilter);
    return matchesSearch && matchesRole && matchesCenter;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les accès et les rôles de votre équipe.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
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
              { label: 'Administrateur', value: 'ADMIN' },
              { label: 'Gestionnaire', value: 'GESTIONNAIRE' },
              { label: 'Comptable', value: 'COMPTABLE' },
              { label: 'Agent', value: 'AGENT' },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="pt-6 pb-0 overflow-visible relative group flex flex-col items-center bg-card border-border hover:shadow-md transition-shadow rounded-xl shadow-sm">
            {/* Status indicator removed as per user request */}

            {/* Dropdown Menu */}
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

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 overflow-hidden shadow-sm">
              <UserIcon className="w-10 h-10 text-slate-400" />
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
              title={user.centerIds && user.centerIds.length > 0 ? user.centerIds.map(cId => centers.find(c => c.id === cId)?.name).filter(Boolean).join(", ") : "Tous les centres"}
            >
              {user.centerIds && user.centerIds.length > 0 ? (
                user.centerIds.map(cId => centers.find(c => c.id === cId)?.name).filter(Boolean).join(", ")
              ) : (
                "Tous les centres"
              )}
            </p>

            <div className="flex gap-2 mt-3 mb-6">
              <Badge variant="outline" className={`px-3 py-0.5 rounded-full text-[10px] font-medium border-none ${roleColors[user.role]}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
              </Badge>
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl shadow-sm">
          Aucun utilisateur trouvé.
        </div>
      )}

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Matricule</label>
              <input
                type="text"
                value={formData.matricule}
                disabled
                className="w-full bg-muted/30 text-muted-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none cursor-not-allowed opacity-80"
              />
            </div>

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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rôle</label>
              <Select
                value={formData.role}
                onChange={(val: string) => setFormData({ ...formData, role: val })}
                options={[
                  { label: 'Administrateur', value: 'ADMIN' },
                  { label: 'Gestionnaire', value: 'GESTIONNAIRE' },
                  { label: 'Comptable', value: 'COMPTABLE' },
                  { label: 'Agent', value: 'AGENT' },
                ]}
              />
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
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              {editingUser ? "Enregistrer" : "Créer"}
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
