# Lista Mestra de Model Context Protocol (MCP) Servers

**Autor:** Manus AI  
**Data:** 09 de Janeiro de 2026

## Introdução

Esta é uma lista curada dos mais importantes e populares Model Context Protocol (MCP) Servers, organizada por categoria. O objetivo deste documento é servir como um guia de referência rápida para desenvolvedores e arquitetos de sistemas de IA que utilizam a metodologia NETECMT, facilitando a descoberta e a integração de ferramentas externas nos workflows dos agentes.

Cada entrada inclui o nome do MCP, uma breve descrição de sua funcionalidade e um link para a documentação oficial, sempre que disponível. Para detalhes de instalação e configuração, consulte o arquivo `mcp-reference.yaml`.

## MCPs de Referência (Oficiais da Anthropic)

Estes servidores são mantidos pela equipe do Model Context Protocol e servem como implementações de referência para demonstrar as principais funcionalidades do protocolo. São um excelente ponto de partida para entender como os MCPs funcionam.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **Everything** | Servidor de referência e teste com uma variedade de prompts, recursos e ferramentas para experimentação. | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/everything) |
| **Fetch** | Realiza a busca e conversão de conteúdo da web (HTML para Markdown), otimizando o uso por LLMs. | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) |
| **Filesystem** | Oferece operações seguras de arquivos (leitura, escrita, etc.) no sistema de arquivos local com controle de acesso. | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) |
| **Git** | Fornece ferramentas para ler, pesquisar e manipular repositórios Git locais. | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/git) |
| **Memory** | Implementa um sistema de memória persistente baseado em grafo de conhecimento para os agentes. | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) |
| **Sequential Thinking** | Permite a resolução de problemas de forma dinâmica e reflexiva através de uma sequência de pensamentos (chain of thought). | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking) |
| **Time** | Oferece capacidades de conversão de tempo e fusos horários. | [Link](https://github.com/modelcontextprotocol/servers/tree/main/src/time) |

## Desenvolvimento e Versionamento

Ferramentas essenciais para o ciclo de vida de desenvolvimento de software, desde a manipulação de código-fonte até a automação de tarefas no ambiente de desenvolvimento.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **GitHub** | Gerenciamento completo de repositórios, incluindo issues, pull requests, actions e manipulação de arquivos via API. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/github) |
| **GitLab** | Integração com a plataforma GitLab para gerenciamento de projetos, repositórios e pipelines de CI/CD. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/gitlab) |
| **VS Code** | Permite a interação com o editor Visual Studio Code para manipulação de arquivos, execução de comandos e mais. | [Link](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) |
| **Puppeteer** | Automação de browser e web scraping, útil para testes E2E e extração de dados de páginas dinâmicas. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer) |

## Cloud & DevOps

Servidores que permitem a interação com as principais plataformas de nuvem e ferramentas de DevOps, automatizando o provisionamento de infraestrutura, deployments e monitoramento.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **Docker** | Gerenciamento de containers Docker, incluindo build, run e logs. | [Link](https://github.com/st-sloth/docker-mcp-server) |
| **Vercel** | Gerenciamento de projetos e deployments na plataforma Vercel. | [Link](https://vercel.com/docs/integrations/mcp) |
| **AWS** | Conjunto de servidores para interagir com diversos serviços da AWS, como Bedrock, CDK e S3. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/aws) |
| **Azure DevOps** | Integração com a suíte Azure DevOps para gerenciamento de pipelines, boards e repos. | [Link](https://github.com/microsoft/azure-devops-mcp-server) |
| **Google Cloud** | Ferramentas para interagir com serviços da Google Cloud Platform. | [Link](https://github.com/google-cloud-mcp/google-cloud-mcp-server) |
| **Cloudflare** | Gerenciamento de recursos da Cloudflare, como Workers, KV e R2. | [Link](https://github.com/cloudflare/mcp-server) |
| **Kubernetes** | Interação com clusters Kubernetes para gerenciar pods, serviços e deployments. | [Link](https://github.com/kubernetes-mcp/kubernetes-mcp-server) |
| **Netlify** | Automação de deploys e gerenciamento de sites na plataforma Netlify. | [Link](https://github.com/netlify/mcp-server) |
| **Railway** | Deploy e gerenciamento de aplicações na plataforma Railway. | [Link](https://github.com/railwayapp/mcp-server) |

## Bancos de Dados

Estes MCPs fornecem uma ponte para interagir com diversos tipos de bancos de dados, permitindo que os agentes executem queries, inspecionem schemas e gerenciem dados.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **PostgreSQL** | Acesso de leitura a bancos de dados PostgreSQL para executar queries e inspecionar schemas. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/postgres) |
| **MySQL** | Permite a conexão com bancos de dados MySQL para consulta e manipulação de dados. | [Link](https://github.com/mysql/mcp-server) |
| **SQLite** | Interação com bancos de dados SQLite locais, ideal para aplicações que necessitam de um banco de dados embarcado. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite) |
| **Supabase** | Integração com a plataforma Supabase, que oferece banco de dados Postgres, autenticação, armazenamento e mais. | [Link](https://github.com/supabase/mcp-server) |
| **Redis** | Permite a interação com armazenamentos de chave-valor do Redis, útil para caching e gerenciamento de sessões. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/redis) |
| **MongoDB** | Conexão com bancos de dados NoSQL MongoDB para manipulação de documentos. | [Link](https://github.com/mongodb/mcp-server) |
| **ClickHouse** | Permite a execução de queries analíticas em bancos de dados ClickHouse. | [Link](https://github.com/clickhouse/mcp-server) |
| **Aiven** | Interage com diversos serviços de banco de dados gerenciados pela Aiven, como PostgreSQL, Kafka e OpenSearch. | [Link](https://github.com/aiven/aiven-mcp-server) |

## Produtividade e Colaboração

Ferramentas que conectam agentes de IA a plataformas de produtividade e colaboração, permitindo a automação de tarefas de gerenciamento de projetos, comunicação e documentação.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **Slack** | Interação com workspaces do Slack para envio de mensagens, leitura de canais e gerenciamento de threads. | [Link](https://docs.slack.dev/ai/mcp-server) |
| **Notion** | Acesso completo a workspaces do Notion para criar e gerenciar páginas, bancos de dados e conteúdo. | [Link](https://developers.notion.com/docs/mcp) |
| **Jira** | Integração com o Jira para gerenciamento de issues, sprints e workflows. | [Link](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/) |
| **Google Workspace** | Conjunto de ferramentas para interagir com Gmail, Google Calendar, Google Drive e outros serviços do Google. | [Link](https://github.com/google-workspace-mcp/google-workspace-mcp-server) |
| **Microsoft 365** | Permite a interação com serviços do Microsoft 365, como Outlook, Teams e SharePoint. | [Link](https://github.com/microsoft/m365-mcp-server) |
| **Obsidian** | Conexão com vaults do Obsidian hospedados no GitHub para gerenciamento de notas e conhecimento. | [Link](https://github.com/Hint-Services/obsidian-github-mcp) |
| **Trello** | Gerenciamento de quadros, listas e cartões na plataforma Trello. | [Link](https://github.com/trello/mcp-server) |
| **Asana** | Automação de tarefas e gerenciamento de projetos na plataforma Asana. | [Link](https://github.com/asana/mcp-server) |

## Busca & Web

Estes MCPs capacitam os agentes com habilidades de busca na web, extração de conteúdo (scraping) e análise de sites, transformando a internet em uma fonte de dados acessível.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **Firecrawl** | Ferramenta poderosa para web scraping e busca, que converte URLs em markdown ou dados estruturados. | [Link](https://docs.firecrawl.dev/mcp-server) |
| **Brave Search** | Realiza buscas na web utilizando a API do Brave Search. | [Link](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/brave) |
| **Exa** | Motor de busca inteligente projetado especificamente para ser utilizado por agentes de IA. | [Link](https://github.com/exa-ai/exa-mcp-server) |
| **Apify** | Acesso a mais de 6.000 ferramentas de extração de dados de websites, e-commerce e redes sociais. | [Link](https://github.com/apify/mcp-server) |
| **Browserbase** | Automação de interações de browser na nuvem, como navegação, extração de dados e preenchimento de formulários. | [Link](https://github.com/browserbase/mcp-server) |
| **Bright Data** | Permite o acesso a dados da web em tempo real ou históricos em grande escala. | [Link](https://github.com/bright-data/mcp-server) |

## IA & Machine Learning

Servidores que integram os agentes com outras APIs de IA, permitindo a geração de mídia (voz, imagem), análise de conteúdo e acesso a outros modelos de linguagem.

| Nome | Descrição | Documentação Oficial |
| :--- | :--- | :--- |
| **ElevenLabs** | Geração de voz (Text-to-Speech) e clonagem de voz com alta fidelidade. | [Link](https://elevenlabs.io/docs/agents-platform/customization/tools/mcp) |
| **Gemini Image** | Análise de imagens e vídeos utilizando o modelo Gemini para extrair insights visuais. | [Link](https://github.com/Artin0123/gemini-image-mcp-server) |
| **AWS Nova Canvas** | Geração de imagens a partir de prompts de texto utilizando o Amazon Nova Canvas. | [Link](https://github.com/aws/nova-canvas-mcp-server) |
| **Chroma** | Integração com o banco de dados vetorial Chroma para busca de similaridade e embeddings. | [Link](https://github.com/chroma-core/chroma-mcp-server) |
| **AgentQL** | Extração de dados estruturados de conteúdo web não estruturado para alimentar outros modelos. | [Link](https://github.com/agentql/agentql-mcp-server) |
| **DeepResearch** | Agente de pesquisa profunda que realiza investigações detalhadas de forma autônoma. | [Link](https://github.com/deep-research/deep-research-mcp-server) |
