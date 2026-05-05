import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Droplet, Calendar, Users, LogOut, Bell, TrendingUp, Activity,
  UserCheck, BarChart3, Clock, Download, UserPlus, Plus, Minus,
  FileText, FileSpreadsheet, FilePieChart
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ─── Mocks (sem API equivalente) ─────────────────────────────────────────────

const monthlyDonations = [
  { month: 'Jan', donations: 245 },
  { month: 'Fev', donations: 289 },
  { month: 'Mar', donations: 267 },
  { month: 'Abr', donations: 312 },
  { month: 'Mai', donations: 298 },
  { month: 'Jun', donations: 325 },
];

const bloodTypeDistribution = [
  { name: 'O+', value: 35, color: '#DC2626' },
  { name: 'A+', value: 28, color: '#EA580C' },
  { name: 'B+', value: 18, color: '#CA8A04' },
  { name: 'AB+', value: 8, color: '#16A34A' },
  { name: 'O-', value: 5, color: '#2563EB' },
  { name: 'A-', value: 3, color: '#7C3AED' },
  { name: 'B-', value: 2, color: '#DB2777' },
  { name: 'AB-', value: 1, color: '#0891B2' },
];

const bloodStockMock = [
  { type: 'A+', current: 45, min: 30, max: 150 },
  { type: 'A-', current: 12, min: 20, max: 100 },
  { type: 'B+', current: 28, min: 25, max: 120 },
  { type: 'B-', current: 8,  min: 15, max: 80  },
  { type: 'AB+', current: 15, min: 15, max: 80 },
  { type: 'AB-', current: 5,  min: 10, max: 50 },
  { type: 'O+', current: 62, min: 40, max: 200 },
  { type: 'O-', current: 18, min: 25, max: 120 },
];

const roleLabels: Record<number, string> = {
  1: 'Doador', 2: 'Funcionário', 3: 'Diretor', 4: 'Admin',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function DirectorDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  // ── Estado: dados da API
  const [staffList, setStaffList] = useState<any[]>([]);
  const [agendamentosHoje, setAgendamentosHoje] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Estado: mock local
  const [stock, setStock] = useState(bloodStockMock);

  // ── Dialogs
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteStaffDialogOpen, setDeleteStaffDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);

  // ── Formulário novo funcionário
  const [newStaff, setNewStaff] = useState({
    name: '', email: '', cpf: '', password: '', role_id: '2',
  });

  // ── Estoque
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');

  // ── Relatório
  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat] = useState('pdf');

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (!user) { navigate('/login'); return null; }
  if (user.role_id !== 3) { navigate('/login'); return null; }

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
  setIsLoading(true);
  try {
    const [usersRes, agendRes] = await Promise.all([
      api.get('/users'),
      api.get('/agendamentos'),
    ]);

    const todosUsers = Array.isArray(usersRes.data)
      ? usersRes.data
      : usersRes.data.data ?? [];

    console.log('TODOS USERS:', todosUsers.map((u: any) => ({
      id: u.id, name: u.name, role_id: u.role_id, hemocentro_id: u.hemocentro_id
    })));
    console.log('DIRETOR hemocentro_id:', user.hemocentro_id, typeof user.hemocentro_id);

    // Filtra por role_id 2 ou 3 E mesmo hemocentro — força Number() nos dois lados
    const staff = todosUsers.filter(
  (u: any) =>
    Number(u.hemocentro_id) === Number(user.hemocentro_id) &&
    (
      [2, 3].includes(Number(u.role_id)) ||
      // inclui usuários sem role_id mas vinculados ao hemocentro
      (u.role_id === null && u.hemocentro_id !== null)
    )
);

    console.log('STAFF FILTRADO:', staff);
    setStaffList(staff);

    // Agendamentos de hoje do hemocentro
    const hoje = new Date().toISOString().split('T')[0];
    const agends = Array.isArray(agendRes.data)
      ? agendRes.data
      : agendRes.data.data ?? [];

    const agendHoje = agends.filter((a: any) => {
      const dataAgend = a.data_hora_doacao?.split(' ')[0] || a.data?.split('T')[0];
      return (
        dataAgend === hoje &&
        Number(a.hemocentro_id) === Number(user.hemocentro_id)
      );
    });

    setAgendamentosHoje(agendHoje);
  } catch (err: any) {
    console.error('Erro ao carregar dados:', err.response?.data);
    toast.error('Erro ao carregar dados');
  } finally {
    setIsLoading(false);
  }
}, [user.hemocentro_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLogout = () => { logout(); navigate('/'); toast.success('Logout realizado'); };

  // Fora do componente, no topo do arquivo
const roleNames: Record<string, string> = {
  '1': 'doador',
  '2': 'funcionario',
  '3': 'diretor',
  '4': 'admin',
};

const handleAddStaff = async () => {
  if (!newStaff.name || !newStaff.email || !newStaff.cpf || !newStaff.password) {
    toast.error('Preencha todos os campos obrigatórios');
    return;
  }

  // Garante que o hemocentro_id do diretor está disponível
  if (!user.hemocentro_id) {
    toast.error('Erro: diretor não está vinculado a um hemocentro');
    return;
  }

<<<<<<< HEAD
  const handleExportReport = () => {
    setExportDialogOpen(true);
  };

  // Handle Add Staff
  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.cpf || !newStaff.role || !newStaff.phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // REQUEST PARA API
    // Exemplo de payload a ser enviado para a rota POST /auth/users
    // const payload = {
    //   name: newStaff.name, // Corrigido de nome
    //   email: newStaff.email,
    //   cpf: newStaff.cpf,
    //   role: newStaff.role, // Corrigido de cargo
    //   phone: newStaff.phone, // Corrigido de telefone
    //   password: "senha_padrao_ou_gerada" // Senha necessária para criação
    // };
    // await fetch('/auth/users', { method: 'POST', body: JSON.stringify(payload) });

    const staffMember = {
      id: String(staff.length + 1),
=======
  try {
    const payload = {
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
      name: newStaff.name,
      email: newStaff.email,
      cpf: newStaff.cpf.replace(/\D/g, ''),
      password: newStaff.password,
      role_id: Number(newStaff.role_id),         // 2 = funcionario, 3 = diretor
      role: roleNames[newStaff.role_id],          // string que o Laravel exige
      hemocentro_id: Number(user.hemocentro_id),  // sempre o hemocentro do diretor
    };

    console.log('PAYLOAD STAFF:', JSON.stringify(payload, null, 2));

    await api.post('/auth/users', payload);
    toast.success(`Funcionário ${newStaff.name} criado com sucesso!`);
    setAddStaffDialogOpen(false);
    setNewStaff({ name: '', email: '', cpf: '', password: '', role_id: '2' });
    await fetchData();
  } catch (err: any) {
    console.log('ERRO STAFF:', JSON.stringify(err.response?.data, null, 2));
    const erros = err.response?.data?.errors;
    if (erros) {
      toast.error(Object.values(erros).flat().join('\n'));
    } else {
      toast.error(err.response?.data?.message || 'Erro ao criar funcionário');
    }
  }
};
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await api.delete(`/users/${staffToDelete.id}`);
      toast.success('Funcionário removido!');
      setDeleteStaffDialogOpen(false);
      setStaffToDelete(null);
      fetchData();
    } catch {
      toast.error('Erro ao remover funcionário');
    }
  };

  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setUpdateStockDialogOpen(true);
  };

  const handleUpdateStock = () => {
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      toast.error('Digite uma quantidade válida');
      return;
    }
    const amount = parseInt(stockAmount);
<<<<<<< HEAD
    const maxStock = 150; // máximo genérico

    // REQUEST PARA API
    // Exemplo de payload a ser enviado para a rota POST/PUT de estoque
    // const payload = {
    //   blood_type: selectedBloodType, // Corrigido de tipo_sanguineo
    //   amount: amount, // Corrigido de quantidade
    //   action: stockAction, // 'add' ou 'remove' (Corrigido de acao)
    // };
    // await fetch('/estoque/atualizar', { method: 'POST', body: JSON.stringify(payload) });

    setStock(prev =>
      prev.map(item => {
        if (item.type === selectedBloodType) {
          const newCurrent = stockAction === 'add'
            ? Math.min(item.current + amount, maxStock)
            : Math.max(item.current - amount, 0);
          const newPercentage = (newCurrent / maxStock) * 100;
          return { ...item, current: newCurrent, percentage: newPercentage };
        }
        return item;
      })
    );

    toast.success(
      stockAction === 'add'
        ? `${amount} bolsas adicionadas ao estoque de ${selectedBloodType}`
        : `${amount} bolsas removidas do estoque de ${selectedBloodType}`
    );
=======
    setStock(prev => prev.map(item => {
      if (item.type !== selectedBloodType) return item;
      const newCurrent = stockAction === 'add'
        ? Math.min(item.current + amount, item.max)
        : Math.max(item.current - amount, 0);
      return { ...item, current: newCurrent };
    }));
    toast.success(`${amount} bolsas ${stockAction === 'add' ? 'adicionadas' : 'removidas'} — ${selectedBloodType}`);
>>>>>>> 29a1149df61d2fee727b2e30f1487737c62e9b0b
    setUpdateStockDialogOpen(false);
  };

  const handleConfirmExport = () => {
    if (!reportType) { toast.error('Selecione um tipo de relatório'); return; }
    const names: Record<string, string> = {
      monthly: 'Mensal', donors: 'Doadores', stock: 'Estoque', performance: 'Desempenho',
    };
    const ext = reportFormat === 'pdf' ? 'PDF' : reportFormat === 'excel' ? 'Excel' : 'CSV';
    toast.success(`Relatório ${names[reportType]} exportado em ${ext}!`);
    setExportDialogOpen(false);
    setReportType('');
    setReportFormat('pdf');
  };

  // ─── Computados ───────────────────────────────────────────────────────────
  const hemocentroNome = user.hemocentro?.nome || `Hemocentro #${user.hemocentro_id}`;
  const agendConcluidos = agendamentosHoje.filter(
    (a: any) => ['FIN', 'concluido'].includes(a.status)
  ).length;
  const staffOnline = staffList.filter((s: any) => s.status === 1).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
              <p className="text-xs text-gray-600">Painel do Diretor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-600">{hemocentroNome}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /><span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {user.name.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600">{hemocentroNome} — Gerenciamento completo</p>
          </div>
          <Button onClick={() => setExportDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4" />Exportar Relatório
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardDescription>Doações Este Mês</CardDescription>
              <CardTitle className="text-3xl">325</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" /><span>+8% vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Funcionários no Hemocentro</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : staffList.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{staffOnline} ativos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardDescription>Agendamentos Hoje</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : agendamentosHoje.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>{agendConcluidos} concluídos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardDescription>Estoque Crítico</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {stock.filter(s => s.current < s.min).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Droplet className="h-4 w-4" />
                <span>tipos abaixo do mínimo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="staff">Funcionários</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* ── Visão Geral ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Doações</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyDonations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" /><YAxis />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="donations" stroke="#9333EA" strokeWidth={2} name="Doações" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo Sanguíneo</CardTitle>
                  <CardDescription>Doações do mês atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={bloodTypeDistribution} cx="50%" cy="50%" outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}%`} dataKey="value">
                        {bloodTypeDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3"><CardDescription>Taxa de Comparecimento</CardDescription><CardTitle className="text-3xl">87%</CardTitle></CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-green-600" style={{ width: '87%' }} /></div>
                  <p className="text-sm text-gray-600 mt-2">218 de 250 agendamentos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardDescription>Média Diária</CardDescription><CardTitle className="text-3xl">15.2</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-600">doações por dia útil</p><p className="text-sm text-green-600 mt-1">↑ 12% vs mês anterior</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardDescription>Satisfação</CardDescription><CardTitle className="text-3xl">4.8</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-600">de 5.0 estrelas</p><p className="text-sm text-gray-600 mt-1">baseado em 156 avaliações</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Funcionários ── */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Funcionários do Hemocentro</CardTitle>
                    <CardDescription>Equipe vinculada a {hemocentroNome}</CardDescription>
                  </div>
                  <Button onClick={() => setAddStaffDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <UserPlus className="h-4 w-4" />Adicionar Funcionário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando funcionários...</div>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum funcionário cadastrado neste hemocentro.</div>
                ) : (
                  <div className="space-y-3">
                    {staffList.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-sm text-gray-600">{roleLabels[s.role_id] || 'Funcionário'}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={s.status === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                            <div className={`h-2 w-2 rounded-full mr-2 ${s.status === 1 ? 'bg-green-600' : 'bg-gray-400'}`} />
                            {s.status === 1 ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => { setStaffToDelete(s); setDeleteStaffDialogOpen(true); }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Equipe</CardTitle>
                <CardDescription>Resumo do hemocentro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Total de Funcionários</p>
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold">{staffList.length}</p>
                    <p className="text-sm text-gray-600 mt-1">{staffOnline} ativos</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Agendamentos Hoje</p>
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">{agendamentosHoje.length}</p>
                    <p className="text-sm text-gray-600 mt-1">{agendConcluidos} concluídos</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Estoque Crítico</p>
                      <Activity className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {stock.filter(s => s.current < s.min).length}
                    </p>
                    <p className="text-sm text-red-600 mt-1">tipos abaixo do mínimo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Estoque ── */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estoque de Sangue</CardTitle>
                <CardDescription>Status atual por tipo sanguíneo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stock.map(item => {
                    const pct = Math.round((item.current / item.max) * 100);
                    const critico = item.current < item.min;
                    const baixo = !critico && pct < 50;
                    return (
                      <div key={item.type} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-3 rounded-lg">
                              <p className="text-xl font-bold text-red-600">{item.type}</p>
                            </div>
                            <div>
                              <p className="font-semibold">{item.current} bolsas</p>
                              <p className="text-sm text-gray-600">Mínimo: {item.min} | Máximo: {item.max}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={critico ? 'bg-red-100 text-red-600' : baixo ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                              {critico ? 'Crítico' : baixo ? 'Baixo' : 'Normal'}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => handleOpenUpdateStock(item.type)}>
                              <Activity className="h-4 w-4 mr-1" />Atualizar
                            </Button>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${critico ? 'bg-red-600' : baixo ? 'bg-orange-500' : 'bg-green-600'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0</span><span>{pct}%</span><span>{item.max}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Relatórios ── */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Análises</CardTitle>
                <CardDescription>Gere relatórios detalhados do hemocentro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: BarChart3, title: 'Relatório Mensal', desc: 'Doações e estatísticas', value: 'monthly' },
                    { icon: Users,     title: 'Relatório de Doadores', desc: 'Cadastros e perfil', value: 'donors' },
                    { icon: Droplet,   title: 'Relatório de Estoque', desc: 'Entrada e saída', value: 'stock' },
                    { icon: Activity,  title: 'Relatório de Desempenho', desc: 'Equipe e processos', value: 'performance' },
                  ].map(({ icon: Icon, title, desc, value }) => (
                    <Button
                      key={value}
                      variant="outline"
                      className="h-24 flex-col gap-2"
                      onClick={() => { setReportType(value); setExportDialogOpen(true); }}
                    >
                      <Icon className="h-6 w-6" />
                      <div><p className="font-semibold">{title}</p><p className="text-xs text-gray-600">{desc}</p></div>
                    </Button>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Últimos Relatórios Gerados</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Relatório Mensal - Fevereiro 2026', date: '01/03/2026', size: '2.4 MB' },
                      { name: 'Relatório de Estoque - Janeiro 2026', date: '25/02/2026', size: '1.8 MB' },
                      { name: 'Relatório Anual - 2025', date: '15/01/2026', size: '5.2 MB' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-semibold text-sm">{r.name}</p>
                          <p className="text-xs text-gray-600">{r.date} • {r.size}</p>
                        </div>
                        <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ DIALOGS ═══════════════════════════════════════════════════════════ */}

      {/* Adicionar Funcionário */}
      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            <DialogDescription>O funcionário será vinculado a {hemocentroNome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Completo *</Label>
              <Input placeholder="Nome completo" value={newStaff.name}
                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
            </div>
            <div><Label>Email *</Label>
              <Input type="email" placeholder="email@exemplo.com" value={newStaff.email}
                onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
            </div>
            <div><Label>CPF * (só números)</Label>
              <Input placeholder="00000000000" maxLength={11} value={newStaff.cpf}
                onChange={e => setNewStaff({ ...newStaff, cpf: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div><Label>Senha * (mín. 6 caracteres)</Label>
              <Input type="password" placeholder="Senha provisória" minLength={6} value={newStaff.password}
                onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
            </div>
            <div>
              <Label>Cargo *</Label>
              <Select value={newStaff.role_id} onValueChange={v => setNewStaff({ ...newStaff, role_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Funcionário</SelectItem>
                  <SelectItem value="3">Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStaffDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddStaff} className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar Remoção */}
      <Dialog open={deleteStaffDialogOpen} onOpenChange={setDeleteStaffDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remover Funcionário</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          {staffToDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold">{staffToDelete.name}</p>
              <p className="text-sm text-gray-600">{staffToDelete.email}</p>
              <p className="text-xs text-gray-500">{roleLabels[staffToDelete.role_id]}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStaffDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700">Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atualizar Estoque */}
      <Dialog open={updateStockDialogOpen} onOpenChange={setUpdateStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atualizar Estoque — {selectedBloodType}</DialogTitle>
            <DialogDescription>Adicione ou remova bolsas do estoque</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ação</Label>
              <Select value={stockAction} onValueChange={v => setStockAction(v as 'add' | 'remove')}>
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
              Estoque atual de <strong>{selectedBloodType}</strong>:{' '}
              <strong>{stock.find(s => s.type === selectedBloodType)?.current} bolsas</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStockDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStock} className={stockAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {stockAction === 'add' ? <><Plus className="h-4 w-4 mr-2" />Adicionar</> : <><Minus className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exportar Relatório */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
            <DialogDescription>Selecione o tipo e formato</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Relatório Mensal</div></SelectItem>
                  <SelectItem value="donors"><div className="flex items-center gap-2"><Users className="h-4 w-4" />Relatório de Doadores</div></SelectItem>
                  <SelectItem value="stock"><div className="flex items-center gap-2"><Droplet className="h-4 w-4" />Relatório de Estoque</div></SelectItem>
                  <SelectItem value="performance"><div className="flex items-center gap-2"><Activity className="h-4 w-4" />Relatório de Desempenho</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-red-600" />PDF</div></SelectItem>
                  <SelectItem value="excel"><div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-green-600" />Excel (.xlsx)</div></SelectItem>
                  <SelectItem value="csv"><div className="flex items-center gap-2"><FilePieChart className="h-4 w-4 text-blue-600" />CSV</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-purple-50 p-3 rounded text-sm text-gray-600">
              O relatório será gerado com os dados atualizados.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmExport} className="bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}