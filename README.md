# 🐔 Corrida Gravitacional - Walkthrough

Bem-vindo ao **Corrida Gravitacional**! Este projeto é um jogo 2D desenvolvido com foco em performance e experiência do usuário (UX), idealizado para testes de QA e diversão casual.

O jogo suporta **2 Jogadores Simultâneos (Co-op Competitivo)** em tela dividida, mantendo uma estética limpa e mecânicas fluidas.

---

## 🚀 O que foi implementado

### 1. UI Funcional e Responsiva
* **Menu Inicial:** Tela de introdução intuitiva para seleção de personagens simultânea.
* **HUD de QA:** Localizado no topo para facilitar testes, exibindo:
    * Distância percorrida em tempo real.
    * Botão de **Reiniciar** rápido.
    * Toggle para visualizar **Hitboxes**, permitindo validar colisões com precisão.

### 2. Estética e Personagens
* **Pixel/Flat-art:** Personagens (Galinha, Capivara, Vaca) desenhados via Canvas API.
* **Ambientação:** Sistema de **Parallax** no background (nuvens e cenário) e listras dinâmicas que delimitam os planos de gravidade.

### 3. Mecânica Multiplayer "Split-Platform"
O desafio é sobreviver em pistas paralelas. O Game Over só ocorre quando **ambos** os jogadores são eliminados.

| Jogador | Comando Cima | Comando Baixo |
| :--- | :--- | :--- |
| **J1 (Superior)** | `W` (Inverte p/ Teto) | `S` (Inverte p/ Chão) |
| **J2 (Inferior)** | `Seta Cima` (Teto) | `Seta Baixo` (Chão) |

* **Feedback Visual:** Sistema de partículas acionado a cada inversão de gravidade.

### 4. Obstáculos Randômicos
* **Caixotes / Blocos:** Obstáculos estáticos que surgem em vias aleatórias.
* **Serras Giratórias:** Obstáculos com animação de rotação para aumentar o desafio visual e técnico.

---

## 🛠️ Como executar e testar

Para rodar o projeto localmente, não é necessário instalar dependências:

1.  Clone este repositório ou baixe os arquivos.
2.  Navegue até a pasta do projeto.
3.  Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge).
4.  Ou acesse o link direto: https://vickciv1102.github.io/Corrida-Gravitacional/
