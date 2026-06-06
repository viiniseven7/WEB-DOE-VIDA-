export interface DashboardNotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
}

interface NotificationInput {
  hemocentroId?: number | null;
  doacoes?: any[];
  agendamentos?: any[];
  users?: any[];
  hemocentros?: any[];
  limit?: number;
}

const formatDateTime = (value: any) => {
  const timestamp = getTimestamp(value);
  if (!timestamp) {
    return 'Agora há pouco';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

const getTimestamp = (value: any) => {
  const candidates = [
    value?.atualizado_em,
    value?.updated_at,
    value?.data_hora_doacao,
    value?.data,
    value?.created_at,
    value?.criado_em,
    value?.data_hora,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const getHemocentroId = (value: any) =>
  value?.hemocentro_id ||
  value?.hemocentro?.id ||
  value?.hemocentroId ||
  null;

const getDonationDonorName = (doacao: any) =>
  doacao?.doador?.name ||
  doacao?.user?.name ||
  doacao?.donor?.name ||
  doacao?.name ||
  'Doador não identificado';

const getAppointmentDonorName = (agendamento: any) =>
  agendamento?.user?.name ||
  agendamento?.doador?.name ||
  agendamento?.donor?.name ||
  agendamento?.name ||
  'Doador não identificado';

const getRoleLabel = (roleId: any) => {
  const labels: Record<string, string> = {
    '1': 'doador',
    '2': 'funcionário',
    '3': 'diretor',
    '4': 'admin',
  };

  return labels[String(roleId)] || 'usuário';
};

const filterByHemocentro = (items: any[], hemocentroId?: number | null) => {
  if (!hemocentroId) {
    return items;
  }

  return items.filter((item) => Number(getHemocentroId(item)) === Number(hemocentroId));
};

export const buildDashboardNotifications = ({
  hemocentroId,
  doacoes = [],
  agendamentos = [],
  users = [],
  hemocentros = [],
  limit = 3,
}: NotificationInput): DashboardNotificationItem[] => {
  const notifications: Array<DashboardNotificationItem & { sortValue: number }> = [];

  const latestDonation = filterByHemocentro(doacoes, hemocentroId)
    .slice()
    .sort((a, b) => getTimestamp(b) - getTimestamp(a))[0];

  if (latestDonation) {
    notifications.push({
      id: `doacao-${latestDonation.id ?? 'latest'}`,
      title: 'Última doação registrada',
      description: `${getDonationDonorName(latestDonation)} realizou uma doação no hemocentro.`,
      timeLabel: formatDateTime(latestDonation),
      sortValue: getTimestamp(latestDonation),
    });
  }

  const latestAppointment = filterByHemocentro(agendamentos, hemocentroId)
    .slice()
    .sort((a, b) => getTimestamp(b) - getTimestamp(a))[0];

  if (latestAppointment) {
    notifications.push({
      id: `agendamento-${latestAppointment.id ?? 'latest'}`,
      title: 'Agenda atualizada',
      description: `${getAppointmentDonorName(latestAppointment)} apareceu na agenda do hemocentro.`,
      timeLabel: formatDateTime(latestAppointment),
      sortValue: getTimestamp(latestAppointment),
    });
  }

  const latestUserUpdate = filterByHemocentro(users, hemocentroId)
    .slice()
    .sort((a, b) => getTimestamp(b) - getTimestamp(a))[0];

  if (latestUserUpdate) {
    notifications.push({
      id: `user-${latestUserUpdate.id ?? 'latest'}`,
      title: 'Cadastro atualizado',
      description: `${latestUserUpdate.name || 'Usuário'} teve alteração no cadastro como ${getRoleLabel(latestUserUpdate.role_id)}.`,
      timeLabel: formatDateTime(latestUserUpdate),
      sortValue: getTimestamp(latestUserUpdate),
    });
  }

  const latestHemocentroUpdate = filterByHemocentro(hemocentros, hemocentroId)
    .slice()
    .sort((a, b) => getTimestamp(b) - getTimestamp(a))[0];

  if (latestHemocentroUpdate) {
    notifications.push({
      id: `hemocentro-${latestHemocentroUpdate.id ?? 'latest'}`,
      title: 'Dados do hemocentro',
      description: `${latestHemocentroUpdate.nome || 'Hemocentro'} teve informações revisadas no painel.`,
      timeLabel: formatDateTime(latestHemocentroUpdate),
      sortValue: getTimestamp(latestHemocentroUpdate),
    });
  }

  return notifications
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, limit)
    .map(({ sortValue, ...item }) => item);
};
