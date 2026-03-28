import { useState } from "react";
import { useNavigate } from "react-router";
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
import { toast } from "sonner@2.0.3";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f9f63502`;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetCode, setResetCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Por favor, insira seu email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, insira um email válido");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Check if email was actually sent or if we're in dev mode
        if (data.emailSent) {
          toast.success("Código enviado para seu email!");
        } else {
          // Email failed, but we're providing the code on screen
          if (
            data.emailError &&
            data.emailError.includes("API key")
          ) {
            toast.warning(
              "Modo desenvolvimento - Configure Resend para envio de emails",
              {
                description:
                  "Veja SOLUÇÃO_RÁPIDA_EMAIL.md para instruções",
                duration: 5000,
              },
            );
          } else {
            toast.info(
              "Modo desenvolvimento - Código gerado localmente",
            );
          }
        }

        // In development, we receive the code in the response
        if (data.codeForDev) {
          setResetCode(data.codeForDev);
        }
      } else {
        setError(
          data.error || "Erro ao enviar código de recuperação",
        );
        toast.error("Erro ao processar solicitação");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Erro ao conectar com o servidor");
      toast.error("Erro de conexão");
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
            <CardTitle className="text-2xl">
              Esqueci a Senha
            </CardTitle>
            <CardDescription>
              {success
                ? "Código de recuperação gerado com sucesso"
                : "Insira seu email para receber um código de recuperação"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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
                    Enviaremos um código de 6 dígitos para este
                    email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Código"}
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
                    Código de recuperação enviado com sucesso!
                  </AlertDescription>
                </Alert>

                {resetCode && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <p className="text-sm font-semibold text-gray-700">
                          Modo Desenvolvimento
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">
                        Em produção, este código seria enviado
                        por email.
                        <br />
                        <a
                          href="/CONFIGURAÇÃO_EMAIL.md"
                          target="_blank"
                          className="text-red-600 hover:text-red-700 underline"
                        >
                          Configure o Resend
                        </a>{" "}
                        para enviar emails reais.
                      </p>
                      <div className="bg-white border-2 border-red-300 rounded-lg p-4 inline-block">
                        <p className="text-xs text-gray-600 mb-1">
                          Seu código de recuperação:
                        </p>
                        <p className="text-3xl font-bold text-red-600 tracking-wider font-mono">
                          {resetCode}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Válido por 15 minutos
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {resetCode
                      ? "Use o código acima para redefinir sua senha."
                      : "Verifique sua caixa de entrada e use o código recebido para redefinir sua senha."}
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
                      setResetCode("");
                    }}
                    variant="outline"
                    className="w-full h-11"
                  >
                    Reenviar Código
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-600 pt-4 border-t">
                  Não recebeu o código?{" "}
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