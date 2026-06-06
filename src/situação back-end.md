# Situação Atual do Backend - DoaVida

Este documento resume as regras de negócio, fluxos de integração e a documentação das APIs implementadas para o ecossistema DoaVida.

## 1. Painel do Diretor e Estatísticas (NOVO)

O backend agora fornece indicadores reais e calculados para a tomada de decisão gerencial.

### Indicadores Implementados:
- **Crescimento Mensal (`crescimento_mes`)**: Cálculo percentual comparando o volume de doações do mês atual com o mês anterior.
- **Taxa de Comparecimento (`taxa_comparecimento`)**: Relação entre agendamentos confirmados (`CON`) e o total de agendamentos do dia atual.
- **Média Diária (`media_diaria`)**: Média de doações realizadas por dia decorrido no mês atual.
- **Estoque Crítico**: Listagem automática de tipos sanguíneos que estão abaixo do nível mínimo de segurança.

### Identificação da Unidade:
- O objeto `user` retornado no **Login** e no **/me** agora inclui o relacionamento `hemocentro` populado. Isso permite que o Diretor e o Funcionário vejam imediatamente o nome e os dados da unidade em que estão alocados.

---

## 2. Fluxo de Elegibilidade (Autoexame)

O backend exige que o doador tenha um teste de elegibilidade válido para permitir agendamentos.

### Regras:
- **Validade:** O teste tem validade de **7 dias**.
- **Endpoints:** 
    - `POST /api/auth/elegibilidade`: Salva o resultado.
    - `GET /api/auth/elegibilidade/atual`: Verifica se o usuário está apto e dentro do prazo.

---

## 3. LGPD e Cadastro Unificado

Garantia de conformidade legal e portabilidade de dados.

- **Registro:** O `POST /api/auth/register` agora aceita o aceite da LGPD e as respostas de pré-triagem simultaneamente.
- **Anonimização:** O `DELETE /api/auth/minha-conta` anonimiza os dados conforme o Art. 18 da LGPD, preservando a integridade histórica das doações (sem dados pessoais).
- **Portabilidade:** `GET /api/auth/meus-dados` exporta todo o histórico do doador em formato JSON.

---

## 4. Triagem Clínica e Doação

Fluxo padronizado para garantir a segurança do sangue coletado.
- **CON (Confirmado):** Doador presente, aguardando triagem.
- **FIN (Finalizado):** Status automático gerado após o sucesso do `POST /api/doacoes`.

## 5. Busca de Doadores (Regra de Hemocentro)

A busca de doadores foi reestruturada para garantir a privacidade e seguir as regras de negócio das unidades.

### Regras Aplicadas:

1. **Visibilidade Restrita:** Funcionários e Diretores autenticados só visualizam doadores que já realizaram doação no **mesmo hemocentro** ao qual o funcionário pertence.
2. **Vínculo por Doação:** O backend utiliza a tabela de `doacoes` e o campo `doador_id` para validar se um doador possui histórico na unidade do funcionário.
3. **Segurança de Dados:** O filtro é aplicado no nível do servidor (Supabase Edge Function). Mesmo que parâmetros de busca sejam manipulados no frontend, o backend bloqueia o retorno de doadores de outras unidades.
4. **Filtros Dinâmicos:** Suporte completo a filtros combinados (AND) via Query Params:
   - Pesquisa por Nome/CPF (`q`).
   - Tipo Sanguíneo (`bloodType`).
   - Sexo, Status, Cidade, Faixa Etária.
   - Período de última doação.
5. **Enriquecimento de Resposta:** O retorno inclui metadados de paginação e campos normalizados como `lastDonation` e `hemocentroName`.

---

## 6. Observação sobre o fluxo demo local do painel de funcionário

As últimas alterações de agenda, triagem e estoque usadas para teste de usabilidade do painel de funcionário foram implementadas no frontend, em modo demo local.

### Importante

1. O backend real continua sendo a fonte de verdade para `agendamentos`, `triagens`, `doacoes` e `estoque`.
2. Os 50 agendamentos fictícios distribuídos em 10 dias do mês não foram persistidos na base Laravel.
3. O tratamento local de check-in, cancelamento, reabertura, triagem e estoque para IDs demo existe apenas para evitar erro de integração durante testes de UX em `localhost`.
4. Se a equipe quiser transformar esse cenário em massa real de homologação, o ideal é criar seed próprio no backend com persistência em banco.

---

## 7. Resumo de Endpoints Relevantes

```http
// Dashboards (Estatísticas Reais)
GET /api/estatisticas/diretor      // Dados gerenciais para diretores
GET /api/estatisticas/funcionario  // Dados operacionais para staff
GET /api/estatisticas/admin        // Visão global do sistema

// Gestão de Conta e LGPD
GET    /api/auth/me                // Agora inclui "hemocentro": {...}
GET    /api/auth/meus-dados        // Portabilidade de dados
DELETE /api/auth/minha-conta       // Exclusão/Anonimização LGPD

// Certificados
GET /api/certificados              // Lista doações elegíveis
GET /api/certificados/{id}/pdf      // Download do certificado oficial
```

---
**Status:** Sincronizado com a demanda "Painel do Diretor" de 21/05/2026.
