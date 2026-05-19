import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../contexts/AuthContext";
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
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "../services/api";

// ─── Helpers de formatação ────────────────────────────────────────────────────

function formatCPF(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCEP(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d)/, "$1-$2");
}

function formatTelefone(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

// ─── Helpers de validação ─────────────────────────────────────────────────────

function validarCPF(cpf: string): boolean {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(n[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(n[10]);
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function formatDateInputToApi(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function requiresGuardian(age: number): boolean {
  return age >= 16 && age < 18;
}

function isGuardianAgeValid(age: number): boolean {
  return age >= 18 && age <= 100;
}

function firstError(errors: Record<string, string[]>, key: string): string | undefined {
  const value = errors[key];
  return Array.isArray(value) && value.length > 0 ? value[0] : undefined;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: "Fraca", color: "bg-red-500" };
  if (score === 3) return { score, label: "Média", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Forte", color: "bg-green-500" };
  return { score, label: "Muito Forte", color: "bg-emerald-600" };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RegistrationDonationPage() {
  const navigate = useNavigate();
  const { signup, login, isAuthenticated, user } = useAuth() as any;

  const [step, setStep] = useState<"personal" | "appointment" | "success">("personal");
  const [date, setDate] = useState<Date>();
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [showUnderageModal, setShowUnderageModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bloodCenters, setBloodCenters] = useState<{id: string, label: string}[]>([]);

  useEffect(() => {
    if (isAuthenticated && step === "personal") setStep("appointment");
  }, [isAuthenticated, step]);

  useEffect(() => {
    const fetchHemocentros = async () => {
      try {
        const response = await api.get('/hemocentros');
        const data = response.data;
        const list = data.data || data;
        setBloodCenters(list.map((h: any) => ({ id: h.id.toString(), label: h.nome })));
      } catch (err) {
        console.error("Erro ao carregar hemocentros:", err);
      }
    };
    fetchHemocentros();
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    birthDate: "",
    gender: "",
    bloodType: "",
    email: "",
    telefone: "",
    zipCode: "",
    address: "",
    numero: "",
    city: "",
    state: "",
    password: "",
    confirmPassword: "",
    hemocentro_id: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  });

  const [guardianData, setGuardianData] = useState({
    guardianName: "",
    guardianCpf: "",
    guardianBirthDate: "",
    guardianPhone: "",
  });

  const timeSlots = [
    "08:00","08:30","09:00","09:30","10:00","10:30",
    "11:00","11:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00",
  ];

  const calculateAge = (dateStr: string): number => {
    if (!dateStr) return 0;
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const setError = (field: string, msg: string) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));
  const clearError = (field: string) =>
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });

  const applyBackendErrors = (backendErrors?: Record<string, string[]>) => {
    if (!backendErrors) return;

    const mappedErrors: Record<string, string> = {};

    const emailError = firstError(backendErrors, "email");
    if (emailError) mappedErrors.email = emailError;

    const cpfError = firstError(backendErrors, "cpf");
    if (cpfError) mappedErrors.cpf = cpfError;

    const phoneError = firstError(backendErrors, "telefone");
    if (phoneError) mappedErrors.telefone = phoneError;

    const birthDateError = firstError(backendErrors, "data_nasc");
    if (birthDateError) mappedErrors.birthDate = birthDateError;

    const guardianMessages = [
      firstError(backendErrors, "responsavel_nome"),
      firstError(backendErrors, "responsavel_cpf"),
      firstError(backendErrors, "responsavel_data_nasc"),
      firstError(backendErrors, "responsavel_telefone"),
    ].filter(Boolean) as string[];

    if (guardianMessages.length > 0) {
      mappedErrors.guardian = guardianMessages[0];
      setShowGuardianModal(true);
    }

    if (Object.keys(mappedErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...mappedErrors }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'telefone') finalValue = formatTelefone(value);
    if (field === 'cpf') finalValue = formatCPF(value);
    if (field === 'zipCode') {
      finalValue = formatCEP(value);
      const clean = value.replace(/\D/g, "");
      if (clean.length === 8) fetchCEP(clean);
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    clearError(field);

    if (field === "birthDate") {
      const age = calculateAge(value);
      if (age > 0 && age < 16) {
        setShowUnderageModal(true);
        setFormData((prev) => ({ ...prev, birthDate: "" }));
      } else if (requiresGuardian(age)) {
        setShowGuardianModal(true);
      }
    }
  };

  const fetchCEP = async (cep: string) => {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {}
  };

  const handleGuardianInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'guardianPhone') finalValue = formatTelefone(value);
    if (field === 'guardianCpf') finalValue = formatCPF(value);
    setGuardianData((prev) => ({ ...prev, [field]: finalValue }));
    clearError("guardian");
  };

  const handleGuardianModalConfirm = () => {
    if (!guardianData.guardianName || !guardianData.guardianCpf ||
        !guardianData.guardianBirthDate || !guardianData.guardianPhone) {
      alert("Preencha todos os campos do responsável.");
      return;
    }
    if (!validarCPF(guardianData.guardianCpf)) {
      alert("CPF do responsável inválido.");
      return;
    }
    const guardianAge = calculateAge(guardianData.guardianBirthDate);
    if (!isGuardianAgeValid(guardianAge)) {
      alert("O responsável deve ter entre 18 e 100 anos.");
      return;
    }
    if (![10, 11].includes(guardianData.guardianPhone.replace(/\D/g, "").length)) {
      alert("Telefone do responsável inválido.");
      return;
    }
    setShowGuardianModal(false);
  };

  const validatePersonal = (): boolean => {
    const newErrors: Record<string, string> = {};
    const age = calculateAge(formData.birthDate);

    if (!formData.fullName.trim() || formData.fullName.trim().split(" ").length < 2)
      newErrors.fullName = "Informe nome e sobrenome.";

    const cpfClean = formData.cpf.replace(/\D/g, "");
    if (!cpfClean) newErrors.cpf = "CPF obrigatório.";
    else if (cpfClean.length !== 11) newErrors.cpf = "CPF deve ter 11 dígitos.";
    else if (!validarCPF(cpfClean)) newErrors.cpf = "CPF inválido.";

    if (!formData.birthDate) newErrors.birthDate = "Data de nascimento obrigatória.";
    else if (age < 16) newErrors.birthDate = "É necessário ter no mínimo 16 anos.";

    if (!formData.gender) newErrors.gender = "Selecione o sexo.";

    if (!validarEmail(formData.email)) newErrors.email = "E-mail inválido.";

    const tel = formData.telefone.replace(/\D/g, "");
    if (tel.length !== 11) newErrors.telefone = "Telefone deve ter DDD + 9 dígitos.";

    const cep = formData.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) newErrors.zipCode = "CEP deve ter 8 dígitos.";

    if (!formData.numero.trim()) newErrors.numero = "Número obrigatório.";

    if (!formData.address.trim()) newErrors.address = "Endereço obrigatório.";
    if (!formData.city.trim()) newErrors.city = "Cidade obrigatória.";
    if (!formData.state) newErrors.state = "Estado obrigatório.";

    if (requiresGuardian(age)) {
      const guardianPhone = guardianData.guardianPhone.replace(/\D/g, "");

      if (!guardianData.guardianName || !guardianData.guardianCpf || !guardianData.guardianBirthDate || !guardianPhone) {
        newErrors.guardian = "Preencha os dados do responsável legal.";
      } else if (!validarCPF(guardianData.guardianCpf)) {
        newErrors.guardian = "CPF do responsável inválido.";
      } else if (![10, 11].includes(guardianPhone.length)) {
        newErrors.guardian = "Telefone do responsável inválido.";
      } else if (!isGuardianAgeValid(calculateAge(guardianData.guardianBirthDate))) {
        newErrors.guardian = "O responsável deve ter entre 18 e 100 anos.";
      }
    }

    const pwd = formData.password;
    if (pwd.length < 8) newErrors.password = "Senha deve ter no mínimo 8 caracteres.";
    else if (!/[A-Z]/.test(pwd)) newErrors.password = "Senha deve ter pelo menos uma letra maiúscula.";
    else if (!/[0-9]/.test(pwd)) newErrors.password = "Senha deve ter pelo menos um número.";

    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "As senhas não coincidem.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePersonalDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePersonal()) return;
    setStep("appointment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildRegistrationData = () => ({
    name: formData.fullName.trim(),
    email: formData.email.trim(),
    password: formData.password,
    password_confirmation: formData.confirmPassword,
    cpf: formData.cpf.replace(/\D/g, ""),
    sexo: formData.gender === "male" ? "M" : formData.gender === "female" ? "F" : "Outro",
    data_nasc: formatDateInputToApi(formData.birthDate),
    telefone: formData.telefone.replace(/\D/g, ""),
    tipo_sang: formData.bloodType && formData.bloodType !== "unknown"
      ? formData.bloodType.toUpperCase() : undefined,
    cep: formData.zipCode.replace(/\D/g, ""),
    rua: formData.address,
    numero: formData.numero,
    cidade: formData.city,
    uf: formData.state.substring(0, 2).toUpperCase(),
    responsavel_nome: guardianData.guardianName || undefined,
    responsavel_cpf: guardianData.guardianCpf?.replace(/\D/g, "") || undefined,
    responsavel_data_nasc: guardianData.guardianBirthDate
      ? formatDateInputToApi(guardianData.guardianBirthDate) : undefined,
    responsavel_telefone: guardianData.guardianPhone?.replace(/\D/g, "") || undefined,
  });

  const handleSkipAppointment = async () => {
    if (isAuthenticated) {
      navigate("/dashboard/doador");
      return;
    }

    if (!validatePersonal()) {
      setStep("personal");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsRegistering(true);
    try {
      const success = await signup(buildRegistrationData());

      if (success) {
        const loggedUser = await login(formData.email, formData.password);
        navigate(loggedUser ? "/dashboard/doador" : "/login", { replace: true });
      }
    } catch (error: any) {
      console.error("ERRO:", error.response?.data);
      const backendErrors = error.response?.data?.errors;
      if (backendErrors) {
        applyBackendErrors(backendErrors);
        const msgs = Object.values(backendErrors).flat().join("\n");
        alert(msgs);
        setStep("personal");
      } else {
        alert(error.response?.data?.message || "Erro ao cadastrar. Tente novamente.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { alert("Selecione uma data"); return; }
    if (!formData.hemocentro_id) { alert("Selecione um posto de coleta"); return; }
    if (!formData.appointmentTime) { alert("Selecione um horário"); return; }

    setIsRegistering(true);
    try {
      if (isAuthenticated) {
        await api.post("/auth/agendamentos", {
          hemocentro_id: Number(formData.hemocentro_id),
          data_hora_doacao: `${format(date, "yyyy-MM-dd")} ${formData.appointmentTime}:00`,
        });
        setStep("success");
        return;
      }

      const success = await signup(buildRegistrationData());

      if (success) {
        // Tenta fazer login automático
        const loggedUser = await login(formData.email, formData.password);
        if (loggedUser) {
          // Cria agendamento após login
          await api.post("/auth/agendamentos", {
            hemocentro_id: Number(formData.hemocentro_id),
            data_hora_doacao: `${format(date, "yyyy-MM-dd")} ${formData.appointmentTime}:00`,
          });
          setStep("success");
        } else {
          // Se falhar login automático, vai para sucesso mas avisa para logar
          setStep("success");
        }
      }
    } catch (error: any) {
      console.error("ERRO:", error.response?.data);
      const backendErrors = error.response?.data?.errors;
      if (backendErrors) {
        applyBackendErrors(backendErrors);
        const msgs = Object.values(backendErrors).flat().join("\n");
        alert(msgs);
      } else {
        alert(error.response?.data?.message || "Erro ao processar. Tente novamente.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const pwdStrength = getPasswordStrength(formData.password);

  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 py-20">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="border-green-200 text-center">
              <CardContent className="p-10 space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {isAuthenticated ? "Agendamento Realizado!" : "Cadastro Realizado!"}
                </h3>
                <p className="text-gray-600 text-lg">
                  {isAuthenticated
                    ? "Seu agendamento foi registrado com sucesso."
                    : "Seu cadastro foi realizado. Faça login para acompanhar seu agendamento."}
                </p>
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={() => navigate(isAuthenticated ? "/dashboard/doador" : "/login")}
                    className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
                  >
                    {isAuthenticated ? "Ir para Meu Dashboard" : "Fazer Login"}
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar para Início
                  </Button>
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 py-12">
        <div className="max-w-2xl mx-auto px-4">

          {/* Botão voltar */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                if (isAuthenticated) navigate(-1);
                else if (step === "personal") navigate("/");
                else setStep("personal");
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </div>

          {/* Progresso */}
          {!isAuthenticated && (
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step === "personal" ? "text-red-600" : "text-green-600"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white ${step === "personal" ? "bg-red-600" : "bg-green-600"}`}>
                  {step === "appointment" ? "✓" : "1"}
                </div>
                <span className="hidden sm:inline font-medium">Dados Pessoais</span>
              </div>
              <div className="h-1 w-16 bg-gray-200 rounded">
                <div className={`h-full rounded transition-all ${step === "appointment" ? "bg-red-600 w-full" : "w-0"}`} />
              </div>
              <div className={`flex items-center gap-2 ${step === "appointment" ? "text-red-600" : "text-gray-400"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white ${step === "appointment" ? "bg-red-600" : "bg-gray-300"}`}>
                  2
                </div>
                <span className="hidden sm:inline font-medium">Agendamento</span>
              </div>
            </div>
          )}

          {/* ── STEP 1: DADOS PESSOAIS ─────────────────────────────────────── */}
          {step === "personal" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="w-6 h-6 text-red-600" /> Dados Pessoais
                </CardTitle>
                <CardDescription>Preencha seus dados para se cadastrar no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePersonalDataSubmit} className="space-y-6" noValidate>

                  {/* Informações Básicas */}
                  <section className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">Informações Básicas</h3>

                    {/* Nome */}
                    <div>
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        placeholder="Nome e sobrenome"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className={errors.fullName ? "border-red-500" : ""}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* CPF */}
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          maxLength={14}
                          onChange={(e) => handleInputChange("cpf", e.target.value)}
                          className={errors.cpf ? "border-red-500" : ""}
                        />
                        {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
                      </div>

                      {/* Data de Nascimento */}
                      <div>
                        <Label htmlFor="birthDate">Data de Nascimento *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          max={format(new Date(), "yyyy-MM-dd")}
                          onChange={(e) => handleInputChange("birthDate", e.target.value)}
                          className={errors.birthDate ? "border-red-500" : ""}
                        />
                        {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                      </div>

                      {/* Sexo */}
                      <div>
                        <Label htmlFor="gender">Sexo *</Label>
                        <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                          <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Feminino</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                            <SelectItem value="prefer_not">Prefiro não informar</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                      </div>

                      {/* Tipo Sanguíneo (opcional) */}
                      <div>
                        <Label htmlFor="bloodType">Tipo Sanguíneo <span className="text-gray-400 font-normal">(opcional)</span></Label>
                        <Select value={formData.bloodType} onValueChange={(v) => handleInputChange("bloodType", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione se souber" />
                          </SelectTrigger>
                          <SelectContent>
                            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t) => (
                              <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                            ))}
                            <SelectItem value="unknown">Não sei</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  {/* Contato */}
                  <section className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">Contato</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone *</Label>
                        <Input
                          id="telefone"
                          placeholder="(00) 00000-0000"
                          value={formData.telefone}
                          maxLength={15}
                          onChange={(e) => handleInputChange("telefone", e.target.value)}
                          className={errors.telefone ? "border-red-500" : ""}
                        />
                        {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
                      </div>
                    </div>
                  </section>

                  {/* Endereço */}
                  <section className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">Endereço</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">CEP *</Label>
                        <Input
                          id="zipCode"
                          placeholder="00000-000"
                          value={formData.zipCode}
                          maxLength={9}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          className={errors.zipCode ? "border-red-500" : ""}
                        />
                        {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                        <p className="text-xs text-gray-400 mt-1">O endereço será preenchido automaticamente</p>
                      </div>
                      <div>
                        <Label htmlFor="numero">Número *</Label>
                        <Input
                          id="numero"
                          placeholder="Ex: 123"
                          maxLength={10}
                          value={formData.numero}
                          onChange={(e) => handleInputChange("numero", e.target.value.replace(/\D/g, ""))}
                          className={errors.numero ? "border-red-500" : ""}
                        />
                        {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="address">Rua *</Label>
                        <Input
                          id="address"
                          placeholder="Preenchido pelo CEP"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className={errors.address ? "border-red-500" : ""}
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                        <div>
                          <Label htmlFor="city">Cidade *</Label>
                          <Input
                            id="city"
                            placeholder="Preenchido pelo CEP"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            className={errors.city ? "border-red-500" : ""}
                          />
                          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                        <div>
                          <Label htmlFor="state">Estado *</Label>
                          <Select value={formData.state} onValueChange={(v) => handleInputChange("state", v)}>
                            <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
                                "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Senha */}
                  <section className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">Senha</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Senha *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formData.password && (
                          <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwdStrength.score ? pwdStrength.color : "bg-gray-200"}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">Força: <span className="font-medium">{pwdStrength.label}</span></p>
                          </div>
                        )}
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres, 1 maiúscula e 1 número</p>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repita a senha"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            className={`pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formData.confirmPassword && formData.password === formData.confirmPassword && (
                          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
                          </p>
                        )}
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </section>

                  {errors.guardian && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {errors.guardian}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                   <input type="checkbox" id="lgpd" required />
                    <label htmlFor="lgpd" className="text-sm text-gray-600">
                        Li e concordo com a{' '}
                    <a href="/privacidade" className="text-red-600 underline">
                    Política de Privacidade
                    </a>{' '}
                    e autorizo o uso dos meus dados para fins de doação de sangue, conforme a LGPD (Lei 13.709/2018).
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-lg py-6">
                    Continuar para Agendamento →
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── STEP 2: AGENDAMENTO ────────────────────────────────────────── */}
          {step === "appointment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CalendarIcon className="w-6 h-6 text-red-600" /> Agendar Doação
                </CardTitle>
                <CardDescription>Escolha o local, data e horário para sua doação</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAppointmentSubmit} className="space-y-6">
                  {/* Resumo */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-700 mb-1">Dados do Doador:</p>
                    <p><strong>Nome:</strong> {isAuthenticated ? user?.name : formData.fullName}</p>
                    <p><strong>CPF:</strong> {isAuthenticated ? user?.cpf : formData.cpf}</p>
                    <p><strong>E-mail:</strong> {isAuthenticated ? user?.email : formData.email}</p>
                  </div>

                  {/* Posto */}
                  <div>
                    <Label className="flex items-center gap-2 text-base mb-2">
                      <MapPin className="w-4 h-4 text-red-600" /> Posto de Coleta *
                    </Label>
                    <Select value={formData.hemocentro_id} onValueChange={(v) => handleInputChange("hemocentro_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um posto de coleta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodCenters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data */}
                  <div>
                    <Label className="flex items-center gap-2 text-base mb-2">
                      <CalendarIcon className="w-4 h-4 text-red-600" /> Data da Doação *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => {
                            setDate(d);
                            if (d) handleInputChange("appointmentDate", format(d, "dd/MM/yyyy"));
                          }}
                          disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Horário */}
                  <div>
                    <Label className="flex items-center gap-2 text-base mb-2">
                      <Clock className="w-4 h-4 text-red-600" /> Horário *
                    </Label>
                    <Select value={formData.appointmentTime} onValueChange={(v) => handleInputChange("appointmentTime", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observações */}
                  <div>
                    <Label htmlFor="notes">Observações <span className="text-gray-400 font-normal">(opcional)</span></Label>
                    <Textarea
                      id="notes"
                      placeholder="Alguma informação adicional..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1 text-sm text-blue-800">
                    <h4 className="font-semibold flex items-center gap-2"><Droplet className="w-4 h-4" /> Informações Importantes</h4>
                    <ul className="space-y-1 mt-2">
                      <li>• A doação leva cerca de 40-60 minutos no total</li>
                      <li>• Chegue com 15 minutos de antecedência</li>
                      <li>• Traga um documento oficial com foto</li>
                      <li>• Você receberá um lanche após a doação</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => isAuthenticated ? navigate(-1) : setStep("personal")} className="flex-1">
                        ← Voltar
                      </Button>
                      <Button type="submit" disabled={isRegistering} className="flex-1 bg-red-600 hover:bg-red-700 text-lg py-6">
                        {isRegistering ? "Processando..." : "Confirmar Agendamento"}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleSkipAppointment}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Processando..." : "Não agendar agora"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />

      {/* Modal Responsável (16-17 anos) */}
      <Dialog open={showGuardianModal} onOpenChange={setShowGuardianModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" /> Informações do Responsável Legal
            </DialogTitle>
            <DialogDescription>
              Como você tem 16 ou 17 anos, precisamos dos dados do seu responsável legal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome do Responsável *</Label>
              <Input placeholder="Nome completo" value={guardianData.guardianName}
                onChange={(e) => handleGuardianInputChange("guardianName", e.target.value)} />
            </div>
            <div>
              <Label>CPF do Responsável *</Label>
              <Input placeholder="000.000.000-00" maxLength={14} value={guardianData.guardianCpf}
                onChange={(e) => handleGuardianInputChange("guardianCpf", e.target.value)} />
            </div>
            <div>
              <Label>Data de Nascimento do Responsável *</Label>
              <Input
                type="date"
                value={guardianData.guardianBirthDate}
                min={format(new Date(new Date().setFullYear(new Date().getFullYear() - 100)), "yyyy-MM-dd")}
                max={format(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), "yyyy-MM-dd")}
                onChange={(e) => handleGuardianInputChange("guardianBirthDate", e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Telefone *</Label>
              <Input placeholder="(00) 00000-0000" maxLength={15} value={guardianData.guardianPhone}
                onChange={(e) => handleGuardianInputChange("guardianPhone", e.target.value)} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Importante:</strong> O responsável deverá estar presente no dia da doação com documento de identificação.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuardianModal(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleGuardianModalConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Menor de 16 anos */}
      <Dialog open={showUnderageModal} onOpenChange={setShowUnderageModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" /> Idade Mínima Não Atingida
            </DialogTitle>
            <DialogDescription>Você não possui a idade mínima para doação de sangue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
              <p className="font-semibold mb-1">❌ Infelizmente, você não pode doar sangue neste momento.</p>
              <p>Para ser apto à doação no Brasil, você precisa ter <strong>no mínimo 16 anos de idade</strong>.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">📅 Requisitos de Idade:</p>
              <ul className="space-y-1 ml-2">
                <li>• <strong>16 a 17 anos:</strong> Pode doar com autorização dos pais ou responsável legal</li>
                <li>• <strong>18 a 69 anos:</strong> Pode doar sem restrições</li>
                <li>• <strong>Acima de 60 anos:</strong> Somente se já tiver doado antes dos 60 anos</li>
              </ul>
            </div>
            <p className="text-center text-sm text-gray-500">
              Agradecemos seu interesse em ajudar a salvar vidas! 💙<br />
              Quando atingir a idade mínima, esperamos você de volta.
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => setShowUnderageModal(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
