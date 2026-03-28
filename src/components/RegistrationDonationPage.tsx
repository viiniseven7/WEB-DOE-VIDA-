import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
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
    // Agendamento
    location: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const bloodCenters = [
    { value: "hc-sp", label: "Hemocentro Central - São Paulo" },
    { value: "hc-rj", label: "Hemocentro Central - Rio de Janeiro" },
    { value: "hc-mg", label: "Hemocentro Central - Belo Horizonte" },
    { value: "hc-rs", label: "Hemocentro Central - Porto Alegre" },
    { value: "hc-ba", label: "Hemocentro Central - Salvador" }
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", 
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonalDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('appointment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria enviado ao backend
    console.log('Dados do formulário:', formData);
    setStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-green-200">
              <CardContent className="p-8 md:p-12 space-y-6">
                {/* Cabeçalho de Sucesso */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-14 h-14 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">Pré-Agendamento Realizado com Sucesso!</h3>
                  <p className="text-lg text-gray-600">
                    Recebemos suas informações e seu agendamento foi registrado.
                  </p>
                </div>

                {/* Detalhes do Agendamento */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-green-900 text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Detalhes do Seu Agendamento
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-green-800">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-green-700">Nome</p>
                        <p className="font-semibold">{formData.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-green-700">E-mail</p>
                        <p className="font-semibold">{formData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-green-700">Local</p>
                        <p className="font-semibold">{bloodCenters.find(c => c.value === formData.location)?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-green-700">Data e Hora</p>
                        <p className="font-semibold">{formData.appointmentDate} às {formData.appointmentTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AVISO IMPORTANTE - Triagem Presencial */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-3 flex-1">
                      <h4 className="font-bold text-amber-900 text-lg">⚠️ Informação Muito Importante</h4>
                      <div className="space-y-2 text-amber-900">
                        <p className="font-semibold">
                          Este teste online foi apenas para coletar informações preliminares e agilizar seu atendimento.
                        </p>
                        <p>
                          <strong>A elegibilidade final será determinada no hemocentro</strong> através de uma triagem médica presencial completa, que inclui:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 ml-2 text-sm">
                          <li>Entrevista detalhada com profissional de saúde</li>
                          <li>Verificação de sinais vitais (pressão arterial, temperatura, pulso)</li>
                          <li>Teste de hemoglobina/hematócrito</li>
                          <li>Análise do histórico médico completo</li>
                          <li>Avaliação de impedimentos temporários ou definitivos</li>
                        </ul>
                        <p className="pt-2 bg-amber-100 -mx-2 -mb-2 px-2 py-3 rounded-b">
                          <strong>O funcionário do hemocentro tem autoridade para:</strong><br/>
                          • Atualizar ou corrigir suas informações cadastrais<br/>
                          • Declarar sua elegibilidade ou inaptidão para doação<br/>
                          • Solicitar exames ou documentos adicionais<br/>
                          • Reagendar sua doação se necessário
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orientações para o Dia da Doação */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-3">
                  <h4 className="font-semibold text-blue-900 text-lg flex items-center gap-2">
                    <Droplet className="w-5 h-5" />
                    Prepare-se para o Dia da Doação
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">📋 Documentos Obrigatórios:</p>
                      <ul className="text-sm text-blue-800 space-y-1 ml-4">
                        <li>• Documento oficial com foto (RG, CNH, Passaporte ou Carteira de Trabalho)</li>
                        <li>• Se menor de 18 anos: autorização dos pais + documento do responsável</li>
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">🍽️ Alimentação:</p>
                      <ul className="text-sm text-blue-800 space-y-1 ml-4">
                        <li>• Faça uma refeição leve antes de doar</li>
                        <li>• Evite alimentos gordurosos 3-4 horas antes</li>
                        <li>• NÃO doe em jejum</li>
                        <li>• Evite bebidas alcoólicas 12 horas antes</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-900 mb-2">💧 Hidratação:</p>
                      <ul className="text-sm text-blue-800 space-y-1 ml-4">
                        <li>• Beba pelo menos 500ml de água antes de doar</li>
                        <li>• Continue se hidratando após a doação</li>
                        <li>• Evite bebidas com cafeína em excesso</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-900 mb-2">😴 Descanso:</p>
                      <ul className="text-sm text-blue-800 space-y-1 ml-4">
                        <li>• Durma pelo menos 6 horas na noite anterior</li>
                        <li>• Evite exercícios físicos intensos no dia</li>
                        <li>• Chegue com 15 minutos de antecedência</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* O que esperar no hemocentro */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 space-y-3">
                  <h4 className="font-semibold text-purple-900 text-lg">🏥 O que Acontece no Hemocentro</h4>
                  <div className="space-y-2 text-sm text-purple-800">
                    <div className="flex gap-3">
                      <span className="font-bold text-purple-600 flex-shrink-0">1.</span>
                      <p><strong>Cadastro e Recepção:</strong> Apresente seu documento e confirme seus dados (5-10 min)</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-purple-600 flex-shrink-0">2.</span>
                      <p><strong>Triagem Clínica:</strong> Entrevista, verificação de sinais vitais e teste de hemoglobina (15-20 min)</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-purple-600 flex-shrink-0">3.</span>
                      <p><strong>Coleta de Sangue:</strong> O procedimento em si leva cerca de 10-15 minutos</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-purple-600 flex-shrink-0">4.</span>
                      <p><strong>Lanche e Descanso:</strong> Alimentação e hidratação pós-doação (10-15 min)</p>
                    </div>
                    <p className="pt-2 font-semibold text-purple-900">
                      ⏱️ Tempo total estimado: 40 a 60 minutos
                    </p>
                  </div>
                </div>

                {/* Após a doação */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 space-y-3">
                  <h4 className="font-semibold text-red-900 text-lg">❤️ Cuidados Após a Doação</h4>
                  <ul className="text-sm text-red-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Mantenha o curativo por pelo menos 4 horas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Evite esforços físicos intensos por 12 horas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Não fume por 2 horas após doar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Aumente a ingestão de líquidos nas próximas 24 horas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Se sentir tontura, sente-se e abaixe a cabeça entre as pernas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Em caso de sintomas persistentes, entre em contato com o hemocentro</span>
                    </li>
                  </ul>
                </div>

                {/* Confirmação por Email */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-indigo-900 mb-1">📧 Confirmação Enviada</h4>
                      <p className="text-sm text-indigo-800">
                        Um e-mail de confirmação foi enviado para <strong>{formData.email}</strong> com todos os detalhes do seu agendamento e estas orientações.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagem Motivacional */}
                <div className="text-center py-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                  <p className="text-lg font-semibold text-gray-900">
                    🩸 Você está prestes a salvar até 4 vidas!
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Obrigado por ser um herói. Sua doação faz toda a diferença.
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col gap-4 pt-4">
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
                  >
                    Fazer Login para Acompanhar Meu Agendamento
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      Imprimir Comprovante
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/')}
                    >
                      Voltar para Início
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => step === 'personal' ? navigate('/') : setStep('personal')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>

          {/* Aviso para quem não fez o teste */}
          {step === 'personal' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Recomendação Importante</h4>
                  <p className="text-sm text-blue-800">
                    Antes de fazer o cadastro, recomendamos que você realize o{' '}
                    <button 
                      onClick={() => navigate('/teste-elegibilidade')}
                      className="underline font-medium hover:text-blue-600"
                    >
                      Teste de Elegibilidade
                    </button>
                    {' '}para verificar se você atende aos requisitos para doação de sangue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de Progresso */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'personal' ? 'text-red-600' : 'text-green-600'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === 'personal' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {step === 'appointment' ? '✓' : '1'}
                </div>
                <span className="hidden sm:inline font-medium">Dados Pessoais</span>
              </div>
              <div className="h-1 w-16 bg-gray-300">
                <div className={`h-full ${step === 'appointment' ? 'bg-red-600' : 'bg-gray-300'} transition-all`} />
              </div>
              <div className={`flex items-center gap-2 ${step === 'appointment' ? 'text-red-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === 'appointment' ? 'bg-red-600 text-white' : 'bg-gray-300'
                }`}>
                  2
                </div>
                <span className="hidden sm:inline font-medium">Agendamento</span>
              </div>
            </div>
          </div>

          {step === 'personal' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="w-6 h-6 text-red-600" />
                  Dados Pessoais
                </CardTitle>
                <CardDescription>
                  Preencha seus dados para fazer o cadastro no sistema de doação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePersonalDataSubmit} className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Informações Básicas</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="fullName">Nome Completo *</Label>
                        <Input
                          id="fullName"
                          placeholder="Digite seu nome completo"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => handleInputChange('cpf', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="birthDate">Data de Nascimento *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender">Sexo *</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Feminino</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bloodType">Tipo Sanguíneo (se souber)</Label>
                        <Select value={formData.bloodType} onValueChange={(value) => handleInputChange('bloodType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a+">A+</SelectItem>
                            <SelectItem value="a-">A-</SelectItem>
                            <SelectItem value="b+">B+</SelectItem>
                            <SelectItem value="b-">B-</SelectItem>
                            <SelectItem value="ab+">AB+</SelectItem>
                            <SelectItem value="ab-">AB-</SelectItem>
                            <SelectItem value="o+">O+</SelectItem>
                            <SelectItem value="o-">O-</SelectItem>
                            <SelectItem value="unknown">Não sei</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contato</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone/Celular *</Label>
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Endereço</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">CEP *</Label>
                        <Input
                          id="zipCode"
                          placeholder="00000-000"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="address">Endereço Completo *</Label>
                        <Input
                          id="address"
                          placeholder="Rua, número, complemento"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="state">Estado *</Label>
                        <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-lg py-6">
                    Continuar para Agendamento →
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'appointment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CalendarIcon className="w-6 h-6 text-red-600" />
                  Agendar Doação
                </CardTitle>
                <CardDescription>
                  Escolha o local, data e horário para sua doação de sangue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAppointmentSubmit} className="space-y-6">
                  {/* Resumo dos Dados Pessoais */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-gray-700">Dados Cadastrados:</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span><strong>Nome:</strong> {formData.fullName}</span>
                      <span><strong>CPF:</strong> {formData.cpf}</span>
                      <span><strong>Email:</strong> {formData.email}</span>
                    </div>
                  </div>

                  {/* Seleção de Local */}
                  <div>
                    <Label htmlFor="location" className="flex items-center gap-2 text-base mb-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      Posto de Coleta *
                    </Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um posto de coleta" />
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

                  {/* Seleção de Data */}
                  <div>
                    <Label className="flex items-center gap-2 text-base mb-2">
                      <CalendarIcon className="w-4 h-4 text-red-600" />
                      Data da Doação *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                            if (newDate) {
                              handleInputChange('appointmentDate', format(newDate, "dd/MM/yyyy"));
                            }
                          }}
                          disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Seleção de Horário */}
                  <div>
                    <Label htmlFor="time" className="flex items-center gap-2 text-base mb-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      Horário *
                    </Label>
                    <Select value={formData.appointmentTime} onValueChange={(value) => handleInputChange('appointmentTime', value)} required>
                      <SelectTrigger>
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

                  {/* Observações */}
                  <div>
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Alguma informação adicional que gostaria de compartilhar..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Informativo */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Droplet className="w-4 h-4" />
                      Informações Importantes
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• A doação leva cerca de 40-60 minutos no total</li>
                      <li>• Chegue com 15 minutos de antecedência</li>
                      <li>• Traga um documento oficial com foto</li>
                      <li>• Você receberá um lanche após a doação</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep('personal')}
                      className="flex-1"
                    >
                      ← Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-lg py-6"
                    >
                      Confirmar Agendamento
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}