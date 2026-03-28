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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Droplet, 
  Calendar,
  Users,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  TrendingUp,
  Activity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Mock data
const todayAppointments = [
  { 
    id: '1', 
    time: '08:00', 
    donorName: 'Ana Silva', 
    bloodType: 'O+', 
    phone: '(11) 98765-4321',
    status: 'pending',
    confirmed: true
  },
  { 
    id: '2', 
    time: '09:00', 
    donorName: 'Carlos Santos', 
    bloodType: 'A+', 
    phone: '(11) 97654-3210',
    status: 'pending',
    confirmed: true
  },
  { 
    id: '3', 
    time: '09:30', 
    donorName: 'Maria Oliveira', 
    bloodType: 'B+', 
    phone: '(11) 96543-2109',
    status: 'completed',
    confirmed: true,
    bloodAmount: 450
  },
  { 
    id: '4', 
    time: '10:00', 
    donorName: 'João Pereira', 
    bloodType: 'AB+', 
    phone: '(11) 95432-1098',
    status: 'pending',
    confirmed: false
  },
  { 
    id: '5', 
    time: '11:00', 
    donorName: 'Paula Costa', 
    bloodType: 'O-', 
    phone: '(11) 94321-0987',
    status: 'completed',
    confirmed: true,
    bloodAmount: 450
  },
];

const bloodStock = [
  { type: 'A+', current: 45, min: 30, max: 100, unit: 'bolsas' },
  { type: 'A-', current: 12, min: 20, max: 60, unit: 'bolsas' },
  { type: 'B+', current: 28, min: 25, max: 80, unit: 'bolsas' },
  { type: 'B-', current: 8, min: 15, max: 50, unit: 'bolsas' },
  { type: 'AB+', current: 15, min: 15, max: 40, unit: 'bolsas' },
  { type: 'AB-', current: 5, min: 10, max: 30, unit: 'bolsas' },
  { type: 'O+', current: 62, min: 40, max: 120, unit: 'bolsas' },
  { type: 'O-', current: 18, min: 25, max: 70, unit: 'bolsas' },
];

export function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState(todayAppointments);
  const [searchTerm, setSearchTerm] = useState('');

  if (!user || user.role !== 'staff') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  const handleCompleteDonation = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId
          ? { ...apt, status: 'completed', bloodAmount: 450 }
          : apt
      )
    );
    toast.success('Doação registrada com sucesso!');
  };

  const handleCancelDonation = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId
          ? { ...apt, status: 'cancelled' }
          : apt
      )
    );
    toast.error('Doação cancelada');
  };

  const getStockStatus = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100;
    if (current < min) return { color: 'red', label: 'Crítico', textColor: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage < 50) return { color: 'orange', label: 'Baixo', textColor: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (percentage < 80) return { color: 'blue', label: 'Normal', textColor: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { color: 'green', label: 'Ótimo', textColor: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.bloodType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedToday = appointments.filter(apt => apt.status === 'completed').length;
  const pendingToday = appointments.filter(apt => apt.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
                <p className="text-xs text-gray-600">Painel do Funcionário</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            {user.hemocentroName} - Gerencie as doações e o estoque de sangue
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Doações Hoje</CardDescription>
              <CardTitle className="text-3xl">{appointments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Agendamentos do dia</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-3xl">{completedToday}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{(completedToday * 450)}ml coletados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl">{pendingToday}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Aguardando atendimento</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardDescription>Doadores Ativos</CardDescription>
              <CardTitle className="text-3xl">2.847</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Cadastrados no sistema</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="schedule">Agenda do Dia</TabsTrigger>
            <TabsTrigger value="stock">Estoque de Sangue</TabsTrigger>
            <TabsTrigger value="donors">Doadores</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Agenda de Doações - Hoje</CardTitle>
                    <CardDescription>
                      {new Date().toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar doador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-4 border rounded-lg ${
                        appointment.status === 'completed' 
                          ? 'bg-green-50 border-green-200' 
                          : appointment.status === 'cancelled'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-lg border-2 border-blue-600">
                            <p className="text-lg font-bold text-blue-600">{appointment.time}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg">{appointment.donorName}</p>
                              <Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">
                                {appointment.bloodType}
                              </Badge>
                              {!appointment.confirmed && (
                                <Badge variant="outline" className="border-orange-600 text-orange-600">
                                  Não confirmado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{appointment.phone}</p>
                            {appointment.status === 'completed' && (
                              <p className="text-sm text-green-600 font-semibold mt-1">
                                ✓ Doação concluída - {appointment.bloodAmount}ml
                              </p>
                            )}
                            {appointment.status === 'cancelled' && (
                              <p className="text-sm text-gray-500 font-semibold mt-1">
                                ✗ Cancelada
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {appointment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleCompleteDonation(appointment.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Concluir
                            </Button>
                            <Button
                              onClick={() => handleCancelDonation(appointment.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estoque de Sangue</CardTitle>
                <CardDescription>
                  Monitoramento em tempo real do estoque por tipo sanguíneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {bloodStock.map((stock) => {
                    const status = getStockStatus(stock.current, stock.min, stock.max);
                    const percentage = (stock.current / stock.max) * 100;
                    
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
                          <Badge className={status.bgColor + ' ' + status.textColor}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estoque atual</span>
                            <span className="font-semibold">{stock.current} {stock.unit}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                stock.current < stock.min ? 'bg-red-600' :
                                percentage < 50 ? 'bg-orange-600' :
                                percentage < 80 ? 'bg-blue-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Mín: {stock.min}</span>
                            <span>Máx: {stock.max}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" className="w-full">
                            <Activity className="h-4 w-4 mr-2" />
                            Atualizar Estoque
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donors Tab */}
          <TabsContent value="donors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Doador</CardTitle>
                <CardDescription>
                  Acesso limitado às informações dos doadores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF ou Nome</Label>
                    <Input placeholder="Digite o CPF ou nome do doador" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo Sanguíneo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Doador
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    ℹ️ Como funcionário, você tem acesso limitado às informações dos doadores.
                    Apenas dados necessários para o atendimento são exibidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
