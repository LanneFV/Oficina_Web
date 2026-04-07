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

# Como Rodar o Servidor (Teste Local do Modelo)
Atualmente, o servidor está configurado para testar o reconhecimento de voz via microfone antes da implementação completa do WebSocket.

## Pré-requisitos
- Python 3.8 ou superior.

- Modelo Vosk (pt-BR) baixado e extraído em server/models/.

Baixe e extraia o modelo **vosk-model-small-pt-0.3** em: [alphacephei.com/vosk/models](alphacephei.com/vosk/models)

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
# Backlog

O acompanhamento das tarefas é gerenciado através do [Trello](https://trello.com/invite/b/69c27fe35421225b2ffbbba6/ATTI059c6f20c7e09b3e68f6dd8d788097bb9934578C/oficina-web).

# Equipe
- Elane Ferreira Viana: Product Owner
  
- Yuri Estrela Leal: Scrum Master
  
- Igor Caldeira Andrade: Desenvolvedor
  
- Arthur Choi Braga: Desenvolvedor
  
- Bianca de Araújo Santana: Desenvolvedora
  
- Bruna Pereira da Cunha: Desenvolvedora
  
- Luiz Eduardo de Sales Carneiro: Desenvolvedor

# Tecnologias Envolvidas
**Frontend / Extensão**: JavaScript (DOM Manipulation, Content Scripts), HTML, CSS (z-index management).

**APIs de Navegador**: chrome.tabCapture / browser.tabCapture.

**Comunicação**: WebSockets.

**Inteligência Artificial**: Modelos de NLP (Processamento de Linguagem Natural) / Speech-to-Text.

**Renderização**: Integração com a suíte VLibras.

# O Desafio e o Impacto Social
Apesar dos avanços nas leis e na conscientização, a inclusão de pessoas com deficiência enfrenta desafios diários. O acesso limitado a tecnologias assistivas (seja por custo ou falta de conhecimento) e a pouca disseminação da LIBRAS nas escolas impactam diretamente a autonomia e a participação social.

Este projeto é um investimento em acessibilidade digital gratuita ou de fácil acesso. Nossa missão é entregar uma ferramenta que promova inclusão plena e efetiva, devolvendo a independência e a qualidade de vida aos indivíduos surdos na internet.
