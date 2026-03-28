import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { 
  Droplet, 
  Users,
  LogOut,
  Bell,
  Building2,
  Shield,
  Mail,
  MessageSquare,
  Send,
  Plus,
  Settings,
  BarChart3,
  Globe,
  UserPlus,
  Edit,
  Trash2,
  Activity,
  Minus,
  Search,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data
const hemocentros = [
  { id: 'hc-001', name: 'Hemepar', city: 'Curitiba', donations: 325, active: true },
  { id: 'hc-002', name: 'Hospital Erasto Gaertner', city: 'Curitiba', donations: 198, active: true },
  { id: 'hc-003', name: 'Hospital de Clínicas - UFPR', city: 'Curitiba', donations: 245, active: true },
  { id: 'hc-004', name: 'Hospital do Trabalhador', city: 'Curitiba', donations: 176, active: true },
];

const permissionGroups = [
  { 
    id: 'pg-001', 
    name: 'Funcionário Padrão', 
    description: 'Acesso básico ao sistema', 
    permissions: ['view_donors', 'register_donations', 'view_schedule'],
    users: 45
  },
  { 
    id: 'pg-002', 
    name: 'Enfermeiro', 
    description: 'Acesso completo ao registro de doações', 
    permissions: ['view_donors', 'register_donations', 'view_schedule', 'manage_stock'],
    users: 18
  },
  { 
    id: 'pg-003', 
    name: 'Diretor', 
    description: 'Gestão completa do hemocentro', 
    permissions: ['all_hemocentro'],
    users: 5
  },
];

const campaignsMock = [
  { 
    id: 'c-001', 
    title: 'Campanha de Urgência - Tipo O-', 
    subtitle: 'Precisamos urgentemente de doadores O-',
    status: 'active',
    sent: 2847,
    opened: 1523,
    clicks: 289,
    date: '2026-03-05'
  },
  { 
    id: 'c-002', 
    title: 'Doação de Junho - Salve Vidas', 
    subtitle: 'Sua doação pode salvar até 4 vidas',
    status: 'scheduled',
    date: '2026-06-01'
  },
  { 
    id: 'c-003', 
    title: 'Campanha de Natal 2025', 
    subtitle: 'Doe sangue neste Natal',
    status: 'completed',
    sent: 3120,
    opened: 1890,
    clicks: 456,
    date: '2025-12-20'
  },
];

const systemStats = [
  { month: 'Jan', total: 1245, hc1: 245, hc2: 198, hc3: 245, hc4: 176, hc5: 142 },
  { month: 'Fev', total: 1389, hc1: 289, hc2: 212, hc3: 267, hc4: 189, hc5: 156 },
  { month: 'Mar', total: 1486, hc1: 325, hc2: 198, hc3: 245, hc4: 176, hc5: 142 },
];

const globalStockMock = [
  { type: 'A+', current: 245, min: 150, max: 500, critical: false },
  { type: 'A-', current: 78, min: 100, max: 300, critical: true },
  { type: 'B+', current: 156, min: 125, max: 400, critical: false },
  { type: 'B-', current: 42, min: 75, max: 250, critical: true },
  { type: 'AB+', current: 89, min: 75, max: 200, critical: false },
  { type: 'AB-', current: 28, min: 50, max: 150, critical: true },
  { type: 'O+', current: 324, min: 200, max: 600, critical: false },
  { type: 'O-', current: 91, min: 125, max: 350, critical: true },
];

const usersMock = [
  { id: 'u-001', name: 'Dr. Roberto Silva', email: 'roberto@doavida.com', role: 'Diretor', hemocentro: 'Hemepar', status: 'online', lastLogin: '2026-03-28 14:30' },
  { id: 'u-002', name: 'Ana Paula Santos', email: 'ana.santos@doavida.com', role: 'Funcionário', hemocentro: 'Hospital Erasto Gaertner', status: 'online', lastLogin: '2026-03-28 08:15' },
  { id: 'u-003', name: 'Carlos Mendes', email: 'carlos.m@doavida.com', role: 'Diretor', hemocentro: 'Hospital de Clínicas - UFPR', status: 'offline', lastLogin: '2026-03-27 18:45' },
  { id: 'u-004', name: 'Maria Oliveira', email: 'maria.o@doavida.com', role: 'Enfermeira', hemocentro: 'Hospital do Trabalhador', status: 'online', lastLogin: '2026-03-28 09:00' },
  { id: 'u-005', name: 'João Pedro Costa', email: 'joao.costa@doavida.com', role: 'Funcionário', hemocentro: 'Hemepar', status: 'online', lastLogin: '2026-03-28 13:20' },
];

const stockDetailsByType: { [key: string]: any } = {
  'A+': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 82, percentage: 33 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 56, percentage: 23 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 48, percentage: 20 },
      { hemocentro: 'Hospital do Trabalhador', stock: 59, percentage: 24 },
    ],
    history: [
      { date: '24/03', stock: 230, entries: 25, exits: 18 },
      { date: '25/03', stock: 237, entries: 18, exits: 11 },
      { date: '26/03', stock: 244, entries: 22, exits: 15 },
      { date: '27/03', stock: 251, entries: 20, exits: 13 },
      { date: '28/03', stock: 245, entries: 15, exits: 21 },
    ],
    stats: {
      avgDailyConsumption: 16,
      daysUntilCritical: 9,
      lastDonation: '2026-03-28 13:45',
      totalDonationsMonth: 87
    }
  },
  'A-': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 28, percentage: 36 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 18, percentage: 23 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 14, percentage: 18 },
      { hemocentro: 'Hospital do Trabalhador', stock: 18, percentage: 23 },
    ],
    history: [
      { date: '24/03', stock: 74, entries: 8, exits: 12 },
      { date: '25/03', stock: 70, entries: 6, exits: 10 },
      { date: '26/03', stock: 66, entries: 9, exits: 13 },
      { date: '27/03', stock: 62, entries: 7, exits: 11 },
      { date: '28/03', stock: 78, entries: 22, exits: 6 },
    ],
    stats: {
      avgDailyConsumption: 10,
      daysUntilCritical: 2,
      lastDonation: '2026-03-28 10:20',
      totalDonationsMonth: 34
    }
  },
  'B+': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 52, percentage: 33 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 38, percentage: 24 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 31, percentage: 20 },
      { hemocentro: 'Hospital do Trabalhador', stock: 35, percentage: 22 },
    ],
    history: [
      { date: '24/03', stock: 148, entries: 14, exits: 11 },
      { date: '25/03', stock: 151, entries: 12, exits: 9 },
      { date: '26/03', stock: 154, entries: 15, exits: 12 },
      { date: '27/03', stock: 157, entries: 11, exits: 8 },
      { date: '28/03', stock: 156, entries: 10, exits: 11 },
    ],
    stats: {
      avgDailyConsumption: 10,
      daysUntilCritical: 3,
      lastDonation: '2026-03-28 11:30',
      totalDonationsMonth: 56
    }
  },
  'B-': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 15, percentage: 36 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 11, percentage: 26 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 8, percentage: 19 },
      { hemocentro: 'Hospital do Trabalhador', stock: 8, percentage: 19 },
    ],
    history: [
      { date: '24/03', stock: 46, entries: 5, exits: 8 },
      { date: '25/03', stock: 43, entries: 4, exits: 7 },
      { date: '26/03', stock: 40, entries: 3, exits: 6 },
      { date: '27/03', stock: 37, entries: 6, exits: 9 },
      { date: '28/03', stock: 42, entries: 10, exits: 5 },
    ],
    stats: {
      avgDailyConsumption: 7,
      daysUntilCritical: 1,
      lastDonation: '2026-03-28 09:15',
      totalDonationsMonth: 21
    }
  },
  'AB+': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 32, percentage: 36 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 22, percentage: 25 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 18, percentage: 20 },
      { hemocentro: 'Hospital do Trabalhador', stock: 17, percentage: 19 },
    ],
    history: [
      { date: '24/03', stock: 85, entries: 8, exits: 6 },
      { date: '25/03', stock: 87, entries: 7, exits: 5 },
      { date: '26/03', stock: 89, entries: 6, exits: 4 },
      { date: '27/03', stock: 91, entries: 5, exits: 3 },
      { date: '28/03', stock: 89, entries: 4, exits: 6 },
    ],
    stats: {
      avgDailyConsumption: 5,
      daysUntilCritical: 3,
      lastDonation: '2026-03-27 16:45',
      totalDonationsMonth: 28
    }
  },
  'AB-': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 10, percentage: 36 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 7, percentage: 25 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 5, percentage: 18 },
      { hemocentro: 'Hospital do Trabalhador', stock: 6, percentage: 21 },
    ],
    history: [
      { date: '24/03', stock: 30, entries: 3, exits: 4 },
      { date: '25/03', stock: 29, entries: 2, exits: 3 },
      { date: '26/03', stock: 28, entries: 3, exits: 4 },
      { date: '27/03', stock: 27, entries: 2, exits: 3 },
      { date: '28/03', stock: 28, entries: 3, exits: 2 },
    ],
    stats: {
      avgDailyConsumption: 3,
      daysUntilCritical: 1,
      lastDonation: '2026-03-26 14:20',
      totalDonationsMonth: 12
    }
  },
  'O+': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 108, percentage: 33 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 82, percentage: 25 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 68, percentage: 21 },
      { hemocentro: 'Hospital do Trabalhador', stock: 66, percentage: 20 },
    ],
    history: [
      { date: '24/03', stock: 310, entries: 32, exits: 28 },
      { date: '25/03', stock: 314, entries: 28, exits: 24 },
      { date: '26/03', stock: 318, entries: 30, exits: 26 },
      { date: '27/03', stock: 322, entries: 26, exits: 22 },
      { date: '28/03', stock: 324, entries: 24, exits: 22 },
    ],
    stats: {
      avgDailyConsumption: 24,
      daysUntilCritical: 5,
      lastDonation: '2026-03-28 14:50',
      totalDonationsMonth: 142
    }
  },
  'O-': {
    distribution: [
      { hemocentro: 'Hemepar', stock: 32, percentage: 35 },
      { hemocentro: 'Hospital Erasto Gaertner', stock: 24, percentage: 26 },
      { hemocentro: 'Hospital de Clínicas - UFPR', stock: 18, percentage: 20 },
      { hemocentro: 'Hospital do Trabalhador', stock: 17, percentage: 19 },
    ],
    history: [
      { date: '24/03', stock: 95, entries: 12, exits: 18 },
      { date: '25/03', stock: 89, entries: 10, exits: 16 },
      { date: '26/03', stock: 83, entries: 14, exits: 20 },
      { date: '27/03', stock: 77, entries: 11, exits: 17 },
      { date: '28/03', stock: 91, entries: 25, exits: 11 },
    ],
    stats: {
      avgDailyConsumption: 16,
      daysUntilCritical: 1,
      lastDonation: '2026-03-28 12:30',
      totalDonationsMonth: 48
    }
  }
};

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Dialog states
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showHemocentroDialog, setShowHemocentroDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showStockDetailsDialog, setShowStockDetailsDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showViewHemocentroDialog, setShowViewHemocentroDialog] = useState(false);
  const [showEditHemocentroDialog, setShowEditHemocentroDialog] = useState(false);
  const [showSettingsHemocentroDialog, setShowSettingsHemocentroDialog] = useState(false);
  const [showEditCampaignDialog, setShowEditCampaignDialog] = useState(false);
  const [showDeleteCampaignDialog, setShowDeleteCampaignDialog] = useState(false);
  const [showEditPermissionDialog, setShowEditPermissionDialog] = useState(false);
  const [showDeletePermissionDialog, setShowDeletePermissionDialog] = useState(false);
  
  // Data states
  const [campaigns, setCampaigns] = useState(campaignsMock);
  const [globalStock, setGlobalStock] = useState(globalStockMock);
  const [users, setUsers] = useState(usersMock);
  const [permissions, setPermissions] = useState(permissionGroups);
  
  // Form states
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [selectedBloodTypeForDetails, setSelectedBloodTypeForDetails] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedHemocentro, setSelectedHemocentro] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [permissionToDelete, setPermissionToDelete] = useState<any>(null);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');
  const [selectedHemocentroForStock, setSelectedHemocentroForStock] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  // Campaign handlers
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCampaignDialog(false);
    toast.success('Campanha criada e agendada com sucesso!');
  };

  const handleEditCampaign = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      setSelectedCampaign(campaign);
      setShowEditCampaignDialog(true);
    }
  };

  const handleUpdateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEditCampaignDialog(false);
    setSelectedCampaign(null);
    toast.success('Campanha atualizada com sucesso!');
  };

  const handleDeleteCampaign = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      setCampaignToDelete(campaign);
      setShowDeleteCampaignDialog(true);
    }
  };

  const handleConfirmDeleteCampaign = () => {
    if (campaignToDelete) {
      setCampaigns(campaigns.filter(c => c.id !== campaignToDelete.id));
      setShowDeleteCampaignDialog(false);
      setCampaignToDelete(null);
      toast.success('Campanha excluída com sucesso!');
    }
  };

  // Permission handlers
  const handleEditPermission = (permission: any) => {
    setSelectedPermission(permission);
    setShowEditPermissionDialog(true);
  };

  const handleUpdatePermission = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEditPermissionDialog(false);
    setSelectedPermission(null);
    toast.success('Grupo de permissões atualizado com sucesso!');
  };

  const handleDeletePermission = (permission: any) => {
    setPermissionToDelete(permission);
    setShowDeletePermissionDialog(true);
  };

  const handleConfirmDeletePermission = () => {
    if (permissionToDelete) {
      setPermissions(permissions.filter(p => p.id !== permissionToDelete.id));
      setShowDeletePermissionDialog(false);
      setPermissionToDelete(null);
      toast.success('Grupo de permissões removido com sucesso!');
    }
  };

  // Permission handlers
  const handleCreatePermissionGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPermissionDialog(false);
    toast.success('Grupo de permissões criado com sucesso!');
  };

  // Hemocentro handlers
  const handleCreateHemocentro = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHemocentroDialog(false);
    toast.success('Hemocentro criado com sucesso!');
  };

  // Stock handlers
  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setSelectedHemocentroForStock('all');
    setShowStockDialog(true);
  };

  const handleOpenStockDetails = (bloodType: string) => {
    setSelectedBloodTypeForDetails(bloodType);
    setShowStockDetailsDialog(true);
  };

  const handleUpdateStock = () => {
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      toast.error('Digite uma quantidade válida');
      return;
    }

    const amount = parseInt(stockAmount);
    setGlobalStock(prev =>
      prev.map(item => {
        if (item.type === selectedBloodType) {
          const newCurrent = stockAction === 'add' 
            ? Math.min(item.current + amount, item.max)
            : Math.max(item.current - amount, 0);
          const newCritical = newCurrent < item.min;
          
          return {
            ...item,
            current: newCurrent,
            critical: newCritical
          };
        }
        return item;
      })
    );

    toast.success(
      stockAction === 'add'
        ? `${amount} bolsas adicionadas ao estoque global de ${selectedBloodType}`
        : `${amount} bolsas removidas do estoque global de ${selectedBloodType}`
    );
    setShowStockDialog(false);
  };

  // User handlers
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setShowUserDialog(false);
    toast.success('Usuário criado com sucesso!');
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(prev =>
      prev.map(u => u.id === selectedUser.id ? selectedUser : u)
    );
    setShowEditUserDialog(false);
    setSelectedUser(null);
    toast.success('Usuário atualizado com sucesso!');
  };

  const handleOpenDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteUserDialog(true);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteUserDialog(false);
      setUserToDelete(null);
      toast.success('Usuário removido com sucesso!');
    }
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => u.id === id ? { ...u, status: u.status === 'online' ? 'offline' : 'online' } : u)
    );
    toast.success('Status do usuário atualizado!');
  };

  // Hemocentro handlers
  const handleViewHemocentro = (hemocentro: any) => {
    setSelectedHemocentro(hemocentro);
    setShowViewHemocentroDialog(true);
  };

  const handleEditHemocentro = (hemocentro: any) => {
    setSelectedHemocentro(hemocentro);
    setShowEditHemocentroDialog(true);
  };

  const handleUpdateHemocentro = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você atualizaria no backend/estado
    setShowEditHemocentroDialog(false);
    setSelectedHemocentro(null);
    toast.success('Hemocentro atualizado com sucesso!');
  };

  const handleSettingsHemocentro = (hemocentro: any) => {
    setSelectedHemocentro(hemocentro);
    setShowSettingsHemocentroDialog(true);
  };

  const handleSaveHemocentroSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSettingsHemocentroDialog(false);
    setSelectedHemocentro(null);
    toast.success('Configurações do hemocentro salvas com sucesso!');
  };

  const handleSaveSettings = () => {
    toast.success('Configurações do sistema salvas com sucesso!');
  };

  // Report handlers
  const handleExportReport = () => {
    if (!reportType) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    const reportNames: { [key: string]: string } = {
      donations: 'Relatório de Doações',
      stock: 'Relatório de Estoque Global',
      users: 'Relatório de Usuários',
      campaigns: 'Relatório de Campanhas',
      hemocentros: 'Relatório de Hemocentros'
    };

    const formatExt = reportFormat === 'pdf' ? 'PDF' : reportFormat === 'excel' ? 'Excel' : 'CSV';
    
    toast.success(`${reportNames[reportType]} exportado em ${formatExt} com sucesso!`);
    setShowReportDialog(false);
    setReportType('');
    setReportFormat('pdf');
  };

  const totalDonations = hemocentros.reduce((acc, hc) => acc + hc.donations, 0);
  const totalDonors = 12847;
  
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesFilter = userFilter === 'all' || 
                         (userFilter === 'online' && u.status === 'online') ||
                         (userFilter === 'offline' && u.status === 'offline') ||
                         u.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  const stockDistribution = globalStock.map(item => ({
    name: item.type,
    value: item.current,
    color: item.critical ? '#DC2626' : item.current < item.min * 1.5 ? '#EA580C' : '#16A34A'
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
                <p className="text-xs text-gray-600">Painel do Administrador</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReportDialog(true)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">Exportar</span>
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-green-600 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">Administrador do Sistema</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Visão global do sistema DoaVida - Gerenciamento completo de todos os hemocentros
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardDescription>Total de Hemocentros</CardDescription>
              <CardTitle className="text-3xl">{hemocentros.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4 text-green-600" />
                <span>Todos ativos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Doações Este Mês</CardDescription>
              <CardTitle className="text-3xl">{totalDonations}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <BarChart3 className="h-4 w-4" />
                <span>+12% vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardDescription>Total de Doadores</CardDescription>
              <CardTitle className="text-3xl">{totalDonors.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Cadastrados no sistema</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardDescription>Campanhas Ativas</CardDescription>
              <CardTitle className="text-3xl">{campaigns.filter(c => c.status === 'active').length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-orange-600" />
                <span>Em andamento</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stock">Estoque Global</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="hemocentros">Hemocentros</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Donations Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Doações por Hemocentro</CardTitle>
                  <CardDescription>Comparativo de performance - Este Mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={systemStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hc1" fill="#16A34A" name="SP Central" />
                      <Bar dataKey="hc2" fill="#2563EB" name="Zona Leste" />
                      <Bar dataKey="hc3" fill="#9333EA" name="Zona Sul" />
                      <Bar dataKey="hc4" fill="#EA580C" name="Campinas" />
                      <Bar dataKey="hc5" fill="#DC2626" name="Santos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Stock Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Estoque Global</CardTitle>
                  <CardDescription>Bolsas disponíveis por tipo sanguíneo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stockDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stockDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução Total do Sistema</CardTitle>
                <CardDescription>Doações acumuladas - Últimos 3 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={3} name="Total de Doações" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Taxa de Comparecimento</CardDescription>
                  <CardTitle className="text-3xl">87%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-600" style={{ width: '87%' }} />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Em todos os hemocentros</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Usuários Online</CardDescription>
                  <CardTitle className="text-3xl">{users.filter(u => u.status === 'online').length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">de {users.length} usuários totais</p>
                  <p className="text-sm text-green-600 mt-1">Sistema operacional</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Estoque Crítico</CardDescription>
                  <CardTitle className="text-3xl text-red-600">{globalStock.filter(s => s.critical).length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">tipos sanguíneos abaixo do mínimo</p>
                  <p className="text-sm text-red-600 mt-1">Requer atenção urgente</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estoque Global de Sangue</CardTitle>
                    <CardDescription>
                      Monitoramento consolidado de todos os hemocentros
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {globalStock.filter(s => s.critical).length} Críticos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {globalStock.map((stock) => {
                    const percentage = (stock.current / stock.max) * 100;
                    const status = stock.critical 
                      ? { label: 'Crítico', color: 'bg-red-600', textColor: 'text-red-600', bgColor: 'bg-red-100' }
                      : percentage < 50 
                      ? { label: 'Baixo', color: 'bg-orange-600', textColor: 'text-orange-600', bgColor: 'bg-orange-100' }
                      : percentage < 80
                      ? { label: 'Normal', color: 'bg-blue-600', textColor: 'text-blue-600', bgColor: 'bg-blue-100' }
                      : { label: 'Ótimo', color: 'bg-green-600', textColor: 'text-green-600', bgColor: 'bg-green-100' };
                    
                    return (
                      <div key={stock.type} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                              <Droplet className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{stock.type}</p>
                              <p className="text-sm text-gray-600">Tipo sanguíneo</p>
                            </div>
                          </div>
                          <Badge className={`${status.bgColor} ${status.textColor}`}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estoque atual</span>
                            <span className="font-semibold">{stock.current} bolsas</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${status.color}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Mín: {stock.min}</span>
                            <span>Máx: {stock.max}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleOpenUpdateStock(stock.type)}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Atualizar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleOpenStockDetails(stock.type)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários do Sistema</CardTitle>
                    <CardDescription>
                      Todos os usuários cadastrados em todos os hemocentros
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowUserDialog(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="Diretor">Diretores</SelectItem>
                      <SelectItem value="Funcionário">Funcionários</SelectItem>
                      <SelectItem value="Enfermeira">Enfermeiras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredUsers.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {userItem.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{userItem.name}</p>
                            <Badge className={userItem.status === 'online' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}>
                              <div className={`h-2 w-2 ${userItem.status === 'online' ? 'bg-green-600' : 'bg-gray-600'} rounded-full mr-2`}></div>
                              {userItem.status === 'online' ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{userItem.email}</p>
                          <p className="text-xs text-gray-500">{userItem.role} • {userItem.hemocentro}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-xs text-gray-600">Último acesso</p>
                          <p className="text-sm font-semibold">{userItem.lastLogin}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleUserStatus(userItem.id)}
                        >
                          {userItem.status === 'online' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(userItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenDeleteUser(userItem)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hemocentros Tab */}
          <TabsContent value="hemocentros" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Hemocentros</CardTitle>
                    <CardDescription>Todos os hemocentros cadastrados no sistema</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowHemocentroDialog(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Hemocentro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hemocentros.map((hc) => (
                    <div
                      key={hc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <Building2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{hc.name}</p>
                            {hc.active && (
                              <Badge className="bg-green-100 text-green-600">Ativo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{hc.city} • ID: {hc.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Doações este mês</p>
                          <p className="text-xl font-bold text-green-600">{hc.donations}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewHemocentro(hc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditHemocentro(hc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSettingsHemocentro(hc)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Grupos de Permissões</CardTitle>
                    <CardDescription>Gerencie os níveis de acesso ao sistema</CardDescription>
                  </div>
                  <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4" />
                        Novo Grupo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Criar Grupo de Permissões</DialogTitle>
                        <DialogDescription>
                          Defina um novo grupo de permissões para os usuários
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreatePermissionGroup} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome do Grupo</Label>
                          <Input placeholder="Ex: Técnico de Laboratório" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea placeholder="Descreva as responsabilidades deste grupo" />
                        </div>
                        <div className="space-y-3">
                          <Label>Permissões</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Visualizar Doadores',
                              'Registrar Doações',
                              'Gerenciar Estoque',
                              'Ver Agenda',
                              'Editar Perfis',
                              'Gerar Relatórios',
                              'Gerenciar Campanhas',
                              'Configurações do Sistema'
                            ].map((perm) => (
                              <div key={perm} className="flex items-center space-x-2">
                                <Switch id={perm} />
                                <Label htmlFor={perm} className="text-sm">{perm}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setShowPermissionDialog(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            Criar Grupo
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permissions.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="bg-purple-100 p-3 rounded-lg">
                            <Shield className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{group.name}</p>
                              <Badge variant="outline">{group.users} usuários</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {group.permissions.map((perm) => (
                                <Badge key={perm} variant="outline" className="bg-green-50 text-green-700">
                                  {perm.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditPermission(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeletePermission(group)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campanhas de Doação</CardTitle>
                    <CardDescription>Gerencie e crie campanhas para doadores via email e WhatsApp</CardDescription>
                  </div>
                  <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4" />
                        Nova Campanha
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Criar Nova Campanha</DialogTitle>
                        <DialogDescription>
                          Configure uma campanha de doação para engajar doadores
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCampaign} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Título da Campanha</Label>
                            <Input placeholder="Ex: Campanha de Urgência - Tipo O-" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtítulo</Label>
                            <Input placeholder="Ex: Precisamos urgentemente de doadores" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Mensagem da Campanha</Label>
                          <Textarea 
                            placeholder="Digite a mensagem completa que será enviada aos doadores..." 
                            rows={5}
                            required
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tipo Sanguíneo Alvo</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="O+">O+</SelectItem>
                                <SelectItem value="O-">O-</SelectItem>
                                <SelectItem value="A+">A+</SelectItem>
                                <SelectItem value="A-">A-</SelectItem>
                                <SelectItem value="B+">B+</SelectItem>
                                <SelectItem value="B-">B-</SelectItem>
                                <SelectItem value="AB+">AB+</SelectItem>
                                <SelectItem value="AB-">AB-</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Hemocentro</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos os Hemocentros</SelectItem>
                                {hemocentros.map(hc => (
                                  <SelectItem key={hc.id} value={hc.id}>{hc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                          <Label>Canais de Envio</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch id="email" defaultChecked />
                              <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch id="whatsapp" defaultChecked />
                              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                WhatsApp
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data de Envio</Label>
                            <Input type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Horário de Envio</Label>
                            <Input type="time" defaultValue="09:00" required />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowCampaignDialog(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            <Send className="h-4 w-4 mr-2" />
                            Criar e Agendar
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{campaign.title}</p>
                            <Badge className={
                              campaign.status === 'active' 
                                ? 'bg-green-100 text-green-600' 
                                : campaign.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            }>
                              {campaign.status === 'active' ? 'Ativa' : campaign.status === 'scheduled' ? 'Agendada' : 'Concluída'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{campaign.subtitle}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(campaign.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditCampaign(campaign.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {campaign.sent && (
                        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-gray-600">Enviados</p>
                            <p className="text-lg font-semibold">{campaign.sent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Abertos</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {campaign.opened?.toLocaleString()} ({Math.round((campaign.opened! / campaign.sent) * 100)}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Cliques</p>
                            <p className="text-lg font-semibold text-green-600">
                              {campaign.clicks?.toLocaleString()} ({Math.round((campaign.clicks! / campaign.sent) * 100)}%)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>Gerencie configurações globais do DoaVida</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-semibold">Sistema Ativo</p>
                        <p className="text-sm text-gray-600">Todos os hemocentros operacionais</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-semibold">Notificações por Email</p>
                        <p className="text-sm text-gray-600">Enviar emails automáticos aos doadores</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-semibold">Notificações por WhatsApp</p>
                        <p className="text-sm text-gray-600">Enviar mensagens via WhatsApp</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-semibold">Cadastro Aberto</p>
                        <p className="text-sm text-gray-600">Permitir novos cadastros de doadores</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Update Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Atualizar Estoque Global - {selectedBloodType}</DialogTitle>
            <DialogDescription>
              Gerencie o estoque consolidado de todos os hemocentros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hemocentro</Label>
              <Select value={selectedHemocentroForStock} onValueChange={setSelectedHemocentroForStock}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Hemocentros (Global)</SelectItem>
                  {hemocentros.map(hc => (
                    <SelectItem key={hc.id} value={hc.id}>{hc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ação</Label>
              <Select value={stockAction} onValueChange={(value) => setStockAction(value as 'add' | 'remove')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      <span>Adicionar ao estoque</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      <span>Remover do estoque</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Quantidade (bolsas)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Digite a quantidade"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p>
                Estoque global de <strong>{selectedBloodType}</strong>:{' '}
                <strong>
                  {globalStock.find(s => s.type === selectedBloodType)?.current} bolsas
                </strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStockDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdateStock}
              className={stockAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {stockAction === 'add' ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 mr-2" />
                  Remover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hemocentro Dialog */}
      <Dialog open={showHemocentroDialog} onOpenChange={setShowHemocentroDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Hemocentro</DialogTitle>
            <DialogDescription>
              Cadastre um novo hemocentro no sistema DoaVida
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateHemocentro} className="space-y-4">
            <div>
              <Label>Nome do Hemocentro</Label>
              <Input placeholder="Ex: Hemocentro Belo Horizonte" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input placeholder="Ex: Belo Horizonte" required />
              </div>
              <div>
                <Label>Estado</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Endereço Completo</Label>
              <Input placeholder="Rua, número, bairro" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input placeholder="(00) 0000-0000" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="contato@hemocentro.com" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowHemocentroDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Hemocentro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Cadastre um novo usuário para o sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input placeholder="Digite o nome completo" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="email@exemplo.com" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diretor">Diretor</SelectItem>
                    <SelectItem value="Funcionário">Funcionário</SelectItem>
                    <SelectItem value="Enfermeira">Enfermeira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hemocentro</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {hemocentros.map(hc => (
                      <SelectItem key={hc.id} value={hc.id}>{hc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Senha Temporária</Label>
              <Input type="password" placeholder="Mínimo 8 caracteres" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Usuário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input 
                  placeholder="Digite o nome completo" 
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  required 
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cargo</Label>
                  <Select 
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diretor">Diretor</SelectItem>
                      <SelectItem value="Funcionário">Funcionário</SelectItem>
                      <SelectItem value="Enfermeira">Enfermeira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hemocentro</Label>
                  <Select
                    value={selectedUser.hemocentro}
                    onValueChange={(value) => setSelectedUser({...selectedUser, hemocentro: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {hemocentros.map(hc => (
                        <SelectItem key={hc.id} value={hc.name}>{hc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value) => setSelectedUser({...selectedUser, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditUserDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  Você está prestes a excluir o seguinte usuário:
                </p>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Avatar>
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {userToDelete.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{userToDelete.name}</p>
                    <p className="text-sm text-gray-600">{userToDelete.email}</p>
                    <p className="text-xs text-gray-500">{userToDelete.role} • {userToDelete.hemocentro}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir este usuário do sistema?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteUserDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Hemocentro Dialog */}
      <Dialog open={showViewHemocentroDialog} onOpenChange={setShowViewHemocentroDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Detalhes do Hemocentro
            </DialogTitle>
            <DialogDescription>
              Visualize as informações completas do hemocentro
            </DialogDescription>
          </DialogHeader>
          {selectedHemocentro && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Nome</Label>
                  <p className="font-semibold text-lg">{selectedHemocentro.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">{selectedHemocentro.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Cidade</Label>
                  <p className="font-semibold">{selectedHemocentro.city}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={selectedHemocentro.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                    {selectedHemocentro.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <Label className="text-gray-500 mb-2 block">Doações Este Mês</Label>
                <p className="text-3xl font-bold text-purple-600">{selectedHemocentro.donations}</p>
                <p className="text-sm text-gray-600 mt-1">+12% vs mês anterior</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Doadores Ativos</p>
                  <p className="text-2xl font-bold text-blue-600">1.245</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Estoque Total</p>
                  <p className="text-2xl font-bold text-green-600">856</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Agendamentos</p>
                  <p className="text-2xl font-bold text-amber-600">78</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewHemocentroDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hemocentro Dialog */}
      <Dialog open={showEditHemocentroDialog} onOpenChange={setShowEditHemocentroDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Hemocentro
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do hemocentro
            </DialogDescription>
          </DialogHeader>
          {selectedHemocentro && (
            <form onSubmit={handleUpdateHemocentro} className="space-y-4">
              <div>
                <Label>Nome do Hemocentro</Label>
                <Input 
                  value={selectedHemocentro.name}
                  onChange={(e) => setSelectedHemocentro({...selectedHemocentro, name: e.target.value})}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input 
                    value={selectedHemocentro.city}
                    onChange={(e) => setSelectedHemocentro({...selectedHemocentro, city: e.target.value})}
                    required 
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedHemocentro.active ? 'active' : 'inactive'}
                    onValueChange={(value) => setSelectedHemocentro({...selectedHemocentro, active: value === 'active'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Endereço</Label>
                <Textarea 
                  placeholder="Digite o endereço completo"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input placeholder="(XX) XXXXX-XXXX" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="contato@hemocentro.com" />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditHemocentroDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Hemocentro Dialog */}
      <Dialog open={showSettingsHemocentroDialog} onOpenChange={setShowSettingsHemocentroDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Configurações do Hemocentro
            </DialogTitle>
            <DialogDescription>
              Gerencie as configurações operacionais do hemocentro
            </DialogDescription>
          </DialogHeader>
          {selectedHemocentro && (
            <form onSubmit={handleSaveHemocentroSettings} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Horários de Funcionamento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Abertura</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div>
                    <Label>Fechamento</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Capacidade</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Doações por Dia</Label>
                    <Input type="number" defaultValue="50" />
                  </div>
                  <div>
                    <Label>Estoque Máximo</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Notificações</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Alertas de Estoque Baixo</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Notificações de Agendamento</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Relatórios Diários</Label>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Permissões</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Permitir Agendamentos Online</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Aceitar Novos Doadores</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSettingsHemocentroDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditCampaignDialog} onOpenChange={setShowEditCampaignDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Campanha
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da campanha de doação
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <Label>Título da Campanha</Label>
                <Input 
                  value={selectedCampaign.title}
                  onChange={(e) => setSelectedCampaign({...selectedCampaign, title: e.target.value})}
                  required 
                />
              </div>
              
              <div>
                <Label>Subtítulo</Label>
                <Input 
                  value={selectedCampaign.subtitle}
                  onChange={(e) => setSelectedCampaign({...selectedCampaign, subtitle: e.target.value})}
                  required 
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={selectedCampaign.status}
                  onValueChange={(value) => setSelectedCampaign({...selectedCampaign, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data</Label>
                <Input 
                  type="date"
                  value={selectedCampaign.date}
                  onChange={(e) => setSelectedCampaign({...selectedCampaign, date: e.target.value})}
                  required 
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditCampaignDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <Dialog open={showDeleteCampaignDialog} onOpenChange={setShowDeleteCampaignDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {campaignToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Tem certeza que deseja excluir a campanha:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-gray-900">{campaignToDelete.title}</p>
                <p className="text-sm text-gray-600">{campaignToDelete.subtitle}</p>
                {campaignToDelete.sent && (
                  <p className="text-xs text-gray-500 mt-2">
                    {campaignToDelete.sent.toLocaleString()} doadores impactados
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteCampaignDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDeleteCampaign}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={showEditPermissionDialog} onOpenChange={setShowEditPermissionDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Grupo de Permissões
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do grupo de permissões
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <form onSubmit={handleUpdatePermission} className="space-y-4">
              <div>
                <Label>Nome do Grupo</Label>
                <Input 
                  value={selectedPermission.name}
                  onChange={(e) => setSelectedPermission({...selectedPermission, name: e.target.value})}
                  required 
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <Textarea 
                  value={selectedPermission.description}
                  onChange={(e) => setSelectedPermission({...selectedPermission, description: e.target.value})}
                  rows={3}
                  required 
                />
              </div>

              <div>
                <Label className="mb-3 block">Permissões</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {['view_donors', 'register_donations', 'view_schedule', 'manage_stock', 'view_reports', 'manage_users', 'all_hemocentro', 'system_admin'].map((perm) => (
                    <div key={perm} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${perm}`}
                        checked={selectedPermission.permissions.includes(perm)}
                        onChange={(e) => {
                          const newPerms = e.target.checked
                            ? [...selectedPermission.permissions, perm]
                            : selectedPermission.permissions.filter((p: string) => p !== perm);
                          setSelectedPermission({...selectedPermission, permissions: newPerms});
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-${perm}`} className="text-sm cursor-pointer">
                        {perm.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditPermissionDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <Dialog open={showDeletePermissionDialog} onOpenChange={setShowDeletePermissionDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {permissionToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Tem certeza que deseja excluir o grupo de permissões:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-gray-900">{permissionToDelete.name}</p>
                <p className="text-sm text-gray-600">{permissionToDelete.description}</p>
                <p className="text-xs text-red-600 font-semibold mt-2">
                  ⚠️ {permissionToDelete.users} usuários atualmente neste grupo
                </p>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Atenção:</strong> Os usuários deste grupo perderão suas permissões. Reatribua-os a outro grupo antes de excluir.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePermissionDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDeletePermission}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Details Dialog */}
      <Dialog open={showStockDetailsDialog} onOpenChange={setShowStockDetailsDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Droplet className="h-6 w-6 text-red-600" />
              </div>
              Detalhes do Estoque - Tipo {selectedBloodTypeForDetails}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre distribuição, histórico e estatísticas
            </DialogDescription>
          </DialogHeader>

          {selectedBloodTypeForDetails && stockDetailsByType[selectedBloodTypeForDetails] && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Consumo Diário</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stockDetailsByType[selectedBloodTypeForDetails].stats.avgDailyConsumption}</p>
                    <p className="text-xs text-gray-600">bolsas/dia</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Dias até Crítico</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${stockDetailsByType[selectedBloodTypeForDetails].stats.daysUntilCritical <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                      {stockDetailsByType[selectedBloodTypeForDetails].stats.daysUntilCritical}
                    </p>
                    <p className="text-xs text-gray-600">dias restantes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Doações/Mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{stockDetailsByType[selectedBloodTypeForDetails].stats.totalDonationsMonth}</p>
                    <p className="text-xs text-gray-600">este mês</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Última Doação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-bold">{stockDetailsByType[selectedBloodTypeForDetails].stats.lastDonation.split(' ')[1]}</p>
                    <p className="text-xs text-gray-600">{stockDetailsByType[selectedBloodTypeForDetails].stats.lastDonation.split(' ')[0]}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution by Hemocentro */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Distribuição por Hemocentro
                </h3>
                <div className="space-y-2">
                  {stockDetailsByType[selectedBloodTypeForDetails].distribution.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{item.hemocentro}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{item.stock} bolsas</span>
                            <Badge variant="outline" className="text-xs">{item.percentage}%</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* History Chart */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Histórico dos Últimos 5 Dias
                </h3>
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stockDetailsByType[selectedBloodTypeForDetails].history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="stock" stroke="#16A34A" strokeWidth={2} name="Estoque" />
                        <Line type="monotone" dataKey="entries" stroke="#2563EB" strokeWidth={2} name="Entradas" />
                        <Line type="monotone" dataKey="exits" stroke="#DC2626" strokeWidth={2} name="Saídas" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Historical Data Table */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Movimentação Detalhada
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Data</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Estoque</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Entradas</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Saídas</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Variação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stockDetailsByType[selectedBloodTypeForDetails].history.map((item: any, index: number) => {
                        const variation = item.entries - item.exits;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{item.date}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{item.stock}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600">+{item.entries}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">-{item.exits}</td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variation >= 0 ? '+' : ''}{variation}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alerts */}
              {stockDetailsByType[selectedBloodTypeForDetails].stats.daysUntilCritical <= 2 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Alerta de Estoque Crítico</p>
                      <p className="text-sm text-red-700 mt-1">
                        Este tipo sanguíneo está próximo do nível crítico. 
                        Recomenda-se iniciar campanha de doação urgente para o tipo {selectedBloodTypeForDetails}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStockDetailsDialog(false)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowStockDetailsDialog(false);
                handleOpenUpdateStock(selectedBloodTypeForDetails);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Activity className="h-4 w-4 mr-2" />
              Atualizar Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Relatório do Sistema</DialogTitle>
            <DialogDescription>
              Selecione o tipo e formato do relatório para exportação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="donations">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Relatório de Doações</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="stock">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      <span>Relatório de Estoque Global</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="users">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Relatório de Usuários</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="campaigns">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Relatório de Campanhas</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hemocentros">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Relatório de Hemocentros</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato de Exportação</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span>PDF</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span>Excel (.xlsx)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>CSV</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-sm text-gray-600">
              <p>
                O relatório será gerado com os dados atualizados até o momento e baixado automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReportDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleExportReport}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
