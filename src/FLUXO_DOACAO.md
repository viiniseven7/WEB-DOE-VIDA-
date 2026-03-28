# 🩸 Fluxo de Doação - DoaVida

## 📋 Visão Geral

O novo fluxo de doação foi completamente reestruturado para oferecer uma experiência mais intuitiva e informativa aos doadores, com ênfase em transparência sobre o processo de triagem presencial.

## 🎯 Páginas Criadas

### 1. **Teste de Elegibilidade** (`/teste-elegibilidade`)
**Arquivo:** `/components/EligibilityTestPage.tsx`

#### Funcionalidades:
- ✅ **10 perguntas detalhadas** sobre elegibilidade para doação
- ✅ Informações úteis em cada pergunta
- ✅ Barra de progresso visual
- ✅ Navegação entre perguntas (voltar/avançar)
- ✅ Três resultados possíveis:
  - **Elegível:** Direciona para cadastro/agendamento
  - **Inelegível:** Orienta sobre impedimentos
  - **Consultar:** Casos especiais que requerem avaliação

#### Perguntas Incluídas:
1. Idade (16-69 anos)
2. Peso (mínimo 50kg)
3. Estado de saúde atual
4. Qualidade do sono (6h mínimo)
5. Alimentação recente
6. Consumo de álcool (12h)
7. Gravidez/amamentação/parto recente
8. Tatuagem/piercing/maquiagem definitiva (12 meses)
9. Última doação (60 dias homens, 90 dias mulheres)
10. Condições médicas específicas

### 2. **Cadastro e Agendamento** (`/cadastro-doacao`)
**Arquivo:** `/components/RegistrationDonationPage.tsx`

#### Funcionalidades:
- ✅ **Processo em 2 etapas:**
  - **Etapa 1:** Dados Pessoais
  - **Etapa 2:** Agendamento da Doação
- ✅ Indicador de progresso visual
- ✅ Formulário completo de cadastro
- ✅ Seleção de posto de coleta
- ✅ Calendário interativo para data
- ✅ Seleção de horário
- ✅ Campo de observações
- ✅ **Tela de confirmação completa e educativa**

#### Dados Coletados:

**Informações Pessoais:**
- Nome completo
- CPF
- Data de nascimento
- Sexo
- Tipo sanguíneo (opcional)
- Email
- Telefone/Celular
- CEP
- Endereço completo
- Cidade
- Estado

**Agendamento:**
- Posto de coleta
- Data da doação
- Horário
- Observações

### 3. **Tela de Pós-Agendamento** (Tela de Sucesso Completa)

#### Informações Incluídas:

**✅ Confirmação do Pré-Agendamento**
- Título enfatiza que é um "Pré-Agendamento"
- Detalhes completos do agendamento em destaque

**⚠️ AVISO IMPORTANTE - Triagem Presencial**
- Seção destacada em âmbar explicando que o teste online foi apenas preliminar
- Informação clara: **"A elegibilidade final será determinada no hemocentro"**
- Lista completa do que inclui a triagem presencial:
  - Entrevista detalhada com profissional de saúde
  - Verificação de sinais vitais (pressão, temperatura, pulso)
  - Teste de hemoglobina/hematócrito
  - Análise do histórico médico completo
  - Avaliação de impedimentos temporários ou definitivos

**👨‍⚕️ Autoridade do Funcionário**
- Explicação clara de que o funcionário pode:
  - Atualizar ou corrigir informações cadastrais
  - Declarar elegibilidade ou inaptidão para doação
  - Solicitar exames ou documentos adicionais
  - Reagendar a doação se necessário

**📋 Orientações Detalhadas**

1. **Prepare-se para o Dia da Doação:**
   - Documentos obrigatórios
   - Orientações de alimentação
   - Hidratação adequada
   - Necessidade de descanso

2. **O que Acontece no Hemocentro (Passo a Passo):**
   - Cadastro e Recepção (5-10 min)
   - Triagem Clínica (15-20 min)
   - Coleta de Sangue (10-15 min)
   - Lanche e Descanso (10-15 min)
   - Tempo total estimado: 40-60 minutos

3. **Cuidados Após a Doação:**
   - Manter curativo por 4 horas
   - Evitar esforços físicos por 12 horas
   - Não fumar por 2 horas
   - Aumentar ingestão de líquidos
   - O que fazer em caso de tontura
   - Quando entrar em contato com o hemocentro

**📧 Confirmação por E-mail**
- Aviso de que um e-mail foi enviado com todas as informações

**💝 Mensagem Motivacional**
- "Você está prestes a salvar até 4 vidas!"
- Agradecimento ao doador

**🔐 Redirecionamento para Login**
- Botão principal destaque: **"Fazer Login para Acompanhar Meu Agendamento"**
- Botões secundários: Imprimir comprovante e voltar para início

## 🏠 Alterações na Home Page

### Removido:
- ❌ Componente `AppointmentForm` (formulário inline de agendamento)
- ❌ Componente `EligibilityChecker` (antigo teste de elegibilidade)

### Adicionado:
- ✅ **Nova seção "Pronto para Doar Sangue?"**
  - 3 cards explicando o processo (Teste → Cadastro → Doação)
  - CTA principal: "Iniciar Teste de Elegibilidade"
  - Design com gradientes temáticos
  
### Botões Atualizados:
- **Hero:** "Quero Doar Sangue" → `/teste-elegibilidade`
- **Header:** "Doar Sangue" → `/teste-elegibilidade`
- **HowToDonate:** "Verificar se Posso Doar" → `/teste-elegibilidade`
- **DonationLocations:** "Agendar Aqui" → `/teste-elegibilidade`

## 🔄 Fluxo do Usuário

```
┌─────────────┐
│  Home Page  │
└──────┬──────┘
       │
       │ Clica "Iniciar Teste"
       ▼
┌──────────────────────┐
│ Teste Elegibilidade  │
│   (10 perguntas)     │
└──────┬───────────────┘
       │
       │ Resultado: Elegível
       ▼
┌──────────────────────┐
│ Cadastro/Agendamento │
│   (2 etapas)         │
└──────┬───────────────┘
       │
       │ Confirma
       ▼
┌──────────────────────┐
│ Tela de Confirmação  │
│  (Informações        │
│   Educativas)        │
└──────┬───────────────┘
       │
       │ Clica "Fazer Login"
       ▼
┌──────────────────────┐
│   Tela de Login      │
└──────────────────────┘
```

## 🎨 Design

### Paleta de Cores por Estado:
- **Teste em Progresso:** Azul/Índigo (`from-blue-50 to-indigo-50`)
- **Elegível/Sucesso:** Verde/Esmeralda (`from-green-50 to-emerald-50`)
- **Inelegível:** Vermelho/Rosa (`from-red-50 to-rose-50`)
- **Consultar:** Âmbar/Amarelo (`from-amber-50 to-yellow-50`)
- **Formulários:** Vermelho/Rosa (`from-red-50 to-rose-50`)

### Ícones Principais:
- 🩸 `Droplet` - Doação de sangue
- ✅ `CheckCircle2` - Sucesso/Elegível
- ❌ `XCircle` - Inelegível
- ⚠️ `AlertCircle` - Consultar
- 📋 `ClipboardCheck` - Teste
- 📅 `Calendar` - Agendamento
- 👤 `User` - Dados pessoais
- 📍 `MapPin` - Localização
- 🕐 `Clock` - Horário

## 🚀 Rotas Adicionadas

```typescript
{ path: "teste-elegibilidade", Component: EligibilityTestPage },
{ path: "cadastro-doacao", Component: RegistrationDonationPage },
```

## 📱 Responsividade

Todas as páginas são totalmente responsivas:
- ✅ Mobile-first design
- ✅ Grid adaptativo (1 coluna mobile, 2-3 colunas desktop)
- ✅ Botões e formulários otimizados para touch
- ✅ Navegação mobile com menu hamburger

## 🔐 Segurança

**NOTA IMPORTANTE:** 
- ⚠️ Este é apenas o **front-end**
- ⚠️ **Nenhum dado está sendo enviado ao backend**
- ⚠️ Os dados são apenas exibidos no console (`console.log`)
- ⚠️ Para produção, será necessário integrar com o backend Supabase

## 📝 Próximos Passos (Backend - Não Implementado)

Quando for implementar o backend:

1. **Criar tabela de doadores:**
   ```sql
   - id, nome, cpf, email, telefone, endereço, tipo_sanguíneo
   ```

2. **Criar tabela de agendamentos:**
   ```sql
   - id, doador_id, posto_id, data, horario, status, observacoes
   - status: 'pre-agendado', 'confirmado', 'triagem-aprovada', 'triagem-reprovada', 'concluido', 'cancelado'
   ```

3. **Criar endpoints:**
   - `POST /api/donors` - Cadastrar doador
   - `POST /api/appointments` - Criar agendamento
   - `GET /api/appointments/:id` - Buscar agendamento
   - `PATCH /api/appointments/:id/status` - Atualizar status (para funcionários)
   - `PATCH /api/donors/:id` - Atualizar dados do doador (para funcionários)

4. **Envio de emails:**
   - Email de confirmação de cadastro com todas as orientações
   - Email de lembrete (1 dia antes)
   - Email de agradecimento (após doação)
   - Email de status alterado (se reprovado na triagem)

5. **Controle de Acesso:**
   - Doadores: podem visualizar seus agendamentos
   - Funcionários: podem atualizar status de triagem e dados cadastrais
   - Diretores/Admin: podem visualizar relatórios

## ✨ Melhorias Implementadas

1. **UX Melhorada:**
   - Processo dividido em etapas claras
   - Informações educativas em cada pergunta
   - Feedback visual imediato
   - Mensagens contextualizadas

2. **Informações Mais Completas:**
   - 10 perguntas vs 5 anteriores
   - Explicações detalhadas
   - Orientações pós-resultado
   - Requisitos documentais claros

3. **Design Profissional:**
   - Gradientes temáticos
   - Cards com bordas e sombras
   - Ícones consistentes
   - Espaçamento adequado

4. **Navegação Intuitiva:**
   - Breadcrumbs visuais
   - Botões de voltar em todas as telas
   - Links contextuais
   - Header sempre acessível

5. **🆕 Transparência e Educação:**
   - Aviso claro sobre triagem presencial
   - Explicação dos poderes do funcionário
   - Guia completo de preparação
   - Timeline do processo no hemocentro
   - Cuidados pós-doação detalhados
   - Redirecionamento para login para acompanhamento

## 🎯 Diferenciais da Tela de Pós-Agendamento

### Por que essa tela é importante:

1. **Gestão de Expectativas:** 
   - O doador entende que pode ser reprovado na triagem presencial
   - Evita frustrações e reclamações

2. **Preparação Adequada:**
   - Doador chega preparado com documentos
   - Melhor taxa de aprovação na triagem
   - Processo mais rápido no hemocentro

3. **Educação Contínua:**
   - Doador aprende sobre todo o processo
   - Torna-se um doador mais consciente e regular

4. **Transparência Institucional:**
   - Sistema transparente sobre limitações do teste online
   - Fortalece credibilidade da organização

5. **Engajamento Pós-Agendamento:**
   - Convite para fazer login e acompanhar status
   - Conecta o doador ao sistema para futuras doações

---

**Desenvolvido para DoaVida** 🩸
*Sistema de Doação de Sangue*