import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger
} from "./ui/popover";
import { CalendarIcon, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface FormData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  sexo: string;
  cep: string;
  rua: string;
  numero: string;
  cidade: string;
  telefone?: string;
  tipo_sang?: string;
  hemocentro_id?: string;
  time?: string;
}

// 🔐 funções auxiliares
const isStrongPassword = (password: string) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' };
  if (score === 3) return { score, label: 'Média', color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Forte', color: 'bg-green-500' };
  return { score, label: 'Muito Forte', color: 'bg-emerald-600' };
};

export function AppointmentForm() {
  const [date, setDate] = useState<Date | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    cpf: "",
    sexo: "",
    cep: "",
    rua: "",
    numero: "",
    cidade: "",
    telefone: "",
    tipo_sang: "",
    hemocentro_id: "",
    time: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      alert("Selecione a data");
      return;
    }

    if (!isStrongPassword(formData.password)) {
      alert("Senha fraca!");
      return;
    }

    try {
      await api.post("/auth/register", {
        ...formData,
        data_nasc: format(date, "dd/MM/yyyy"),
        password_confirmation: formData.password,
      });

      setIsSubmitted(true);
      alert("Sucesso!");
    } catch (error: any) {
      console.error(error);
      alert("Erro");
    }
  };

  if (isSubmitted) {
    return <div>Cadastro realizado com sucesso!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <Input
        placeholder="Nome"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <Input
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      {/* SENHA CORRIGIDA */}
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Senha"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-2"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </div>

      {/* força da senha */}
      {formData.password && (
        <p>
          Força: {getPasswordStrength(formData.password).label}
        </p>
      )}

      <Button type="submit">Cadastrar</Button>
    </form>
  );
}