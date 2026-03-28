import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Droplet, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SeedButton } from './SeedButton';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      toast.success('Login realizado com sucesso!');
      // Navigate will be handled by Root component based on user role
    } else {
      setError('Email ou senha inválidos. Verifique suas credenciais e tente novamente.');
      toast.error('Falha no login');
    }
  };

  const fillCredentials = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
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
                Bem-vindo de volta!
              </h2>
              <p className="text-red-100 text-lg mb-8">
                Entre na sua conta para acessar seu painel e continuar salvando vidas através da doação de sangue.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">+50.000</p>
                    <p className="text-sm text-red-100">Doadores Cadastrados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">+150.000</p>
                    <p className="text-sm text-red-100">Vidas Salvas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
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
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                  Entre com suas credenciais para acessar sua conta
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold"
                        disabled={isLoading}
                      >
                        Esqueci a senha
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      className="text-red-600 hover:text-red-700 font-semibold"
                      disabled={isLoading}
                    >
                      Cadastre-se
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600 font-semibold">Credenciais de teste:</p>
                    <SeedButton />
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillCredentials('doador@example.com', 'doador123')}
                      className="justify-start text-left h-auto py-2"
                    >
                      <div>
                        <p className="font-semibold text-red-600">Doador</p>
                        <p className="text-gray-600">doador@example.com / doador123</p>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillCredentials('funcionario@hemocentro.com', 'funcionario123')}
                      className="justify-start text-left h-auto py-2"
                    >
                      <div>
                        <p className="font-semibold text-blue-600">Funcionário</p>
                        <p className="text-gray-600">funcionario@hemocentro.com / funcionario123</p>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillCredentials('diretor@hemocentro.com', 'diretor123')}
                      className="justify-start text-left h-auto py-2"
                    >
                      <div>
                        <p className="font-semibold text-purple-600">Diretor</p>
                        <p className="text-gray-600">diretor@hemocentro.com / diretor123</p>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillCredentials('admin@doavida.com', 'admin123')}
                      className="justify-start text-left h-auto py-2"
                    >
                      <div>
                        <p className="font-semibold text-green-600">Administrador</p>
                        <p className="text-gray-600">admin@doavida.com / admin123</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}