# Pesquisa sobre MCPs (Model Context Protocol Servers)

## Data da Pesquisa: 09/01/2026

## Fontes Oficiais

### 1. Documentação Oficial
- **Site Principal**: https://modelcontextprotocol.io/
- **Documentação**: https://modelcontextprotocol.io/docs/learn/architecture
- **Especificação**: https://modelcontextprotocol.io/specification/2025-11-25
- **Anúncio Anthropic**: https://www.anthropic.com/news/model-context-protocol

### 2. Repositórios Oficiais
- **Repositório de Servidores de Referência**: https://github.com/modelcontextprotocol/servers
- **Documentação (GitHub)**: https://github.com/modelcontextprotocol/docs
- **Registro Oficial de MCPs**: https://registry.modelcontextprotocol.io/

### 3. Listas Comunitárias
- **Awesome MCP Servers**: https://github.com/wong2/awesome-mcp-servers
- **Popular MCP Servers**: https://github.com/pedrojaques99/popular-mcp-servers
- **MCP Server Finder**: https://www.mcpserverfinder.com/

## MCPs de Referência Oficiais (Mantidos pela Anthropic)

### Ativos
1. **Everything** - Servidor de referência/teste com prompts, recursos e ferramentas
2. **Fetch** - Busca e conversão de conteúdo web para uso eficiente com LLMs
3. **Filesystem** - Operações seguras de arquivos com controles de acesso configuráveis
4. **Git** - Ferramentas para ler, pesquisar e manipular repositórios Git
5. **Memory** - Sistema de memória persistente baseado em grafo de conhecimento
6. **Sequential Thinking** - Resolução de problemas dinâmica e reflexiva através de sequências de pensamento
7. **Time** - Capacidades de conversão de tempo e fuso horário

### Arquivados (Movidos para servers-archived)
- AWS KB Retrieval
- Brave Search (substituído por servidor oficial)
- EverArt
- GitHub
- GitLab
- Google Drive
- Google Maps
- PostgreSQL
- Puppeteer
- Redis
- Sentry
- Slack (agora mantido por Zencoder)
- SQLite

## Categorias de MCPs Populares

### 1. Integrações Cloud & DevOps
- **AWS** (múltiplos servidores)
- **Azure** (múltiplos servidores)
- **Google Cloud** (múltiplos servidores)
- **Alibaba Cloud** (AnalyticDB, DataWorks, OpenSearch, RDS, OPS)
- **Vercel**
- **Netlify**
- **Docker**
- **Kubernetes**

### 2. Bancos de Dados
- **PostgreSQL**
- **MySQL**
- **SQLite**
- **Redis**
- **MongoDB**
- **Apache Doris**
- **Apache Pinot**
- **ClickHouse**
- **Supabase**
- **Aiven**

### 3. Desenvolvimento & Versionamento
- **GitHub**
- **GitLab**
- **Git** (oficial)
- **Bitbucket**

### 4. Produtividade & Colaboração
- **Slack**
- **Notion**
- **Google Workspace**
- **Microsoft 365**
- **Obsidian**
- **Anytype**

### 5. E-commerce & Pagamentos
- **Shopify**
- **Stripe**
- **Alipay Plus**
- **Antom**
- **Adfin**

### 6. CRM & Marketing
- **Salesforce**
- **HubSpot**
- **Ahrefs**

### 7. Busca & Web Scraping
- **Brave Search**
- **Exa** (busca inteligente)
- **Firecrawl**
- **Puppeteer**
- **AgentQL**
- **Apify** (6000+ ferramentas de extração)

### 8. Análise de Dados & BI
- **Amplitude**
- **Kubit**
- **Alkemi** (Snowflake, BigQuery, DataBricks)
- **Apache Doris**

### 9. Testes & QA
- **AltTester** (Unity/Unreal)
- **Playwright**
- **Cypress**

### 10. IA & Machine Learning
- **EverArt** (geração de imagens)
- **AllVoiceLab** (TTS, clonagem de voz)
- **Gemini Image** (análise de imagens/vídeos)

### 11. Finanças & Trading
- **Alpaca** (trading de ações e opções)
- **AlphaVantage** (dados de mercado financeiro)

### 12. Observabilidade & Monitoramento
- **AgentOps** (observabilidade para agentes IA)
- **Sentry**

## SDKs Oficiais Disponíveis

1. **TypeScript** - https://github.com/modelcontextprotocol/typescript-sdk
2. **Python** - https://github.com/modelcontextprotocol/python-sdk
3. **C#** - https://github.com/modelcontextprotocol/csharp-sdk
4. **Go** - https://github.com/modelcontextprotocol/go-sdk
5. **Java** - https://github.com/modelcontextprotocol/java-sdk
6. **Kotlin** - https://github.com/modelcontextprotocol/kotlin-sdk
7. **PHP** - https://github.com/modelcontextprotocol/php-sdk
8. **Ruby** - https://github.com/modelcontextprotocol/ruby-sdk
9. **Rust** - https://github.com/modelcontextprotocol/rust-sdk
10. **Swift** - https://github.com/modelcontextprotocol/swift-sdk

## Conceitos Importantes

### O que é MCP?
- **Model Context Protocol (MCP)** é um protocolo aberto padrão para conectar aplicações de IA a sistemas externos
- Permite que aplicações de IA como Claude tenham acesso seguro e controlado a ferramentas e fontes de dados
- Lançado pela Anthropic em 25 de novembro de 2024

### Arquitetura
- **Cliente MCP**: Aplicação de IA (ex: Claude Desktop)
- **Servidor MCP**: Implementação que expõe recursos, ferramentas e prompts
- **Protocolo**: Comunicação padronizada entre cliente e servidor

### Tipos de Recursos MCP
1. **Resources** (Recursos): Dados que podem ser lidos (arquivos, documentos, etc.)
2. **Tools** (Ferramentas): Funções que podem ser executadas
3. **Prompts** (Prompts): Templates de prompts reutilizáveis

## Próximos Passos
1. Criar mcp-reference.yaml com os MCPs mais importantes
2. Criar script de instalação automatizado
3. Documentar melhores práticas de uso
4. Integrar com sistema NETECMT


## Como Instalar e Configurar MCPs

### Formato de Configuração

Os MCPs são configurados através de um arquivo JSON no Claude Desktop:

**Localização do Arquivo de Configuração:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Formato Básico:**
```json
{
  "mcpServers": {
    "nome-do-servidor": {
      "command": "comando",
      "args": ["argumento1", "argumento2"],
      "env": {
        "VARIAVEL_AMBIENTE": "valor"
      }
    }
  }
}
```

### Tipos de Instalação

#### 1. MCPs via NPX (Node.js)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/caminho/para/diretorio"
      ]
    }
  }
}
```

#### 2. MCPs via Python
```json
{
  "mcpServers": {
    "mcp-python": {
      "command": "python",
      "args": ["-m", "nome_do_pacote"]
    }
  }
}
```

#### 3. MCPs via UV (Python Package Manager)
```json
{
  "mcpServers": {
    "mcp-uv": {
      "command": "uvx",
      "args": ["nome-do-pacote"]
    }
  }
}
```

#### 4. MCPs Remotos (SSE - Server-Sent Events)
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.exemplo.com/mcp/sse",
      "headers": {
        "Authorization": "Bearer TOKEN_AQUI"
      }
    }
  }
}
```

### Processo de Instalação

1. **Instalar pré-requisitos** (Node.js, Python, etc.)
2. **Editar arquivo de configuração** do Claude Desktop
3. **Adicionar configuração do MCP** no formato JSON
4. **Reiniciar Claude Desktop** para carregar a nova configuração
5. **Verificar ícone de martelo** (🔨) no canto inferior direito do Claude
6. **Testar ferramentas** disponibilizadas pelo MCP

### Variáveis de Ambiente Comuns

Muitos MCPs requerem variáveis de ambiente para autenticação:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "seu_token_aqui"
      }
    }
  }
}
```

### Múltiplos MCPs

É possível configurar múltiplos MCPs simultaneamente:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "token"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

## MCPs Mais Importantes por Categoria

### 1. Desenvolvimento (Top 10)
1. **GitHub** - Gerenciamento de repositórios e operações Git
2. **GitLab** - Integração com GitLab
3. **Git** (oficial) - Operações Git locais
4. **Filesystem** (oficial) - Operações de arquivos com controle de acesso
5. **Sequential Thinking** (oficial) - Resolução de problemas passo a passo
6. **Memory** (oficial) - Sistema de memória persistente baseado em grafo
7. **Fetch** (oficial) - Busca e conversão de conteúdo web
8. **Puppeteer** - Automação de browser e web scraping
9. **Docker** - Gerenciamento de containers
10. **VS Code** - Integração com Visual Studio Code

### 2. Bancos de Dados (Top 10)
1. **PostgreSQL** - Acesso a bancos PostgreSQL
2. **MySQL** - Acesso a bancos MySQL
3. **SQLite** - Interação com bancos SQLite
4. **Supabase** - Plataforma completa de backend
5. **MongoDB** - Banco de dados NoSQL
6. **Redis** - Cache e armazenamento key-value
7. **ClickHouse** - Banco de dados analítico
8. **Apache Doris** - Data warehouse em tempo real
9. **Couchbase** - Banco de dados distribuído
10. **DreamFactory** - Acesso a múltiplos bancos via RBAC

### 3. Cloud & DevOps (Top 10)
1. **AWS Bedrock** - Integração com AWS Knowledge Base
2. **AWS CDK** - Infraestrutura como código AWS
3. **Azure DevOps** - Pipelines e gerenciamento Azure
4. **Google Cloud** - Serviços Google Cloud Platform
5. **Cloudflare** - Workers, KV, R2, D1
6. **Vercel** - Deploy e gerenciamento Vercel
7. **Netlify** - Deploy e hosting Netlify
8. **Railway** - Deploy de aplicações
9. **Kubernetes** - Orquestração de containers
10. **Docker** - Gerenciamento de containers

### 4. Produtividade & Colaboração (Top 10)
1. **Slack** - Mensagens e gerenciamento de canais
2. **Notion** - Gerenciamento de conhecimento
3. **Obsidian** - Vault de notas com GitHub
4. **Google Workspace** - Gmail, Calendar, Drive
5. **Microsoft 365** - Serviços Microsoft
6. **Jira** - Gerenciamento de projetos
7. **Linear** - Rastreamento de issues
8. **Trello** - Quadros Kanban
9. **Asana** - Gerenciamento de tarefas
10. **Monday** - Plataforma de trabalho

### 5. Busca & Web (Top 10)
1. **Brave Search** - Busca web via API Brave
2. **Exa** - Busca inteligente para IA
3. **Firecrawl** - Web scraping avançado
4. **Puppeteer** - Automação de browser
5. **Browserbase** - Automação de browser na nuvem
6. **Apify** - 6000+ ferramentas de extração
7. **Bright Data** - Dados web em tempo real
8. **Crawlbase** - HTML, markdown e screenshots
9. **Decodo** - Acesso simplificado a dados web
10. **FetchSERP** - Toolkit de SEO e web intelligence

### 6. IA & Machine Learning (Top 10)
1. **ElevenLabs** - Text-to-speech oficial
2. **AllVoiceLab** - TTS, clonagem de voz, tradução de vídeo
3. **DAISYS** - Text-to-speech de alta qualidade
4. **Gemini Image** - Análise de imagens/vídeos com Gemini
5. **AWS Nova Canvas** - Geração de imagens com Amazon Nova
6. **DINO-X** - Visão computacional e detecção de objetos
7. **Chroma** - Embeddings e busca vetorial
8. **AgentQL** - Dados estruturados de web não estruturada
9. **DeepResearch** - Agente de pesquisa profunda
10. **Chronulus AI** - Previsões e forecasting

### 7. E-commerce & Pagamentos (Top 5)
1. **Shopify** - Administração de lojas Shopify
2. **Stripe** - Pagamentos e commerce
3. **Alipay Plus** - Checkout Alipay
4. **Antom** - Checkout Antom
5. **Adfin** - Plataforma de pagamentos e faturamento

### 8. CRM & Marketing (Top 5)
1. **Salesforce** - CRM completo Salesforce
2. **HubSpot** - Marketing e CRM HubSpot
3. **Ahrefs** - SEO e análise de marketing
4. **Audiense Insights** - Análise de audiência
5. **Agent Mindshare** - Monitoramento de mindshare de IA

### 9. Testes & QA (Top 5)
1. **Playwright** - Testes E2E
2. **Cypress** - Testes de frontend
3. **BrowserStack** - Plataforma de testes
4. **Debugg AI** - Testes E2E com zero configuração
5. **AltTester** - Testes para Unity/Unreal

### 10. Observabilidade & Monitoramento (Top 5)
1. **Sentry** - Rastreamento de erros
2. **AgentOps** - Observabilidade para agentes IA
3. **Dash0** - OpenTelemetry, métricas, logs, traces
4. **Axiom** - Análise de logs e traces
5. **Comet Opik** - Telemetria de LLMs

## Comandos de Instalação Comuns

### Via NPM/NPX (Node.js)
```bash
# Instalar globalmente
npm install -g @modelcontextprotocol/server-nome

# Usar via npx (sem instalação)
npx -y @modelcontextprotocol/server-nome
```

### Via UV (Python)
```bash
# Instalar UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Usar MCP via UV
uvx nome-do-pacote-mcp
```

### Via PIP (Python)
```bash
# Instalar pacote Python
pip install nome-do-pacote-mcp

# Executar
python -m nome_do_pacote_mcp
```

## Troubleshooting Comum

### Servidor não aparece no Claude
1. Verificar se o arquivo de configuração está correto (JSON válido)
2. Reiniciar Claude Desktop completamente
3. Verificar logs em:
   - macOS/Linux: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

### Erros de permissão
- Verificar se Node.js/Python estão instalados corretamente
- Verificar se as variáveis de ambiente estão configuradas
- Verificar permissões de acesso aos diretórios

### Ferramentas não funcionam
- Aprovar cada ação quando solicitado pelo Claude
- Verificar se as credenciais/tokens estão corretos
- Consultar documentação específica do MCP
