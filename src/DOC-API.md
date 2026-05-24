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
- **Body JSON esperado**: 
  - `name`, `email`, `password`, `cpf` (obrigatórios)
  - `sexo` (`male`, `female`, `other`)
  - `data_nasc` (`YYYY-MM-DD`)
  - `phone`, `tipo_sanguineo`
  - `cep`, `rua`, `numero`, `cidade`, `uf`
  - `hemocenterId`, `hemocentroName`
- **Perfil**: O sistema define automaticamente `role_id = 1` (Doador).
- **Status inicial**: Definido como `1` (Ativo) por padrão.

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

- **Parâmetros de Busca (Query String)**:
  - `search` ou `name`: Pesquisa por nome parcial.
  - `cpf`: Pesquisa por CPF.
  - `role`: Filtra por papel (`doador`, `funcionario`, `diretor`, `admin`).
  - `tipo_sang`: Filtra por tipo sanguíneo (`A+`, `O-`, etc.).
  - `sexo`: Filtra por sexo (`M`, `F`, `Outro`).
  - `status`: Filtra por status do usuário (`1` para Ativo, `0` para Inativo).
  - `cidade`: Filtra por nome da cidade (busca parcial).
  - `idade_min` / `idade_max`: Filtra por faixa etária (calculado via `data_nasc`).
  - `data_doacao_inicio` / `data_doacao_fim`: Filtra doadores que doaram dentro de um período específico (`YYYY-MM-DD`).
- **Paginação**:
  - `page`: Número da página (padrão: 1).
  - `limit`: Resultados por página (padrão: 10).
- **Filtro de Segurança e Regra de Negócio (Backend)**:
  - **Doador**: Vê apenas seus próprios dados.
  - **Funcionário/Diretor**: Vê apenas doadores que já realizaram doação no **hemocentro ao qual o funcionário pertence**.
    - O sistema identifica o `hemocentro_id` do funcionário logado e filtra na tabela `doacao` pelo campo `user_id`, retornando apenas doadores com doação registrada naquela unidade.
  - **Admin**: Vê todos os usuários do sistema.
- **Segurança Obrigatória**: Mesmo que o usuário altere parâmetros manualmente, o backend bloqueia o acesso a doadores de outros hemocentros.
- **Retorno**:
  - `data`: Lista de usuários encontrados, incluindo `hemocentroName` e `lastDonation`.
  - `meta`: Objeto com `total`, `page`, `limit` e `totalPages`.

### Comportamento da busca de doadores no painel do funcionario

- A busca não retorna todos os doadores do sistema por padrão; ela é sempre restrita ao hemocentro do funcionário.
- Se a busca for enviada vazia, nenhum doador deve ser exibido.
- `search` ou `name` filtra por nome parcial.
- `cpf` filtra por CPF.
- `tipo_sang` deve ser um filtro exato.
- Todos os filtros ativos são combinados por interseção (`AND`).
- O backend é o responsável por toda a lógica de filtragem e segurança, o frontend apenas exibe os resultados retornados.

### Comportamento da busca de usuarios no painel do admin

- O admin vê usuários do sistema inteiro, sem restrição por hemocentro.
- A listagem da tela só aparece depois que uma pesquisa ou filtro é aplicado.
- Se a busca for enviada vazia e sem filtros, nenhum usuário deve ser exibido na grade.
- A busca textual aceita `nome`, `email` ou `cpf`.
- O filtro por tipo de usuário usa os perfis do sistema:
  - `1`: doador
  - `2`: funcionario
  - `3`: diretor
  - `4`: admin
- O filtro de `status` permite separar usuários `ativos` e `inativos`.
- Quando mais de um filtro é usado ao mesmo tempo, o resultado deve respeitar todos eles (`AND`).
- O botão de limpar deve remover texto, filtros e resultados da busca atual.

### Notificacoes no dashboard por hemocentro

- Os dashboards de `funcionario`, `diretor` e `admin` exibem um sino de notificações no cabeçalho.
- O sino mostra até 3 atualizações recentes relacionadas ao hemocentro do usuário.
- As notificações podem incluir:
  - última doação registrada, com o nome do último doador
  - atualização de agenda/agendamento
  - atualização de cadastro de usuário vinculado ao hemocentro
  - atualização de dados do próprio hemocentro
- Ao abrir o popover do sino, o contador numérico deve desaparecer, marcando as notificações atuais como lidas.
- O contador só volta a aparecer quando surgir uma atualização nova na base consultada pelo dashboard.
- Para montar esse resumo, o frontend depende das leituras já existentes de:
  - `GET /api/doacoes`
  - `GET /api/agendamentos`
  - `GET /api/users`
  - `GET /api/hemocentros`

### Destaque visual no calendario da agenda do funcionario

- No painel do funcionário, o calendário da agenda deve destacar em vermelho os dias com movimentação do hemocentro.
- O destaque é calculado a partir de datas encontradas em:
  - agendamentos carregados do hemocentro
  - doações carregadas do hemocentro
- O objetivo é indicar rapidamente quais dias tiveram alteração, sem o usuário precisar abrir data por data.
- A seleção do dia continua funcionando normalmente; o destaque vermelho é apenas um marcador visual de atividade.

### Fluxo de estoque por doacao no painel do funcionario

- Depois que uma doacao e registrada, ela nao entra automaticamente no estoque.
- O painel do funcionario exibe uma lista com as doacoes do dia que ainda aguardam lancamento no estoque.
- Cada doacao pendente deve aparecer apenas uma vez, com nome do doador, tipo sanguineo, quantidade e horario.
- Ao clicar em `Atualizar estoque`, o frontend envia o `doacao_id` correspondente.
- Quando o lancamento e concluido com sucesso, essa doacao deve desaparecer da lista de pendencias.
- A atualizacao manual do estoque por tipo sanguineo continua disponivel em paralelo.

### POST /api/seed-doadores

- **Controller**: `DevSeedController@seedDoadores`
- **Objetivo**: Criar rapidamente doadores de teste já vinculados a um hemocentro por meio de doações registradas.
- **Uso sugerido**: ambiente local/desenvolvimento via Postman.
- **Body JSON opcional**:
  - `hemocentro_id`: ID do hemocentro onde as doações serão registradas.
- **Comportamento**:
  - cria ou reaproveita um funcionário do hemocentro informado
  - cria 10 doadores de teste com nomes, sexos, idades, cidades e tipos sanguíneos variados
  - cria 1 doação para cada doador no hemocentro escolhido
  - pode ser chamado novamente sem duplicar doadores já seedados
- **Exemplo**:

```json
{
    "hemocentro_id": 1
}
```

- **Resposta esperada**:
  - `message`
  - `hemocentro`
  - `funcionario`
  - `doadores`
  - `total_doadores`

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
- **Regra de Negocio**: O registro da doacao nao faz mais o lancamento automatico no estoque; esse passo e separado.

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
  - `doacao_id`: (Opcional) ID da doacao que esta sendo lancada no estoque.
- **Regras de lancamento por doacao**:
  - se `doacao_id` for enviado, a doacao precisa pertencer ao mesmo hemocentro informado
  - uma mesma doacao nao pode ser lancada no estoque mais de uma vez
  - ao concluir o lancamento, o backend registra `estoque_lancado_em` e `estoque_lancado_por` na tabela `doacao`
  - isso permite que o frontend remova a doacao da fila de pendencias e evite duplicidade visual

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
---

## Atualizacao recente - painel do funcionario

### Agenda do funcionario

- O cabecalho da aba `Agenda` foi reorganizado em 3 zonas visuais:
- titulo e contagem a esquerda
- calendario ao centro
- busca de doador a direita
- O objetivo foi melhorar leitura e uso em rotina operacional.

### Estoque do dia

- A caixa de acompanhamento do estoque continua filtrando apenas doacoes da data atual.
- No fluxo real, isso significa que doacoes de dias anteriores nao aparecem mais nessa lista quando o dia muda.
- Quando a atualizacao do estoque e concluida, o item passa para estado visual verde claro.
- A listagem de doacoes do bloco agora pode ser recolhida e expandida pelo usuario.

### Fluxo demo local

- Em ambiente local (`localhost` e `127.0.0.1`), o frontend pode adicionar agendamentos demo para teste de usabilidade do painel de funcionario.
- Esses dados demo nao sao persistidos pela API Laravel.
- Check-in, cancelamento, reabertura, triagem e atualizacao de estoque de itens demo sao resolvidos localmente para nao enviar IDs ficticios ao backend.
