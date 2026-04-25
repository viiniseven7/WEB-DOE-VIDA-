import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Droplet,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RegistrationDonationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'personal' | 'appointment' | 'success'>('personal');
  const [date, setDate] = useState<Date>();
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [showUnderageModal, setShowUnderageModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Dados pessoais
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    email: '',
    phone: '',
    zipCode: '',
    address: '', 
    city: '',
    state: '',
    password: '',
    confirmPassword: '',
    hemocentro_id: '', 
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  // Dados do responsável legal (16-17 anos)
  const [guardianData, setGuardianData] = useState({
    guardianName: '',
    guardianCpf: '',
    guardianBirthDate: '',
    guardianPhone: '',
  });

  const [bloodCenters, setBloodCenters] = useState<{id: string, label: string}[]>([]);

  useEffect(() => {
    const fetchHemocentros = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/hemocentros');
        if (response.ok) {
          const data = await response.json();
          const list = data.data || data;
          setBloodCenters(list.map((h: any) => ({ id: h.id.toString(), label: h.nome })));
        }
      } catch (err) {
        console.error("Erro ao carregar hemocentros:", err);
      }
    };
    fetchHemocentros();
  }, []);

  // Máscaras visuais
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'phone' || field === 'guardianPhone') finalValue = maskPhone(value);
    if (field === 'cpf' || field === 'guardianCpf') finalValue = maskCPF(value);

    setFormData(prev => ({ ...prev, [field]: finalValue }));
    
    if (field === 'birthDate') {
      const age = calculateAge(value);
      if (age > 0 && age < 16) {
        setShowUnderageModal(true);
        setFormData(prev => ({ ...prev, birthDate: '' }));
      } else if (age === 16 || age === 17) {
        setShowGuardianModal(true);
      }
    }
  };

  const handleGuardianInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'guardianPhone') finalValue = maskPhone(value);
    if (field === 'guardianCpf') finalValue = maskCPF(value);
    setGuardianData(prev => ({ ...prev, [field]: finalValue }));
  };

  const calculateAge = (birthDateString: string): number => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePersonalDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formatToBRDate = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const [rua = '', numero = '', ...bairroParts] = formData.address.split(',').map(s => s.trim());
    const bairro = bairroParts.join(', ').trim();

    const registrationPayload = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.confirmPassword,
      cpf: formData.cpf.replace(/\D/g, ''),
      telefone: formData.phone.replace(/\D/g, ''), // Envia apenas números
      tipo_sang: formData.bloodType === 'unknown' ? null : formData.bloodType.toUpperCase(),
      sexo: formData.gender === 'male' ? 'M' : formData.gender === 'female' ? 'F' : 'Outro',
      data_nasc: formatToBRDate(formData.birthDate),
      cep: formData.zipCode.replace(/\D/g, ''),
      rua, numero, bairro,
      cidade: formData.city,
      uf: formData.state,
      ...(calculateAge(formData.birthDate) < 18 && {
        responsavel_nome: guardianData.guardianName,
        responsavel_cpf: guardianData.guardianCpf.replace(/\D/g, ''),
        responsavel_data_nasc: formatToBRDate(guardianData.guardianBirthDate),
      })
    };

    try {
      setIsRegistering(true);
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(registrationPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || JSON.stringify(data.errors));

      const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        localStorage.setItem('access_token', loginData.token || loginData.access_token);
      }

      setStep('appointment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      alert(`Erro no cadastro: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hemocentro_id || !formData.appointmentDate) return alert("Selecione local e data.");

    const [day, month, year] = formData.appointmentDate.split('/');
    const payload = {
      hemocentro_id: formData.hemocentro_id,
      data_hora_doacao: `${year}-${month}-${day} ${formData.appointmentTime}:00`
    };

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/auth/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Falha no agendamento");
      setStep('success');
    } catch (err: any) {
      alert(err.message);
      navigate('/dashboard/donor');
    }
  };

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-12 max-w-4xl mx-auto px-4 w-full">
        {step === 'personal' && (
          <Card className="shadow-lg">
            <CardHeader className="bg-red-600 text-white rounded-t-lg">
              <CardTitle>Cadastro de Doador</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handlePersonalDataSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Nome Completo</Label>
                    <Input value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} required />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input placeholder="000.000.000-00" value={formData.cpf} onChange={e => handleInputChange('cpf', e.target.value)} required />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input placeholder="(00) 00000-0000" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required />
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={formData.birthDate} onChange={e => handleInputChange('birthDate', e.target.value)} required />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <Select value={formData.gender} onValueChange={v => handleInputChange('gender', v)} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                   <div className="sm:col-span-2">
                    <Label>E-mail</Label>
                    <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input value={formData.zipCode} onChange={e => handleInputChange('zipCode', e.target.value)} required />
                  </div>
                  <div>
                    <Label>Endereço (Rua, Nº, Bairro)</Label>
                    <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                  <Input type="password" placeholder="Senha" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} required />
                  <Input type="password" placeholder="Confirmar Senha" value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} required />
                </div>
                <Button type="submit" disabled={isRegistering} className="w-full bg-red-600 h-12 text-lg">
                  {isRegistering ? "Processando..." : "Criar Conta e Agendar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'appointment' && (
          <Card className="shadow-lg">
            <CardHeader className="bg-red-600 text-white rounded-t-lg">
              <CardTitle>Agendar Doação</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleAppointmentSubmit} className="space-y-6">
                <div>
                  <Label>Onde deseja doar?</Label>
                  <Select value={formData.hemocentro_id} onValueChange={v => handleInputChange('hemocentro_id', v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o Hemocentro" /></SelectTrigger>
                    <SelectContent>
                      {bloodCenters.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <Calendar mode="single" selected={date} onSelect={d => { setDate(d); if(d) handleInputChange('appointmentDate', format(d, "dd/MM/yyyy")); }} disabled={d => d < new Date()} className="border rounded" />
                  <div className="space-y-4">
                    <Label>Horário</Label>
                    <Select value={formData.appointmentTime} onValueChange={v => handleInputChange('appointmentTime', v)} required>
                      <SelectTrigger><SelectValue placeholder="Selecione o Horário" /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Observações" value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full bg-red-600 h-12">Confirmar Horário</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard/donor')} className="w-full h-12">Agora não, ir para meu painel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <div className="text-center py-20 space-y-6">
            <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
            <h1 className="text-3xl font-bold">Sucesso!</h1>
            <p className="text-gray-600">Sua conta foi criada e o agendamento realizado.</p>
            <Button onClick={() => navigate('/dashboard/donor')} className="bg-red-600 px-10 h-12">Acessar Painel</Button>
          </div>
        )}
      </div>
      
      {/* Modais de Idade e Responsável */}
      <Dialog open={showUnderageModal} onOpenChange={setShowUnderageModal}>
        <DialogContent>
          <DialogTitle>Idade Mínima</DialogTitle>
          <DialogDescription>É necessário ter no mínimo 16 anos para doar.</DialogDescription>
          <Button onClick={() => navigate('/')}>Voltar</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showGuardianModal} onOpenChange={setShowGuardianModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Dados do Responsável</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <Input placeholder="Nome do Responsável" value={guardianData.guardianName} onChange={e => handleGuardianInputChange('guardianName', e.target.value)} />
            <Input placeholder="CPF do Responsável" value={guardianData.guardianCpf} onChange={e => handleGuardianInputChange('guardianCpf', e.target.value)} />
            <Input type="date" value={guardianData.guardianBirthDate} onChange={e => handleGuardianInputChange('guardianBirthDate', e.target.value)} />
            <Input placeholder="Telefone do Responsável" value={guardianData.guardianPhone} onChange={e => handleGuardianInputChange('guardianPhone', e.target.value)} />
          </div>
          <Button onClick={() => setShowGuardianModal(false)} className="w-full bg-red-600">Confirmar</Button>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}