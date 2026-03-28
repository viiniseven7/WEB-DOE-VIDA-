import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
  Download
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
    toast.success('Relatório exportado com sucesso!');
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
                <CardTitle>Funcionários Logados no Sistema</CardTitle>
                <CardDescription>
                  Funcionários atualmente ativos no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loggedStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{staff.name}</p>
                          <p className="text-sm text-gray-600">{staff.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Login às</p>
                          <p className="font-semibold">{staff.loginTime}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-600">
                          <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                          Online
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
                  {bloodStock.map((stock) => (
                    <div key={stock.type} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-3 rounded-lg">
                            <p className="text-xl font-bold text-red-600">{stock.type}</p>
                          </div>
                          <div>
                            <p className="font-semibold">{stock.current} bolsas</p>
                            <p className="text-sm text-gray-600">Mínimo: {stock.min} bolsas</p>
                          </div>
                        </div>
                        <Badge className={
                          stock.current < stock.min 
                            ? 'bg-red-100 text-red-600' 
                            : stock.percentage < 50 
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-green-100 text-green-600'
                        }>
                          {stock.current < stock.min ? 'Crítico' : stock.percentage < 50 ? 'Baixo' : 'Normal'}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            stock.current < stock.min 
                              ? 'bg-red-600' 
                              : stock.percentage < 50 
                              ? 'bg-orange-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(stock.percentage, 100)}%` }}
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
    </div>
  );
}
