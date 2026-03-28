import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
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
  Droplet, 
  Calendar,
  Users,
  LogOut,
  Bell,
  TrendingUp,
  Activity,
  UserCheck,
  BarChart3,
  Clock,
  Download,
  UserPlus,
  Plus,
  Minus,
  FileText,
  FileSpreadsheet,
  FilePieChart
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data
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

const loggedStaff = [
  { id: '1', name: 'Maria Santos', role: 'Funcionário', loginTime: '08:00', status: 'online' },
  { id: '2', name: 'Pedro Silva', role: 'Funcionário', loginTime: '08:15', status: 'online' },
  { id: '3', name: 'Ana Costa', role: 'Funcionário', loginTime: '09:00', status: 'online' },
  { id: '4', name: 'Carlos Lima', role: 'Funcionário', loginTime: '14:00', status: 'online' },
  { id: '5', name: 'Julia Mendes', role: 'Enfermeira', loginTime: '08:00', status: 'online' },
];

const bloodStock = [
  { type: 'A+', current: 45, min: 30, percentage: 75 },
  { type: 'A-', current: 12, min: 20, percentage: 40 },
  { type: 'B+', current: 28, min: 25, percentage: 60 },
  { type: 'B-', current: 8, min: 15, percentage: 35 },
  { type: 'AB+', current: 15, min: 15, percentage: 50 },
  { type: 'AB-', current: 5, min: 10, percentage: 25 },
  { type: 'O+', current: 62, min: 40, percentage: 85 },
  { type: 'O-', current: 18, min: 25, percentage: 45 },
];

export function DirectorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [staff, setStaff] = useState(loggedStaff);
  const [stock, setStock] = useState(bloodStock);
  
  // Add Staff Dialog states
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    cpf: '',
    role: '',
    phone: ''
  });
  
  // Update Stock Dialog states
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');
  
  // Export Report Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportFormat, setReportFormat] = useState('pdf');

  if (!user || user.role !== 'director') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  const handleExportReport = () => {
    setExportDialogOpen(true);
  };

  // Handle Add Staff
  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.cpf || !newStaff.role || !newStaff.phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const staffMember = {
      id: String(staff.length + 1),
      name: newStaff.name,
      role: newStaff.role,
      loginTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'offline' as const
    };

    setStaff([...staff, staffMember]);
    toast.success(`Funcionário ${newStaff.name} adicionado com sucesso!`);
    setAddStaffDialogOpen(false);
    setNewStaff({ name: '', email: '', cpf: '', role: '', phone: '' });
  };

  // Handle Update Stock
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
    const maxStock = 150; // máximo genérico

    setStock(prev =>
      prev.map(item => {
        if (item.type === selectedBloodType) {
          const newCurrent = stockAction === 'add' 
            ? Math.min(item.current + amount, maxStock)
            : Math.max(item.current - amount, 0);
          const newPercentage = (newCurrent / maxStock) * 100;
          
          return {
            ...item,
            current: newCurrent,
            percentage: newPercentage
          };
        }
        return item;
      })
    );

    toast.success(
      stockAction === 'add'
        ? `${amount} bolsas adicionadas ao estoque de ${selectedBloodType}`
        : `${amount} bolsas removidas do estoque de ${selectedBloodType}`
    );
    setUpdateStockDialogOpen(false);
  };

  // Handle Export Report
  const handleConfirmExport = () => {
    if (!reportType) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    const reportNames: { [key: string]: string } = {
      monthly: 'Relatório Mensal',
      donors: 'Relatório de Doadores',
      stock: 'Relatório de Estoque',
      performance: 'Relatório de Desempenho'
    };

    const formatExt = reportFormat === 'pdf' ? 'PDF' : reportFormat === 'excel' ? 'Excel' : 'CSV';
    
    toast.success(`${reportNames[reportType]} exportado em ${formatExt} com sucesso!`);
    setExportDialogOpen(false);
    setReportType('');
    setReportFormat('pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-purple-600 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.hemocentroName}</p>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {user.name.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600">
              {user.hemocentroName} - Visão completa e gerenciamento do hemocentro
            </p>
          </div>
          <Button onClick={handleExportReport} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardDescription>Doações Este Mês</CardDescription>
              <CardTitle className="text-3xl">325</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+8% vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Doadores Ativos</CardDescription>
              <CardTitle className="text-3xl">2.847</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Cadastrados no sistema</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardDescription>Funcionários Online</CardDescription>
              <CardTitle className="text-3xl">{loggedStaff.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span>Ativos agora</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardDescription>Agendamentos Hoje</CardDescription>
              <CardTitle className="text-3xl">24</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span>12 concluídos</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="staff">Funcionários</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Donations Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Doações</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyDonations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="donations" 
                        stroke="#9333EA" 
                        strokeWidth={2}
                        name="Doações"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Blood Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo Sanguíneo</CardTitle>
                  <CardDescription>Doações do mês atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={bloodTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {bloodTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

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
                  <p className="text-sm text-gray-600 mt-2">218 de 250 agendamentos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Média Diária</CardDescription>
                  <CardTitle className="text-3xl">15.2</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">doações por dia útil</p>
                  <p className="text-sm text-green-600 mt-1">↑ 12% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Satisfação</CardDescription>
                  <CardTitle className="text-3xl">4.8</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">de 5.0 estrelas</p>
                  <p className="text-sm text-gray-600 mt-1">baseado em 156 avaliações</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Funcionários Logados no Sistema</CardTitle>
                    <CardDescription>
                      Funcionários atualmente ativos no sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setAddStaffDialogOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <UserPlus className="h-4 w-4" />
                    Adicionar Funcionário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {staffMember.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{staffMember.name}</p>
                          <p className="text-sm text-gray-600">{staffMember.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Login às</p>
                          <p className="font-semibold">{staffMember.loginTime}</p>
                        </div>
                        <Badge className={staffMember.status === 'online' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}>
                          <div className={`h-2 w-2 ${staffMember.status === 'online' ? 'bg-green-600' : 'bg-gray-600'} rounded-full mr-2`}></div>
                          {staffMember.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Equipe</CardTitle>
                <CardDescription>Desempenho dos funcionários este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Total de Funcionários</p>
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-gray-600 mt-1">8 ativos hoje</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">1.248h</p>
                    <p className="text-sm text-gray-600 mt-1">este mês</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Eficiência</p>
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-sm text-green-600 mt-1">↑ 3% vs mês anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estoque de Sangue - Status Atual</CardTitle>
                <CardDescription>
                  Monitoramento detalhado por tipo sanguíneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stock.map((stockItem) => (
                    <div key={stockItem.type} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-3 rounded-lg">
                            <p className="text-xl font-bold text-red-600">{stockItem.type}</p>
                          </div>
                          <div>
                            <p className="font-semibold">{stockItem.current} bolsas</p>
                            <p className="text-sm text-gray-600">Mínimo: {stockItem.min} bolsas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            stockItem.current < stockItem.min 
                              ? 'bg-red-100 text-red-600' 
                              : stockItem.percentage < 50 
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-green-100 text-green-600'
                          }>
                            {stockItem.current < stockItem.min ? 'Crítico' : stockItem.percentage < 50 ? 'Baixo' : 'Normal'}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => handleOpenUpdateStock(stockItem.type)}>
                            <Activity className="h-4 w-4 mr-1" />
                            Atualizar
                          </Button>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            stockItem.current < stockItem.min 
                              ? 'bg-red-600' 
                              : stockItem.percentage < 50 
                              ? 'bg-orange-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(stockItem.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Análises</CardTitle>
                <CardDescription>
                  Gere relatórios detalhados sobre as operações do hemocentro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">Relatório Mensal</p>
                      <p className="text-xs text-gray-600">Doações e estatísticas</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">Relatório de Doadores</p>
                      <p className="text-xs text-gray-600">Cadastros e perfil</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <Droplet className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">Relatório de Estoque</p>
                      <p className="text-xs text-gray-600">Entrada e saída</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <Activity className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">Relatório de Desempenho</p>
                      <p className="text-xs text-gray-600">Equipe e processos</p>
                    </div>
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Últimos Relatórios Gerados</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Relatório Mensal - Fevereiro 2026', date: '01/03/2026', size: '2.4 MB' },
                      { name: 'Relatório de Estoque - Janeiro 2026', date: '25/02/2026', size: '1.8 MB' },
                      { name: 'Relatório Anual - 2025', date: '15/01/2026', size: '5.2 MB' },
                    ].map((report, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-semibold text-sm">{report.name}</p>
                          <p className="text-xs text-gray-600">{report.date} • {report.size}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo funcionário do hemocentro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Digite o nome completo"
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={newStaff.cpf}
                onChange={(e) => setNewStaff({...newStaff, cpf: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Cargo *</Label>
              <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcionário">Funcionário</SelectItem>
                  <SelectItem value="Enfermeira">Enfermeira</SelectItem>
                  <SelectItem value="Técnico">Técnico em Enfermagem</SelectItem>
                  <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStaffDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStaff} className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Stock Dialog */}
      <Dialog open={updateStockDialogOpen} onOpenChange={setUpdateStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atualizar Estoque - {selectedBloodType}</DialogTitle>
            <DialogDescription>
              Adicione ou remova bolsas de sangue do estoque
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                Estoque atual de <strong>{selectedBloodType}</strong>:{' '}
                <strong>
                  {stock.find(s => s.type === selectedBloodType)?.current} bolsas
                </strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUpdateStockDialogOpen(false)}
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

      {/* Export Report Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Relatório</DialogTitle>
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
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Relatório Mensal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="donors">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Relatório de Doadores</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="stock">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      <span>Relatório de Estoque</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="performance">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>Relatório de Desempenho</span>
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
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span>Excel (.xlsx)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FilePieChart className="h-4 w-4 text-blue-600" />
                      <span>CSV</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-sm text-gray-600">
              <p>
                O relatório será gerado com os dados atualizados até o momento e baixado automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmExport}
              className="bg-purple-600 hover:bg-purple-700"
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