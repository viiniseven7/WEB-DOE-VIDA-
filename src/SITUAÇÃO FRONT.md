# Estado Atual do Front-end - DoaVida

Este documento serve para orientar a equipe sobre as funcionalidades já implementadas no front-end e os endpoints que estão sendo consumidos.

---

## 🔐 Módulo: Autenticação & Cadastro

Este módulo gerencia o acesso ao sistema e a criação de novas contas de doadores.

### Tela de Login
- **Componente**: `LoginPage.tsx`
- **Funcionalidades**: Login de usuários com diferentes perfis (Doador, Funcionário, Diretor, Administrador).
- **API Consumida**: 
  - `POST /api/auth/login`: Realiza a autenticação e retorna o token JWT e dados do usuário.
  - `GET /api/auth/me`: Valida a sessão atual e recupera os dados do usuário logado.

### Cadastro de Doador
- **Componente**: `RegistrationDonationPage.tsx`
- **Funcionalidades**: Fluxo completo de cadastro de doador + primeiro agendamento.
- **API Consumida**:
  - `POST /api/auth/register`: Cria o perfil do doador.
  - `GET /api/hemocentros`: Lista os hemocentros disponíveis para o primeiro agendamento.
  - `POST /api/auth/agendamentos`: Realiza o agendamento inicial após o cadastro.

---

## 🩸 Módulo: Painel do Doador (Donor Dashboard)

Espaço dedicado ao doador para gerenciar suas doações e informações.

- **Componente**: `DonorDashboard.tsx`
- **Funcionalidades**:
  - **Próximo Agendamento**: Exibe o agendamento ativo (status `AGE`).
  - **Histórico de Doações**: Lista doações já concluídas (status `CON`).
  - **Status de Aptidão**: Verifica se o doador já pode doar novamente.
- **API Consumida**:
  - `GET /api/agendamentos`: Recupera todos os agendamentos vinculados ao usuário autenticado.

---

## 🏥 Módulo: Agendamento de Doação

Interface para marcar novas doações (dentro e fora do fluxo de cadastro).

- **Componente**: `RegistrationDonationPage.tsx` (Etapa 2) e `DonorDashboard.tsx`.
- **Funcionalidades**: Seleção de hemocentro, data e horário.
- **API Consumida**:
  - `GET /api/hemocentros`: Busca a lista de hemocentros ativos.
  - `POST /api/auth/agendamentos`: Envia os dados do agendamento (ID do hemocentro e data/hora).

---

## 🧑‍⚕️ Módulo: Painel do Funcionário (Staff Dashboard)

Gestão operacional do hemocentro.

- **Componente**: `StaffDashboard.tsx`
- **Funcionalidades**: 
  - Agenda do dia para o hemocentro vinculado.
  - Registro de conclusão de doação.
  - Consulta rápida de doadores.
  - Atualização de estoque local.
- **Status da API**: Estrutura de chamadas preparada, utilizando dados mockados enquanto as rotas específicas de Staff (Laravel) são finalizadas.

---

## 📈 Módulo: Painel do Diretor & Admin

Visão gerencial e administrativa do sistema.

- **Componentes**: `DirectorDashboard.tsx` e `AdminDashboard.tsx`.
- **Funcionalidades**: 
  - Gestão de usuários e hemocentros.
  - Monitoramento de estoque global.
  - Campanhas de engajamento.
  - Relatórios de performance.
- **Status da API**: Estrutura preparada para consumir:
  - `GET /api/users`
  - `POST /api/auth/users` (Gestão de funcionários/diretores)
  - `GET/POST /api/hemocentros`

---

## 📝 Observações Técnicas

- **Base URL**: `http://localhost:8000/api`
- **Autenticação**: Utiliza `Bearer Token` via `localStorage` (chave `access_token`).
- **Contexto**: O `AuthContext.tsx` gerencia o estado global do usuário e a normalização de perfis entre as diferentes fontes de dados.
