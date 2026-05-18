# DOC-API

## Visão geral

API construída com Laravel usando rotas em `routes/api.php`.
Autenticação com `sanctum` em endpoints específicos.

## Prefixo padrão

Os caminhos abaixo são relativos ao prefixo padrão `/api` do Laravel.

---

## Autenticação

### POST /api/auth/register

- **Controller**: `AuthController@register`
- **Body JSON esperado**: `name`, `email`, `password`, `cpf`, `sexo`, `data_nasc`, `cep`, `rua`, `numero`, `cidade`, etc.
- **Perfil**: O sistema define automaticamente `role_id = 1` (Doador).

### POST /api/auth/login

- **Controller**: `AuthController@login`
- **Body JSON esperado**: `email`, `password`.
- **Retorna**: Token de acesso Sanctum.

### GET /api/auth/me

- **Middleware**: `auth:sanctum`
- **Retorna usuário autenticado e seus papéis (roles)**.

---

## Usuários (Gestão Administrativa)

### GET /api/users

- **Middleware**: `auth:sanctum`
- **Filtro de Segurança/Privacidade**:
  - **Doador**: Vê apenas seus próprios dados.
  - **Funcionário/Diretor**: Vê apenas doadores que já realizaram triagem ou doação em seu hemocentro vinculado.
  - **Admin**: Vê todos os usuários do sistema.
- **Ordenação**: Alfabética por nome.

### POST /api/auth/users

- **Middleware**: `auth:sanctum`
- **Body**: `name`, `email`, `password`, `cpf`, `role_id`, `hemocentro_id`.
- **Regra**: `hemocentro_id` é obrigatório para funcionários (2) e diretores (3).

---

## Hemocentros

### GET /api/hemocentros

- **Retorna lista de hemocentros.**

### GET /api/hemocentros/

- **Exibe detalhes de um hemocentro específico.**

---

## Agendamentos

### GET /api/agendamentos

- **Filtro**:
  - **Doador**: Vê apenas seus agendamentos ativos (`AGE`) ou confirmados (`CON`).
  - **Funcionário**: Vê todos os agendamentos do seu hemocentro vinculado.

### GET /api/agendamentos/historico

- **Controller**: `AgendamentoController@historico`
- **Doador**: Retorna todos os agendamentos já feitos pelo usuário (incluindo cancelados e excluídos).

### POST /api/auth/agendamentos

- **Body**: `hemocentro_id`, `data_hora_doacao`.
- **Regras**: Valida restrição de dias (90/120), idade (16-18 requer alerta) e inativa agendamentos pendentes anteriores.

### POST /api/auth/agendamentos//confirmar

- **Ação**: Muda o status para `CON`.
- **Público**: Doador (confirmação de ida) ou Funcionário (registro de presença).

### POST /api/auth/agendamentos//cancelar

- **Ação**: Muda o status para `CAN`.
- **Público**: Doador ou Funcionário.

### POST /api/auth/agendamentos//reabrir

- **Ação**: Muda o status para `AGE` (Reabre um agendamento cancelado).
- **Regra**: Só permite reabrir se a data da doação ainda não tiver passado.
- **Público**: Doador ou Funcionário.

---

## Triagens

### GET /api/triagens

- **Filtro**: Doador vê as suas; Funcionário vê as do seu hemocentro.

### POST /api/auth/triagens

- **Ação**: Efetiva a triagem de um doador.
- **Body JSON esperado**:
  - `agendamento_id`: **Obrigatório**. ID do agendamento vinculado.
  - `user_id`: **Obrigatório**. ID do doador.
  - `data_triagem`: **Obrigatório**. Data da realização (`YYYY-MM-DD`).
  - `apto`: **Obrigatório**. Boolean (`true`/`false`).
  - `motivo_inaptidao`: **Obrigatório se `apto` for `false`**.
  - `observacoes`: (Opcional) Notas adicionais.
- **Exemplo**:

```json
{
    "agendamento_id": 1,
    "user_id": 5,
    "data_triagem": "2026-05-18",
    "apto": true,
    "observacoes": "Doador em boas condições"
}
```

- **Status inicial**: `C` (Concluída).

### DELETE /api/auth/triagens/

- **Ação**: Muda o status para `E` (Excluída).

---

## Doações

### GET /api/doacoes

- **Filtro**: Doador vê seu histórico; Funcionário vê as doações do hemocentro.

### POST /api/auth/doacoes

- **Controller**: `DoacaoController@store`
- **Body JSON esperado**:
  - `agendamento_id`: **Obrigatório**. ID do agendamento vinculado.
  - `triagem_id`: **Obrigatório**. ID da triagem aprovada.
  - `user_id`: **Obrigatório**. ID do doador.
  - `hemocentro_id`: **Obrigatório**. ID do local da coleta.
  - `data_hora_doacao`: **Obrigatório**. Data e hora (`YYYY-MM-DD HH:mm:ss`).
  - `tipo_sangue`: **Obrigatório**. `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
  - `quantidade`: **Obrigatório**. Volume em ml.
  - `data_validade_sangue`: (Opcional) Data de validade da bolsa.
- **Exemplo**:

```json
{
    "agendamento_id": 1,
    "triagem_id": 10,
    "user_id": 5,
    "hemocentro_id": 2,
    "data_hora_doacao": "2026-05-18 15:00:00",
    "tipo_sangue": "O+",
    "quantidade": 450
}
```

- **Regra**: O `funcionario_id` é preenchido automaticamente com o usuário logado.
- **Regra de Negócio**: A triagem vinculada deve ter `apto = true`.

---

## Estoque

### GET /api/estoque

- **Ação**: Lista o estoque de bolsas de sangue.
- **Parâmetros (Query String)**:
  - `hemocentro_id`: (Opcional para Admin) ID do hemocentro.
  - `tipo_sangue`: (Opcional) `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
- **Regra**: Funcionário vê apenas o estoque do seu hemocentro.

### GET /api/estoque/

- **Ação**: Exibe detalhes de um registro de estoque específico.

### POST /api/auth/estoque

- **Ação**: Incrementa ou cria um registro de estoque para um tipo sanguíneo.
- **Body JSON esperado**:
  - `hemocentro_id`: Obrigatório (se não for funcionário vinculado).
  - `tipo_sangue`: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
  - `quantidade`: Valor a ser somado ao estoque atual.
  - `quantidade_minima`: (Opcional) Define o alerta de estoque baixo.

### PUT /api/auth/estoque/

- **Ação**: Atualiza diretamente os valores de um registro de estoque.
- **Body JSON esperado**: `quantidade`, `quantidade_minima`.

---

## Relatórios & Estatísticas (Dashboards)

Endpoints otimizados para dashboards gerenciais com dados agregados. Exigem autenticação.

### GET /api/reports/donations-summary

- **Ação**: Retorna o volume total de agendamentos agrupado por status.
- **Parâmetros (Query String)**:
  - `dias`: (Opcional, padrão 30) Número de dias retroativos para o resumo.
- **Retorno**: Lista de objetos com `label` e `total`.

### GET /api/reports/blood-stock

- **Ação**: Retorna o saldo atual de bolsas de sangue por tipo.
- **Parâmetros (Query String)**:
  - `hemocentro_id`: (Admin apenas) Filtra por unidade específica.
- **Retorno**: Lista de objetos com `tipo` e `quantidade`.

### GET /api/reports/performance-monthly

- **Ação**: Retorna a quantidade de doações realizadas por mês nos últimos 12 meses.
- **Parâmetros (Query String)**:
  - `hemocentro_id`: (Admin apenas) Filtra por unidade específica.
- **Finalidade**: Construção de gráficos de linha/tendência.

---

## Relatórios para Impressão (PDF)

Endpoints que geram arquivos PDF para download.

### GET /api/relatorios/doacoes

- **Ação**: Gera PDF com a listagem detalhada de doações.
- **Parâmetros (Query String)**:
  - `periodo`: (Opcional, padrão 30) Número de dias retroativos.
  - `hemocentro_id`: (Admin apenas) Filtra por unidade específica.

### GET /api/relatorios/estoque

- **Ação**: Gera PDF com a situação atual do estoque (incluindo alertas de nível crítico).
- **Parâmetros (Query String)**:
  - `hemocentro_id`: (Admin apenas) Filtra por unidade específica.

### GET /api/relatorios/doadores

- **Ação**: Gera PDF com a listagem de doadores vinculados à unidade.
- **Parâmetros (Query String)**:
  - `hemocentro_id`: (Admin apenas) Filtra por unidade específica.

---

## Estoque

### GET /api/estoque
- **Ação**: Lista o estoque de bolsas de sangue.
- **Filtros query string**: `hemocentro_id`, `tipo_sangue`.
- **Regra**: Funcionário vê apenas o estoque do seu hemocentro.

### GET /api/estoque/{id}
- **Ação**: Exibe detalhes de um registro de estoque específico.

### POST /api/auth/estoque
- **Ação**: Incrementa ou cria um registro de estoque para um tipo sanguíneo.
- **Body JSON esperado**:
  - `hemocentro_id`: Obrigatório (se não for funcionário vinculado).
  - `tipo_sangue`: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
  - `quantidade`: Valor a ser somado ao estoque atual.
  - `quantidade_minima`: (Opcional) Define o alerta de estoque baixo.

### PUT /api/auth/estoque/{id}
- **Ação**: Atualiza diretamente os valores de um registro de estoque.
- **Body JSON esperado**: `quantidade`, `quantidade_minima`.

---

## Status e Enums

### Status Agendamento

- `AGE`: Agendado (Pendente)
- `CON`: Confirmado
- `CAN`: Cancelado
- `EXC`: Excluído (por reagendamento)

### Status Triagem

- `P`: Pendente
- `C`: Concluída
- `E`: Excluída

---

## Observações Gerais

- **Segurança**: Rotas sob `/auth/` exigem token Sanctum.
- **Hierarquia**: O fluxo ideal é Agendamento -> Triagem -> Doação.