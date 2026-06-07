import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  extractApiList, 
  extractApiObject, 
  getStatus, 
  getDateKey, 
  getAppointmentDonor, 
  getAppointmentUserId, 
  getHemocentroId,
  getUserRoles
} from '../../services/api-normalizers';
import { buildDashboardNotifications } from '../../services/dashboard-notifications';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarUI } from '../ui/calendar';
import {
  Droplet,
  Calendar,
  Users,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Activity,
  ChevronDown,
  Plus,
  Minus,
  Phone,
  Mail,
  Edit,
  AlertCircle,
  Stethoscope,
  CalendarDays,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tiposSanguineos = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const demoAgendaNames = [
  'Aline Ferreira', 'Bruno Varella', 'Camila Noronha', 'Diego Furtado', 'Elisa Tavares',
  'Fernando Queiroz', 'Giovana Siqueira', 'Hugo Barcellos', 'Isadora Menezes', 'Joao Vitor Paiva',
  'Karina Dourado', 'Leonardo Peixoto', 'Mariana Azevedo', 'Nicolas Freire', 'Olivia Campos',
  'Paulo Henrique Dantas', 'Quiteria Lopes', 'Rafael Sampaio', 'Sabrina Mello', 'Thiago Arruda',
  'Ursula Nogueira', 'Vinicius Teixeira', 'Wesley Batista', 'Yasmin Coelho', 'Zuleica Ramos',
  'Adriana Pontes', 'Bernardo Gusmao', 'Cecilia Matos', 'Davi Rezende', 'Estela Figueiredo',
  'Fabricio Moura', 'Graziella Cunha', 'Heitor Pacheco', 'Ingrid Salazar', 'Julia Marcondes',
  'Kaique Neves', 'Lorena Bastos', 'Matheus Silveira', 'Nathalia Prado', 'Otavio Seabra',
  'Priscila Ventura', 'Renato Galvao', 'Samara Farias', 'Talita Borges', 'Ulisses Duarte',
  'Valeria Pinheiro', 'William Santana', 'Ximena Leal', 'Yuri Alencar', 'Zelia Monteiro',
];

const buildDemoAgendaDays = (referenceDate: Date) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const uniqueDays: number[] = [];

  offsets.forEach((offset) => {
    const candidate = referenceDate.getDate() + offset;
    if (candidate >= 1 && candidate <= daysInMonth && !uniqueDays.includes(candidate)) {
      uniqueDays.push(candidate);
    }
  });

  let cursor = 1;
  while (uniqueDays.length < 10 && cursor <= daysInMonth) {
    if (!uniqueDays.includes(cursor)) {
      uniqueDays.push(cursor);
    }
    cursor += 1;
  }

  return uniqueDays.slice(0, 10).sort((a, b) => a - b);
};

const buildDemoAgendaAppointments = (referenceDate: Date, hemocentroId?: number | string) => {
  if (!hemocentroId) return [];

  const days = buildDemoAgendaDays(referenceDate);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const slots = ['08:00:00', '09:15:00', '10:30:00', '13:30:00', '15:00:00'];

  return demoAgendaNames.slice(0, 50).map((name, index) => {
    const day = days[Math.floor(index / 5)];
    const slot = slots[index % 5];
    const donorId = `demo-donor-${index + 1}`;
    const bloodType = tiposSanguineos[index % tiposSanguineos.length];
    const date = new Date(year, month, day);
    const dateKey = format(date, 'yyyy-MM-dd');
    const cpfBase = String(10000000000 + index).slice(0, 11);

    return {
      id: `demo-agendamento-${index + 1}`,
      user_id: donorId,
      doador_id: donorId,
      hemocentro_id: hemocentroId,
      data_hora_doacao: `${dateKey} ${slot}`,
      status: 'AGE',
      status_agendamento: 'AGE',
      doador: {
        id: donorId,
        name,
        cpf: cpfBase,
        tipo_sang: bloodType,
        tipo_sanguineo: bloodType,
      },
      observacao_demo: true,
    };
  });
};

const normalizeSearchText = (value: any) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getDonorBloodType = (donor: any) =>
  donor?.tipo_sanguineo || donor?.tipo_sang || donor?.tipo_sangue || '';

const isDonorRecord = (user: any) =>
  Number(user?.role_id) === 1 || ['doador', 'donor'].includes(normalizeSearchText(user?.role || user?.role_name));

const getDonationDonorId = (doacao: any) =>
  doacao?.user_id || doacao?.doador_id || doacao?.donor_id || doacao?.user?.id || doacao?.doador?.id || doacao?.donor?.id;

const getDonationDonor = (doacao: any, doadores: any[]) => {
  const embeddedDonor = doacao?.doador || doacao?.user || doacao?.donor;
  if (embeddedDonor?.name || embeddedDonor?.nome) {
    return embeddedDonor;
  }

  const donorId = getDonationDonorId(doacao);
  if (!donorId) return null;

  return doadores.find((doador) => Number(doador?.id) === Number(donorId)) || null;
};

const isDemoAppointment = (agendamento: any) => agendamento?.observacao_demo === true;
const isDemoDonation = (doacao: any) => String(doacao?.id || '').startsWith('demo-doacao-');

const getAgendaDonorSearchData = (agendamento: any, doador?: any) => {
  const donorData = doador || getAppointmentDonor(agendamento);
  const name = String(
    donorData?.name ||
    donorData?.nome ||
    agendamento?.user_name ||
    agendamento?.doador_name ||
    agendamento?.nome ||
    ''
  );
  const cpf = String(
    donorData?.cpf ||
    agendamento?.cpf ||
    agendamento?.user_cpf ||
    ''
  ).replace(/\D/g, '');
  const bloodType = String(
    getDonorBloodType(donorData) ||
    agendamento?.tipo_sang ||
    agendamento?.tipo_sanguineo ||
    agendamento?.tipo_sangue ||
    ''
  );

  return { name, cpf, bloodType };
};

const getApiErrorMessage = (err: any, fallback = 'Tente novamente') => {
  const data = err?.response?.data;

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data && typeof data === 'object') {
    const values = Object.values(data)
      .flatMap((value: any) => Array.isArray(value) ? value : [value])
      .filter((value: any) => typeof value === 'string' && value.trim());

    if (values.length > 0) {
      return values.join(', ');
    }
  }

  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }

  return fallback;
};

const normalizeTriagemText = (value: any) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getDateAfterDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, days));
  return format(date, 'yyyy-MM-dd');
};

const getCurrentLocalDate = () => format(new Date(), 'yyyy-MM-dd');
const getCurrentLocalDateTime = () => format(new Date(), 'yyyy-MM-dd HH:mm:ss');

const getCreatedTriagem = (payload: any) =>
  extractApiObject(payload, ['triagem', 'data']);

const getCreatedDoacao = (payload: any) =>
  extractApiObject(payload, ['doacao', 'data']);

const getTriagemApto = (payload: any, fallbackResultado?: string) => {
  const triagem = getCreatedTriagem(payload);
  const explicitApto = payload?.apto ?? payload?.data?.apto ?? triagem?.apto;
  const statusTriagem = String(payload?.status_triagem ?? payload?.data?.status_triagem ?? triagem?.status_triagem ?? '').toUpperCase();
  const resultado = String(
    payload?.aptidao?.resultado ??
    payload?.data?.aptidao?.resultado ??
    triagem?.aptidao?.resultado ??
    fallbackResultado ??
    ''
  ).toLowerCase();

  if (explicitApto === true || explicitApto === 1 || explicitApto === '1' || explicitApto === 'true') return true;
  if (explicitApto === false || explicitApto === 0 || explicitApto === '0' || explicitApto === 'false') return false;
  if (statusTriagem === 'P' || statusTriagem === 'APTO') return true;
  if (resultado === 'apto') return true;
  return false;
};

const extractPerguntasResponse = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const buildTriagemPayload = ({
  agendamentoId,
  userId,
  hemocentroId,
  dataTriagem,
  sinaisPayload,
  respostasPayload,
  aptidaoPayload,
}: {
  agendamentoId: number | string;
  userId: number | string;
  hemocentroId?: number | string;
  dataTriagem: string;
  sinaisPayload: Record<string, number>;
  respostasPayload: Array<{ pergunta_id: number; opcao_id: number }>;
  aptidaoPayload: Record<string, any>;
}) => {
  const resultado = String(aptidaoPayload.resultado || '').toLowerCase();
  const apto = resultado === 'apto';

  return {
    agendamento_id: agendamentoId,
    user_id: userId,
    hemocentro_id: hemocentroId,
    data_triagem: dataTriagem,
    apto,
    motivo_inaptidao: apto ? null : aptidaoPayload.categoria_inaptidao || null,
    observacoes: aptidaoPayload.observacoes_internas || null,
    sinais_vitais: Object.keys(sinaisPayload).length > 0 ? sinaisPayload : undefined,
    respostas: respostasPayload.length > 0 ? respostasPayload : undefined,
    aptidao: aptidaoPayload,
  };
};

const inferTemporaryCategory = (questionText: string) => {
  if (questionText.includes('medicamento')) return 'medicamento_incompativel';
  if (questionText.includes('cirurgia')) return 'cirurgia_recente';
  if (questionText.includes('risco') || questionText.includes('infecc')) return 'comportamento_de_risco';
  return 'condicao_clinica_na_triagem';
};

const selectedOptionIsYes = (optionText: string) =>
  optionText === 'sim' || optionText.startsWith('sim ') || optionText.includes(' sim');

const selectedOptionIsNo = (optionText: string) =>
  optionText === 'nao' || optionText.startsWith('nao ') || optionText.includes(' nao');

const analyzeTemporaryInaptidao = (perguntas: any[], respostas: Record<number, number>) => {
  const impedimentos: Array<{
    motivo: string;
    categoria: string;
    diasInaptidao: number | null;
  }> = [];

  perguntas.forEach((pergunta) => {
    const opcaoId = respostas[pergunta.id];
    const opcao = pergunta.opcoes?.find((item: any) => Number(item.id) === Number(opcaoId));
    if (!opcao) return;

    const questionText = normalizeTriagemText(pergunta.pergunta);
    const optionText = normalizeTriagemText(opcao.texto_opcao);
    const answeredYes = selectedOptionIsYes(optionText);
    const answeredNo = selectedOptionIsNo(optionText);
    const diasDaOpcao = Number.isFinite(Number(opcao.dias_inaptidao))
      ? Number(opcao.dias_inaptidao)
      : null;

    if (opcao.gera_inaptidao === true) {
      impedimentos.push({
        motivo: pergunta.pergunta,
        categoria: inferTemporaryCategory(questionText),
        diasInaptidao: diasDaOpcao,
      });
      return;
    }

    const addIf = (condition: boolean, categoria: string, diasInaptidao: number | null) => {
      if (condition) {
        impedimentos.push({
          motivo: pergunta.pergunta,
          categoria,
          diasInaptidao,
        });
      }
    };

    addIf(
      (questionText.includes('sentindo') || questionText.includes('bem')) && answeredNo,
      'condicao_clinica_na_triagem',
      null
    );
    addIf(
      questionText.includes('aliment') && answeredNo,
      'condicao_clinica_na_triagem',
      null
    );
    addIf(
      (questionText.includes('dormiu') || questionText.includes('sono')) &&
        (answeredNo || optionText.includes('menos de 6') || optionText.includes('menos que 6') || optionText.includes('<6')),
      'condicao_clinica_na_triagem',
      1
    );
    addIf(
      questionText.includes('alcool') || questionText.includes('alcoolica') || questionText.includes('bebida alcoolica')
        ? answeredYes
        : false,
      'condicao_clinica_na_triagem',
      1
    );
    addIf(
      (questionText.includes('gripe') || questionText.includes('resfriado') || questionText.includes('infecc')) && answeredYes,
      'condicao_clinica_na_triagem',
      7
    );
    addIf(
      (questionText.includes('tatuagem') || questionText.includes('piercing')) && answeredYes,
      'comportamento_de_risco',
      183
    );
    addIf(
      (questionText.includes('transfus') || questionText.includes('transplante')) && answeredYes,
      'condicao_clinica_na_triagem',
      365
    );
    addIf(
      questionText.includes('vacina') && answeredYes,
      'condicao_clinica_na_triagem',
      diasDaOpcao
    );
    addIf(
      (questionText.includes('risco') || questionText.includes('transmissiveis pelo sangue')) && answeredYes,
      'comportamento_de_risco',
      diasDaOpcao
    );
    addIf(
      questionText.includes('medicamento') && answeredYes,
      'medicamento_incompativel',
      diasDaOpcao
    );
    addIf(
      questionText.includes('cirurgia') && answeredYes,
      'cirurgia_recente',
      diasDaOpcao
    );
  });

  const impedimento = impedimentos[0];
  return {
    resultado: impedimento ? 'inapto_temporario' as const : 'apto' as const,
    categoria: impedimento?.categoria || '',
    validoAte: impedimento?.diasInaptidao != null ? getDateAfterDays(impedimento.diasInaptidao) : '',
    motivos: impedimentos.map((item) => item.motivo),
  };
};

const emptyStaffStats = {
  agendamentos_hoje: 0,
  confirmados_hoje: 0,
  doacoes_mes: 0,
  estoque_critico: [] as string[],
  agendamentos_semana: {} as Record<string, number>,
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function StaffDashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  // ── Estado: dados da API
  const [hemocentros, setHemocentros] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [doadores, setDoadores] = useState<any[]>([]);
  const [stats, setStats] = useState(emptyStaffStats);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── Estado: API de Estoque
  const [stock, setStock] = useState<any[]>([]);
  const [doacoes, setDoacoes] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // ── Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorBloodTypeFilter, setDonorBloodTypeFilter] = useState('');
  const [donorGenderFilter, setDonorGenderFilter] = useState('');
  const [donorStatusFilter, setDonorStatusFilter] = useState('');
  const [donorCityFilter, setDonorCityFilter] = useState('');
  const [donorMinAge, setDonorMinAge] = useState('');
  const [donorMaxAge, setDonorMaxAge] = useState('');
  const [donorLastDonationSince, setDonorLastDonationSince] = useState('');
  const [donorLastDonationUntil, setDonorLastDonationUntil] = useState('');
  
  const [donorResult, setDonorResult] = useState<any[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isSearchingDonors, setIsSearchingDonors] = useState(false);
  const [donorPagination, setDonorPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // ── Dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');

  const [triagemDialogOpen, setTriagemDialogOpen] = useState(false);
  const [triagemData, setTriagemData] = useState({
    apto: true,
    motivo_inaptidao: '',
    observacoes: '',
    ml_coletados: '450',
  });
  // Estados para triagem clínica dinâmica
  const [perguntas, setPerguntas] = useState<any[]>([]);
  const [respostasTriagem, setRespostasTriagem] = useState<Record<number, number>>({});
  const [sinaisVitais, setSinaisVitais] = useState({
    peso: '',
    pressao_sistolica: '',
    pressao_diastolica: '',
    temperatura: '',
    frequencia_cardiaca: '',
    hemoglobina: '',
    hematocrito: '',
  });
  const [aptidaoFormal, setAptidaoFormal] = useState({
    resultado: 'apto' as 'apto' | 'inapto_temporario' | 'inapto_definitivo',
    categoria_inaptidao: '',
    observacoes_internas: '',
    valido_ate: '',
  });
  const triagemAutomatica = useMemo(
    () => analyzeTemporaryInaptidao(perguntas, respostasTriagem),
    [perguntas, respostasTriagem]
  );

  useEffect(() => {
    setAptidaoFormal((prev) => {
      if (triagemAutomatica.resultado === 'inapto_temporario') {
        return {
          ...prev,
          resultado: 'inapto_temporario',
          categoria_inaptidao: triagemAutomatica.categoria || prev.categoria_inaptidao,
          valido_ate: triagemAutomatica.validoAte || prev.valido_ate,
        };
      }

      return {
        ...prev,
        resultado: prev.resultado === 'inapto_definitivo' ? prev.resultado : 'apto',
        categoria_inaptidao: prev.resultado === 'inapto_definitivo' ? prev.categoria_inaptidao : '',
        valido_ate: prev.resultado === 'inapto_definitivo' ? prev.valido_ate : '',
      };
    });
  }, [triagemAutomatica]);

  const [editDonorDialogOpen, setEditDonorDialogOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [editDonorData, setEditDonorData] = useState({
    tipo_sang: '',
    telefone: '',
    status: '1',
    tempo_restricao: '',
  });

  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockAmount, setStockAmount] = useState('');
  const [stockSourceDonation, setStockSourceDonation] = useState<any>(null);
  const [stockUpdatedDonationIds, setStockUpdatedDonationIds] = useState<Array<number | string>>([]);
  const [stockDonationsExpanded, setStockDonationsExpanded] = useState(false);

  // Alerta médico
  const [alertaDialogOpen, setAlertaDialogOpen]     = useState(false);
  const [alertaDoador, setAlertaDoador]             = useState<any>(null);
  const [alertaForm, setAlertaForm]                 = useState({
    tipo_alerta: 'resultado_sorologico' as 'resultado_sorologico' | 'convocacao_retorno' | 'outro',
    notificacao_doador: '',
  });

  // Histórico tipo sanguíneo
  const [tipoSangDialogOpen, setTipoSangDialogOpen] = useState(false);
  const [tipoSangDoador, setTipoSangDoador]         = useState<any>(null);
  const [tipoSangHistorico, setTipoSangHistorico]   = useState<any[]>([]);
  const [tipoSangForm, setTipoSangForm]             = useState({
    tipo_sangue_novo: '',
    categoria_motivo: '',
  });

  // ─── Guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (Number(user.role_id) !== 2 && !getUserRoles(user).includes('funcionario')) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const [
      hemocentrosResult,
      agendResult,
      usersResult,
      doacoesResult,
      stockResult,
      statsResult,
      bloco1Result,
      bloco3Result,
      bloco4Result
    ] = await Promise.allSettled([
      api.get('/hemocentros'),
      api.get('/agendamentos'),
      api.get('/users'),
      api.get('/doacoes'),
      api.get('/estoque'),
      api.get('/estatisticas/funcionario'),
      api.get('/triagens/perguntas', { params: { bloco: 1 } }),
      api.get('/triagens/perguntas', { params: { bloco: 3 } }),
      api.get('/triagens/perguntas', { params: { bloco: 4 } }),
    ]);

    if (hemocentrosResult.status === 'fulfilled') {
      const hemocentrosData = Array.isArray(hemocentrosResult.value.data)
        ? hemocentrosResult.value.data
        : hemocentrosResult.value.data.data ?? [];
      setHemocentros(hemocentrosData);
    } else {
      setHemocentros([]);
    }

    // Triagem Questions
    const extractPerguntas = (res: any) => (res.status === 'fulfilled')
      ? extractPerguntasResponse(res.value.data)
      : [];
    const todasPerguntas = [
      ...extractPerguntas(bloco1Result),
      ...extractPerguntas(bloco3Result),
      ...extractPerguntas(bloco4Result),
    ];
    setPerguntas(todasPerguntas);

    // Agendamentos
    if (agendResult.status === 'fulfilled') {
      const agendRes = agendResult.value;
      const agends = Array.isArray(agendRes.data)
        ? agendRes.data : agendRes.data.data ?? agendRes.data.agendamentos ?? [];

      const agendsFiltrados = agends.filter((a: any) => {
        const hemocentroId = getHemocentroId(a);
        return !hemocentroId || !getHemocentroId(user) || Number(hemocentroId) === Number(getHemocentroId(user));
      });
      const isLocalDemo =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const demoAgendamentos = isLocalDemo
        ? buildDemoAgendaAppointments(new Date(), getHemocentroId(user))
        : [];
      setAgendamentos([...demoAgendamentos, ...agendsFiltrados]);
    } else {
      console.error('Erro ao carregar agendamentos:', agendResult.reason?.response?.data || agendResult.reason);
      toast.error('Erro ao carregar agendamentos');
    }

    // Doadores
    if (usersResult.status === 'fulfilled') {
      const usersRes = usersResult.value;
      const users = Array.isArray(usersRes.data)
        ? usersRes.data : usersRes.data.data ?? usersRes.data.users ?? [];
      setDoadores(users.filter(isDonorRecord));
    } else {
      console.warn('Erro ao carregar doadores:', usersResult.reason?.response?.data || usersResult.reason);
      setDoadores([]);
    }

    // Doacoes
    if (doacoesResult.status === 'fulfilled') {
      const doacoesRes = doacoesResult.value;
      const donations = extractApiList(doacoesRes.data, ['data']);
      const filteredDonations = donations.filter((doacao: any) => {
        const hemocentroId = getHemocentroId(doacao);
        return !hemocentroId || !getHemocentroId(user) || Number(hemocentroId) === Number(getHemocentroId(user));
      });
      setDoacoes(filteredDonations);
    } else {
      console.warn('Erro ao carregar doacoes:', doacoesResult.reason?.response?.data || doacoesResult.reason);
      setDoacoes([]);
    }

    // Estoque
    if (stockResult.status === 'fulfilled') {
      const stockRes = stockResult.value;
      const stockData = Array.isArray(stockRes.data) ? stockRes.data : stockRes.data.data ?? [];
      setStock(stockData.map((s: any) => ({
        id: s.id,
        type: s.tipo_sangue,
        current: Number(s.quantidade),
        min: Number(s.quantidade_minima || 0),
        max: 100
      })));
    } else {
      console.warn('Erro ao carregar estoque:', stockResult.reason?.response?.data || stockResult.reason);
    }

    // Estatísticas
    if (statsResult.status === 'fulfilled') {
      const statsRes = statsResult.value;
      setStats({ ...emptyStaffStats, ...statsRes.data });
    } else {
      console.warn('Erro ao carregar estatísticas:', statsResult.reason?.reason?.response?.data || statsResult.reason);
      setStats(emptyStaffStats);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user || (Number(user.role_id) !== 2 && !getUserRoles(user).includes('funcionario'))) return null;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const hemocentroNomeResolvido =
    user.hemocentro?.nome ||
    user.hemocentroName ||
    hemocentros.find((hemocentro: any) => Number(hemocentro.id) === Number(user.hemocentro_id))?.nome ||
    '';
  const hemocentroNome = hemocentroNomeResolvido
    ? `Hemocentro ${hemocentroNomeResolvido}`
    : 'Hemocentro vinculado';
  const notifications = useMemo(() => buildDashboardNotifications({
    hemocentroId: Number(user?.hemocentro_id),
    doacoes,
    agendamentos,
    users: doadores,
    hemocentros,
  }), [user?.hemocentro_id, doacoes, agendamentos, doadores, hemocentros]);
  const notificationsKey = notifications.map((notification) => `${notification.id}:${notification.timeLabel}`).join('|');

  useEffect(() => {
    setHasUnreadNotifications(notifications.length > 0);
  }, [notificationsKey]);

  const formatDataHora = (agendamento: any) => {
    const campo = agendamento.data_hora_doacao || agendamento.data;
    if (!campo) return { data: '-', hora: '-' };
    try {
      const d = parseISO(campo.includes('T') ? campo : campo.replace(' ', 'T'));
      return {
        data: format(d, "dd/MM/yyyy", { locale: ptBR }),
        hora: format(d, 'HH:mm'),
      };
    } catch { return { data: campo, hora: '-' }; }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      AGE: { label: 'Agendado',   color: 'bg-blue-100 text-blue-600'   },
      CON: { label: 'Confirmado', color: 'bg-green-100 text-green-600' },
      CAN: { label: 'Cancelado',  color: 'bg-red-100 text-red-600'     },
      FIN: { label: 'Finalizado', color: 'bg-gray-100 text-gray-600'   },
      DOA: { label: 'Doação realizada', color: 'bg-green-600 text-white' },
      E:   { label: 'Reagendado', color: 'bg-yellow-100 text-yellow-600'},
    };
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  const isDoacaoRealizada = (agendamento: any) => {
    const status = getStatus(agendamento);
    return status === 'FIN' || status === 'DOA' || status === 'REALIZADA' || !!agendamento.doacao_id || !!agendamento.doacao || !!agendamento.doacao_realizada;
  };

  const getAgendaCardClass = (agendamento: any) => {
    const status = getStatus(agendamento);
    if (isDoacaoRealizada(agendamento)) return 'bg-green-50 border-green-500 ring-1 ring-green-100';
    if (status === 'CAN') return 'bg-gray-50 border-gray-200';
    return 'bg-white border-gray-200 hover:border-blue-300 shadow-sm';
  };

  const canReabrirAgendamento = (agendamento: any) => {
    if (getStatus(agendamento) !== 'CAN') return false;
    const dataKey = getDateKey(agendamento.data_hora_doacao || agendamento.data);
    if (!dataKey) return true;
    return new Date(`${dataKey}T23:59:59`).getTime() >= Date.now();
  };

  const getResolvedAppointmentDonor = (agendamento: any) => {
    const inlineDonor = getAppointmentDonor(agendamento);
    if (inlineDonor?.name || inlineDonor?.nome) {
      return inlineDonor;
    }

    const appointmentUserId = getAppointmentUserId(agendamento);
    if (!appointmentUserId) {
      return inlineDonor;
    }

    return doadores.find((doador: any) => Number(doador.id) === Number(appointmentUserId)) || inlineDonor;
  };

  // Filtragem por data e busca
  const filteredAgendamentos = agendamentos.filter((a: any) => {
    const dataCampo = a.data_hora_doacao || a.data;
    if (!dataCampo) return false;
    const aptDate = parseISO(dataCampo.includes('T') ? dataCampo : dataCampo.replace(' ', 'T'));
    const matchesDate = isSameDay(aptDate, selectedDate);
    const normalizedSearch = normalizeSearchText(searchTerm);
    const cleanedSearchCpf = searchTerm.replace(/\D/g, '');
    const resolvedDonor = getResolvedAppointmentDonor(a);
    const { name, cpf, bloodType } = getAgendaDonorSearchData(a, resolvedDonor);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      normalizeSearchText(name).includes(normalizedSearch) ||
      normalizeSearchText(bloodType).includes(normalizedSearch) ||
      (cleanedSearchCpf.length > 0 && cpf.includes(cleanedSearchCpf));
    return matchesDate && matchesSearch;
  }).sort((a, b) => {
    const dA = new Date(a.data_hora_doacao || a.data).getTime();
    const dB = new Date(b.data_hora_doacao || b.data).getTime();
    return dA - dB;
  });

  const agendamentosHoje = agendamentos.filter((a: any) => {
    const dataCampo = a.data_hora_doacao || a.data;
    if (!dataCampo) return false;
    const data = dataCampo.split('T')[0].split(' ')[0];
    return data === format(new Date(), 'yyyy-MM-dd');
  });

  const highlightedCalendarDays = useMemo(() => {
    const datesByKey = new Map<string, Date>();

    [...agendamentos, ...doacoes].forEach((item: any) => {
      const rawDate = item?.data_hora_doacao || item?.data || item?.atualizado_em || item?.created_at;
      if (!rawDate) return;

      const normalizedDate = String(rawDate).includes('T')
        ? String(rawDate)
        : String(rawDate).replace(' ', 'T');
      const parsedDate = new Date(normalizedDate);

      if (Number.isNaN(parsedDate.getTime())) return;

      const key = format(parsedDate, 'yyyy-MM-dd');
      if (!datesByKey.has(key)) {
        datesByKey.set(key, parsedDate);
      }
    });

    return Array.from(datesByKey.values());
  }, [agendamentos, doacoes]);

  const concluidos = stats.confirmados_hoje;
  const pendentes = Math.max(stats.agendamentos_hoje - stats.confirmados_hoje, 0);
  const isDonationStockUpdated = useCallback((doacao: any) => {
    if (doacao?.estoque_lancado_em) return true;
    return stockUpdatedDonationIds.some((id) => String(id) === String(doacao?.id));
  }, [stockUpdatedDonationIds]);

  const todayDonationStockUpdates = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const uniqueDonations = new Map<number | string, any>();

    doacoes.forEach((doacao: any) => {
      const donationId = doacao?.id;
      if (!donationId || uniqueDonations.has(donationId)) return;

      const donationDate = doacao?.data_hora_doacao || doacao?.atualizado_em || doacao?.created_at;
      if (!donationDate) return;

      const parsedDate = new Date(String(donationDate).includes('T') ? String(donationDate) : String(donationDate).replace(' ', 'T'));
      if (Number.isNaN(parsedDate.getTime())) return;
      if (format(parsedDate, 'yyyy-MM-dd') !== todayKey) return;

      uniqueDonations.set(donationId, doacao);
    });

    return Array.from(uniqueDonations.values()).sort((a: any, b: any) => {
      const dateA = new Date(a?.data_hora_doacao || a?.atualizado_em || 0).getTime();
      const dateB = new Date(b?.data_hora_doacao || b?.atualizado_em || 0).getTime();
      return dateB - dateA;
    });
  }, [doacoes]);
  const pendingDonationStockUpdates = useMemo(
    () => todayDonationStockUpdates.filter((doacao: any) => !isDonationStockUpdated(doacao)),
    [todayDonationStockUpdates, isDonationStockUpdated]
  );
  const hasPendingStockUpdates = pendingDonationStockUpdates.length > 0;

  // ─── Handlers: Agendamentos ───────────────────────────────────────────────

  const handleConfirmar = async (agend: any) => {
    if (isDemoAppointment(agend)) {
      setAgendamentos((prev) =>
        prev.map((item) =>
          item.id === agend.id ? { ...item, status: 'CON', status_agendamento: 'CON' } : item
        )
      );
      toast.success('Check-in realizado!');
      return;
    }

    try {
      await api.post(`/auth/agendamentos/${agend.id}/confirmar`);
      toast.success('Check-in realizado!');
      await fetchData();
      if (doacaoCriadaParaEstoque) {
        setDoacoes((prev) => {
          const exists = prev.some((doacao) => String(doacao?.id) === String(doacaoCriadaParaEstoque.id));
          return exists ? prev : [doacaoCriadaParaEstoque, ...prev];
        });
      }
    } catch { toast.error('Erro ao confirmar agendamento'); }
  };

  const handleAbrirCancelar = (agend: any) => {
    setSelectedAgendamento(agend);
    setCancelMotivo('');
    setCancelDialogOpen(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (!cancelMotivo) { toast.error('Selecione o motivo do cancelamento'); return; }

    if (isDemoAppointment(selectedAgendamento)) {
      toast.success('Agendamento cancelado!');
      setCancelDialogOpen(false);
      setAgendamentos((prev) =>
        prev.map((agendamento) =>
          agendamento.id === selectedAgendamento.id
            ? { ...agendamento, status: 'CAN', status_agendamento: 'CAN' }
            : agendamento
        )
      );
      setSelectedAgendamento(null);
      return;
    }

    try {
      await api.post(`/auth/agendamentos/${selectedAgendamento.id}/cancelar`, { motivo_cancelamento: cancelMotivo });
      toast.success('Agendamento cancelado!');
      setCancelDialogOpen(false);
      setAgendamentos((prev) =>
        prev.map((agendamento) =>
          agendamento.id === selectedAgendamento.id
            ? { ...agendamento, status: 'CAN', status_agendamento: 'CAN' }
            : agendamento
        )
      );
      setSelectedAgendamento(null);
    } catch { toast.error('Erro ao cancelar agendamento'); }
  };

  const handleReabrirAgendamento = async (agend: any) => {
    if (isDemoAppointment(agend)) {
      setAgendamentos((prev) =>
        prev.map((item) =>
          item.id === agend.id ? { ...item, status: 'AGE', status_agendamento: 'AGE' } : item
        )
      );
      toast.success('Agendamento reaberto!');
      return;
    }

    try {
      await api.post(`/auth/agendamentos/${agend.id}/reabrir`);
      setAgendamentos((prev) =>
        prev.map((item) =>
          item.id === agend.id ? { ...item, status: 'AGE', status_agendamento: 'AGE' } : item
        )
      );
      toast.success('Agendamento reaberto!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao reabrir agendamento.');
    }
  };

  const handleAbrirTriagem = (agend: any) => {
    setSelectedAgendamento(agend);
    setTriagemData({ apto: true, motivo_inaptidao: '', observacoes: '', ml_coletados: '450' });
    setRespostasTriagem({});
    setSinaisVitais({ peso:'', pressao_sistolica:'', pressao_diastolica:'',
      temperatura:'', frequencia_cardiaca:'', hemoglobina:'', hematocrito:'' });
    setAptidaoFormal({ resultado:'apto', categoria_inaptidao:'',
      observacoes_internas:'', valido_ate:'' });
    setTriagemDialogOpen(true);
  };

  const handleRegistrarTriagemLegacy = async () => {
    if (!selectedAgendamento) return;
    try {
      const doador = getAppointmentDonor(selectedAgendamento);
      const agendamentoId = selectedAgendamento.id;
      const userId = getAppointmentUserId(selectedAgendamento);
      const hemocentroId = getHemocentroId(selectedAgendamento) || getHemocentroId(user);

      const triagemRes = await api.post('/auth/triagens', {
        agendamento_id: agendamentoId,
        user_id:       userId,
        hemocentro_id: hemocentroId,
        data_triagem:  getCurrentLocalDate(),
        apto:          triagemData.apto,
        motivo_inaptidao: !triagemData.apto ? triagemData.motivo_inaptidao : null,
        observacoes:   triagemData.observacoes || null,
      });

      if (triagemData.apto) {
        const triagem = extractApiObject(triagemRes.data, ['triagem']);
        const triagemId = triagem.id || triagem.triagem_id;

        if (!triagemId) {
          throw new Error('A API não retornou o ID da triagem criada.');
        }

        await api.post('/auth/doacoes', {
          agendamento_id: agendamentoId,
          triagem_id: triagemId,
          user_id: userId,
          hemocentro_id: hemocentroId,
          data_hora_doacao: getCurrentLocalDateTime(),
          tipo_sangue: doador?.tipo_sang || 'O+',
          quantidade: Number(triagemData.ml_coletados),
          data_validade_sangue: format(new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        });
      }

      await api.post(`/auth/agendamentos/${selectedAgendamento.id}/confirmar`);

      toast.success(triagemData.apto ? 'Doação registrada com sucesso!' : 'Triagem registrada — doador inapto');
      setTriagemDialogOpen(false);
      setSelectedAgendamento(null);
      setAgendamentos((prev) =>
        prev.map((agendamento) =>
          agendamento.id === selectedAgendamento.id
            ? { ...agendamento, status: 'FIN', status_agendamento: 'FIN', doacao_realizada: triagemData.apto }
            : agendamento
        )
      );
    } catch (err: any) {
      toast.error('Erro ao registrar triagem: ' + getApiErrorMessage(err));
    }
  };

  // ─── Handlers: Doadores ───────────────────────────────────────────────────

  const handleRegistrarTriagem = async () => {
    if (!selectedAgendamento) return;
    const agendamentoId = selectedAgendamento.id;

    // Validar que todas as perguntas obrigatórias foram respondidas
    const naoRespondidas = perguntas.filter(
      p => p.obrigatoria && !respostasTriagem[p.id]
    );
    if (naoRespondidas.length > 0) {
      toast.error(`Responda todas as perguntas obrigatórias (${naoRespondidas.length} pendentes)`);
      return;
    }

    const aptidaoParaEnvio = triagemAutomatica.resultado === 'inapto_temporario'
      ? {
          ...aptidaoFormal,
          resultado: 'inapto_temporario' as const,
          categoria_inaptidao: triagemAutomatica.categoria || aptidaoFormal.categoria_inaptidao,
          valido_ate: triagemAutomatica.validoAte || aptidaoFormal.valido_ate,
        }
      : aptidaoFormal;

    // Validar aptidão
    if (!aptidaoParaEnvio.resultado) {
      toast.error('Selecione o resultado da aptidão');
      return;
    }
    if (aptidaoParaEnvio.resultado !== 'apto' && !aptidaoParaEnvio.categoria_inaptidao) {
      toast.error('Selecione a categoria de inaptidão');
      return;
    }
    if (aptidaoParaEnvio.resultado === 'inapto_temporario' && !aptidaoParaEnvio.valido_ate) {
      toast.error('Informe até quando dura a inaptidão temporária');
      return;
    }

    if (isDemoAppointment(selectedAgendamento)) {
      const doadorResolvido = getResolvedAppointmentDonor(selectedAgendamento);
      const aptoDemo = aptidaoParaEnvio.resultado === 'apto';

      if (aptoDemo) {
        const demoDonation = {
          id: `demo-doacao-${selectedAgendamento.id}`,
          user_id: getAppointmentUserId(selectedAgendamento),
          doador_id: getAppointmentUserId(selectedAgendamento),
          hemocentro_id: getHemocentroId(selectedAgendamento) || getHemocentroId(user),
          tipo_sangue: getDonorBloodType(doadorResolvido) || 'O+',
          quantidade: Number(triagemData.ml_coletados) || 450,
          data_hora_doacao: getCurrentLocalDateTime(),
          doador: doadorResolvido,
        };

        setDoacoes((prev) => {
          const exists = prev.some((doacao) => String(doacao?.id) === String(demoDonation.id));
          return exists ? prev : [demoDonation, ...prev];
        });
        toast.success('Doacao registrada com sucesso!');
      } else {
        toast.info('Triagem registrada - doador inapto para doacao nesta data.');
      }

      setAgendamentos((prev) =>
        prev.map((agendamento) =>
          agendamento.id === selectedAgendamento.id
            ? { ...agendamento, status: 'FIN', status_agendamento: 'FIN', doacao_realizada: aptoDemo }
            : agendamento
        )
      );

      setTriagemDialogOpen(false);
      setSelectedAgendamento(null);
      setRespostasTriagem({});
      setSinaisVitais({ peso:'', pressao_sistolica:'', pressao_diastolica:'',
        temperatura:'', frequencia_cardiaca:'', hemoglobina:'', hematocrito:'' });
      setAptidaoFormal({ resultado:'apto', categoria_inaptidao:'',
        observacoes_internas:'', valido_ate:'' });
      return;
    }

    try {
      const agendamentoUserId = getAppointmentUserId(selectedAgendamento);
      const doadorResolvido = getResolvedAppointmentDonor(selectedAgendamento);
      const hemocentroId = getHemocentroId(selectedAgendamento) || getHemocentroId(user);

      if (!agendamentoUserId) {
        toast.error('Não foi possível identificar o doador deste agendamento.');
        return;
      }

      // Montar payload de sinais vitais (apenas campos preenchidos)
      const sinaisPayload: Record<string, number> = {};
      Object.entries(sinaisVitais).forEach(([k, v]) => {
        if (v !== '') sinaisPayload[k] = Number(v);
      });

      // Montar payload de respostas
      const respostasPayload = Object.entries(respostasTriagem).map(([pergunta_id, opcao_id]) => ({
        pergunta_id: Number(pergunta_id),
        opcao_id:    Number(opcao_id),
      }));

      // Montar aptidão
      const aptidaoPayload: Record<string, any> = {
        resultado:            aptidaoParaEnvio.resultado,
        observacoes_internas: aptidaoParaEnvio.observacoes_internas || null,
      };
      if (aptidaoParaEnvio.resultado !== 'apto') {
        aptidaoPayload.categoria_inaptidao = aptidaoParaEnvio.categoria_inaptidao;
      }
      if (aptidaoParaEnvio.resultado === 'inapto_temporario') {
        aptidaoPayload.valido_ate = aptidaoParaEnvio.valido_ate;
      }

      let triagemId: number | null = null;
      let apto = false;
      let doacaoCriadaParaEstoque: any = null;

      try {
        const triagemRes = await api.post('/auth/triagens', buildTriagemPayload({
          agendamentoId,
          userId: agendamentoUserId,
          hemocentroId,
          dataTriagem: getCurrentLocalDate(),
          sinaisPayload,
          respostasPayload,
          aptidaoPayload,
        }));
        
        const triagemCriada = getCreatedTriagem(triagemRes.data);
        apto = getTriagemApto(triagemRes.data, aptidaoParaEnvio.resultado);
        triagemId = triagemCriada.id || triagemCriada.triagem_id || null;
      } catch (err: any) {
        // Recupera apenas quando o backend devolver explicitamente uma triagem existente.
        if (err.response?.data?.message?.includes('Ja existe uma triagem')) {
          const existing = err.response?.data?.data;
          if (existing && existing.id) {
            console.log('Recuperando triagem existente:', existing.id);
            triagemId = existing.id;
            apto = existing.apto === true || existing.status_triagem === 'P'; // Se status for P (apto/passou)
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (!triagemId) throw new Error('Não foi possível identificar o ID da triagem.');

      if (apto) {
        // Registrar doação
        const doacaoPayload = {
          agendamento_id:    agendamentoId,
          triagem_id:        triagemId,
          user_id:           agendamentoUserId,
          hemocentro_id:     hemocentroId,
          tipo_sangue:       getDonorBloodType(doadorResolvido) || 'O+',
          quantidade:        Number(triagemData.ml_coletados) || 450,
          data_hora_doacao:  getCurrentLocalDateTime(),
          data_validade_sangue: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0],
        };
        const doacaoRes = await api.post('/auth/doacoes', doacaoPayload);
        const doacaoCriada = getCreatedDoacao(doacaoRes.data);
        const doacaoParaLista = {
          ...doacaoPayload,
          ...doacaoCriada,
          id: doacaoCriada.id || doacaoCriada.doacao_id || `doacao-${agendamentoId}-${Date.now()}`,
          doador: doadorResolvido,
        };

        setDoacoes((prev) => {
          const exists = prev.some((doacao) => String(doacao?.id) === String(doacaoParaLista.id));
          return exists ? prev : [doacaoParaLista, ...prev];
        });
        doacaoCriadaParaEstoque = doacaoParaLista;
        setStockDonationsExpanded(true);
        toast.success('Doação registrada com sucesso!');
      } else {
        toast.info('Triagem registrada — doador inapto para doação nesta data.');
      }

      // Confirmar agendamento após triagem
      await api.post(`/auth/agendamentos/${agendamentoId}/confirmar`);

      // Resetar estados do dialog
      setTriagemDialogOpen(false);
      setRespostasTriagem({});
      setSinaisVitais({ peso:'', pressao_sistolica:'', pressao_diastolica:'',
        temperatura:'', frequencia_cardiaca:'', hemoglobina:'', hematocrito:'' });
      setAptidaoFormal({ resultado:'apto', categoria_inaptidao:'',
        observacoes_internas:'', valido_ate:'' });
      fetchData();

    } catch (err: any) {
      toast.error('Erro ao registrar triagem: ' + getApiErrorMessage(err));
    }
  };

  const hasActiveDonorFilters = () =>
    Boolean(
      donorSearchTerm.trim() ||
      donorBloodTypeFilter ||
      (donorGenderFilter && donorGenderFilter !== 'todos') ||
      (donorStatusFilter && donorStatusFilter !== 'todos') ||
      donorCityFilter.trim() ||
      donorMinAge ||
      donorMaxAge ||
      donorLastDonationSince ||
      donorLastDonationUntil
    );

  const getDonorAge = (donor: any) => {
    const rawBirthDate = donor?.data_nasc || donor?.dataNascimento || donor?.birthDate;
    if (!rawBirthDate) return null;

    const birthDate = String(rawBirthDate).includes('/')
      ? (() => {
          const [day, month, year] = String(rawBirthDate).split('/');
          return new Date(`${year}-${month}-${day}`);
        })()
      : new Date(rawBirthDate);

    if (Number.isNaN(birthDate.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
  };

  const getAllowedDonorIds = () => {
    const donorIdsFromDoacoes = doacoes
      .map(getDonationDonorId)
      .filter((id) => id !== undefined && id !== null)
      .map((id) => String(id));

    if (donorIdsFromDoacoes.length > 0) {
      return new Set(donorIdsFromDoacoes);
    }

    return new Set(
      agendamentos
        .filter((agendamento: any) => isDoacaoRealizada(agendamento))
        .map((agendamento: any) => getAppointmentUserId(agendamento))
        .filter((id) => id !== undefined && id !== null)
        .map((id) => String(id))
    );
  };

  const donorMatchesCurrentFilters = (donor: any, allowedDonorIds: Set<string>) => {
    if (!allowedDonorIds.has(String(donor?.id))) return false;

    const nameSearch = normalizeSearchText(donorSearchTerm);
    if (nameSearch) {
      const donorName = normalizeSearchText(donor?.name || donor?.nome || donor?.full_name);
      if (!donorName.includes(nameSearch)) return false;
    }

    if (donorBloodTypeFilter) {
      const donorBloodType = String(getDonorBloodType(donor)).replace(/\s/g, '').toUpperCase();
      if (donorBloodType !== donorBloodTypeFilter.toUpperCase()) return false;
    }

    if (donorGenderFilter && donorGenderFilter !== 'todos') {
      const gender = normalizeSearchText(donor?.sexo || donor?.gender);
      const matchesByGender: Record<string, string[]> = {
        male: ['male', 'masculino', 'm'],
        female: ['female', 'feminino', 'f'],
        other: ['other', 'outro', 'o'],
      };
      if (!matchesByGender[donorGenderFilter]?.includes(gender)) return false;
    }

    if (donorStatusFilter && donorStatusFilter !== 'todos') {
      if (String(donor?.status ?? '') !== String(donorStatusFilter)) return false;
    }

    if (donorCityFilter.trim()) {
      const city = normalizeSearchText(donor?.cidade || donor?.city);
      if (!city.includes(normalizeSearchText(donorCityFilter))) return false;
    }

    if (donorMinAge || donorMaxAge) {
      const age = getDonorAge(donor);
      if (age === null) return false;
      if (donorMinAge && age < Number(donorMinAge)) return false;
      if (donorMaxAge && age > Number(donorMaxAge)) return false;
    }

    if (donorLastDonationSince || donorLastDonationUntil) {
      const rawLastDonation = donor?.lastDonation || donor?.ultima_doacao || donor?.data_ultima_doacao;
      if (!rawLastDonation) return false;
      const lastDonation = new Date(rawLastDonation);
      if (Number.isNaN(lastDonation.getTime())) return false;
      if (donorLastDonationSince && lastDonation < new Date(donorLastDonationSince)) return false;
      if (donorLastDonationUntil && lastDonation > new Date(donorLastDonationUntil)) return false;
    }

    return true;
  };

  const handleSearchDonor = async (page = 1) => {
    setSearchPerformed(true);
    if (!hasActiveDonorFilters()) {
      setDonorResult([]);
      setDonorPagination({ ...donorPagination, page: 1, total: 0, totalPages: 0 });
      toast.info('Informe um nome ou selecione pelo menos um filtro para buscar doadores');
      return;
    }

    setIsSearchingDonors(true);

    const allowedDonorIds = getAllowedDonorIds();
    const filteredDonors = doadores.filter((donor: any) => donorMatchesCurrentFilters(donor, allowedDonorIds));
    const total = filteredDonors.length;
    const totalPages = total > 0 ? Math.ceil(total / donorPagination.limit) : 0;
    const currentPage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const start = (currentPage - 1) * donorPagination.limit;

    setDonorResult(filteredDonors.slice(start, start + donorPagination.limit));
    setDonorPagination({
      ...donorPagination,
      page: currentPage,
      total,
      totalPages
    });

    if (filteredDonors.length === 0) {
      toast.info('Nenhum doador encontrado com os filtros aplicados');
    }

    setIsSearchingDonors(false);
    return;

    setIsSearchingDonors(true);

    try {
      const params: any = {
        role: 'donor',
        page: page,
        limit: 10,
      };

      if (donorSearchTerm.trim()) params.q = donorSearchTerm.trim();
      if (donorBloodTypeFilter && donorBloodTypeFilter !== 'todos') params.bloodType = donorBloodTypeFilter;
      if (donorGenderFilter && donorGenderFilter !== 'todos') params.gender = donorGenderFilter;
      if (donorStatusFilter && donorStatusFilter !== 'todos') params.status = donorStatusFilter;
      if (donorCityFilter.trim()) params.city = donorCityFilter.trim();
      if (donorMinAge) params.minAge = donorMinAge;
      if (donorMaxAge) params.maxAge = donorMaxAge;
      if (donorLastDonationSince) params.lastDonationSince = donorLastDonationSince;
      if (donorLastDonationUntil) params.lastDonationUntil = donorLastDonationUntil;

      const res = await api.get('/users', { params });
      
      const donors = extractApiList(res.data, ['data']);
      const meta = res.data.meta || {};

      setDonorResult(donors);
      setDonorPagination({
        page: meta.page || page,
        limit: meta.limit || 10,
        total: meta.total || donors.length,
        totalPages: meta.totalPages || 1
      });

      if (donors.length === 0) {
        toast.info('Nenhum doador encontrado com os filtros aplicados');
      }
    } catch (err) {
      console.error('Erro ao buscar doadores:', err);
      toast.error('Erro ao buscar doadores. Verifique sua conexão.');
    } finally {
      setIsSearchingDonors(false);
    }
  };

  const resetDonorFilters = () => {
    setDonorSearchTerm('');
    setDonorBloodTypeFilter('');
    setDonorGenderFilter('');
    setDonorStatusFilter('');
    setDonorCityFilter('');
    setDonorMinAge('');
    setDonorMaxAge('');
    setDonorLastDonationSince('');
    setDonorLastDonationUntil('');
    setDonorResult([]);
    setSearchPerformed(false);
    setDonorPagination({ ...donorPagination, page: 1, total: 0, totalPages: 0 });
  };

  const handleAbrirEditDonor = (donor: any) => {
    setSelectedDonor(donor);
    setEditDonorData({
      tipo_sang:       getDonorBloodType(donor),
      telefone:        donor.telefone  || '',
      status:          String(donor.status ?? 1),
      tempo_restricao: '',
    });
    setEditDonorDialogOpen(true);
  };

  const handleSalvarDonor = async () => {
    if (!selectedDonor) return;
    try {
      const payload: any = {
        tipo_sang: editDonorData.tipo_sang || undefined,
        telefone:  editDonorData.telefone.replace(/\D/g, '') || undefined,
        status:    Number(editDonorData.status),
      };
      if (editDonorData.tempo_restricao) {
        payload.tempo_restricao = editDonorData.tempo_restricao;
      }
      await api.put(`/users/${selectedDonor.id}`, payload);
      toast.success('Doador atualizado com sucesso!');
      setEditDonorDialogOpen(false);
      setSelectedDonor(null);
      fetchData();
      // Atualiza resultado da busca
      setDonorResult(prev =>
        prev.map(d => d.id === selectedDonor.id ? { ...d, ...payload } : d)
      );
    } catch (err: any) {
      toast.error('Erro ao atualizar doador: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  // ─── Handlers: Estoque ────────────────────────────────────────────────────

  const handleOpenUpdateStock = (bloodType: string) => {
    setSelectedBloodType(bloodType);
    setStockAction('add');
    setStockAmount('');
    setStockSourceDonation(null);
    setUpdateStockDialogOpen(true);
  };

  const handleOpenDonationStockUpdate = (doacao: any) => {
    if (!doacao) {
      toast.info('Não há doação pendente para atualizar no estoque.');
      return;
    }

    const donor = getDonationDonor(doacao, doadores);
    const bloodType = String(doacao?.tipo_sangue || getDonorBloodType(donor) || '');
    const amount = String(Math.round(Number(doacao?.quantidade || 450)));

    setSelectedBloodType(bloodType || 'O+');
    setStockAction('add');
    setStockAmount(amount);
    setStockSourceDonation({
      ...doacao,
      doador: donor || doacao?.doador || doacao?.user || null,
    });
    setUpdateStockDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      toast.error('Digite uma quantidade válida');
      return;
    }
    const amount = parseInt(stockAmount);
    const valueToSend = stockAction === 'add' ? amount : -amount;
    const launchedAt = new Date().toISOString();

    if (isDemoDonation(stockSourceDonation)) {
      setStock((prev) => {
        const existing = prev.find((item) => item.type === selectedBloodType);
        if (existing) {
          return prev.map((item) =>
            item.type === selectedBloodType
              ? { ...item, current: Math.max(0, Number(item.current || 0) + valueToSend) }
              : item
          );
        }

        return [
          ...prev,
          {
            id: `demo-stock-${selectedBloodType}`,
            type: selectedBloodType,
            current: Math.max(0, valueToSend),
            min: 0,
            max: 100,
          },
        ];
      });

      if (stockSourceDonation?.id) {
        const donationId = stockSourceDonation.id;
        setStockUpdatedDonationIds((prev) =>
          prev.some((id) => String(id) === String(donationId)) ? prev : [...prev, donationId]
        );
        setDoacoes((prev) =>
          prev.map((doacao) =>
            String(doacao?.id) === String(donationId)
              ? { ...doacao, estoque_lancado_em: doacao?.estoque_lancado_em || launchedAt }
              : doacao
          )
        );
      }

      toast.success(`${amount} bolsas ${stockAction === 'add' ? 'adicionadas' : 'removidas'} — ${selectedBloodType}`);
      setUpdateStockDialogOpen(false);
      setStockSourceDonation(null);
      return;
    }

    try {
      await api.post('/auth/estoque', {
        hemocentro_id: user.hemocentro_id,
        tipo_sangue: selectedBloodType,
        quantidade: valueToSend,
        doacao_id: stockSourceDonation?.id || undefined,
      });

      toast.success(`${amount} bolsas ${stockAction === 'add' ? 'adicionadas' : 'removidas'} — ${selectedBloodType}`);
      if (stockSourceDonation?.id) {
        const donationId = stockSourceDonation.id;
        setStockUpdatedDonationIds((prev) =>
          prev.some((id) => String(id) === String(donationId)) ? prev : [...prev, donationId]
        );
        setDoacoes((prev) =>
          prev.map((doacao) =>
            String(doacao?.id) === String(donationId)
              ? { ...doacao, estoque_lancado_em: doacao?.estoque_lancado_em || launchedAt }
              : doacao
          )
        );
      }

      setUpdateStockDialogOpen(false);
      setStockSourceDonation(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar estoque: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  const handleAbrirAlerta = (doador: any) => {
    setAlertaDoador(doador);
    setAlertaForm({ tipo_alerta: 'resultado_sorologico', notificacao_doador: '' });
    setAlertaDialogOpen(true);
  };

  const handleCriarAlerta = async () => {
    if (!alertaForm.notificacao_doador.trim()) {
      toast.error('Informe a mensagem para o doador');
      return;
    }
    try {
      await api.post('/auth/alertas-medicos', {
        user_id:            alertaDoador.id,
        tipo_alerta:        alertaForm.tipo_alerta,
        notificacao_doador: alertaForm.notificacao_doador,
      });
      toast.success('Alerta médico criado com sucesso.');
      setAlertaDialogOpen(false);
    } catch (err: any) {
      toast.error('Erro ao criar alerta: ' + (err.response?.data?.message || 'Tente novamente'));
    }
  };

  const handleAbrirTipoSang = async (doador: any) => {
    setTipoSangDoador(doador);
    setTipoSangForm({ tipo_sangue_novo: '', categoria_motivo: '' });
    try {
      const res = await api.get(`/auth/doadores/${doador.id}/tipo-sangue-historico`);
      setTipoSangHistorico(res.data?.historico ?? []);
    } catch {
      setTipoSangHistorico([]);
    }
    setTipoSangDialogOpen(true);
  };

  const handleSalvarTipoSang = async () => {
    if (!tipoSangForm.tipo_sangue_novo || !tipoSangForm.categoria_motivo) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await api.post(`/auth/doadores/${tipoSangDoador.id}/tipo-sangue-historico`, tipoSangForm);
      toast.success('Tipo sanguíneo atualizado com sucesso.');
      setTipoSangDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar tipo sanguíneo');
    }
  };

  const handleLogoutClick = () => { logout(); navigate('/'); };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg cursor-pointer" onClick={() => navigate('/')}>
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DoaVida</h1>
              <p className="text-xs text-gray-600">Painel do Funcionário</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Popover
              open={notificationsOpen}
              onOpenChange={(open) => {
                setNotificationsOpen(open);
                if (open) {
                  setHasUnreadNotifications(false);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Atualizações do hemocentro</p>
                  <p className="text-xs text-gray-500">{hemocentroNome}</p>
                </div>
                <div className="divide-y">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      Nenhuma atualização recente disponível.
                    </div>
                  ) : notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.description}</p>
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{notification.timeLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-600">{hemocentroNome}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogoutClick} className="gap-2">
              <LogOut className="h-4 w-4" /><span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user.name?.split(' ')[0]}! 👋</h2>
          <p className="text-gray-600">{hemocentroNome} — Gerencie as doações e o estoque</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-3"><CardDescription>Agendamentos Hoje</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats.agendamentos_hoje}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-blue-600" /><span>Do seu hemocentro</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-3"><CardDescription>Concluídos (Hoje)</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : concluidos}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-green-600" /><span>{concluidos * 450}ml coletados</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-3"><CardDescription>Pendentes (Hoje)</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : pendentes}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4 text-orange-600" /><span>Aguardando atendimento</span></div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="pb-3"><CardDescription>Doações do Mês</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats.doacoes_mes}</CardTitle>
            </CardHeader>
            <CardContent><div className="flex items-center gap-2 text-sm text-gray-600"><Users className="h-4 w-4 text-purple-600" /><span>Registradas no hemocentro</span></div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="donors">Doadores</TabsTrigger>
          </TabsList>

          {/* ── Agenda ── */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="grid w-full grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                  <div className="justify-self-start">
                    <CardTitle>Agenda de Doações</CardTitle>
                    <CardDescription>{filteredAgendamentos.length} agendamentos listados</CardDescription>
                  </div>

                  {/* SELETOR DE DATA CENTRALIZADO */}
                  <div className="flex justify-center justify-self-center">
                    <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-3 shadow-sm">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="h-auto p-0 font-bold text-blue-700 hover:bg-transparent text-sm">
                            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <CalendarUI
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            modifiers={{ highlighted: highlightedCalendarDays }}
                            modifiersClassNames={{
                              highlighted: 'bg-red-100 text-red-700 font-semibold hover:bg-red-200 rounded-md',
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="relative w-full justify-self-end md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar doador..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 animate-pulse text-gray-500">Carregando agendamentos...</div>
                ) : filteredAgendamentos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum agendamento encontrado para este dia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAgendamentos.map((agend: any) => {
                      const { hora } = formatDataHora(agend);
                      const statusAgend = getStatus(agend);
                      const doador = getResolvedAppointmentDonor(agend);
                      const doacaoRealizada = isDoacaoRealizada(agend);
                      const statusInfo = doacaoRealizada
                        ? { label: 'Doação realizada', color: 'bg-green-600 text-white' }
                        : getStatusLabel(statusAgend);
                      const ativo = !doacaoRealizada && ['AGE', 'CON'].includes(statusAgend);
                      const podeReabrir = canReabrirAgendamento(agend);
                      return (
                        <div key={agend.id} className={`p-4 border rounded-lg transition-all ${getAgendaCardClass(agend)}`}>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`${doacaoRealizada ? 'bg-white border-2 border-green-600' : 'bg-blue-600 text-white'} p-3 rounded-lg shadow-lg text-center min-w-[60px]`}>
                                <p className={`text-lg font-bold ${doacaoRealizada ? 'text-green-700' : ''}`}>{hora}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-lg text-gray-900">{doador?.name || `Doador #${agend.user_id}`}</p>
                                  {doador?.tipo_sang && (
                                    <Badge variant="outline" className="bg-red-50 border-red-600 text-red-600">
                                      {doador.tipo_sang}
                                    </Badge>
                                  )}
                                  <Badge className={statusInfo.color + " border-none"}>{statusInfo.label}</Badge>
                                </div>
                                {doador?.telefone && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />{doador.telefone}
                                  </p>
                                )}
                                {doacaoRealizada && (
                                  <p className="text-sm text-green-600 font-semibold mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Doação realizada
                                  </p>
                                )}
                                {statusAgend === 'CAN' && (
                                  <p className="text-sm text-gray-500 font-semibold mt-1 flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Cancelada
                                  </p>
                                )}
                              </div>
                            </div>
                            {ativo && (
                              <div className="flex gap-2 flex-wrap">
                                {statusAgend === 'AGE' && (
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleConfirmar(agend)}>
                                    Check-in
                                  </Button>
                                )}
                                {statusAgend === 'CON' && (
                                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-2"
                                    onClick={() => handleAbrirTriagem(agend)}>
                                    <Stethoscope className="h-4 w-4" /> Triagem
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600"
                                  onClick={() => handleAbrirCancelar(agend)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {!ativo && podeReabrir && (
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" className="border-blue-600 text-blue-600" onClick={() => handleReabrirAgendamento(agend)}>
                                  <RotateCcw className="h-4 w-4 mr-1" />Reabrir
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Estoque ── */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Estoque de Sangue</CardTitle>
                  <CardDescription>Monitoramento por tipo sanguíneo e lançamento manual por doação</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`rounded-lg border p-4 ${hasPendingStockUpdates ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-900">Doações de hoje aguardando estoque</p>
                      
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`w-fit border bg-white ${hasPendingStockUpdates ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'}`}>
                        {pendingDonationStockUpdates.length} pendente{pendingDonationStockUpdates.length === 1 ? '' : 's'}
                      </Badge>
                      <Badge className="w-fit border border-gray-200 bg-white text-gray-700">
                        {todayDonationStockUpdates.length === 1
                          ? '1 doação'
                          : `${todayDonationStockUpdates.length} doações`}
                      </Badge>
                      {todayDonationStockUpdates.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 bg-white"
                          onClick={() => setStockDonationsExpanded((prev) => !prev)}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${stockDonationsExpanded ? 'rotate-180' : ''}`} />
                          {stockDonationsExpanded ? 'Ocultar' : 'Ver Doações'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {stockDonationsExpanded && todayDonationStockUpdates.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {todayDonationStockUpdates.map((doacao: any) => {
                        const donor = getDonationDonor(doacao, doadores);
                        const donorName = donor?.name || donor?.nome || doacao?.doador?.name || doacao?.user?.name || `Doador #${getDonationDonorId(doacao) || doacao.id}`;
                        const bloodType = doacao?.tipo_sangue || getDonorBloodType(donor) || 'Não informado';
                        const amount = Number(doacao?.quantidade || 0);
                        const donationDate = new Date(doacao?.data_hora_doacao || doacao?.atualizado_em || Date.now());
                        const stockUpdated = isDonationStockUpdated(doacao);

                        return (
                          <div
                            key={doacao.id}
                            className={`flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between ${
                              stockUpdated ? 'border-green-200 bg-green-50' : 'border-red-200 bg-white'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">{donorName}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                <span>Tipo: <strong>{bloodType}</strong></span>
                                <span>Quantidade: <strong>{amount} ml</strong></span>
                                <span>Horário: <strong>{donationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                              </div>
                            </div>
                            {stockUpdated ? (
                              <Badge className="w-fit gap-2 border border-green-200 bg-white text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Estoque atualizado
                              </Badge>
                            ) : (
                              <Button size="sm" className="gap-2" onClick={() => handleOpenDonationStockUpdate(doacao)}>
                                <Droplet className="h-4 w-4" />
                                Atualizar estoque
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : todayDonationStockUpdates.length === 0 ? (
                    <p className="mt-4 text-sm text-red-700">Nenhuma doação de hoje aguardando lançamento no estoque.</p>
                  ) : null}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {stock.map(item => {
                    const critico = item.current < item.min;
                    return (
                      <div key={item.type} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg"><Droplet className="h-5 w-5 text-red-600" /></div>
                            <div><p className="text-2xl font-bold">{item.type}</p><p className="text-sm text-gray-600">Tipo sanguíneo</p></div>
                          </div>
                          <Badge className={critico ? 'bg-red-100 text-red-600' : item.current < item.min * 1.5 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                            {critico ? 'Crítico' : item.current < item.min * 1.5 ? 'Baixo' : 'Normal'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estoque atual</span>
                            <span className="font-semibold">{item.current} bolsas</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${critico ? 'bg-red-600' : item.current < item.min * 1.5 ? 'bg-orange-500' : 'bg-green-600'}`}
                              style={{ width: `${Math.min((item.current / item.max) * 100, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Mín: {item.min}</span><span>Máx: {item.max}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenUpdateStock(item.type)}>
                            <Activity className="h-4 w-4 mr-2" />Atualizar Estoque
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Doadores ── */}
          <TabsContent value="donors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Doador</CardTitle>
                <CardDescription>Busque doadores com filtros avançados e gerencie informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtros Principais */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Pesquisar por nome ou sobrenome" 
                        value={donorSearchTerm}
                        onChange={e => setDonorSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearchDonor(1)} 
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tipo Sanguíneo</Label>
                    <Select
                      value={donorBloodTypeFilter || 'todos'}
                      onValueChange={v => setDonorBloodTypeFilter(v === 'todos' ? '' : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        {tiposSanguineos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filtros Avançados (Grid) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t mt-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-gray-500">Sexo</Label>
                    <Select value={donorGenderFilter || 'todos'} onValueChange={setDonorGenderFilter}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-gray-500">Status</Label>
                    <Select value={donorStatusFilter || 'todos'} onValueChange={setDonorStatusFilter}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="1">Ativos</SelectItem>
                        <SelectItem value="0">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                </div>

                {/* Filtro de Data de Última Doação */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-gray-500">Última doação (período)</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="date" 
                        value={donorLastDonationSince} 
                        onChange={e => setDonorLastDonationSince(e.target.value)}
                        className="h-9 text-xs"
                      />
                      <span className="text-gray-400">até</span>
                      <Input 
                        type="date" 
                        value={donorLastDonationUntil} 
                        onChange={e => setDonorLastDonationUntil(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-end justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={resetDonorFilters}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />Limpar
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 gap-2 min-w-[120px]" 
                      onClick={() => handleSearchDonor(1)}
                      disabled={isSearchingDonors}
                    >
                      {isSearchingDonors ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : <Search className="h-4 w-4" />}
                      Pesquisar
                    </Button>
                  </div>
                </div>

                {/* Resultados */}
                {searchPerformed && (
                  <div className="pt-6 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Resultados ({donorPagination.total})
                      </h3>
                      {donorPagination.totalPages > 1 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          Página {donorPagination.page} de {donorPagination.totalPages}
                        </div>
                      )}
                    </div>

                    {isSearchingDonors ? (
                      <div className="text-center py-12 text-gray-500 animate-pulse">
                        Buscando doadores na base de dados...
                      </div>
                    ) : donorResult.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 border-dashed border-2 rounded-lg">
                        <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum doador encontrado com os filtros selecionados.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {donorResult.map((donor: any) => (
                            <div key={donor.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm bg-white">
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                      {donor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-gray-900">{donor.name}</p>
                                      {getDonorBloodType(donor) && (
                                        <Badge variant="outline" className="bg-red-50 border-red-600 text-red-600 font-bold">
                                          {getDonorBloodType(donor)}
                                        </Badge>
                                      )}
                                      <Badge className={donor.status === 1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                                        {donor.status === 1 ? 'Ativo' : 'Inativo'}
                                      </Badge>
                                      {donor.cidade && (
                                        <Badge variant="ghost" className="text-gray-500 bg-gray-100 text-[10px] font-normal">
                                          {donor.cidade}{donor.uf ? `, ${donor.uf}` : ''}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      {donor.cpf && (
                                        <p className="text-xs text-gray-500 font-mono">
                                          CPF: {donor.cpf.length === 11 ? donor.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : donor.cpf}
                                        </p>
                                      )}
                                      {donor.lastDonation && (
                                        <p className="text-xs text-blue-600 flex items-center gap-1">
                                          <Droplet className="h-3 w-3" />
                                          Última doação: {new Date(donor.lastDonation).toLocaleDateString('pt-BR')}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      {donor.email && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <Mail className="h-3 w-3" />{donor.email}
                                        </p>
                                      )}
                                      {donor.telefone && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <Phone className="h-3 w-3" />{donor.telefone}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-auto">
                                  <Button size="sm" variant="outline" onClick={() => handleAbrirEditDonor(donor)} className="h-8">
                                    <Edit className="h-3.5 w-3.5 mr-1" />Editar
                                  </Button>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-56 p-2 space-y-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                        onClick={() => handleAbrirAlerta(donor)}
                                      >
                                        <AlertCircle className="h-4 w-4 mr-2" />Criar Alerta Médico
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleAbrirTipoSang(donor)}
                                      >
                                        <Activity className="h-4 w-4 mr-2" />Histórico Tipo Sang
                                      </Button>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Paginação */}
                        {donorPagination.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearchDonor(donorPagination.page - 1)}
                              disabled={donorPagination.page === 1 || isSearchingDonors}
                            >
                              Anterior
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: donorPagination.totalPages }, (_, i) => i + 1).map(p => (
                                <Button
                                  key={p}
                                  variant={donorPagination.page === p ? 'default' : 'ghost'}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => handleSearchDonor(p)}
                                  disabled={isSearchingDonors}
                                >
                                  {p}
                                </Button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearchDonor(donorPagination.page + 1)}
                              disabled={donorPagination.page === donorPagination.totalPages || isSearchingDonors}
                            >
                              Próxima
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ DIALOGS ═══════════════════════════════════════════════════════════ */}

      {/* Cancelar Agendamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Cancelar Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedAgendamento && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-semibold">{selectedAgendamento.user?.name}</p>
                <p className="text-gray-600">{formatDataHora(selectedAgendamento).hora}</p>
              </div>
            )}
            <div>
              <Label>Motivo do Cancelamento *</Label>
              <Select value={cancelMotivo} onValueChange={setCancelMotivo}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
                  <SelectItem value="inaptidao">Inaptidão clínica</SelectItem>
                  <SelectItem value="nao_elegivel">Não elegível</SelectItem>
                  <SelectItem value="solicitacao_doador">Solicitação do doador</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Voltar</Button>
            <Button onClick={handleConfirmarCancelamento} className="bg-red-600 hover:bg-red-700">
              <XCircle className="h-4 w-4 mr-2" />Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrar Doação / Triagem */}
      <Dialog open={triagemDialogOpen} onOpenChange={setTriagemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Triagem Clínica</DialogTitle>
            <DialogDescription>
              Doador: <strong>{selectedAgendamento?.doador?.name}</strong>
              {selectedAgendamento?.doador?.tipo_sang && (
                <span className="ml-2 text-red-600 font-bold">
                  {selectedAgendamento.doador.tipo_sang}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">
                Sinais Vitais
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'peso',               label: 'Peso (kg)',         placeholder: 'Ex: 70' },
                  { key: 'pressao_diastolica',  label: 'Pressão diastólica',placeholder: 'Ex: 80' },
                  { key: 'temperatura',         label: 'Temperatura (°C)',  placeholder: 'Ex: 36.5' },
                  { key: 'frequencia_cardiaca', label: 'Freq. cardíaca (bpm)', placeholder: 'Ex: 72' },
                  { key: 'hemoglobina',         label: 'Hemoglobina (g/dL)',placeholder: 'Ex: 14.2' },
                  { key: 'hematocrito',         label: 'Hematócrito (%)',   placeholder: 'Ex: 42' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={placeholder}
                      value={sinaisVitais[key as keyof typeof sinaisVitais]}
                      onChange={e => setSinaisVitais(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {[
              { bloco: 1, titulo: 'Estado Geral no Dia' },
              { bloco: 3, titulo: 'Histórico de Saúde Recente' },
              { bloco: 4, titulo: 'Histórico Comportamental' },
            ].map(({ bloco, titulo }) => {
              const perguntasBloco = perguntas.filter(p => p.bloco === bloco);
              if (perguntasBloco.length === 0) return null;
              return (
                <div key={bloco} className="space-y-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">
                    {titulo}
                  </h4>
                  {perguntasBloco.map(pergunta => (
                    <div key={pergunta.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {pergunta.pergunta}
                        {pergunta.obrigatoria && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="space-y-1">
                        {pergunta.opcoes?.map((opcao: any) => (
                          <label
                            key={opcao.id}
                            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm transition-colors ${
                              respostasTriagem[pergunta.id] === opcao.id
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`pergunta-${pergunta.id}`}
                              value={opcao.id}
                              checked={respostasTriagem[pergunta.id] === opcao.id}
                              onChange={() => setRespostasTriagem(prev => ({
                                ...prev,
                                [pergunta.id]: opcao.id,
                              }))}
                              className="text-red-600"
                            />
                            {opcao.texto_opcao}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {aptidaoFormal.resultado === 'apto' && (
              <div>
                <Label className="text-xs">Volume coletado (mL)</Label>
                <Input
                  type="number"
                  min="100"
                  max="600"
                  placeholder="450"
                  value={triagemData.ml_coletados}
                  onChange={e => setTriagemData({ ...triagemData, ml_coletados: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-500">
                Conclusão da Triagem *
              </h4>
              {triagemAutomatica.motivos.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold">Analise automatica: inapto temporario.</p>
                  <p className="mt-1">
                    Motivo: {triagemAutomatica.motivos.join('; ')}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'apto',              label: 'Apto',           color: 'border-green-400 bg-green-50 text-green-700' },
                  { value: 'inapto_temporario', label: 'Inapto Temporário', color: 'border-amber-400 bg-amber-50 text-amber-700' },
                  { value: 'inapto_definitivo', label: 'Inapto Definitivo', color: 'border-red-400 bg-red-50 text-red-700' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAptidaoFormal(prev => ({ ...prev, resultado: opt.value as any }))}
                    className={`p-2 rounded-md border-2 text-xs font-semibold transition-all ${
                      aptidaoFormal.resultado === opt.value ? opt.color : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {aptidaoFormal.resultado !== 'apto' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Categoria da inaptidão *</Label>
                    <select
                      className="w-full border rounded-md p-2 text-sm mt-1"
                      value={aptidaoFormal.categoria_inaptidao}
                      onChange={e => setAptidaoFormal(prev => ({ ...prev, categoria_inaptidao: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      <option value="sinais_vitais_fora_do_padrao">Sinais vitais fora do padrão</option>
                      <option value="intervalo_minimo_nao_cumprido">Intervalo mínimo não cumprido</option>
                      <option value="medicamento_incompativel">Medicamento incompatível</option>
                      <option value="cirurgia_recente">Cirurgia recente</option>
                      <option value="viagem_area_de_risco">Viagem para área de risco</option>
                      <option value="comportamento_de_risco">Comportamento de risco</option>
                      <option value="condicao_clinica_na_triagem">Condição clínica na triagem</option>
                      <option value="resultado_sorologico_alterado">Resultado sorológico alterado</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  {aptidaoFormal.resultado === 'inapto_temporario' && (
                    <div>
                      <Label className="text-xs">Inapto até *</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={aptidaoFormal.valido_ate}
                        onChange={e => setAptidaoFormal(prev => ({ ...prev, valido_ate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs">Observações internas (visível só para funcionários)</Label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm mt-1 resize-none"
                  rows={2}
                  placeholder="Observações clínicas relevantes..."
                  value={aptidaoFormal.observacoes_internas}
                  onChange={e => setAptidaoFormal(prev => ({ ...prev, observacoes_internas: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTriagemDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRegistrarTriagem}>
              Registrar Triagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={false} onOpenChange={setTriagemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Triagem Médica e Coleta</DialogTitle>
            <DialogDescription>Doador: {selectedAgendamento?.user?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAgendamento && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-semibold">{selectedAgendamento.user?.name}</p>
                <p className="text-gray-600">
                  Tipo: <strong>{selectedAgendamento.user?.tipo_sang || 'Não informado'}</strong>
                  {' '}• {formatDataHora(selectedAgendamento).hora}
                </p>
              </div>
            )}

            <div>
              <Label>Aptidão para Doação *</Label>
              <Select
                value={triagemData.apto ? 'true' : 'false'}
                onValueChange={v => setTriagemData({ ...triagemData, apto: v === 'true', motivo_inaptidao: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Apto — doação realizada</SelectItem>
                  <SelectItem value="false">❌ Inapto — doação não realizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {triagemData.apto && (
              <div>
                <Label>Volume Coletado (ml)</Label>
                <Input type="number" min="100" max="600" value={triagemData.ml_coletados}
                  onChange={e => setTriagemData({ ...triagemData, ml_coletados: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Padrão: 450ml</p>
              </div>
            )}

            {!triagemData.apto && (
              <div>
                <Label>Motivo da Inaptidão *</Label>
                <Select value={triagemData.motivo_inaptidao}
                  onValueChange={v => setTriagemData({ ...triagemData, motivo_inaptidao: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pressao_arterial">Pressão arterial alterada</SelectItem>
                    <SelectItem value="hemoglobina_baixa">Hemoglobina baixa</SelectItem>
                    <SelectItem value="febre">Febre</SelectItem>
                    <SelectItem value="medicamento">Uso de medicamento</SelectItem>
                    <SelectItem value="tatuagem_recente">Tatuagem/piercing recente</SelectItem>
                    <SelectItem value="cirurgia_recente">Cirurgia recente</SelectItem>
                    <SelectItem value="doacao_recente">Doação recente (intervalo mínimo)</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea placeholder="Observações da triagem..." value={triagemData.observacoes}
                onChange={e => setTriagemData({ ...triagemData, observacoes: e.target.value })} />
            </div>

            {!triagemData.apto && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>O agendamento será finalizado e o doador notificado sobre a inaptidão.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriagemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarTriagem}
              className={triagemData.apto ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {triagemData.apto ? 'Confirmar Doação' : 'Registrar Inaptidão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Doador */}
      <Dialog open={editDonorDialogOpen} onOpenChange={setEditDonorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Editar Doador</DialogTitle></DialogHeader>
          {selectedDonor && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-semibold">{selectedDonor.name}</p>
                <p className="text-gray-600">{selectedDonor.email}</p>
              </div>
              <div>
                <Label>Tipo Sanguíneo</Label>
                <Select value={editDonorData.tipo_sang} onValueChange={v => setEditDonorData({ ...editDonorData, tipo_sang: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tiposSanguineos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={editDonorData.telefone}
                  onChange={e => setEditDonorData({ ...editDonorData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editDonorData.status} onValueChange={v => setEditDonorData({ ...editDonorData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ativo</SelectItem>
                    <SelectItem value="0">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Restrição até (data)</Label>
                <Input type="date" value={editDonorData.tempo_restricao}
                  onChange={e => setEditDonorData({ ...editDonorData, tempo_restricao: e.target.value })}
                  min={new Date().toISOString().split('T')[0]} />
                <p className="text-xs text-gray-400 mt-1">Deixe em branco para não alterar</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDonorDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvarDonor} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Alerta Médico */}
      <Dialog open={alertaDialogOpen} onOpenChange={setAlertaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Alerta Médico</DialogTitle>
            <DialogDescription>
              Doador: <strong>{alertaDoador?.name}</strong> — a mensagem será exibida ao doador sem diagnóstico exposto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tipo de alerta</Label>
              <select
                className="w-full border rounded-md p-2 text-sm mt-1"
                value={alertaForm.tipo_alerta}
                onChange={e => setAlertaForm(prev => ({ ...prev, tipo_alerta: e.target.value as any }))}
              >
                <option value="resultado_sorologico">Resultado sorológico</option>
                <option value="convocacao_retorno">Convocação para retorno</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label>Mensagem para o doador *</Label>
              <textarea
                className="w-full border rounded-md p-2 text-sm mt-1 resize-none"
                rows={4}
                placeholder="Ex: Identificamos uma alteração nos exames realizados após sua doação. Por favor, compareça ao hemocentro para uma reavaliação..."
                value={alertaForm.notificacao_doador}
                onChange={e => setAlertaForm(prev => ({ ...prev, notificacao_doador: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Não inclua diagnósticos ou informações clínicas específicas.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertaDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCriarAlerta}>
              Criar Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Histórico Tipo Sanguíneo */}
      <Dialog open={tipoSangDialogOpen} onOpenChange={setTipoSangDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tipo Sanguíneo</DialogTitle>
            <DialogDescription>
              Doador: <strong>{tipoSangDoador?.name}</strong> — Tipo atual: <strong className="text-red-600">{tipoSangDoador?.tipo_sang || 'Não informado'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {tipoSangHistorico.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-gray-500">Histórico de alterações</Label>
                <div className="divide-y border rounded-md max-h-40 overflow-y-auto">
                  {tipoSangHistorico.map((h, i) => (
                    <div key={i} className="p-2 text-xs flex justify-between items-center">
                      <span>{h.tipo_sangue_anterior || '—'} → <strong>{h.tipo_sangue_novo}</strong></span>
                      <span className="text-gray-400">{h.alterado_por} · {new Date(h.alterado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-xs uppercase tracking-wide text-gray-500">Registrar alteração</Label>
              <div>
                <Label className="text-xs">Novo tipo sanguíneo *</Label>
                <select
                  className="w-full border rounded-md p-2 text-sm mt-1"
                  value={tipoSangForm.tipo_sangue_novo}
                  onChange={e => setTipoSangForm(prev => ({ ...prev, tipo_sangue_novo: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Motivo da alteração *</Label>
                <select
                  className="w-full border rounded-md p-2 text-sm mt-1"
                  value={tipoSangForm.categoria_motivo}
                  onChange={e => setTipoSangForm(prev => ({ ...prev, categoria_motivo: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="erro_cadastro">Erro de cadastro</option>
                  <option value="confirmacao_laboratorial">Confirmação laboratorial</option>
                  <option value="retificacao_com_laudo">Retificação com laudo</option>
                  <option value="retificacao_profissional">Retificação pelo profissional</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipoSangDialogOpen(false)}>Fechar</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSalvarTipoSang}
              disabled={!tipoSangForm.tipo_sangue_novo || !tipoSangForm.categoria_motivo}
            >
              Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atualizar Estoque */}
      <Dialog
        open={updateStockDialogOpen}
        onOpenChange={(open) => {
          setUpdateStockDialogOpen(open);
          if (!open) {
            setStockSourceDonation(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Atualizar Estoque — {selectedBloodType}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {stockSourceDonation && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">Preenchido pela doação selecionada para lançamento</p>
                <p>
                  {stockSourceDonation?.doador?.name || stockSourceDonation?.user?.name || 'Doador'} —{' '}
                  {new Date(stockSourceDonation?.data_hora_doacao).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
            <div>
              <Label>Ação</Label>
              <Select value={stockAction} onValueChange={v => setStockAction(v as 'add' | 'remove')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-600" />Adicionar</div></SelectItem>
                  <SelectItem value="remove"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-red-600" />Remover</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade (bolsas)</Label>
              <Input type="number" min="1" value={stockAmount} onChange={e => setStockAmount(e.target.value)} />
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              Estoque atual de <strong>{selectedBloodType}</strong>:{' '}
              <strong>{stock.find(s => s.type === selectedBloodType)?.current} bolsas</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStockDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStock}
              className={stockAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {stockAction === 'add' ? <><Plus className="h-4 w-4 mr-2" />Adicionar</> : <><Minus className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

