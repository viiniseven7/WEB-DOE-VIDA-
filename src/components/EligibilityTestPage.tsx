import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function EligibilityTestPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<'eligible' | 'ineligible' | 'consult' | null>(null);

  const questions = [
    {
      id: 0,
      question: "Qual é a sua idade?",
      info: "A idade mínima para doar sangue é 16 anos (com autorização dos pais) e máxima 69 anos (para primeira doação).",
      options: [
        { value: "under16", label: "Menos de 16 anos", result: 'ineligible' },
        { value: "16-17", label: "16 ou 17 anos", result: 'consult' },
        { value: "18-69", label: "Entre 18 e 69 anos", result: 'eligible' },
        { value: "over69", label: "Mais de 69 anos (primeira doação)", result: 'ineligible' },
        { value: "over69-donor", label: "Mais de 69 anos (já sou doador)", result: 'eligible' }
      ]
    },
    {
      id: 1,
      question: "Qual é o seu peso?",
      info: "É necessário pesar no mínimo 50kg para doar sangue com segurança.",
      options: [
        { value: "under50", label: "Menos de 50kg", result: 'ineligible' },
        { value: "50-60", label: "Entre 50kg e 60kg", result: 'eligible' },
        { value: "over60", label: "Mais de 60kg", result: 'eligible' }
      ]
    },
    {
      id: 2,
      question: "Como você está se sentindo hoje?",
      info: "É importante estar em bom estado de saúde no dia da doação.",
      options: [
        { value: "great", label: "Muito bem, sem sintomas", result: 'eligible' },
        { value: "good", label: "Bem, apenas cansaço leve", result: 'eligible' },
        { value: "sick", label: "Com febre, gripe ou resfriado", result: 'ineligible' },
        { value: "unwell", label: "Indisposto ou com sintomas", result: 'ineligible' }
      ]
    },
    {
      id: 3,
      question: "Você dormiu bem nas últimas 24 horas?",
      info: "É recomendado ter dormido pelo menos 6 horas na noite anterior à doação.",
      options: [
        { value: "yes-8", label: "Sim, 8 horas ou mais", result: 'eligible' },
        { value: "yes-6", label: "Sim, entre 6-8 horas", result: 'eligible' },
        { value: "less-6", label: "Menos de 6 horas", result: 'ineligible' },
        { value: "no-sleep", label: "Não dormi", result: 'ineligible' }
      ]
    },
    {
      id: 4,
      question: "Você fez alguma refeição hoje?",
      info: "É importante estar alimentado antes de doar sangue. Evite apenas alimentos muito gordurosos.",
      options: [
        { value: "yes-normal", label: "Sim, uma refeição normal", result: 'eligible' },
        { value: "yes-light", label: "Sim, uma refeição leve", result: 'eligible' },
        { value: "yes-fatty", label: "Sim, mas muito gordurosa", result: 'consult' },
        { value: "no", label: "Não, estou em jejum", result: 'ineligible' }
      ]
    },
    {
      id: 5,
      question: "Você consumiu bebida alcoólica nas últimas 12 horas?",
      info: "É necessário aguardar 12 horas após consumo de álcool para doar sangue.",
      options: [
        { value: "no", label: "Não consumi", result: 'eligible' },
        { value: "yes-12", label: "Sim, há mais de 12 horas", result: 'eligible' },
        { value: "yes-recent", label: "Sim, há menos de 12 horas", result: 'ineligible' }
      ]
    },
    {
      id: 6,
      question: "Você está grávida, amamentando ou teve parto recente?",
      info: "Mulheres grávidas ou amamentando não podem doar. Após parto normal aguardar 90 dias, cesárea 180 dias.",
      options: [
        { value: "pregnant", label: "Estou grávida", result: 'ineligible' },
        { value: "breastfeeding", label: "Estou amamentando", result: 'ineligible' },
        { value: "recent-birth", label: "Tive parto há menos de 6 meses", result: 'ineligible' },
        { value: "no", label: "Não", result: 'eligible' },
        { value: "na", label: "Não se aplica", result: 'eligible' }
      ]
    },
    {
      id: 7,
      question: "Você fez tatuagem, piercing ou maquiagem definitiva recentemente?",
      info: "É necessário aguardar 12 meses após tatuagem, piercing ou maquiagem definitiva.",
      options: [
        { value: "no", label: "Não fiz", result: 'eligible' },
        { value: "yes-12", label: "Sim, há mais de 12 meses", result: 'eligible' },
        { value: "yes-recent", label: "Sim, há menos de 12 meses", result: 'ineligible' }
      ]
    },
    {
      id: 8,
      question: "Quando foi sua última doação de sangue?",
      info: "Homens podem doar a cada 60 dias (máx. 4x/ano). Mulheres a cada 90 dias (máx. 3x/ano).",
      options: [
        { value: "never", label: "Nunca doei", result: 'eligible' },
        { value: "male-60", label: "Sou homem, há mais de 60 dias", result: 'eligible' },
        { value: "female-90", label: "Sou mulher, há mais de 90 dias", result: 'eligible' },
        { value: "recent", label: "Doei recentemente", result: 'ineligible' }
      ]
    },
    {
      id: 9,
      question: "Você tem ou teve alguma dessas condições?",
      info: "Algumas condições impedem temporária ou permanentemente a doação de sangue.",
      options: [
        { value: "none", label: "Nenhuma dessas condições", result: 'eligible' },
        { value: "hepatitis", label: "Hepatite após 11 anos", result: 'ineligible' },
        { value: "malaria", label: "Malária", result: 'consult' },
        { value: "cancer", label: "Câncer", result: 'consult' },
        { value: "heart", label: "Doença cardíaca grave", result: 'consult' }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);
    
    const selectedOption = questions[currentQuestion].options.find(opt => opt.value === value);
    
    if (selectedOption?.result === 'ineligible') {
      setResult('ineligible');
    } else if (selectedOption?.result === 'consult') {
      setResult('consult');
    } else if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setResult('eligible');
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  const handleContinueToRegistration = async () => {
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
                  <p className="text-green-900 font-semibold text-lg">
                    📋 Próximos passos:
                  </p>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Faça seu cadastro e escolha um posto de coleta próximo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Leve um documento de identidade oficial com foto (RG, CNH ou Passaporte)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Esteja bem alimentado (evite alimentos gordurosos 3h antes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Beba bastante água antes e depois da doação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Evite esforços físicos nas 12 horas seguintes à doação</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6" 
                    onClick={handleContinueToRegistration}
                  >
                    Continuar para Cadastro e Agendamento
                  </Button>
                  <Button variant="outline" onClick={resetQuiz} className="sm:w-auto">
                    Refazer Teste
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
                  <p className="text-red-900 font-semibold text-lg">
                    ℹ️ O que você pode fazer:
                  </p>
                  <ul className="space-y-2 text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Aguarde o período necessário e tente novamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Consulte um médico para esclarecer dúvidas sobre sua elegibilidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Entre em contato com um de nossos postos para mais informações</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Compartilhe esta causa com amigos e familiares que possam doar</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    onClick={resetQuiz}
                    className="flex-1"
                  >
                    Refazer Teste
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
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
                <div className="bg-amber-100 rounded-lg p-6 text-left space-y-3">
                  <p className="text-amber-900 font-semibold text-lg">
                    📄 Informações importantes:
                  </p>
                  <ul className="space-y-2 text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Menores de 18 anos precisam de autorização dos pais/responsáveis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Algumas condições podem permitir doação com avaliação médica</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Ligue para o posto antes de comparecer para confirmar os requisitos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Leve documento de identidade e, se menor, documentos dos responsáveis</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    onClick={resetQuiz}
                    className="sm:w-auto"
                  >
                    Refazer Teste
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    Ver Postos de Coleta
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para início
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
                <CardTitle>Pergunta {currentQuestion + 1} de {questions.length}</CardTitle>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentQuestion + 1) / questions.length) * 100)}% completo
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <CardDescription className="text-lg mb-2">
                  {questions[currentQuestion].question}
                </CardDescription>
                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  💡 {questions[currentQuestion].info}
                </p>
              </div>

              <RadioGroup 
                value={answers[currentQuestion] || ''} 
                onValueChange={handleAnswer}
              >
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-red-300 transition-all"
                      onClick={() => handleAnswer(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {currentQuestion > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
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
