import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarUI } from '../ui/calendar';
import { 
  Droplet, 
  Calendar as CalendarIcon,
  Users,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Activity,
  Plus,
  Minus,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://localhost:8000/api';

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
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stock, setStock] = useState(bloodStock);
  
  // Modais de Fluxo
  const [triagemDialogOpen, setTriagemDialogOpen] = useState(false);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Estados dos Formulários
  const [triagemData, setTriagemData] = useState({ apto: 'true', observacoes: '' });
  const [donationData, setDonationData] = useState({ quantidade: '450', data_validade: format(new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') });

  // Outros modais
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorBloodType, setDonorBloodType] = useState('');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/agendamentos`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.data || data);
      }
    } catch (error) {
      toast.error('Erro ao carregar agenda');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'staff') {
      fetchAppointments();
    } else if (user) {
      navigate('/login');
    }
  }, [user]);

  if (!user || user.role !== 'staff') return null;

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logout realizado com sucesso');
  };

  // --- LOGICA DE FILTRO E ORDENAÇÃO ---
  const filteredAndSortedAppointments = appointments
    .filter(apt => {
      const aptDate = parseISO(apt.data_hora_doacao);
      const matchesDate = isSameDay(aptDate, selectedDate);
      const matchesSearch = (apt.doador?.name || apt.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (apt.doador?.tipo_sang || apt.user?.tipo_sang || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    })
    .sort((a, b) => new Date(a.data_hora_doacao).getTime() - new Date(b.data_hora_doacao).getTime());

  // --- FUNÇÕES DE INTEGRAÇÃO ---
  const handleConfirmPresence = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/agendamentos/${appointmentId}/confirmar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) {
        toast.success('Check-in realizado!');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erro no check-in');
    }
  };

  const handleRegisterTriagem = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/triagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify({
          agendamento_id: selectedAppointment.id,
          user_id: selectedAppointment.user_id,
          hemocentro_id: user.hemocenterId,
          data_triagem: format(new Date(), 'yyyy-MM-dd'),
          apto: triagemData.apto === 'true',
          observacoes: triagemData.observacoes
        })
      });
      if (response.ok) {
        toast.success('Triagem salva!');
        setTriagemDialogOpen(false);
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erro ao salvar triagem');
    }
  };

  const handleRegisterDonation = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/auth/doacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify({
          agendamento_id: selectedAppointment.id,
          triagem_id: selectedAppointment.triagem?.id,
          user_id: selectedAppointment.user_id,
          hemocentro_id: user.hemocenterId,
          data_hora_doacao: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          tipo_sangue: selectedAppointment.doador?.tipo_sang || selectedAppointment.user?.tipo_sang,
          quantidade: parseInt(donationData.quantidade),
          data_validade_sangue: donationData.data_validade
        })
      });
      if (response.ok) {
        toast.success('Doação registrada!');
        setDonationDialogOpen(false);
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erro ao registrar coleta');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Deseja cancelar?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_URL}/auth/agendamentos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      toast.success('Cancelado');
      fetchAppointments();
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };

  const getStockStatus = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100;
    if (current < min) return { color: 'red', label: 'Crítico', textColor: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage < 50) return { color: 'orange', label: 'Baixo', textColor: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (percentage < 80) return { color: 'blue', label: 'Normal', textColor: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { color: 'green', label: 'Ótimo', textColor: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setUpdateStockDialogOpen(true);
  };

  const handleUpdateStock = () => {
    const amount = parseInt(stockAmount);
    setStock(prev => prev.map(item => item.type === selectedBloodType ? { ...item, current: stockAction === 'add' ? Math.min(item.current + amount, item.max) : Math.max(item.current - amount, 0) } : item));
    toast.success('Estoque atualizado');
    setUpdateStockDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}><Droplet className="h-6 w-6 text-white" /></div>
            <div><h1 className="text-xl font-bold text-gray-900">DoaVida</h1><p className="text-xs text-gray-600">Painel do Funcionário</p></div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" /><span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span></Button>
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback className="bg-blue-100 text-blue-600">{user.name[0]}</AvatarFallback></Avatar>
              <div className="hidden md:block"><p className="text-sm font-semibold text-gray-900">{user.name}</p><p className="text-xs text-gray-600">{user.hemocentroName}</p></div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /> Sair</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user.name.split(' ')[0]}! 👋</h2>
          <p className="text-gray-600">{user.hemocentroName} - Gerencie as doações e o estoque de sangue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600"><CardHeader className="pb-3"><CardDescription>Doações Hoje</CardDescription><CardTitle className="text-3xl">{appointments.filter(a => isSameDay(parseISO(a.data_hora_doacao), new Date())).length}</CardTitle></CardHeader></Card>
          <Card className="border-l-4 border-l-green-600"><CardHeader className="pb-3"><CardDescription>Concluídas (Hoje)</CardDescription><CardTitle className="text-3xl">{appointments.filter(a => !!a.doacao && isSameDay(parseISO(a.data_hora_doacao), new Date())).length}</CardTitle></CardHeader></Card>
          <Card className="border-l-4 border-l-orange-600"><CardHeader className="pb-3"><CardDescription>Pendentes (Hoje)</CardDescription><CardTitle className="text-3xl">{appointments.filter(a => !a.doacao && a.status_agendamento !== 'CAN' && isSameDay(parseISO(a.data_hora_doacao), new Date())).length}</CardTitle></CardHeader></Card>
          <Card className="border-l-4 border-l-purple-600"><CardHeader className="pb-3"><CardDescription>Total Sistema</CardDescription><CardTitle className="text-3xl">{appointments.length}</CardTitle></CardHeader></Card>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="donors">Doadores</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Agenda de Doações</CardTitle>
                    <CardDescription>{filteredAndSortedAppointments.length} agendamentos listados</CardDescription>
                  </div>

                  {/* SELETOR DE DATA CENTRALIZADO */}
                  <div className="flex-1 flex justify-center">
                    <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-3 shadow-sm">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="h-auto p-0 font-bold text-blue-700 hover:bg-transparent text-sm">
                            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <CalendarUI mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar na lista..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? <div className="text-center py-10 italic text-gray-400">Carregando agendamentos...</div> : filteredAndSortedAppointments.length > 0 ? filteredAndSortedAppointments.map((apt) => {
                    const isApto = apt.triagem && (apt.triagem.apto === true || apt.triagem.apto === 1 || apt.triagem.apto === '1' || apt.triagem.apto === 'true');
                    const hasTriagem = !!apt.triagem;
                    const hasDoacao = !!apt.doacao;
                    return (
                      <div key={apt.id} className={`p-4 border rounded-lg transition-all ${hasDoacao ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-lg shadow-lg"><p className="text-lg font-bold">{format(parseISO(apt.data_hora_doacao), "HH:mm")}</p></div>
                            <div>
                              <div className="flex items-center gap-2"><p className="font-bold text-lg text-gray-900">{apt.doador?.name || apt.user?.name}</p><Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">{apt.doador?.tipo_sang || apt.user?.tipo_sang || '?'}</Badge>{apt.status_agendamento === 'CON' && <Badge className="bg-blue-100 text-blue-700 border-none">Presente</Badge>}</div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1"><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {apt.doador?.telefone || apt.user?.telefone}</span>{hasTriagem && <span className={`flex items-center gap-1 font-medium ${isApto ? 'text-green-600' : 'text-red-600'}`}>{isApto ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}Triagem {isApto ? 'Apto' : 'Inapto'}</span>}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {apt.status_agendamento === 'AGE' && <Button onClick={() => handleConfirmPresence(apt.id)} size="sm" className="bg-blue-600 hover:bg-blue-700">Check-in</Button>}
                            {apt.status_agendamento === 'CON' && !hasTriagem && <Button onClick={() => { setSelectedAppointment(apt); setTriagemDialogOpen(true); }} size="sm" className="bg-orange-500 hover:bg-orange-600 gap-2"><Stethoscope className="h-4 w-4" /> Triagem</Button>}
                            {isApto && !hasDoacao && <Button onClick={() => { setSelectedAppointment(apt); setDonationDialogOpen(true); }} size="sm" className="bg-green-600 hover:bg-green-700 gap-2"><Droplet className="h-4 w-4" /> Coleta</Button>}
                            {hasDoacao && <Badge className="bg-green-100 text-green-700 py-2 px-3 border-none font-bold">✓ Concluído</Badge>}
                            {!hasDoacao && apt.status_agendamento !== 'CAN' && <Button onClick={() => handleCancelAppointment(apt.id)} size="sm" variant="ghost" className="text-gray-400 hover:text-red-600"><XCircle className="h-4 w-4" /></Button>}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed"><CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum agendamento para este dia.</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESTOQUE E DOADORES */}
          <TabsContent value="stock" className="space-y-6">
            <Card><CardHeader><CardTitle>Estoque de Sangue</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 gap-4">{stock.map((s) => {
              const status = getStockStatus(s.current, s.min, s.max);
              return (
                <div key={s.type} className="p-4 border rounded-lg"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="bg-red-100 p-2 rounded-lg"><Droplet className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{s.type}</p></div></div><Badge className={status.bgColor + ' ' + status.textColor}>{status.label}</Badge></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(s.current/s.max)*100}%` }} /></div><Button size="sm" variant="outline" className="w-full mt-3" onClick={() => handleOpenUpdateStock(s.type)}>Atualizar Estoque</Button></div>
              );
            })}</div></CardContent></Card>
          </TabsContent>
          <TabsContent value="donors" className="space-y-6">
            <Card><CardHeader><CardTitle>Buscar Doador</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><Input placeholder="CPF ou Nome" /><Button className="bg-blue-600 hover:bg-blue-700"><Search className="h-4 w-4 mr-2" /> Buscar</Button></div></CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* MODAIS */}
      <Dialog open={triagemDialogOpen} onOpenChange={setTriagemDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Triagem Médica</DialogTitle><DialogDescription>Doador: {selectedAppointment?.doador?.name || selectedAppointment?.user?.name}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4"><div className="space-y-2"><Label>O doador está apto?</Label><Select value={triagemData.apto} onValueChange={(v) => setTriagemData({...triagemData, apto: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim, está apto</SelectItem><SelectItem value="false">Não, está inapto</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Observações</Label><Textarea value={triagemData.observacoes} onChange={(e) => setTriagemData({...triagemData, observacoes: e.target.value})} placeholder="Observações da triagem..." /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setTriagemDialogOpen(false)}>Cancelar</Button><Button onClick={handleRegisterTriagem} className="bg-blue-600 hover:bg-blue-700">Salvar Triagem</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={donationDialogOpen} onOpenChange={setDonationDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Registrar Coleta</DialogTitle><DialogDescription>Doador: {selectedAppointment?.doador?.name || selectedAppointment?.user?.name}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Tipo Sangue</Label><Input value={selectedAppointment?.doador?.tipo_sang || selectedAppointment?.user?.tipo_sang} readOnly className="bg-gray-50 font-bold" /></div><div className="space-y-2"><Label>Quantidade (ml)</Label><Input type="number" value={donationData.quantidade} onChange={(e) => setDonationData({...donationData, quantidade: e.target.value})} /></div></div>
        <div className="space-y-2"><Label>Data de Validade</Label><Input type="date" value={donationData.data_validade} onChange={(e) => setDonationData({...donationData, data_validade: e.target.value})} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setDonationDialogOpen(false)}>Cancelar</Button><Button onClick={handleRegisterDonation} className="bg-green-600 hover:bg-green-700">Concluir Doação</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={updateStockDialogOpen} onOpenChange={setUpdateStockDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Atualizar Estoque</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4"><Select value={stockAction} onValueChange={(v) => setStockAction(v as 'add' | 'remove')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="add">Adicionar</SelectItem><SelectItem value="remove">Remover</SelectItem></SelectContent></Select><Input type="number" placeholder="Quantidade" value={stockAmount} onChange={(e) => setStockAmount(e.target.value)} /></div>
        <DialogFooter><Button onClick={handleUpdateStock} className="bg-blue-600">Confirmar</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
