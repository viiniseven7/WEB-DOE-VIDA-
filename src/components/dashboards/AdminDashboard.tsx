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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Droplet, 
  Users,
  LogOut,
  Bell,
  Building2,
  Shield,
  Mail,
  MessageSquare,
  Image as ImageIcon,
  Send,
  Plus,
  Settings,
  BarChart3,
  Globe,
  UserPlus,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data
const hemocentros = [
  { id: 'hc-001', name: 'Hemocentro São Paulo Central', city: 'São Paulo', donations: 325, active: true },
  { id: 'hc-002', name: 'Hemocentro Zona Leste', city: 'São Paulo', donations: 198, active: true },
  { id: 'hc-003', name: 'Hemocentro Zona Sul', city: 'São Paulo', donations: 245, active: true },
  { id: 'hc-004', name: 'Hemocentro Campinas', city: 'Campinas', donations: 176, active: true },
  { id: 'hc-005', name: 'Hemocentro Santos', city: 'Santos', donations: 142, active: true },
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

const campaigns = [
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

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCampaignDialog(false);
    toast.success('Campanha criada e agendada com sucesso!');
  };

  const handleCreatePermissionGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPermissionDialog(false);
    toast.success('Grupo de permissões criado com sucesso!');
  };

  const totalDonations = hemocentros.reduce((acc, hc) => acc + hc.donations, 0);
  const totalDonors = 12847;

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
            Visão global do sistema DoaVida - Gerenciamento de todos os hemocentros
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="hemocentros">Hemocentros</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Doações por Hemocentro - Este Mês</CardTitle>
                <CardDescription>Comparativo de performance entre unidades</CardDescription>
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

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Total do Sistema</CardTitle>
                  <CardDescription>Doações acumuladas - Últimos 3 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={systemStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={3} name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hemocentros - Status</CardTitle>
                  <CardDescription>Resumo de atividades por unidade</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hemocentros.slice(0, 5).map((hc) => (
                      <div key={hc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{hc.name}</p>
                            <p className="text-xs text-gray-600">{hc.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{hc.donations}</p>
                          <p className="text-xs text-gray-600">doações</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <Button className="gap-2 bg-green-600 hover:bg-green-700">
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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
                  {permissionGroups.map((group) => (
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
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

                        <div className="space-y-2">
                          <Label>Imagem da Campanha (URL)</Label>
                          <Input placeholder="https://exemplo.com/imagem.jpg" type="url" />
                          <p className="text-xs text-gray-600">
                            Cole o link de uma imagem para usar na campanha
                          </p>
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
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
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
