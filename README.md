# Extensão Web para Tradução de Libras em Tempo Real
 
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub repo size](https://img.shields.io/github/repo-size/LanneFV/Oficina_Web)
![GitHub last commit](https://img.shields.io/github/last-commit/LanneFV/Oficina_Web)
 

# Extensão Web para Tradução de Libras em Tempo Real
Garantindo acessibilidade, autonomia e dignidade através de tradução sintática inteligente em tempo real.

# Sobre o Projeto
Você sabia que cerca de 10 milhões de brasileiros têm alguma deficiência auditiva? Isso representa 5% da nossa população (segundo o IBGE). A LIBRAS (Língua Brasileira de Sinais) é reconhecida por lei como meio legal de comunicação no Brasil, mas a realidade ainda é dura: a barreira da comunicação isola essas pessoas diariamente, pois a maioria da população não sabe a língua de sinais.

Este projeto é uma extensão de navegador desenvolvida para mudar essa realidade. Ele captura o áudio de abas da web (como aulas ao vivo ou reuniões no Google Meet) e o traduz, em tempo real, para LIBRAS através de um avatar 3D.

# O Diferencial: Tradução do Sentido
Acessibilidade para surdos vai muito além de trocar palavras por sinais. Existe uma barreira linguística profunda:

**Português**: Língua auditiva, dependente de conectivos e flexões complexas.

**Libras**: Língua visual-espacial, com gramática e sintaxe próprias (frequentemente usando a ordem Tempo > Objeto > Verbo).

Traduzir o português literalmente resulta no chamado "Português Sinalizado", que é exaustivo e muitas vezes incompreensível para o surdo.

Para resolver isso, nosso projeto utiliza Processamento de Linguagem Natural (PLN) como um tradutor sintático inteligente. A IA analisa o áudio, filtra o "ruído" gramatical (como artigos e preposições) e reorganiza os termos essenciais. O resultado é a entrega do sentido real da mensagem, respeitando a cultura surda.

# Como Funciona a Arquitetura
O sistema foi desenhado para ser rápido e não obstrutivo, operando da seguinte maneira:

**Captura de Áudio**: Utiliza a API de Tab Capture do navegador para interceptar o fluxo de áudio da aba ativa (sem mutar o som para os ouvintes originais).

**Processamento em Tempo Real**: O áudio é cortado em frações de milissegundos para não perder o contexto visual e garantir que a tradução ocorra simultaneamente à fala.

**Comunicação Bidirecional**: Os pacotes de áudio são transmitidos continuamente para o nosso servidor de IA através de uma conexão de altíssima velocidade via WebSocket.

**Inteligência Artificial (PLN)**: No servidor, o modelo converte voz em texto, aplica as regras sintáticas da LIBRAS e devolve os dados processados para o navegador instantaneamente.

**Renderização 3D**: O texto processado alimenta o motor do VLibras, que gera a animação do avatar.

**Injeção na Tela**: Através de Content Scripts, a extensão manipula o DOM (Document Object Model) da página de forma isolada para não quebrar o site original. O widget do avatar é sobreposto à tela utilizando o controle da propriedade CSS z-index, garantindo que fique sempre visível para o usuário.
 
```
Áudio da aba
     │
     ▼
[Tab Capture API] ──► [Pacotes de áudio em ms]
                              │
                              ▼ WebSocket
                      [Servidor de IA]
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              [Speech-to-Text]      [PLN / Sintaxe LIBRAS]
                                         │
                                         ▼
                                  [Navegador]
                                         │
                                         ▼
                                  [VLibras Avatar 3D]
                                  (injetado via z-index)
```

# Como Rodar o Servidor (Teste Local do Modelo)
Atualmente, o servidor está configurado para testar o reconhecimento de voz via microfone antes da implementação completa do WebSocket.

## Pré-requisitos
- Google Chrome (versão 88+)
- Python 3.8 ou superior
- Modelo Vosk (pt-BR): baixe e extraia o **vosk-model-small-pt-0.3** em `server/models/`
  - Download: [alphacephei.com/vosk/models](https://alphacephei.com/vosk/models)

## Passo a Passo

Acesse a pasta do servidor:

```Bash
cd server
```
Crie um ambiente virtual (venv):

```Bash
# Windows
python -m venv venv
# Linux/Mac
python3 -m venv venv
```
Ative o ambiente virtual:

```Bash
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```
Instale as dependências:

```Bash
pip install -r requirements.txt
```

Execute o motor de STT:

```Bash
python main.py
```

### Carregar a Extensão no Chrome
 
1. Abra `chrome://extensions` no navegador
2. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `/extension` do repositório clonado
5. A extensão aparecerá na barra de ferramentas do Chrome ✅


# Backlog

O acompanhamento das tarefas é gerenciado no **Trello** — solicite acesso à equipe.

# Equipe
| Nome | Papel |
|---|---|
| Elane Ferreira Viana | Product Owner |
| Yuri Estrela Leal | Scrum Master |
| Igor Caldeira Andrade | Desenvolvedor |
| Arthur Choi Braga | Desenvolvedor |
| Bianca de Araújo Santana | Desenvolvedora |
| Bruna Pereira da Cunha | Desenvolvedora |
| Luiz Eduardo de Sales Carneiro | Desenvolvedor |


# Tecnologias Envolvidas
**Frontend / Extensão**: JavaScript (DOM Manipulation, Content Scripts), HTML, CSS (z-index management).

**APIs de Navegador**: chrome.tabCapture / browser.tabCapture.

**Comunicação**: WebSockets.

**Inteligência Artificial**: Modelos de NLP (Processamento de Linguagem Natural) / Speech-to-Text.

**Renderização**: Integração com a suíte VLibras.

# O Desafio e o Impacto Social
Apesar dos avanços nas leis e na conscientização, a inclusão de pessoas com deficiência enfrenta desafios diários. O acesso limitado a tecnologias assistivas (seja por custo ou falta de conhecimento) e a pouca disseminação da LIBRAS nas escolas impactam diretamente a autonomia e a participação social.

Este projeto é um investimento em acessibilidade digital gratuita ou de fácil acesso. Nossa missão é entregar uma ferramenta que promova inclusão plena e efetiva, devolvendo a independência e a qualidade de vida aos indivíduos surdos na internet.

# Licença
 
Este projeto está licenciado sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
