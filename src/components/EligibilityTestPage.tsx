import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Opcao {
  id: number;
  texto_opcao: string;
  gera_inaptidao: boolean;
  dias_inaptidao: number | null;
}

interface Pergunta {
  id: number;
  pergunta: string;
  bloco: number;
  obrigatoria: boolean;
  opcoes: Opcao[];
}

interface RespostaParaSalvar {
  pergunta_id: number;
  opcao_id: number;
  gera_inaptidao: boolean;
  dias_inaptidao: number | null;
}

export function EligibilityTestPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth() as any;

  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [isLoadingPerguntas, setIsLoadingPerguntas] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, RespostaParaSalvar>>({});
  const [selectedOpcaoId, setSelectedOpcaoId] = useState<number | null>(null);
  const [result, setResult] = useState<'eligible' | 'ineligible' | 'consult' | null>(null);

  useEffect(() => {
    const fetchPerguntas = async () => {
      try {
        const res = await api.get('/triagens/perguntas?bloco=0');
        const data = res.data?.data ?? res.data ?? [];

        if (Array.isArray(data)) {
          setPerguntas(data);
        }
      } catch (err) {
        console.error("Erro ao carregar perguntas:", err);
      } finally {
        setIsLoadingPerguntas(false);
      }
    };

    fetchPerguntas();
  }, []);

  const salvarNoSessionStorage = (
    respostasFinais: Record<number, RespostaParaSalvar>,
    resultadoGeral: 'apto' | 'inapto' | 'consulte_medico'
  ) => {
    const payload = {
      resultado_geral: resultadoGeral,
      respostas: Object.values(respostasFinais).map(r => ({
        pergunta_id: r.pergunta_id,
        opcao_id: r.opcao_id,
        resultado_geral: resultadoGeral,
      })),
    };

    sessionStorage.setItem('pre_triagem', JSON.stringify(payload));
  };

  const handleAnswer = (opcaoIdStr: string) => {
    const opcaoId = Number(opcaoIdStr);
    const perguntaAtual = perguntas[currentQuestion];
    const opcaoSelecionada = perguntaAtual.opcoes.find(o => o.id === opcaoId);

    if (!opcaoSelecionada) return;

    setSelectedOpcaoId(opcaoId);

    const novasRespostas = {
      ...respostas,
      [perguntaAtual.id]: {
        pergunta_id: perguntaAtual.id,
        opcao_id: opcaoId,
        gera_inaptidao: opcaoSelecionada.gera_inaptidao,
        dias_inaptidao: opcaoSelecionada.dias_inaptidao,
      },
    };

    setRespostas(novasRespostas);

    if (opcaoSelecionada.gera_inaptidao) {
      salvarNoSessionStorage(novasRespostas, 'inapto');
      setResult('ineligible');
      return;
    }

    if (currentQuestion < perguntas.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOpcaoId(null);
      }, 300);
    } else {
      salvarNoSessionStorage(novasRespostas, 'apto');
      setResult('eligible');
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setRespostas({});
    setSelectedOpcaoId(null);
    setResult(null);
    sessionStorage.removeItem('pre_triagem');
  };

  const handleContinuarCadastro = async () => {
    salvarNoSessionStorage(respostas, 'apto');
    sessionStorage.setItem('doevida_eligibility_result', 'eligible');
    sessionStorage.setItem('doevida_eligibility_checked_at', new Date().toISOString());
    
    if (isAuthenticated) {
      try {
        await api.post('/auth/elegibilidade', { apto: true });
      } catch (err) {
        console.error("Erro ao salvar elegibilidade na API:", err);
      }
    }
    
    navigate('/cadastro-doacao');
  };

  if (isLoadingPerguntas) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 animate-pulse">Carregando questionário...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (perguntas.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <p className="text-gray-600">Não foi possível carregar o questionário. Tente novamente mais tarde.</p>
          <Button onClick={() => navigate('/')}>Voltar para início</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (result === 'eligible') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-green-200">
              <CardContent className="p-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl text-gray-900">Parabéns! Você está apto para doar!</h3>
                <p className="text-xl text-gray-600">
                  Com base nas suas respostas, você atende aos requisitos básicos para doação de sangue.
                </p>
                <div className="bg-green-100 rounded-lg p-6 text-left space-y-3">
                  <p className="text-green-900 font-semibold text-lg">📋 Próximos passos:</p>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start gap-2"><span className="text-green-600 mt-1">✓</span><span>Faça seu cadastro e escolha um posto de coleta próximo</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-600 mt-1">✓</span><span>Leve um documento de identidade oficial com foto (RG, CNH ou Passaporte)</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-600 mt-1">✓</span><span>Esteja bem alimentado (evite alimentos gordurosos 3h antes)</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-600 mt-1">✓</span><span>Beba bastante água antes e depois da doação</span></li>
                    <li className="flex items-start gap-2"><span className="text-green-600 mt-1">✓</span><span>Evite esforços físicos nas 12 horas seguintes à doação</span></li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6" 
                    onClick={handleContinuarCadastro}
                  >
                    Continuar para Cadastro e Agendamento
                  </Button>
                  <Button variant="outline" onClick={resetQuiz} className="sm:w-auto">Refazer Teste</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (result === 'ineligible') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-red-200">
              <CardContent className="p-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-14 h-14 text-red-600" />
                  </div>
                </div>
                <h3 className="text-3xl text-gray-900">Você não está apto para doar no momento</h3>
                <p className="text-xl text-gray-600">
                  Com base nas suas respostas, você não atende a todos os requisitos básicos para doação de sangue neste momento.
                </p>
                <div className="bg-red-100 rounded-lg p-6 text-left space-y-3">
                  <p className="text-red-900 font-semibold text-lg">ℹ️ O que você pode fazer:</p>
                  <ul className="space-y-2 text-red-800">
                    <li className="flex items-start gap-2"><span className="text-red-600 mt-1">•</span><span>Aguarde o período necessário e tente novamente</span></li>
                    <li className="flex items-start gap-2"><span className="text-red-600 mt-1">•</span><span>Consulte um médico para esclarecer dúvidas sobre sua elegibilidade</span></li>
                    <li className="flex items-start gap-2"><span className="text-red-600 mt-1">•</span><span>Entre em contato com um de nossos postos para mais informações</span></li>
                    <li className="flex items-start gap-2"><span className="text-red-600 mt-1">•</span><span>Compartilhe esta causa com amigos e familiares que possam doar</span></li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" onClick={resetQuiz} className="flex-1">Refazer Teste</Button>
                  <Button onClick={() => navigate('/')} className="flex-1 bg-red-600 hover:bg-red-700">Voltar para Início</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (result === 'consult') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-br from-amber-50 to-yellow-50 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-amber-200">
              <CardContent className="p-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-14 h-14 text-amber-600" />
                  </div>
                </div>
                <h3 className="text-3xl text-gray-900">Consulte um Posto de Coleta</h3>
                <p className="text-xl text-gray-600">
                  Sua situação requer uma avaliação mais detalhada. Entre em contato com um posto de coleta para verificar sua elegibilidade.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" onClick={resetQuiz} className="sm:w-auto">Refazer Teste</Button>
                  <Button onClick={() => navigate('/')} className="flex-1 bg-amber-600 hover:bg-amber-700">Ver Postos de Coleta</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const perguntaAtual = perguntas[currentQuestion];

  if (!perguntaAtual) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar para início
            </Button>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-4xl text-gray-900 mb-4">Teste de Elegibilidade para Doação</h2>
            <p className="text-xl text-gray-600">
              Responda as perguntas abaixo para verificar se você pode doar sangue hoje
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Pergunta {currentQuestion + 1} de {perguntas.length}</CardTitle>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentQuestion + 1) / perguntas.length) * 100)}% completo
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / perguntas.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <CardDescription className="text-lg mb-2">
                  {perguntaAtual.pergunta}
                </CardDescription>
              </div>

              <RadioGroup
                value={selectedOpcaoId !== null ? String(selectedOpcaoId) : ''}
                onValueChange={handleAnswer}
              >
                <div className="space-y-3">
                  {perguntaAtual.opcoes.map((opcao) => (
                    <div
                      key={opcao.id}
                      className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-red-300 transition-all"
                    >
                      <RadioGroupItem value={String(opcao.id)} id={String(opcao.id)} />
                      <Label htmlFor={String(opcao.id)} className="flex-1 cursor-pointer">
                        {opcao.texto_opcao}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {currentQuestion > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentQuestion(prev => prev - 1);
                    setSelectedOpcaoId(null);
                  }}
                  className="w-full"
                >
                  ← Voltar para pergunta anterior
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
