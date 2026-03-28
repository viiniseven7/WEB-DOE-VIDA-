import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Droplet, ArrowLeft, Eye, EyeOff, User, Mail, Lock, Phone, FileText, Heart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    bloodType: '',
    role: 'donor' as const,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um email válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const { confirmPassword, ...signupData } = formData;
    const result = await signup(signupData);
    
    setIsLoading(false);

    if (result.success) {
      toast.success('Conta criada com sucesso!');
      toast.info('Agora você pode fazer login com suas credenciais');
      navigate('/login');
    } else {
      setError(result.error || 'Erro ao criar conta. Tente novamente.');
      toast.error('Falha no cadastro');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-12 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <Droplet className="h-10 w-10" />
                </div>
                <h1 className="text-4xl font-bold">DoaVida</h1>
              </div>
              <h2 className="text-3xl font-semibold mb-4">
                Faça parte da nossa comunidade
              </h2>
              <p className="text-red-100 text-lg mb-8">
                Cadastre-se agora e comece a salvar vidas através da doação de sangue. Juntos, podemos fazer a diferença!
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Processo Simples</p>
                    <p className="text-sm text-red-100">Cadastro rápido e seguro</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Agende Doações</p>
                    <p className="text-sm text-red-100">Escolha o melhor horário para você</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Acompanhe seu Histórico</p>
                    <p className="text-sm text-red-100">Veja todas as suas doações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Signup Form */}
          <div>
            <Card className="shadow-xl border-0">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 md:hidden">
                    <Droplet className="h-6 w-6 text-red-600" />
                    <span className="text-xl font-bold text-red-600">DoaVida</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </div>
                <CardTitle className="text-2xl">Criar Conta</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para se cadastrar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome Completo <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Senha <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirmar Senha <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange('confirmPassword', e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(11) 98765-4321"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          disabled={isLoading}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="cpf"
                          type="text"
                          placeholder="123.456.789-00"
                          value={formData.cpf}
                          onChange={(e) => handleChange('cpf', e.target.value)}
                          disabled={isLoading}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
                    <div className="relative">
                      <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) => handleChange('bloodType', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 pl-10">
                          <SelectValue placeholder="Selecione seu tipo sanguíneo" />
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

                  <Button
                    type="submit"
                    className="w-full h-11 bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-red-600 hover:text-red-700 font-semibold"
                      disabled={isLoading}
                    >
                      Faça login
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
