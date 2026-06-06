import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Droplet,
  ArrowLeft,
  Mail,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const getApiErrorMessage = (error: any) => {
    const data = error?.response?.data;
    const firstValidationError = data?.errors
      ? Object.values(data.errors).flat().find(Boolean)
      : null;

    return (
      firstValidationError ||
      data?.details ||
      data?.error ||
      data?.message ||
      "Erro ao enviar codigo de recuperacao."
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Por favor, insira seu email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, insira um email valido.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      const data = response.data;

      setSuccess(true);

      toast.success(data.message || "Codigo enviado para seu email.");
    } catch (error: any) {
      console.error("Forgot password error:", error?.response?.data || error);
      const message = getApiErrorMessage(error);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/reset-password", { state: { email } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplet className="h-6 w-6 text-red-600" />
                <span className="text-xl font-bold text-red-600">
                  DoaVida
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            <CardTitle className="text-2xl">Esqueci a Senha</CardTitle>
            <CardDescription>
              {success
                ? "Codigo de recuperacao enviado com sucesso."
                : "Insira seu email para receber um codigo de recuperacao."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seuemail@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Enviaremos um codigo de 6 digitos para este email.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Codigo"}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Lembrou sua senha?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-red-600 hover:text-red-700 font-semibold"
                    disabled={isLoading}
                  >
                    Fazer login
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Codigo de recuperacao enviado para seu email.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Verifique sua caixa de entrada e use o codigo recebido para redefinir sua senha.
                  </p>

                  <Button
                    onClick={handleContinue}
                    className="w-full h-11 bg-red-600 hover:bg-red-700"
                  >
                    Continuar para Redefinir Senha
                  </Button>

                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full h-11"
                  >
                    Reenviar Codigo
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-600 pt-4 border-t">
                  Nao recebeu o codigo?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    Voltar ao login
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
