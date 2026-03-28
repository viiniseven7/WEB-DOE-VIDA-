import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export function EligibilityChecker() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<'eligible' | 'ineligible' | 'consult' | null>(null);

  const questions = [
    {
      id: 0,
      question: "Qual é a sua idade?",
      options: [
        { value: "under16", label: "Menos de 16 anos", result: 'ineligible' },
        { value: "16-17", label: "16 ou 17 anos", result: 'consult' },
        { value: "18-69", label: "Entre 18 e 69 anos", result: 'eligible' },
        { value: "over69", label: "Mais de 69 anos", result: 'ineligible' }
      ]
    },
    {
      id: 1,
      question: "Qual é o seu peso?",
      options: [
        { value: "under50", label: "Menos de 50kg", result: 'ineligible' },
        { value: "over50", label: "50kg ou mais", result: 'eligible' }
      ]
    },
    {
      id: 2,
      question: "Você está se sentindo bem de saúde?",
      options: [
        { value: "yes", label: "Sim, estou bem", result: 'eligible' },
        { value: "no", label: "Não, não estou bem", result: 'ineligible' }
      ]
    },
    {
      id: 3,
      question: "Você dormiu pelo menos 6 horas nas últimas 24 horas?",
      options: [
        { value: "yes", label: "Sim", result: 'eligible' },
        { value: "no", label: "Não", result: 'ineligible' }
      ]
    },
    {
      id: 4,
      question: "Você está grávida ou amamentando?",
      options: [
        { value: "yes", label: "Sim", result: 'ineligible' },
        { value: "no", label: "Não", result: 'eligible' },
        { value: "na", label: "Não se aplica", result: 'eligible' }
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

  if (result === 'eligible') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-green-200">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-14 h-14 text-green-600" />
                </div>
              </div>
              <h3 className="text-3xl text-gray-900">Você está apto para doar!</h3>
              <p className="text-xl text-gray-600">
                Com base nas suas respostas, você atende aos requisitos básicos para doação de sangue.
              </p>
              <div className="bg-green-100 rounded-lg p-6 text-left space-y-2">
                <p className="text-green-900">
                  <strong>Próximos passos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-green-800">
                  <li>Escolha um posto de coleta próximo</li>
                  <li>Agende sua doação</li>
                  <li>Leve um documento de identidade com foto</li>
                  <li>Esteja bem alimentado e hidratado</li>
                </ul>
              </div>
              <div className="flex gap-4">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                  const element = document.getElementById('agendamento');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Agendar Doação
                </Button>
                <Button variant="outline" onClick={resetQuiz}>
                  Refazer Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (result === 'ineligible') {
    return (
      <div className="bg-gradient-to-br from-red-50 to-rose-50 py-20">
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
              <div className="bg-red-100 rounded-lg p-6 text-left">
                <p className="text-red-900 mb-2">
                  <strong>O que você pode fazer:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  <li>Consulte um médico para saber quando poderá doar</li>
                  <li>Entre em contato com um de nossos postos para mais informações</li>
                  <li>Compartilhe esta causa com amigos e familiares</li>
                </ul>
              </div>
              <Button variant="outline" onClick={resetQuiz}>
                Refazer Teste
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (result === 'consult') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 py-20">
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
                Para menores de 18 anos, é necessária autorização dos pais ou responsáveis legais para doar sangue.
              </p>
              <div className="bg-amber-100 rounded-lg p-6 text-left">
                <p className="text-amber-900 mb-2">
                  <strong>Documentos necessários:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li>Documento de identidade com foto</li>
                  <li>Formulário de autorização assinado pelos pais/responsável</li>
                  <li>Documento de identidade do responsável</li>
                </ul>
              </div>
              <div className="flex gap-4">
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700">
                  Baixar Formulário
                </Button>
                <Button variant="outline" onClick={resetQuiz}>
                  Refazer Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-gray-900 mb-4">Verificador de Elegibilidade</h2>
          <p className="text-xl text-gray-600">
            Responda algumas perguntas para verificar se você pode doar sangue
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
            <CardDescription className="text-lg">
              {questions[currentQuestion].question}
            </CardDescription>

            <RadioGroup 
              value={answers[currentQuestion] || ''} 
              onValueChange={handleAnswer}
            >
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
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
                Voltar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
