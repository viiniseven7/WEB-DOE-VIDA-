import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/dialog';
import { buildDashboardNotifications } from '../../services/dashboard-notifications';
import {
  Droplet, Users, LogOut, Bell, Building2, Shield, Mail, MessageSquare,
  Send, Plus, Settings, BarChart3, Globe, UserPlus, Edit, Trash2, Activity,
  Minus, Search, Download, Eye, CheckCircle2, XCircle, Filter, Brain, Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- Tipos -------------------------------------------------------------------

interface Hemocentro {
  id: number;
  nome: string;
  cidade?: string;
  uf?: string;
  status: number; // 1 = ativo, 0 = inativo
  telefone?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role_id: number;
  hemocentro_id?: number;
  status: number;
  cpf?: string;
  telefone?: string;
  hemocentro?: Hemocentro;
}


const systemStats = [
  { month: 'Jan', total: 1245, hc1: 245, hc2: 198, hc3: 245, hc4: 176 },
  { month: 'Fev', total: 1389, hc1: 289, hc2: 212, hc3: 267, hc4: 189 },
  { month: 'Mar', total: 1486, hc1: 325, hc2: 198, hc3: 245, hc4: 176 },
];

const emptyAdminStats = {
  total_hemocentros:      0,
  total_usuarios:         0,
  taxa_comparecimento:    0,
  doacoes_por_hemocentro: [] as Array<{ hemocentro_id: number; hemocentro: string; total: number }>,
  estoque_global:         {} as Record<string, number>,
  doacoes_por_mes:        [] as Array<{ mes: string; total: number }>,
  doacoes_por_tipo:       {} as Record<string, number>,
};

const roleLabels: Record<number, string> = { 1: 'Doador', 2: 'Funcionário', 3: 'Diretor', 4: 'Admin' };
const roleNames: Record<string, string> = { '1': 'doador', '2': 'funcionario', '3': 'diretor', '4': 'admin' };
const systemRoleNames = new Set(['doador', 'funcionario', 'diretor', 'admin', 'enfermeiro']);
const ML_API_URL = import.meta.env.VITE_ML_URL ?? 'http://localhost:8001';

const formatDateInput = (date: Date) => {
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateInput = (value?: string) => {
  if (!value) return '';

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsed = new Date(value);
  return formatDateInput(parsed);
};

const addDaysToDateInput = (dateInput: string, days: number) => {
  const normalizedDate = normalizeDateInput(dateInput);
  if (!normalizedDate) return '';

  const date = new Date(`${normalizedDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
};

const validateCampaignDates = (dataPubli?: string, dataExpiracao?: string) => {
  const publicationInput = String(dataPubli || '');
  const expirationInput = String(dataExpiracao || '');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(publicationInput)) {
    return 'Informe a data de publicação no formato AAAA-MM-DD.';
  }

  const publicationDate = normalizeDateInput(dataPubli);
  const expirationDate = normalizeDateInput(dataExpiracao);

  if (!publicationDate) {
    return 'Informe uma data de publicação válida.';
  }

  const publicationYear = publicationDate.slice(0, 4);
  if (!/^\d{4}$/.test(publicationYear)) {
    return 'O ano da data de publicação deve ter exatamente 4 dígitos.';
  }

  const publicationYearNumber = Number(publicationYear);
  if (publicationYearNumber < 2000 || publicationYearNumber > 2100) {
    return 'O ano informado deve estar entre 2000 e 2100.';
  }

  const today = formatDateInput(new Date());
  if (publicationDate < today) {
    return 'A data de publicação não pode ser anterior a hoje.';
  }

  if (!expirationInput) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationInput)) {
    return 'Informe a data de expiração no formato AAAA-MM-DD.';
  }

  const expirationYear = expirationDate.slice(0, 4);
  if (!/^\d{4}$/.test(expirationYear)) {
    return 'O ano da data de expiração deve ter exatamente 4 dígitos.';
  }

  const expirationYearNumber = Number(expirationYear);
  if (expirationYearNumber < 2000 || expirationYearNumber > 2100) {
    return 'O ano informado deve estar entre 2000 e 2100.';
  }

  if (expirationDate < today) {
    return 'A data de expiração não pode ser anterior a hoje.';
  }

  if (expirationDate <= publicationDate) {
    return 'A data de expiração deve ser em um dia posterior à data de publicação.';
  }

  return null;
};

const DEFAULT_PERMISSIONS: Record<string, Record<string, string>> = {
  'Agendamentos': {
    ver_agendamentos:       'Ver agendamentos',
    criar_agendamentos:     'Criar agendamentos',
    confirmar_agendamentos: 'Confirmar / reabrir agendamentos',
    cancelar_agendamentos:  'Cancelar agendamentos',
  },
  'Doações': {
    ver_doacoes:       'Ver doações',
    registrar_doacoes: 'Registrar doações',
  },
  'Triagem': {
    ver_triagens:      'Ver triagens',
    registrar_triagem: 'Registrar triagem clínica',
  },
  'Estoque': {
    ver_estoque:       'Ver estoque',
    gerenciar_estoque: 'Gerenciar estoque',
  },
  'Alertas Médicos': {
    ver_alertas_medicos:       'Ver alertas médicos',
    gerenciar_alertas_medicos: 'Criar / editar alertas médicos',
  },
  'Usuários': {
    ver_usuarios:     'Ver usuários',
    criar_usuarios:   'Criar usuários',
    excluir_usuarios: 'Excluir usuários',
  },
  'Hemocentros': {
    ver_hemocentros:       'Ver hemocentros',
    gerenciar_hemocentros: 'Gerenciar hemocentros',
  },
  'Campanhas': {
    ver_campanhas:       'Ver campanhas',
    gerenciar_campanhas: 'Criar / editar campanhas',
    disparar_campanhas:  'Disparar campanhas',
  },
  'Estatísticas': {
    ver_estatisticas_hemocentro: 'Ver estatísticas do hemocentro',
    ver_estatisticas_globais:    'Ver estatísticas globais',
  },
  'Relatórios': {
    exportar_relatorios: 'Exportar relatórios PDF',
  },
};

// --- Componente --------------------------------------------------------------

export function AdminDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();
  const todayDateInput = formatDateInput(new Date());

  // -- Estado: dados da API
  const [hemocentros, setHemocentros] = useState<Hemocentro[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [doacoes, setDoacoes] = useState<any[]>([]);
  const [stats, setStats] = useState(emptyAdminStats);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // -- Estado: campanhas
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [disparandoCampaignId, setDisparandoCampaignId] = useState<string | number | null>(null);
  const [disparoResultado, setDisparoResultado] = useState<any>(null);
  const [globalStock, setGlobalStock] = useState<any[]>([]);

  // -- Estado: roles
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, Record<string, string>>>(DEFAULT_PERMISSIONS);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as string[] });

  // -- Estado: dialogs
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showHemocentroDialog, setShowHemocentroDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showStockDetailsDialog, setShowStockDetailsDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showViewHemocentroDialog, setShowViewHemocentroDialog] = useState(false);
  const [showEditHemocentroDialog, setShowEditHemocentroDialog] = useState(false);
  const [showEditCampaignDialog, setShowEditCampaignDialog] = useState(false);
  const [showDeleteCampaignDialog, setShowDeleteCampaignDialog] = useState(false);

  // -- Estado: formulários / seleções
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [selectedBloodTypeForDetails, setSelectedBloodTypeForDetails] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [selectedHemocentro, setSelectedHemocentro] = useState<Hemocentro | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportPeriod, setReportPeriod] = useState('30');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportBloodType, setReportBloodType] = useState('todos');
  const [chartPeriod, setChartPeriod] = useState('30');
  const [chartStartDate, setChartStartDate] = useState('');
  const [chartEndDate, setChartEndDate] = useState('');
  const [chartBloodType, setChartBloodType] = useState('todos');
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [mlRecsLoading, setMlRecsLoading] = useState(false);
  const [mlRecs, setMlRecs] = useState<any[]>([]);
  const [mlPreview, setMlPreview] = useState<any>(null);
  const [mlStatus, setMlStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearchPerformed, setUserSearchPerformed] = useState(false);

  // -- Formulário: novo hemocentro
  const [hcForm, setHcForm] = useState({ nome: '', cidade: '', uf: 'PR', endereco: '', numero: '', bairro: '', cep: '', telefone: '', email: '' });

  // -- Formulário: novo usuário
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', cpf: '', role_id: '2', hemocentro_id: '' });

  // -- Formulário: nova campanha
  const [campaignForm, setCampaignForm] = useState({
    titulo: '',
    subtitulo: '',
    descricao: '',
    tipo_sangue: '',
    data_publi: '',
    data_expiracao: '',
  });
  const campaignExpirationMinDate = campaignForm.data_publi
    ? addDaysToDateInput(campaignForm.data_publi, 1) || todayDateInput
    : todayDateInput;

  // --- Guard ------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role_id !== 4 && !user.roles?.includes('admin')) {
      navigate('/login');
    }
  }, [user, navigate]);

  // --- Fetch inicial ----------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [hcRes, usersRes, doacoesRes, stockRes, statsRes, campanhasRes] = await Promise.all([
        api.get('/hemocentros'),
        api.get('/users'),
        api.get('/doacoes'),
        api.get('/estoque'),
        api.get('/estatisticas/admin'),
        api.get('/campanhas'),
      ]);

      setHemocentros(Array.isArray(hcRes.data) ? hcRes.data : hcRes.data.data ?? []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data ?? []);
      setDoacoes(Array.isArray(doacoesRes.data) ? doacoesRes.data : doacoesRes.data.data ?? []);

      // Agrega estoque globalmente
      const allStock = Array.isArray(stockRes.data) ? stockRes.data : stockRes.data.data ?? [];
      const aggregated = allStock.reduce((acc: any[], curr: any) => {
        const existing = acc.find((item: any) => item.tipo_sangue === curr.tipo_sangue);
        if (existing) {
          existing.quantidade += Number(curr.quantidade);
          existing.quantidade_minima += Number(curr.quantidade_minima || 0);
        } else {
          acc.push({
            tipo_sangue: curr.tipo_sangue,
            quantidade: Number(curr.quantidade),
            quantidade_minima: Number(curr.quantidade_minima || 0)
          });
        }
        return acc;
      }, []);

      setGlobalStock(aggregated.map((s: any) => ({
        type: s.tipo_sangue,
        current: s.quantidade,
        min: s.quantidade_minima,
        critical: s.quantidade < s.quantidade_minima
      })));
      setStats({ ...emptyAdminStats, ...statsRes.data });
      setCampaigns(
        Array.isArray(campanhasRes.data)
          ? campanhasRes.data
          : campanhasRes.data?.data ?? []
      );
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err.response?.data);
      toast.error('Erro ao carregar dados do painel');
    } finally {
      setIsLoading(false);
    }

    try {
      const rolesRes = await api.get('/roles');
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.data ?? []);
    } catch (err) {
      console.warn('Roles não carregadas da API:', err);
    }

    try {
      const permsRes = await api.get('/permissions');
      setAllPermissions(permsRes.data ?? DEFAULT_PERMISSIONS);
    } catch (err) {
      console.warn('Permissões não carregadas da API, usando padrão:', err);
      setAllPermissions(DEFAULT_PERMISSIONS);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user || (user.role_id !== 4 && !user.roles?.includes('admin'))) return null;

  const handleLogoutClick = () => { logout(); navigate('/'); toast.success('Logout realizado'); };

  // --- Hemocentros ------------------------------------------------------------
  const handleCreateHemocentro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/hemocentros', { ...hcForm, status: 1 });
      toast.success('Hemocentro criado com sucesso!');
      setShowHemocentroDialog(false);
      setHcForm({ nome: '', cidade: '', uf: 'PR', endereco: '', numero: '', bairro: '', cep: '', telefone: '', email: '' });
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao criar hemocentro');
    }
  };

  const handleUpdateHemocentro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHemocentro) return;
    try {
      await api.put(`/auth/hemocentros/${selectedHemocentro.id}`, selectedHemocentro);
      toast.success('Hemocentro atualizado!');
      setShowEditHemocentroDialog(false);
      setSelectedHemocentro(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar hemocentro');
    }
  };

  const handleToggleHemocentroStatus = async (hc: Hemocentro) => {
    try {
      const novoStatus = hc.status === 1 ? 0 : 1;
      await api.put(`/auth/hemocentros/${hc.id}`, { status: novoStatus });
      toast.success(`Hemocentro ${novoStatus === 1 ? 'ativado' : 'desativado'}!`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao alterar status');
    }
  };

  // --- Usuários ---------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoleObj = roles.find(r => String(r.id) === newUserForm.role_id);
      const payload: any = {
        ...newUserForm,
        cpf: newUserForm.cpf.replace(/\D/g, ''),
        role: selectedRoleObj?.name || roleNames[newUserForm.role_id],
        role_id: Number(newUserForm.role_id)
      };
      if (newUserForm.hemocentro_id) payload.hemocentro_id = Number(newUserForm.hemocentro_id);

      await api.post('/auth/users', payload);
      toast.success('Usuário criado com sucesso!');
      setShowUserDialog(false);
      setNewUserForm({ name: '', email: '', password: '', cpf: '', role_id: '2', hemocentro_id: '' });
      fetchData();
    } catch (err: any) {
      const erros = err.response?.data?.errors;
      if (erros) {
        toast.error(Object.values(erros).flat().join('\n'));
      } else {
        toast.error(err.response?.data?.message || 'Erro ao criar usuário');
      }
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const payload: any = {
        name: selectedUser.name,
        email: selectedUser.email,
        role_id: selectedUser.role_id,
        role: roles.find(r => r.id === selectedUser.role_id)?.name || roleNames[String(selectedUser.role_id)],
        status: selectedUser.status
      };
      if (selectedUser.hemocentro_id) payload.hemocentro_id = selectedUser.hemocentro_id;

      await api.put(`/users/${selectedUser.id}`, payload);
      toast.success('Usuário atualizado!');
      setShowEditUserDialog(false);
      setSelectedUser(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success('Usuário removido!');
      setShowDeleteUserDialog(false);
      setUserToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao remover usuário');
    }
  };

  const handleToggleUserStatus = async (userItem: UserItem) => {
    try {
      const novoStatus = userItem.status === 1 ? 0 : 1;
      await api.put(`/users/${userItem.id}`, { status: novoStatus });
      toast.success('Status atualizado!');
      fetchData();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleSearchUsers = () => {
    const hasSearch = userSearchTerm.trim().length > 0;
    const hasRoleFilter = userRoleFilter !== 'all';
    const hasStatusFilter = userStatusFilter !== 'all';

    if (!hasSearch && !hasRoleFilter && !hasStatusFilter) {
      setUserSearchPerformed(false);
      return;
    }

    setUserSearchPerformed(true);
  };

  const handleClearUserSearch = () => {
    setUserSearchTerm('');
    setUserRoleFilter('all');
    setUserStatusFilter('all');
    setUserSearchPerformed(false);
  };

  // --- Estoque (API) ----------------------------------------------------------
  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setShowStockDialog(true);
  };

  const handleUpdateStock = async () => {
    if (!stockAmount || parseInt(stockAmount) <= 0) { toast.error('Digite uma quantidade válida'); return; }
    const amount = parseInt(stockAmount);
    const valueToSend = stockAction === 'add' ? amount : -amount;

    // Admin usa o primeiro hemocentro se não houver um vinculado
    const targetHemocentroId = user.hemocentro_id || (hemocentros.length > 0 ? hemocentros[0].id : null);

    if (!targetHemocentroId) {
      toast.error('Nenhum hemocentro disponível para atualizar estoque');
      return;
    }

    try {
      await api.post('/auth/estoque', {
        hemocentro_id: targetHemocentroId,
        tipo_sangue: selectedBloodType,
        quantidade: valueToSend,
      });

      toast.success(`${amount} bolsas ${stockAction === 'add' ? 'adicionadas' : 'removidas'} - ${selectedBloodType}`);
      setShowStockDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar estoque: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };


  // --- Campanhas (API) --------------------------------------------------------
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    const campaignDateError = validateCampaignDates(campaignForm.data_publi, campaignForm.data_expiracao);
    if (campaignDateError) {
      toast.error(campaignDateError);
      return;
    }

    try {
      await api.post('/auth/campanhas', {
        titulo:         campaignForm.titulo,
        subtitulo:      campaignForm.subtitulo || undefined,
        descricao:      campaignForm.descricao || undefined,
        tipo_sangue:    campaignForm.tipo_sangue || undefined,
        data_publi:     campaignForm.data_publi,
        data_expiracao: campaignForm.data_expiracao || undefined,
      });
      toast.success('Campanha criada com sucesso!');
      setShowCampaignDialog(false);
      setCampaignForm({ titulo: '', subtitulo: '', descricao: '', tipo_sangue: '', data_publi: '', data_expiracao: '' });
      fetchData();
    } catch (err: any) {
      const erros = err.response?.data?.errors;
      toast.error(erros ? Object.values(erros).flat().join('\n') : 'Erro ao criar campanha');
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await api.put(`/auth/campanhas/${selectedCampaign.id}`, {
        titulo:         selectedCampaign.titulo,
        subtitulo:      selectedCampaign.subtitulo,
        descricao:      selectedCampaign.descricao,
        tipo_sangue:    selectedCampaign.tipo_sangue,
        data_publi:     selectedCampaign.data_publi,
        data_expiracao: selectedCampaign.data_expiracao,
        status:         selectedCampaign.status,
      });
      toast.success('Campanha atualizada!');
      setShowEditCampaignDialog(false);
      setSelectedCampaign(null);
      fetchData();
    } catch {
      toast.error('Erro ao atualizar campanha');
    }
  };

  const handleConfirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      await api.delete(`/auth/campanhas/${campaignToDelete.id}`);
      toast.success('Campanha removida!');
      setShowDeleteCampaignDialog(false);
      setCampaignToDelete(null);
      fetchData();
    } catch {
      toast.error('Erro ao remover campanha');
    }
  };

  const handleDispararCampaign = async (campanha: any) => {
    setDisparandoCampaignId(campanha.id);
    setDisparoResultado(null);
    try {
      const res = await api.post(`/auth/campanhas/${campanha.id}/disparar`);
      setDisparoResultado({ ...res.data, campanha_id: res.data.campanha_id ?? campanha.id });
      toast.success(`Campanha disparada para ${res.data.total_disparado} doadores!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao disparar campanha');
    } finally {
      setDisparandoCampaignId(null);
    }
  };

  const handleBuscarRecomendacoesMl = async () => {
    setMlStatus('loading');
    setMlRecsLoading(true);
    try {
      let doadores: any[] = [];
      try {
        const doadoresRes = await api.get('/auth/doadores/perfil-rfmt');
        doadores = Array.isArray(doadoresRes.data?.data)
          ? doadoresRes.data.data
          : Array.isArray(doadoresRes.data)
          ? doadoresRes.data
          : [];
      } catch (err: any) {
        if (err.response?.status !== 404) {
          throw err;
        }

        const doadoresRes = await api.get('/users');
        const todosUsers = Array.isArray(doadoresRes.data)
          ? doadoresRes.data
          : doadoresRes.data?.data ?? [];
        doadores = todosUsers
          .filter((u: any) => u.role_id === 1 || u.roles?.includes('doador'))
          .map((u: any) => ({
            ...u,
            recencia_meses:              6,
            frequencia_doacoes:          1,
            volume_total_cc:             450,
            tempo_desde_primeira_doacao: 12,
            risco_inatividade:           'Atencao',
          }));
      }

      if (doadores.length === 0) {
        toast.error('Nenhum doador encontrado para análise.');
        setMlStatus('error');
        return;
      }

      const BATCH = 20;
      const resultados: any[] = [];
      for (let i = 0; i < Math.min(doadores.length, 100); i += BATCH) {
        const lote = doadores.slice(i, i + BATCH);
        const promises = lote.map(async (d: any) => {
          const toNum = (v: any, fallback: number) => {
            const n = Number(v);
            return (!isNaN(n) && n >= 0) ? n : fallback;
          };
          const payload = {
            recencia_meses:               toNum(d.recencia_meses,              6),
            frequencia_doacoes:           toNum(d.frequencia_doacoes,          1),
            volume_total_cc:              toNum(d.volume_total_cc,             450),
            tempo_desde_primeira_doacao:  toNum(d.tempo_desde_primeira_doacao, 12),
            risco_inatividade:            ['Ativo','Atencao','Em_Risco','Inativo'].includes(d.risco_inatividade)
                                          ? d.risco_inatividade
                                          : 'Atencao',
          };

          try {
            const [retRes, volRes] = await Promise.all([
              fetch(`${ML_API_URL}/predizer/retorno`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              }).then(r => r.json()),
              fetch(`${ML_API_URL}/predizer/volume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              }).then(r => r.json()),
            ]);

            return { doador: d, retorno: retRes, volume: volRes };
          } catch {
            return null;
          }
        });
        const loteRes = await Promise.all(promises);
        resultados.push(...loteRes.filter(Boolean));
      }

      const elegiveis = resultados.length;
      const vaiRetornar = resultados.filter(r => r.retorno?.vai_retornar).length;
      const volumeTotal = resultados
        .filter(r => r.retorno?.vai_retornar)
        .reduce((acc, r) => acc + (r.volume?.volume_estimado_cc ?? 450), 0);

      setMlPreview({
        total_elegiveis: elegiveis,
        segmentados_ml: vaiRetornar,
        pct_ml: elegiveis > 0 ? Math.round((vaiRetornar / elegiveis) * 100) : 0,
        retorno_estimado: vaiRetornar,
        volume_estimado_litros: Math.round(volumeTotal / 1000),
      });

      const campanhasParticipadas = campaigns
        .filter(c => c.total_disparado > 0)
        .map(c => c.titulo);

      const recRes = await fetch(`${ML_API_URL}/recomendar/campanhas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campanhas_participadas: campanhasParticipadas,
          n_recomendacoes: 3,
        }),
      }).then(r => r.json());

      const recsEnriquecidas = (recRes.recomendacoes ?? []).map((rec: any) => {
        const contextMap: Record<string, { motivo: string; estimativa: number }> = {
          Campanha_Urgencia_O_Negativo: { motivo: 'Estoque crítico detectado', estimativa: Math.floor(vaiRetornar * 0.15) },
          Campanha_Doacao_Regular_Mensal: { motivo: 'Doadores frequentes disponíveis', estimativa: Math.floor(vaiRetornar * 0.35) },
          Campanha_Semana_do_Doador: { motivo: 'Alta taxa de engajamento esperada', estimativa: Math.floor(vaiRetornar * 0.28) },
          Campanha_Doacao_Hospitais_Publicos: { motivo: 'Demanda hospitalar identificada', estimativa: Math.floor(vaiRetornar * 0.22) },
          Campanha_Reativacao_Inativos: { motivo: `${resultados.filter(r => !r.retorno?.vai_retornar).length} doadores inativos identificados`, estimativa: Math.floor(vaiRetornar * 0.12) },
          Campanha_Primeira_Doacao: { motivo: 'Novos cadastros sem doação', estimativa: Math.floor(vaiRetornar * 0.10) },
          Campanha_Doador_VIP_Exclusiva: { motivo: 'Perfis VIP com alta frequência', estimativa: Math.floor(vaiRetornar * 0.08) },
          Campanha_Tipo_A_Positivo: { motivo: 'Tipo A+ com doadores elegíveis', estimativa: Math.floor(vaiRetornar * 0.18) },
        };
        const ctx = contextMap[rec.campanha] ?? { motivo: 'Perfil dos doadores compatível', estimativa: Math.floor(vaiRetornar * 0.15) };

        return {
          ...rec,
          nome_legivel: rec.campanha.replace('Campanha_', '').replace(/_/g, ' '),
          motivo: ctx.motivo,
          estimativa_doacoes: ctx.estimativa,
          score_pct: Math.round(rec.score_relevancia * 100),
        };
      });

      setMlRecs(recsEnriquecidas);
      setMlStatus('ready');
      toast.success('Análise ML concluída!');
    } catch (err) {
      console.error('Erro ML:', err);
      setMlStatus('error');
      toast.error('Não foi possível conectar com a API de ML. Verifique se o servidor está rodando.');
    } finally {
      setMlRecsLoading(false);
    }
  };

  const handleUsarRecomendacao = (rec: any) => {
    setCampaignForm({
      titulo: rec.nome_legivel,
      subtitulo: rec.motivo,
      descricao: `Campanha recomendada pelo sistema de inteligência artificial com base no perfil atual dos doadores. Score de relevância: ${rec.score_pct}%.`,
      tipo_sangue: '',
      data_publi: new Date().toISOString().split('T')[0],
      data_expiracao: '',
    });
    setShowCampaignDialog(true);
  };

  const formatDatePt = (date: Date) => date.toLocaleDateString('pt-BR');

  const resolvePeriodFilter = (period: string, startDate?: string, endDate?: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    if (period === 'all') {
      return { start: null as Date | null, end: null as Date | null, label: 'Período completo' };
    }

    if (period === 'previous_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `Mês anterior (${formatDatePt(start)} a ${formatDatePt(end)})` };
    }

    if (period === 'custom' && startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);
      return { start, end, label: `${formatDatePt(start)} a ${formatDatePt(end)}` };
    }

    const days = Number(period) || 30;
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - days);
    return { start, end: today, label: `Últimos ${days} dias (${formatDatePt(start)} a ${formatDatePt(today)})` };
  };

  const isDateInPeriod = (value: any, periodInfo: { start: Date | null; end: Date | null }) => {
    if (!periodInfo.start && !periodInfo.end) return true;
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    if (periodInfo.start && date < periodInfo.start) return false;
    if (periodInfo.end && date > periodInfo.end) return false;
    return true;
  };


  // --- Roles (API) ------------------------------------------------------------
  const togglePermission = (permName: string, currentPerms: string[], setter: (p: string[]) => void) => {
    setter(
      currentPerms.includes(permName)
        ? currentPerms.filter(p => p !== permName)
        : [...currentPerms, permName]
    );
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleName = roleForm.name.trim().toLowerCase();
    if (systemRoleNames.has(roleName)) {
      toast.error('Este cargo é padrão do sistema e não pode ser criado pelo dashboard');
      return;
    }

    try {
      await api.post('/auth/roles', { name: roleName, permissions: roleForm.permissions });
      toast.success('Cargo criado com sucesso!');
      setShowRoleDialog(false);
      setRoleForm({ name: '', permissions: [] });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar cargo');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (selectedRole.sistema || systemRoleNames.has(selectedRole.name)) {
      toast.error('Cargos padrão do sistema não podem ser alterados');
      return;
    }

    try {
      await api.put(`/auth/roles/${selectedRole.id}`, {
        name: selectedRole.name.trim().toLowerCase(),
        permissions: selectedRole.permissions ?? [],
      });
      toast.success('Cargo atualizado!');
      setShowEditRoleDialog(false);
      setSelectedRole(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar cargo');
    }
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    if (roleToDelete.sistema || systemRoleNames.has(roleToDelete.name)) {
      toast.error('Cargos padrão do sistema não podem ser removidos');
      return;
    }

    try {
      await api.delete(`/auth/roles/${roleToDelete.id}`);
      toast.success('Cargo removido!');
      setShowDeleteRoleDialog(false);
      setRoleToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover cargo');
    }
  };

  // --- Relatório ---------------------------------------------------------------
  const handleExportReport = async () => {
    if (!reportType) { toast.error('Selecione um tipo de relatório'); return; }
    if (reportPeriod === 'custom' && (!reportStartDate || !reportEndDate)) {
      toast.error('Informe a data inicial e final do período');
      return;
    }

    const endpoints: Record<string, string> = {
      doacoes:      '/relatorios/doacoes/pdf',
      estoque:      '/relatorios/estoque/pdf',
      doadores:     '/relatorios/doadores/pdf',
      agendamentos: '/relatorios/agendamentos/pdf',
      triagens:     '/relatorios/triagens/pdf',
      desempenho:   '/relatorios/desempenho/pdf',
    };

    const nomes: Record<string, string> = {
      doacoes:      'doacoes',
      estoque:      'estoque',
      doadores:     'doadores',
      agendamentos: 'agendamentos',
      triagens:     'triagens',
      desempenho:   'desempenho',
    };

    const endpoint = endpoints[reportType];
    if (!endpoint) { toast.error('Tipo não disponível'); return; }
    const reportPeriodInfo = resolvePeriodFilter(reportPeriod, reportStartDate, reportEndDate);
    const params = new URLSearchParams();
    params.set('periodo', reportPeriod);
    params.set('periodo_label', reportPeriodInfo.label);
    if (reportPeriodInfo.start) params.set('data_inicio', formatDateInput(reportPeriodInfo.start));
    if (reportPeriodInfo.end) params.set('data_fim', formatDateInput(reportPeriodInfo.end));
    if (reportBloodType !== 'todos') params.set('tipo_sangue', reportBloodType);

    setIsDownloadingReport(true);
    toast.info('Gerando relatório PDF...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${nomes[reportType]}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório gerado com sucesso!');
      setShowReportDialog(false);
      setReportType('');
    } catch {
      toast.error('Erro ao gerar relatório. Verifique se o servidor está rodando.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // --- Computados -------------------------------------------------------------
  const hemocentrosAtivos = hemocentros.filter(h => h.status === 1);
  const totalDonors = users.filter(u => Number(u.role_id) === 1).length;
  const hemocentroNomeResolvido =
    user?.hemocentro?.nome ||
    user?.hemocentroName ||
    hemocentros.find((hemocentro) => Number(hemocentro.id) === Number(user?.hemocentro_id))?.nome ||
    '';
  const hemocentroNome = hemocentroNomeResolvido
    ? `Hemocentro ${hemocentroNomeResolvido}`
    : 'Todos os hemocentros';
  const notifications = useMemo(() => buildDashboardNotifications({
    hemocentroId: user?.hemocentro_id ? Number(user.hemocentro_id) : null,
    doacoes,
    users,
    hemocentros,
  }), [user?.hemocentro_id, doacoes, users, hemocentros]);
  const notificationsKey = notifications.map((notification) => `${notification.id}:${notification.timeLabel}`).join('|');

  useEffect(() => {
    setHasUnreadNotifications(notifications.length > 0);
  }, [notificationsKey]);

  const filteredUsers = users.filter(u => {
    const normalizedSearch = userSearchTerm.trim().toLowerCase();
    const cleanCpfSearch = userSearchTerm.replace(/\D/g, '');
    const matchesSearch =
      normalizedSearch.length === 0 ||
      u.name?.toLowerCase().includes(normalizedSearch) ||
      u.email?.toLowerCase().includes(normalizedSearch) ||
      (cleanCpfSearch.length > 0 && (u.cpf || '').replace(/\D/g, '').includes(cleanCpfSearch));
    const matchesRole =
      userRoleFilter === 'all' || String(u.role_id) === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'all' ||
      (userStatusFilter === 'ativo' && Number(u.status) === 1) ||
      (userStatusFilter === 'inativo' && Number(u.status) === 0);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const chartPeriodInfo = resolvePeriodFilter(chartPeriod, chartStartDate, chartEndDate);
  const selectedBloodTypeLabel = chartBloodType === 'todos' ? 'Todos os tipos sanguíneos' : chartBloodType;
  const filteredDoacoesForCharts = doacoes.filter((d: any) => {
    const matchesDate = isDateInPeriod(d.data_hora_doacao || d.data_doacao || d.created_at, chartPeriodInfo);
    const matchesType = chartBloodType === 'todos' || d.tipo_sangue === chartBloodType || d.tipo_sang === chartBloodType;
    return matchesDate && matchesType;
  });

  const doacoesPorTipoData = Object.entries(stats.doacoes_por_tipo || {})
    .map(([tipo, total]) => ({ tipo, total: Number(total) }))
    .filter(d => chartBloodType === 'todos' || d.tipo === chartBloodType)
    .sort((a, b) => b.total - a.total);

  const estoqueBarData = globalStock
    .filter(s => chartBloodType === 'todos' || s.type === chartBloodType)
    .map(s => ({ tipo: s.type, atual: s.current, minimo: s.min, critico: s.critical }));

  const stockDistribution = globalStock
    .filter(item => chartBloodType === 'todos' || item.type === chartBloodType)
    .map(item => ({
    name: item.type,
    value: item.current,
    color: item.critical ? '#DC2626' : item.current < item.min * 1.5 ? '#EA580C' : '#16A34A',
  }));
  const donationsByHemocentro = filteredDoacoesForCharts.length
    ? Object.values(filteredDoacoesForCharts.reduce((acc: Record<string, { hemocentro: string; total: number }>, item: any) => {
        const nome = item.hemocentro?.nome || item.hemocentro || `Hemocentro ${item.hemocentro_id ?? 'N/D'}`;
        acc[nome] = acc[nome] || { hemocentro: nome, total: 0 };
        acc[nome].total += 1;
        return acc;
      }, {}))
    : [];
  const monthlySystemStats = filteredDoacoesForCharts.length
    ? Object.values(filteredDoacoesForCharts.reduce((acc: Record<string, { month: string; total: number }>, item: any) => {
        const rawDate = item.data_hora_doacao || item.data_doacao || item.created_at;
        const date = rawDate ? new Date(rawDate) : null;
        if (!date || Number.isNaN(date.getTime())) return acc;
        const month = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        acc[month] = acc[month] || { month, total: 0 };
        acc[month].total += 1;
        return acc;
      }, {}))
    : [];
  const monthlyAreaData = (stats.doacoes_por_mes || []).length > 0
    ? (stats.doacoes_por_mes || []).map((item: any) => ({ mes: item.mes, total: item.total }))
    : monthlySystemStats.map((item: any) => ({ mes: item.month, total: item.total }));
  const doacoesMesAtual = stats.doacoes_por_mes.length
    ? stats.doacoes_por_mes[stats.doacoes_por_mes.length - 1].total
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}>
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
              <p className="text-xs text-gray-600">Painel do Administrador</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Popover
              open={notificationsOpen}
              onOpenChange={(open) => {
                setNotificationsOpen(open);
                if (open) {
                  setHasUnreadNotifications(false);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-green-600 text-white rounded-full text-[10px] flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Atualizações recentes</p>
                  <p className="text-xs text-gray-500">{hemocentroNome}</p>
                </div>
                <div className="divide-y">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      Nenhuma atualização recente disponível.
                    </div>
                  ) : notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.description}</p>
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{notification.timeLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" onClick={() => setShowReportDialog(true)} className="gap-2">
              <Download className="h-4 w-4" /><span className="hidden md:inline">Exportar</span>
            </Button>
            <Avatar>
              <AvatarFallback className="bg-green-100 text-green-600">
                {user.name?.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-600">{hemocentroNome}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogoutClick} className="gap-2">
              <LogOut className="h-4 w-4" /><span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user.name?.split(' ')[0]}! </h2>
          <p className="text-gray-600">Visão global do sistema DoaVida</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 lg:w-auto h-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stock">Estoque Global</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="hemocentros">Hemocentros</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* -- Overview -- */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 px-1 mb-4">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />Filtros
              </span>
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="previous_month">Mês anterior</SelectItem>
                  <SelectItem value="all">Período completo</SelectItem>
                  <SelectItem value="custom">Intervalo personalizado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chartBloodType} onValueChange={setChartBloodType}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chartPeriod === 'custom' && (
                <>
                  <Input type="date" value={chartStartDate} onChange={e => setChartStartDate(e.target.value)} className="h-8 w-[140px] text-xs" />
                  <Input type="date" value={chartEndDate} onChange={e => setChartEndDate(e.target.value)} className="h-8 w-[140px] text-xs" />
                </>
              )}
              <span className="text-[11px] text-gray-400 ml-auto hidden md:block">{chartPeriodInfo.label} · {selectedBloodTypeLabel}</span>
            </div>

            {/* KPIs — 6 cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Hemocentros ativos', value: hemocentrosAtivos.length, sub: `de ${hemocentros.length} cadastrados`, color: 'border-l-green-500', Icon: Building2 },
                { label: 'Doações este mês', value: stats.doacoes_por_mes?.slice(-1)[0]?.total ?? doacoesMesAtual, sub: 'último mês fechado', color: 'border-l-blue-500', Icon: Droplet },
                { label: 'Total de doadores', value: users.filter(u => Number(u.role_id) === 1).length, sub: 'cadastrados', color: 'border-l-purple-500', Icon: Users },
                { label: 'Comparecimento', value: `${stats.taxa_comparecimento ?? 0}%`, sub: 'agendamentos → doações', color: 'border-l-emerald-500', Icon: Activity },
                { label: 'Estoque crítico', value: globalStock.filter(s => s.critical).length, sub: 'tipos abaixo do mínimo', color: globalStock.filter(s => s.critical).length > 0 ? 'border-l-red-500' : 'border-l-gray-200', Icon: AlertCircle },
                { label: 'Campanhas ativas', value: campaigns.filter((c: any) => c.status === true || c.status === 1).length, sub: 'em andamento', color: 'border-l-orange-500', Icon: Mail },
              ].map(({ label, value, sub, color, Icon }) => (
                <Card key={label} className={`border-l-4 ${color}`}>
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
                      <Icon className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{isLoading ? '—' : value}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Gráficos — linha 1 */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Doações por Hemocentro</CardTitle>
                  <CardDescription className="text-[11px]">Fonte: tabela doacao · filtrada por período · {chartPeriodInfo.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  {donationsByHemocentro.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">Nenhuma doação no período selecionado.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={donationsByHemocentro} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="hemocentro" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip formatter={(v: any) => [`${v} doações`, 'Total']} contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="total" fill="#16A34A" radius={[0, 4, 4, 0]} name="Doações" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Doações por Tipo Sanguíneo</CardTitle>
                  <CardDescription className="text-[11px]">Fonte: estatisticas/admin → doacoes_por_tipo · histórico completo</CardDescription>
                </CardHeader>
                <CardContent>
                  {doacoesPorTipoData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">Nenhum dado disponível.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={doacoesPorTipoData} margin={{ left: 0, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => [`${v} doações`, 'Total']} contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Total">
                          {doacoesPorTipoData.map((_: any, i: number) => (
                            <Cell key={i} fill={['#DC2626','#B91C1C','#2563EB','#1D4ED8','#7C3AED','#6D28D9','#059669','#047857'][i % 8]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico — evolução mensal AreaChart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Evolução de Doações — Últimos 12 meses</CardTitle>
                    <CardDescription className="text-[11px]">Fonte: estatisticas/admin → doacoes_por_mes · agrupado por mês</CardDescription>
                  </div>
                  {monthlyAreaData.length > 1 && (() => {
                    const last = monthlyAreaData[monthlyAreaData.length - 1]?.total ?? 0;
                    const prev = monthlyAreaData[monthlyAreaData.length - 2]?.total ?? 0;
                    const diff = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
                    return (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${diff >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {diff >= 0 ? '+' : ''}{diff}% vs mês anterior
                      </span>
                    );
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                {monthlyAreaData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">Nenhum dado mensal disponível.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyAreaData} margin={{ left: 0, right: 8, top: 4 }}>
                      <defs>
                        <linearGradient id="colorDoacoes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v} doações`, 'Total']} contentStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={2.5} fill="url(#colorDoacoes)" dot={{ r: 3, fill: '#16A34A' }} name="Doações" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Gráficos — linha 2: estoque */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Estoque Global por Tipo Sanguíneo</CardTitle>
                  <CardDescription className="text-[11px]">
                    Fonte: tabela estoque agregada globalmente · posição atual em bolsas
                    {globalStock.filter(s => s.critical).length > 0 && (
                      <span className="ml-2 text-red-600 font-medium">⚠ {globalStock.filter(s => s.critical).length} tipo(s) crítico(s)</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={estoqueBarData} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any, n: string) => [`${v} bolsas`, n === 'atual' ? 'Estoque atual' : 'Mínimo exigido']} contentStyle={{ fontSize: 12 }} />
                      <Legend formatter={(v) => v === 'atual' ? 'Estoque atual' : 'Mínimo exigido'} />
                      <Bar dataKey="atual" name="atual" radius={[4, 4, 0, 0]}>
                        {estoqueBarData.map((e: any, i: number) => (
                          <Cell key={i} fill={e.critico ? '#DC2626' : e.atual < e.minimo * 1.5 ? '#EA580C' : '#16A34A'} />
                        ))}
                      </Bar>
                      <Bar dataKey="minimo" name="minimo" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Distribuição Percentual do Estoque</CardTitle>
                  <CardDescription className="text-[11px]">Fonte: tabela estoque · proporção de cada tipo no total atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stockDistribution.filter((s: any) => s.value > 0)}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={2} dataKey="value"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stockDistribution.filter((s: any) => s.value > 0).map((_: any, i: number) => (
                          <Cell key={i} fill={stockDistribution.filter((s: any) => s.value > 0)[i].color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v} bolsas`, 'Estoque atual']} contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* -- Estoque Global -- */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estoque Global de Sangue</CardTitle>
                    <CardDescription>Monitoramento consolidado - dados simulados</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {globalStock.filter(s => s.critical).length} Críticos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {globalStock.map((stock) => {
                    return (
                      <div key={stock.type} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg"><Droplet className="h-5 w-5 text-red-600" /></div>
                            <div><p className="text-2xl font-bold">{stock.type}</p><p className="text-sm text-gray-600">Tipo sanguíneo</p></div>
                          </div>
                          <Badge className={stock.critical ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}>
                            {stock.critical ? 'Crítico' : 'Normal'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total em rede</span>
                            <span className="font-semibold">{stock.current} bolsas</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${stock.critical ? 'bg-red-600' : stock.current < stock.min * 1.5 ? 'bg-orange-500' : 'bg-green-600'}`}
                              style={{ width: `${Math.min((stock.current / stock.max) * 100, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Mín: {stock.min}</span><span>Máx: {stock.max}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenUpdateStock(stock.type)}>
                            <Activity className="h-4 w-4 mr-2" />Atualizar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedBloodTypeForDetails(stock.type); setShowStockDetailsDialog(true); }}>
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

          {/* -- Usuários -- */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>Todos os usuários do sistema</CardDescription>
                  </div>
                  <Button onClick={() => setShowUserDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                    <UserPlus className="h-4 w-4" />Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_220px_180px] gap-4">
                    <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, email ou CPF..."
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchUsers();
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger><SelectValue placeholder="Tipo de usuario" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="1">Doadores</SelectItem>
                      <SelectItem value="2">Funcionários</SelectItem>
                      <SelectItem value="3">Diretores</SelectItem>
                      <SelectItem value="4">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="inativo">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSearchUsers} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Search className="h-4 w-4" />
                    Pesquisar
                  </Button>
                  <Button variant="outline" onClick={handleClearUserSearch} className="gap-2">
                    <Filter className="h-4 w-4" />
                    Limpar
                  </Button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando usuários...</div>
                ) : !userSearchPerformed ? (
                  <div className="text-center py-10 text-gray-500 border-dashed border-2 rounded-lg">
                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>Pesquise por nome, email ou CPF e use os filtros para listar usuarios.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Resultados da busca</p>
                        <p className="text-sm text-gray-500">{filteredUsers.length} usuario(s) encontrado(s)</p>
                      </div>
                    </div>
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{u.name}</p>
                              <Badge className={u.status === 1 ? 'bg-green-100 text-green-600 border-none' : 'bg-gray-100 text-gray-600 border-none'}>
                                {u.status === 1 ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-5">{roleLabels[u.role_id] || 'Usuário'}</Badge>
                              {u.hemocentro && <span className="text-[10px] text-gray-400">• {u.hemocentro.nome}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleToggleUserStatus(u)}
                            title={u.status === 1 ? 'Desativar' : 'Ativar'}>
                            {u.status === 1 ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setShowEditUserDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setUserToDelete(u); setShowDeleteUserDialog(true); }}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado.</div>
                    )}
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* -- Hemocentros -- */}
          <TabsContent value="hemocentros" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Hemocentros</CardTitle>
                    <CardDescription>Hemocentros cadastrados no sistema</CardDescription>
                  </div>
                  <Button onClick={() => setShowHemocentroDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />Novo Hemocentro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando hemocentros...</div>
                ) : (
                  <div className="space-y-3">
                    {hemocentros.map(hc => (
                      <div key={hc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-lg"><Building2 className="h-6 w-6 text-green-600" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{hc.nome}</p>
                              <Badge className={hc.status === 1 ? 'bg-green-100 text-green-600 border-none' : 'bg-red-100 text-red-600 border-none'}>
                                {hc.status === 1 ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{hc.cidade}{hc.uf ? ` - ${hc.uf}` : ''} • ID: {hc.id}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedHemocentro(hc); setShowViewHemocentroDialog(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedHemocentro({ ...hc }); setShowEditHemocentroDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleHemocentroStatus(hc)}
                            title={hc.status === 1 ? 'Desativar' : 'Ativar'}>
                            {hc.status === 1 ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {hemocentros.length === 0 && (
                      <div className="text-center py-8 text-gray-500">Nenhum hemocentro cadastrado.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* -- Roles / Permissões -- */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cargos e Permissões</CardTitle>
                    <CardDescription>Crie cargos personalizados para usuários novos sem alterar os cargos padrão</CardDescription>
                  </div>
                  <Button onClick={() => { setRoleForm({ name: '', permissions: [] }); setShowRoleDialog(true); }} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />Novo Cargo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando cargos...</div>
                ) : (
                  <div className="space-y-3">
                    {roles.map((role: any) => (
                      <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Settings className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{role.name}</p>
                              {role.sistema && (
                                <Badge variant="outline" className="text-xs text-gray-500">sistema</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {role.users_count} usuário{role.users_count !== 1 ? 's' : ''} vinculado{role.users_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={role.sistema}
                            onClick={() => { setSelectedRole({ ...role }); setShowEditRoleDialog(true); }}
                            title={role.sistema ? 'Cargos padrão do sistema não podem ser editados' : 'Editar'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={role.sistema || role.users_count > 0}
                            onClick={() => { setRoleToDelete(role); setShowDeleteRoleDialog(true); }}
                            title={role.sistema ? 'Cargos padrão do sistema não podem ser removidos' : role.users_count > 0 ? 'Remova os usuários antes de excluir' : 'Excluir'}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {roles.length === 0 && (
                      <div className="text-center py-8 text-gray-500">Nenhum cargo encontrado.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* -- Campanhas (local) -- */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campanhas de doação</h3>
                <p className="text-sm text-gray-500 mt-0.5">Gerencie e dispare campanhas segmentadas pelo ML</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={handleBuscarRecomendacoesMl}
                  disabled={mlRecsLoading}
                >
                  <Brain className="h-4 w-4" />
                  {mlRecsLoading ? 'Analisando...' : 'Recomendações ML'}
                </Button>
                <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4" />Nova campanha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Criar Nova Campanha</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateCampaign} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Título *</Label>
                          <Input
                            required
                            value={campaignForm.titulo}
                            onChange={e => setCampaignForm({ ...campaignForm, titulo: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Subtítulo</Label>
                          <Input
                            value={campaignForm.subtitulo}
                            onChange={e => setCampaignForm({ ...campaignForm, subtitulo: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Mensagem / Descrição *</Label>
                        <Textarea
                          required
                          rows={4}
                          value={campaignForm.descricao}
                          onChange={e => setCampaignForm({ ...campaignForm, descricao: e.target.value })}
                          placeholder="Texto que será enviado por e-mail aos doadores..."
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Tipo sanguíneo alvo</Label>
                          <Select
                            value={campaignForm.tipo_sangue || 'todos'}
                            onValueChange={v => setCampaignForm({ ...campaignForm, tipo_sangue: v === 'todos' ? '' : v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos os tipos</SelectItem>
                              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Data de publicação *</Label>
                          <Input
                            type="date"
                            required
                            min={todayDateInput}
                            max="2100-12-31"
                            value={campaignForm.data_publi}
                            onChange={e => {
                              const dataPubli = normalizeDateInput(e.target.value);
                              setCampaignForm({
                                ...campaignForm,
                                data_publi: dataPubli,
                                data_expiracao:
                                  campaignForm.data_expiracao && campaignForm.data_expiracao <= dataPubli
                                    ? ''
                                    : campaignForm.data_expiracao,
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Data de expiração</Label>
                        <Input
                          type="date"
                          min={campaignExpirationMinDate}
                          max="2100-12-31"
                          value={campaignForm.data_expiracao}
                          onChange={e => setCampaignForm({ ...campaignForm, data_expiracao: normalizeDateInput(e.target.value) })}
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowCampaignDialog(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          <Send className="h-4 w-4 mr-2" />Criar Campanha
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Campanhas ativas', value: campaigns.filter(c => c.status).length, sub: `${campaigns.filter(c => !c.status).length} inativas` },
                { label: 'Total disparado', value: campaigns.reduce((a, c) => a + (c.total_disparado || 0), 0).toLocaleString(), sub: 'todos os tempos' },
                { label: 'Segmentados pelo ML', value: mlPreview ? `${mlPreview.pct_ml}%` : '-', sub: mlPreview ? `de ${mlPreview.total_elegiveis} doadores` : 'rode a análise ML' },
                { label: 'Retorno estimado', value: mlPreview ? `~${mlPreview.retorno_estimado}` : '-', sub: mlPreview ? `~${mlPreview.volume_estimado_litros}L de sangue` : 'rode a análise ML' },
              ].map(({ label, value, sub }) => (
                <Card key={label} className="bg-gray-50 border-0">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Campanhas</CardTitle>
                  <CardDescription>{campaigns.filter(c => c.status).length} ativas · {campaigns.filter(c => !c.status).length} inativas</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 px-6">
                      <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma campanha criada ainda.</p>
                      <p className="text-xs mt-1">Use "Recomendações ML" para receber sugestões de campanhas baseadas no perfil dos doadores.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {campaigns.map((campaign: any) => (
                        <div key={campaign.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-medium text-sm text-gray-900 truncate">{campaign.titulo}</span>
                                {campaign.tipo_sangue && (
                                  <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">{campaign.tipo_sangue}</Badge>
                                )}
                                <Badge className={campaign.status ? 'bg-green-50 text-green-700 border-green-200 text-[10px]' : 'bg-gray-100 text-gray-500 border-gray-200 text-[10px]'}>
                                  {campaign.status ? 'Ativa' : 'Inativa'}
                                </Badge>
                                {campaign.total_disparado > 0 && (
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">ML ativo</Badge>
                                )}
                              </div>
                              {campaign.subtitulo && (
                                <p className="text-xs text-gray-500 truncate">{campaign.subtitulo}</p>
                              )}
                              <div className="flex gap-4 mt-2 flex-wrap">
                                {campaign.total_disparado > 0 && (
                                  <span className="text-xs text-gray-500">Disparado: <span className="font-medium text-gray-700">{campaign.total_disparado.toLocaleString()}</span></span>
                                )}
                                {campaign.data_publi && (
                                  <span className="text-xs text-gray-500">Publicação: <span className="font-medium text-gray-700">{new Date(campaign.data_publi).toLocaleDateString('pt-BR')}</span></span>
                                )}
                                {campaign.data_expiracao && (
                                  <span className="text-xs text-gray-500">Expira: <span className="font-medium text-gray-700">{new Date(campaign.data_expiracao).toLocaleDateString('pt-BR')}</span></span>
                                )}
                              </div>
                              {campaign.total_disparado > 0 && (
                                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${Math.min((campaign.total_disparado / 500) * 100, 100)}%` }}
                                  />
                                </div>
                              )}
                              {disparoResultado?.campanha_id === campaign.id && (
                                <div className="mt-2 p-2 bg-green-50 rounded-md text-xs text-green-700">
                                  Último disparo: {disparoResultado.total_disparado} doadores atingidos
                                  {disparoResultado.segmentacao === 'ml' && ' · segmentado pelo ML'}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-red-600 border-red-200 hover:bg-red-50 gap-1 text-xs"
                                disabled={disparandoCampaignId !== null}
                                onClick={() => handleDispararCampaign(campaign)}
                              >
                                <Send className="h-3 w-3" />
                                {disparandoCampaignId === campaign.id ? 'Disparando...' : 'Disparar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => { setSelectedCampaign({ ...campaign }); setShowEditCampaignDialog(true); }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => { setCampaignToDelete(campaign); setShowDeleteCampaignDialog(true); }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Inteligência de campanhas</span>
                  </div>
                  <p className="text-xs text-purple-700 leading-relaxed mb-3">
                    O modelo RFMT analisa o perfil de todos os doadores e sugere quais campanhas lançar agora com maior probabilidade de retorno e volume estimado.
                  </p>
                  <Button
                    className="w-full gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs h-9"
                    onClick={handleBuscarRecomendacoesMl}
                    disabled={mlRecsLoading}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {mlRecsLoading ? 'Analisando doadores...' : 'Receber recomendações do ML'}
                  </Button>
                </div>

                {mlStatus === 'idle' && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">Aguardando análise</p>
                      <p className="text-xs text-gray-400 mt-1">Clique no botão acima para o ML analisar os perfis dos doadores.</p>
                    </CardContent>
                  </Card>
                )}

                {mlStatus === 'loading' && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Segmentando perfis via ML...</p>
                      <p className="text-xs text-gray-400 mt-1">Isso pode levar alguns segundos</p>
                    </CardContent>
                  </Card>
                )}

                {mlStatus === 'error' && (
                  <Card>
                    <CardContent className="py-6 text-center">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-400" />
                      <p className="text-sm text-gray-600">API ML indisponível</p>
                      <p className="text-xs text-gray-400 mt-1">Verifique se o servidor FastAPI está rodando na porta 8001.</p>
                      <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={handleBuscarRecomendacoesMl}>
                        Tentar novamente
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {mlStatus === 'ready' && mlRecs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Campanhas recomendadas</CardTitle>
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">{mlRecs.length} sugestões</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {mlRecs.map((rec: any, i: number) => (
                          <div key={i} className="p-3 flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                              {rec.rank}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900 capitalize">{rec.nome_legivel}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{rec.motivo}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${rec.score_pct}%` }} />
                                </div>
                                <span className="text-[10px] font-medium text-purple-700">{rec.score_pct}%</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-6 text-[11px] border-purple-200 text-purple-700 hover:bg-purple-50"
                                onClick={() => handleUsarRecomendacao(rec)}
                              >
                                Usar como base
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {mlStatus === 'ready' && mlPreview && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Estimativa do próximo disparo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: 'Doadores elegíveis', value: mlPreview.total_elegiveis, color: '' },
                        { label: 'Segmentados pelo ML', value: `${mlPreview.segmentados_ml} (${mlPreview.pct_ml}%)`, color: 'text-purple-700' },
                        { label: 'Retorno estimado', value: `~${mlPreview.retorno_estimado} doações`, color: 'text-green-700' },
                        { label: 'Volume estimado', value: `~${mlPreview.volume_estimado_litros} litros`, color: 'text-green-700' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-medium ${color || 'text-gray-900'}`}>{value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* -- Configurações -- */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Configurações do Sistema</CardTitle><CardDescription>Configurações globais do DoaVida</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Globe, label: 'Sistema Ativo', desc: 'Todos os hemocentros operacionais' },
                  { icon: Mail, label: 'Notificações por Email', desc: 'Emails automáticos aos doadores' },
                  { icon: MessageSquare, label: 'Notificações por WhatsApp', desc: 'Mensagens via WhatsApp' },
                  { icon: UserPlus, label: 'Cadastro Aberto', desc: 'Permitir novos cadastros de doadores' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div><p className="font-semibold">{label}</p><p className="text-sm text-gray-600">{desc}</p></div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
                <div className="pt-4">
                  <Button onClick={() => toast.success('Configurações salvas!')} className="bg-green-600 hover:bg-green-700">
                    <Settings className="h-4 w-4 mr-2" />Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* --- DIALOGS ----------------------------------------------------------- */}

      {/* Criar Hemocentro */}
      <Dialog open={showHemocentroDialog} onOpenChange={setShowHemocentroDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Adicionar Novo Hemocentro</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateHemocentro} className="space-y-4">
            <div><Label>Nome *</Label><Input value={hcForm.nome} onChange={e => setHcForm({ ...hcForm, nome: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cidade *</Label><Input value={hcForm.cidade} onChange={e => setHcForm({ ...hcForm, cidade: e.target.value })} required /></div>
              <div>
                <Label>UF *</Label>
                <Select value={hcForm.uf} onValueChange={v => setHcForm({ ...hcForm, uf: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['PR', 'SP', 'RJ', 'MG', 'RS', 'SC', 'BA', 'DF'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Endereço *</Label><Input value={hcForm.endereco} onChange={e => setHcForm({ ...hcForm, endereco: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Número *</Label><Input value={hcForm.numero} onChange={e => setHcForm({ ...hcForm, numero: e.target.value })} required /></div>
              <div><Label>CEP *</Label><Input value={hcForm.cep} onChange={e => setHcForm({ ...hcForm, cep: e.target.value.replace(/\D/g, '') })} maxLength={8} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={hcForm.telefone} onChange={e => setHcForm({ ...hcForm, telefone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={hcForm.email} onChange={e => setHcForm({ ...hcForm, email: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowHemocentroDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white"><Plus className="h-4 w-4 mr-2" />Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ver Hemocentro */}
      <Dialog open={showViewHemocentroDialog} onOpenChange={setShowViewHemocentroDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Detalhes do Hemocentro</DialogTitle></DialogHeader>
          {selectedHemocentro && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-gray-500">Nome</Label><p className="font-semibold text-gray-900">{selectedHemocentro.nome}</p></div>
                <div><Label className="text-gray-500">ID</Label><p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">{selectedHemocentro.id}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-gray-500">Cidade / UF</Label><p>{selectedHemocentro.cidade} {selectedHemocentro.uf}</p></div>
                <div><Label className="text-gray-500">Status</Label>
                  <Badge className={selectedHemocentro.status === 1 ? 'bg-green-100 text-green-600 border-none' : 'bg-red-100 text-red-600 border-none'}>
                    {selectedHemocentro.status === 1 ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              {selectedHemocentro.telefone && <div><Label className="text-gray-500">Telefone</Label><p>{selectedHemocentro.telefone}</p></div>}
              {selectedHemocentro.email && <div><Label className="text-gray-500">Email</Label><p>{selectedHemocentro.email}</p></div>}
              {selectedHemocentro.endereco && <div><Label className="text-gray-500">Endereço</Label><p>{selectedHemocentro.endereco}, {selectedHemocentro.numero} - {selectedHemocentro.bairro}</p></div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowViewHemocentroDialog(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Hemocentro */}
      <Dialog open={showEditHemocentroDialog} onOpenChange={setShowEditHemocentroDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Editar Hemocentro</DialogTitle></DialogHeader>
          {selectedHemocentro && (
            <form onSubmit={handleUpdateHemocentro} className="space-y-4">
              <div><Label>Nome *</Label>
                <Input value={selectedHemocentro.nome} onChange={e => setSelectedHemocentro({ ...selectedHemocentro, nome: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cidade</Label>
                  <Input value={selectedHemocentro.cidade || ''} onChange={e => setSelectedHemocentro({ ...selectedHemocentro, cidade: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={String(selectedHemocentro.status)} onValueChange={v => setSelectedHemocentro({ ...selectedHemocentro, status: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ativo</SelectItem>
                      <SelectItem value="0">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefone</Label>
                  <Input value={selectedHemocentro.telefone || ''} onChange={e => setSelectedHemocentro({ ...selectedHemocentro, telefone: e.target.value })} />
                </div>
                <div><Label>Email</Label>
                  <Input type="email" value={selectedHemocentro.email || ''} onChange={e => setSelectedHemocentro({ ...selectedHemocentro, email: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditHemocentroDialog(false)}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white"><CheckCircle2 className="h-4 w-4 mr-2" />Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Criar Usuário */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Adicionar Novo Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div><Label>Nome Completo *</Label>
              <Input value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} required />
            </div>
            <div><Label>Email *</Label>
              <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CPF *</Label>
                <Input value={newUserForm.cpf} onChange={e => setNewUserForm({ ...newUserForm, cpf: e.target.value.replace(/\D/g, '') })} maxLength={11} required />
              </div>
              <div><Label>Senha *</Label>
                <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} minLength={6} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Perfil *</Label>
                <Select value={newUserForm.role_id} onValueChange={v => setNewUserForm({ ...newUserForm, role_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(roles.length ? roles : [
                      { id: 2, name: 'funcionario' },
                      { id: 3, name: 'diretor' },
                      { id: 4, name: 'admin' },
                    ])
                      .filter(r => r.name !== 'doador')
                      .map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {roleLabels[r.id] || r.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hemocentro</Label>
                <Select value={newUserForm.hemocentro_id} onValueChange={v => setNewUserForm({ ...newUserForm, hemocentro_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {hemocentros.map(hc => (
                      <SelectItem key={hc.id} value={String(hc.id)}>{hc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white"><UserPlus className="h-4 w-4 mr-2" />Criar Usuário</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar Usuário */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div><Label>Nome *</Label>
                <Input value={selectedUser.name} onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })} required />
              </div>
              <div><Label>Email *</Label>
                <Input type="email" value={selectedUser.email} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Perfil</Label>
                  <Select value={String(selectedUser.role_id)} onValueChange={v => setSelectedUser({ ...selectedUser, role_id: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(roles.length ? roles : [
                        { id: 1, name: 'doador' },
                        { id: 2, name: 'funcionario' },
                        { id: 3, name: 'diretor' },
                        { id: 4, name: 'admin' },
                      ]).map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {roleLabels[r.id] || r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hemocentro</Label>
                  <Select value={selectedUser.hemocentro_id ? String(selectedUser.hemocentro_id) : ''} onValueChange={v => setSelectedUser({ ...selectedUser, hemocentro_id: v ? Number(v) : undefined })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {hemocentros.map(hc => (
                        <SelectItem key={hc.id} value={String(hc.id)}>{hc.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={String(selectedUser.status)} onValueChange={v => setSelectedUser({ ...selectedUser, status: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ativo</SelectItem>
                    <SelectItem value="0">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white"><CheckCircle2 className="h-4 w-4 mr-2" />Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar Excluir Usuário */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" />Confirmar Exclusão</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita e removerá permanentemente o usuário do sistema.</DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{userToDelete.name}</p>
              <p className="text-sm text-gray-600">{userToDelete.email}</p>
              <Badge variant="outline" className="mt-2">{roleLabels[userToDelete.role_id]}</Badge>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteUser} className="gap-2"><Trash2 className="h-4 w-4" />Excluir Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atualizar Estoque */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Atualizar Estoque Global - {selectedBloodType}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Ação</Label>
              <Select value={stockAction} onValueChange={(v) => setStockAction(v as 'add' | 'remove')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-600" />Adicionar</div></SelectItem>
                  <SelectItem value="remove"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-red-600" />Remover</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade (bolsas)</Label>
              <Input type="number" min="1" value={stockAmount} onChange={e => setStockAmount(e.target.value)} />
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              Estoque atual de <strong>{selectedBloodType}</strong>: <strong>{globalStock.find(s => s.type === selectedBloodType)?.current} bolsas</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStock} className={stockAction === 'add' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}>
              {stockAction === 'add' ? 'Confirmar Adição' : 'Confirmar Remoção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Campanha */}
      <Dialog open={showEditCampaignDialog} onOpenChange={setShowEditCampaignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Editar Campanha</DialogTitle></DialogHeader>
          {selectedCampaign && (
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  required
                  value={selectedCampaign?.titulo || ''}
                  onChange={e => setSelectedCampaign({ ...selectedCampaign, titulo: e.target.value })}
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={selectedCampaign?.subtitulo || ''}
                  onChange={e => setSelectedCampaign({ ...selectedCampaign, subtitulo: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={selectedCampaign?.descricao || ''}
                  onChange={e => setSelectedCampaign({ ...selectedCampaign, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo sanguíneo alvo</Label>
                  <Select
                    value={selectedCampaign?.tipo_sangue || 'todos'}
                    onValueChange={v => setSelectedCampaign({ ...selectedCampaign, tipo_sangue: v === 'todos' ? '' : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedCampaign?.status ? '1' : '0'}
                    onValueChange={v => setSelectedCampaign({ ...selectedCampaign, status: v === '1' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ativa</SelectItem>
                      <SelectItem value="0">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditCampaignDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Excluir Campanha */}
      <Dialog open={showDeleteCampaignDialog} onOpenChange={setShowDeleteCampaignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><Trash2 className="h-5 w-5" />Excluir Campanha</DialogTitle></DialogHeader>
          {campaignToDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-gray-900">{campaignToDelete.titulo}</p>
              <p className="text-sm text-gray-600">{campaignToDelete.subtitulo}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteCampaignDialog(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDeleteCampaign} className="bg-red-600 hover:bg-red-700 text-white">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exportar Relatório */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />Gerar Relatório PDF
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o tipo, período e filtros. O arquivo será baixado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Tipo de relatório</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'doacoes',      label: 'Doações',      desc: 'Coletas e volume',    icon: '🩸' },
                  { value: 'estoque',      label: 'Estoque',       desc: 'Níveis e alertas',    icon: '📦' },
                  { value: 'doadores',     label: 'Doadores',      desc: 'Cadastros e perfil',  icon: '👥' },
                  { value: 'agendamentos', label: 'Agendamentos',  desc: 'Status e taxa',       icon: '📅' },
                  { value: 'triagens',     label: 'Triagens',      desc: 'Aptidão e motivos',   icon: '🏥' },
                  { value: 'desempenho',   label: 'Desempenho',    desc: 'Performance mensal',  icon: '📈' },
                ].map(({ value, label, desc, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReportType(value)}
                    className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                      reportType === value ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-xs font-medium text-gray-900">{label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Período</Label>
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="previous_month">Mês anterior</SelectItem>
                    <SelectItem value="all">Período completo</SelectItem>
                    <SelectItem value="custom">Intervalo personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo sanguíneo</Label>
                <Select value={reportBloodType} onValueChange={setReportBloodType}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {reportPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data inicial</Label>
                  <Input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Data final</Label>
                  <Input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="h-8 text-xs mt-1" />
                </div>
              </div>
            )}
            {reportType && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 flex items-center gap-2">
                <Download className="h-3 w-3 flex-shrink-0" />
                <span>
                  <strong className="text-gray-700 capitalize">{reportType}</strong>
                  {' · '}{resolvePeriodFilter(reportPeriod, reportStartDate, reportEndDate).label}
                  {reportBloodType !== 'todos' && ` · ${reportBloodType}`}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => { setShowReportDialog(false); setReportType(''); }}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleExportReport}
              disabled={!reportType || isDownloadingReport}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingReport ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhes Estoque - mantido simples, dados locais */}
      <Dialog open={showStockDetailsDialog} onOpenChange={setShowStockDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-red-600" />Detalhes Global - Tipo {selectedBloodTypeForDetails}
            </DialogTitle>
          </DialogHeader>
          {selectedBloodTypeForDetails && (() => {
            const stock = globalStock.find(s => s.type === selectedBloodTypeForDetails);
            if (!stock) return null;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Atual</p><p className="text-2xl font-bold">{stock.current}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Mínimo</p><p className="text-2xl font-bold text-orange-600">{stock.min}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Máximo</p><p className="text-2xl font-bold text-green-600">{stock.max}</p></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Nível de preenchimento</span>
                    <span>{Math.round((stock.current / stock.max) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${stock.critical ? 'bg-red-600' : stock.current < stock.min * 1.5 ? 'bg-orange-500' : 'bg-green-600'}`}
                      style={{ width: `${Math.min((stock.current / stock.max) * 100, 100)}%` }} />
                  </div>
                </div>
                {stock.critical && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="h-4 w-4" />Atenção: Estoque global abaixo do nível de segurança!
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDetailsDialog(false)}>Fechar</Button>
            <Button onClick={() => { setShowStockDetailsDialog(false); handleOpenUpdateStock(selectedBloodTypeForDetails); }} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <Activity className="h-4 w-4" />Ajustar Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Criar Cargo */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[580px] max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Novo Cargo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateRole} className="flex flex-col flex-1 min-h-0 gap-4">
            <div>
              <Label>Nome do cargo *</Label>
              <Input
                required
                placeholder="ex: marketing_campanhas"
                value={roleForm.name}
                onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Use letras minúsculas, números e underscores. Cargos padrão do sistema ficam bloqueados.</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Permissões</Label>
              <div className="space-y-4">
                {Object.entries(allPermissions).map(([categoria, perms]) => (
                  <div key={categoria}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{categoria}</p>
                    <div className="grid grid-cols-2 gap-1.5 pl-1">
                      {Object.entries(perms).map(([permName, permLabel]) => (
                        <label key={permName} className="flex items-center gap-2 text-sm cursor-pointer hover:text-gray-900 text-gray-700 py-0.5">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions.includes(permName)}
                            onChange={() => togglePermission(permName, roleForm.permissions, p => setRoleForm({ ...roleForm, permissions: p }))}
                            className="w-4 h-4 rounded accent-green-600"
                          />
                          {permLabel}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setShowRoleDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Criar Cargo ({roleForm.permissions.length} permissão{roleForm.permissions.length !== 1 ? 'ões' : ''})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar Cargo */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="sm:max-w-[580px] max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Editar Cargo</DialogTitle></DialogHeader>
          {selectedRole && (
            <form onSubmit={handleUpdateRole} className="flex flex-col flex-1 min-h-0 gap-4">
              <div>
                <Label>Nome do cargo *</Label>
                <Input
                  required
                  disabled={selectedRole.sistema}
                  value={selectedRole.name}
                  onChange={e => setSelectedRole({ ...selectedRole, name: e.target.value })}
                />
                {selectedRole.sistema && (
                  <p className="text-xs text-amber-600 mt-1">Cargos padrão do sistema não podem ser alterados pelo dashboard.</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Permissões</Label>
                <div className="space-y-4">
                  {Object.entries(allPermissions).map(([categoria, perms]) => (
                    <div key={categoria}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{categoria}</p>
                      <div className="grid grid-cols-2 gap-1.5 pl-1">
                        {Object.entries(perms).map(([permName, permLabel]) => (
                          <label key={permName} className="flex items-center gap-2 text-sm cursor-pointer hover:text-gray-900 text-gray-700 py-0.5">
                            <input
                              type="checkbox"
                              checked={(selectedRole.permissions ?? []).includes(permName)}
                              onChange={() => togglePermission(
                                permName,
                                selectedRole.permissions ?? [],
                                p => setSelectedRole({ ...selectedRole, permissions: p })
                              )}
                              className="w-4 h-4 rounded accent-green-600"
                            />
                            {permLabel}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditRoleDialog(false)}>Cancelar</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">Salvar alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Excluir Cargo */}
      <Dialog open={showDeleteRoleDialog} onOpenChange={setShowDeleteRoleDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />Excluir Cargo
            </DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          {roleToDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-gray-900">{roleToDelete.name}</p>
              <p className="text-sm text-gray-500">{roleToDelete.users_count} usuários vinculados</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteRoleDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteRole} className="gap-2">
              <Trash2 className="h-4 w-4" />Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

