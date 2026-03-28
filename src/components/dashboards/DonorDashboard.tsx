import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Droplet, 
  Calendar as CalendarIcon, 
  Award, 
  Clock, 
  MapPin, 
  Heart,
  LogOut,
  User,
  Bell,
  CheckCircle2,
  AlertCircle,
  Edit
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data
const upcomingAppointment = {
  id: '1',
  date: '2026-03-15',
  time: '09:00',
  location: 'Hemocentro São Paulo Central',
  address: 'Av. Dr. Enéas de Carvalho Aguiar, 155',
  confirmed: false
};

const donationHistory = [
  { id: '1', date: '2025-12-15', location: 'Hemocentro São Paulo Central', bloodAmount: '450ml', status: 'Concluída' },
  { id: '2', date: '2025-09-10', location: 'Hemocentro São Paulo Central', bloodAmount: '450ml', status: 'Concluída' },
  { id: '3', date: '2025-06-05', location: 'Hemocentro Zona Leste', bloodAmount: '450ml', status: 'Concluída' },
  { id: '4', date: '2025-03-01', location: 'Hemocentro São Paulo Central', bloodAmount: '450ml', status: 'Concluída' },
  { id: '5', date: '2024-12-10', location: 'Hemocentro Zona Sul', bloodAmount: '450ml', status: 'Concluída' },
];

export function DonorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(upcomingAppointment.confirmed);
  
  // Reagendamento states
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLocation, setRescheduleLocation] = useState('');
  
  // Edit Profile states
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const bloodCenters = [
    { value: "hemepar", label: "Hemepar - Centro de Hematologia e Hemoterapia do Paraná" },
    { value: "erasto-gaertner", label: "Hospital Erasto Gaertner - Banco de Sangue" },
    { value: "hc-ufpr", label: "Hospital de Clínicas - UFPR" },
    { value: "hc-trabalhador", label: "Hospital do Trabalhador - Banco de Sangue" }
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", 
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  if (!user || user.role !== 'donor') {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  const handleConfirmAppointment = () => {
    setAppointmentConfirmed(true);
    toast.success('Doação confirmada com sucesso!');
  };

  const handleReschedule = () => {
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleConfirm = () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleLocation) {
      toast.error('Preencha todos os campos para reagendar');
      return;
    }
    toast.info('Funcionalidade de reagendamento em desenvolvimento');
    setRescheduleDialogOpen(false);
  };

  const handleEditProfile = () => {
    setEditProfileDialogOpen(true);
  };

  const handleEditProfileConfirm = () => {
    toast.info('Funcionalidade de edição de perfil em desenvolvimento');
    setEditProfileDialogOpen(false);
  };

  const nextDonationDate = new Date('2026-06-15');
  const daysUntilNextDonation = Math.ceil((nextDonationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
                <p className="text-xs text-gray-600">Painel do Doador</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
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
            Bem-vindo ao seu painel de doador. Aqui você pode acompanhar suas doações e agendar novas.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-red-600">
            <CardHeader className="pb-3">
              <CardDescription>Total de Doações</CardDescription>
              <CardTitle className="text-3xl">{user.donationCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Droplet className="h-4 w-4 text-red-600" />
                <span>Aproximadamente {((user.donationCount || 0) * 450)}ml doados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardDescription>Tipo Sanguíneo</CardDescription>
              <CardTitle className="text-3xl">{user.bloodType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Heart className="h-4 w-4 text-blue-600" />
                <span>Compatível com {user.bloodType === 'O+' ? '8 tipos' : '4 tipos'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardDescription>Vidas Impactadas</CardDescription>
              <CardTitle className="text-3xl">{(user.donationCount || 0) * 4}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="h-4 w-4 text-green-600" />
                <span>Cada doação pode salvar até 4 vidas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardDescription>Próxima Doação</CardDescription>
              <CardTitle className="text-3xl">{daysUntilNextDonation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-purple-600" />
                <span>dias restantes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            {/* Upcoming Appointment */}
            {upcomingAppointment && (
              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-red-600" />
                        Próxima Doação Agendada
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Confirme sua presença até 1 dia antes
                      </CardDescription>
                    </div>
                    {appointmentConfirmed ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Confirmada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-600 text-orange-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <CalendarIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Data e Hora</p>
                          <p className="font-semibold">
                            {new Date(upcomingAppointment.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })} às {upcomingAppointment.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <MapPin className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Local</p>
                          <p className="font-semibold">{upcomingAppointment.location}</p>
                          <p className="text-sm text-gray-600">{upcomingAppointment.address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {!appointmentConfirmed && (
                        <Button
                          onClick={handleConfirmAppointment}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirmar Presença
                        </Button>
                      )}
                      <Button
                        onClick={handleReschedule}
                        variant="outline"
                        className="w-full"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Reagendar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule New */}
            <Card>
              <CardHeader>
                <CardTitle>Agendar Nova Doação</CardTitle>
                <CardDescription>
                  Selecione uma data disponível para sua próxima doação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Horários Disponíveis</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((time) => (
                          <Button key={time} variant="outline" size="sm">
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      Confirmar Agendamento
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Doações</CardTitle>
                <CardDescription>
                  Todas as suas doações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {donationHistory.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                          <Droplet className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {new Date(donation.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">{donation.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{donation.bloodAmount}</p>
                        <Badge variant="outline" className="mt-1 border-green-600 text-green-600">
                          {donation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Seus dados cadastrais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-red-100 text-red-600 text-2xl">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <Badge className="mt-2 bg-red-600">Doador Ativo</Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">CPF</p>
                      <p className="font-semibold">{user.cpf}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-semibold">{user.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo Sanguíneo</p>
                      <p className="font-semibold">{user.bloodType}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Total de Doações</p>
                      <p className="font-semibold">{user.donationCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Última Doação</p>
                      <p className="font-semibold">
                        {new Date(user.lastDonation || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cadastro desde</p>
                      <p className="font-semibold">Janeiro 2024</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button variant="outline" className="gap-2" onClick={handleEditProfile}>
                    <User className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reagendar Doação</DialogTitle>
            <DialogDescription>
              Selecione uma nova data e horário para sua doação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={rescheduleDate}
                onSelect={setRescheduleDate}
                className="rounded-md border"
                disabled={(date) => date < new Date() || date.getDay() === 0}
              />
            </div>
            <div>
              <Label htmlFor="time">Horário</Label>
              <Select
                value={rescheduleTime}
                onValueChange={setRescheduleTime}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Local</Label>
              <Select
                value={rescheduleLocation}
                onValueChange={setRescheduleLocation}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Selecione um local" />
                </SelectTrigger>
                <SelectContent>
                  {bloodCenters.map((center) => (
                    <SelectItem key={center.value} value={center.value}>
                      {center.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRescheduleConfirm}
            >
              Reagendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditProfileDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleEditProfileConfirm}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}