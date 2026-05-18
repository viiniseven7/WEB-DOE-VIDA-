const roleMap: Record<number, string> = {
  1: 'doador',
  2: 'funcionario',
  3: 'diretor',
  4: 'admin',
};

export function extractApiList(payload: any, keys: string[] = []): any[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    ...keys.map((key) => payload?.[key]),
    ...keys.map((key) => payload?.data?.[key]),
    ...keys.map((key) => payload?.[key]?.data),
    ...keys.map((key) => payload?.data?.[key]?.data),
  ];

  return candidates.find(Array.isArray) || [];
}

export function extractApiObject(payload: any, keys: string[] = []): any {
  const candidates = [
    ...keys.map((key) => payload?.[key]),
    ...keys.map((key) => payload?.data?.[key]),
    payload?.data,
    payload,
  ];

  return candidates.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || {};
}

export function getStatus(item: any): string {
  return String(item?.status_agendamento || item?.status || '').toUpperCase();
}

export function getDateKey(value: any): string {
  const raw = String(value || '');
  const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  const brMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

  return '';
}

export function getAppointmentDonor(agendamento: any) {
  return agendamento?.doador || agendamento?.user || agendamento?.usuario || agendamento?.donor || null;
}

export function getAppointmentUserId(agendamento: any): number | string | undefined {
  return agendamento?.user_id || agendamento?.doador_id || getAppointmentDonor(agendamento)?.id;
}

export function getHemocentroId(source: any): number | string | undefined {
  return source?.hemocentro_id || source?.hemocentro?.id || source?.hemocenterId;
}

export function getUserRoles(user: any): string[] {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const normalized = roles
    .map((role: any) => {
      if (typeof role === 'string') return role;
      return role?.name || role?.nome || role?.slug || '';
    })
    .filter(Boolean)
    .map((role: string) => role.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  if (normalized.length > 0) return normalized;

  const roleId = Number(user?.role_id);
  return roleMap[roleId] ? [roleMap[roleId]] : [];
}

export function isDonorUser(user: any): boolean {
  return Number(user?.role_id) === 1 || getUserRoles(user).some((role) => ['doador', 'donor'].includes(role));
}
