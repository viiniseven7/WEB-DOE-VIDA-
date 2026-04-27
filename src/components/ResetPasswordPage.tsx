import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Droplet, ArrowLeft, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f9f63502`;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: emailFromState,
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If no email in state, redirect to forgot password page
    if (!emailFromState) {
      navigate('/forgot-password');
    }
  }, [emailFromState, navigate]);

  const validateForm = () => {
    if (!formData.email || !formData.code || !formData.newPassword) {
      setError('Todos os campos são obrigatórios');
      return false;
    }

    if (formData.code.length !== 6 || !/^\d+$/.test(formData.code)) {
      setError('O código deve ter 6 dígitos');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
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

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success('Senha alterada com sucesso!');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Erro ao redefinir senha');
        toast.error(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Erro ao conectar com o servidor');
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Senha Alterada!
                  </h2>
                  <p className="text-gray-600">
                    Sua senha foi redefinida com sucesso. Redirecionando para o login...
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 bg-red-600 hover:bg-red-700"
                >
                  Ir para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplet className="h-6 w-6 text-red-600" />
                <span className="text-xl font-bold text-red-600">DoaVida</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/forgot-password')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Insira o código recebido e sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Enviamos um código de 6 dígitos para <strong>{formData.email}</strong>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="code">
                  Código de Recuperação <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={formData.code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      handleChange('code', value);
                    }}
                    required
                    disabled={isLoading}
                    className="h-11 pl-10 text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Digite o código de 6 dígitos enviado para seu email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  Nova Senha <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
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
                <p className="text-xs text-gray-500">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Nova Senha <span className="text-red-600">*</span>
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

              <Button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Alterando senha...' : 'Redefinir Senha'}
              </Button>

              <div className="space-y-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password', { state: { email: formData.email } })}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold block mx-auto"
                  disabled={isLoading}
                >
                  Não recebeu o código? Reenviar
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 hover:text-gray-700 block mx-auto"
                  disabled={isLoading}
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
