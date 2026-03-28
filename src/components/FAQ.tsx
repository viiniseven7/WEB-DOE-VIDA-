import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question: "Quanto tempo leva o processo de doação?",
      answer: "O processo completo de doação de sangue leva cerca de 40 a 60 minutos, incluindo cadastro, triagem, coleta e lanche. A coleta do sangue em si leva apenas 10 a 15 minutos."
    },
    {
      question: "A doação de sangue dói?",
      answer: "Você sentirá apenas uma pequena picada da agulha no momento da inserção. Durante a coleta, a maioria dos doadores não sente dor, apenas um leve desconforto. Nossa equipe está sempre presente para garantir seu conforto."
    },
    {
      question: "Com que frequência posso doar sangue?",
      answer: "Homens podem doar a cada 60 dias (até 4 vezes ao ano). Mulheres podem doar a cada 90 dias (até 3 vezes ao ano). Esse intervalo é importante para que seu corpo recupere as células sanguíneas doadas."
    },
    {
      question: "Preciso estar em jejum para doar?",
      answer: "Não! Você deve estar bem alimentado. Recomendamos fazer uma refeição leve antes da doação, evitando alimentos muito gordurosos nas 3 horas anteriores. Também é importante estar bem hidratado."
    },
    {
      question: "Quais documentos preciso levar?",
      answer: "Você precisa levar um documento de identidade oficial com foto (RG, CNH, passaporte, carteira de trabalho ou certificado de reservista). Para menores de 18 anos, é necessária autorização dos pais ou responsável legal."
    },
    {
      question: "Posso doar sangue se tiver tatuagem?",
      answer: "Sim, mas você deve aguardar 12 meses após ter feito a tatuagem antes de doar. Isso garante que não haja risco de transmissão de doenças infecciosas."
    },
    {
      question: "O que acontece com meu sangue após a doação?",
      answer: "Seu sangue é testado, processado e separado em diferentes componentes (hemácias, plasma, plaquetas). Cada componente pode ajudar diferentes pacientes. Uma única doação pode salvar até 4 vidas!"
    },
    {
      question: "Existe algum efeito colateral?",
      answer: "A maioria das pessoas não apresenta efeitos colaterais. Alguns doadores podem sentir tontura leve ou cansaço temporário. Por isso, recomendamos descansar por alguns minutos após a doação e evitar esforços físicos intensos no dia."
    },
    {
      question: "Posso doar se tiver tomado vacina recentemente?",
      answer: "Depende da vacina. Para vacinas de vírus inativado (como gripe), você pode doar imediatamente. Para vacinas de vírus atenuado, geralmente é preciso aguardar 4 semanas. Consulte nosso posto para informações específicas."
    },
    {
      question: "Meu sangue é compatível com todos os tipos?",
      answer: "Não. O sangue tipo O negativo (O-) é considerado doador universal para hemácias. AB positivo (AB+) é receptor universal. É importante doar independentemente do seu tipo sanguíneo, pois todos são necessários."
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl text-gray-900 mb-4">Perguntas Frequentes</h2>
          <p className="text-xl text-gray-600">
            Tire suas dúvidas sobre doação de sangue
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-lg px-6 bg-gray-50"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}