# 🇧🇷 Fake Filler BR

> Preenchimento automático inteligente de formulários com dados brasileiros consistentes e válidos.

[![Versão](https://img.shields.io/badge/versão-1.0-blue.svg)]()
[![Licença](https://img.shields.io/badge/licença-MIT-green.svg)]()

O **Fake Filler BR** é uma extensão essencial para desenvolvedores, QAs e testadores que lidam com formulários e checkouts brasileiros no dia a dia. Esqueça geradores de CPF online e preenchimentos manuais tediosos: popule formulários inteiros com dados ultra realistas, perfeitamente válidos e coerentes com um único atalho no teclado.

---

## ✨ Por que é diferente?

A maioria das extensões de preenchimento falha em formulários complexos modernos (devido a máscaras estritas) e injeta dados completamente desconexos. O Fake Filler BR resolve esses problemas pela raiz:

- **👤 Perfil Consistente (Single Profile):** Cada vez que você aciona a extensão, ela cria uma "pessoa virtual" em memória. O gênero, nome, sobrenome e e-mail combinam perfeitamente entre si em todos os campos da tela (ex: se o sistema gerar o nome *Beatriz Silva*, o campo de gênero será preenchido como *Feminino* e o e-mail não conterá caracteres genéricos).
- **🛡️ Bypass Avançado de Máscaras:** Utiliza injeção nativa do navegador (`insertText`) para simular teclas físicas. Isso contorna facilmente bibliotecas de máscara ou validações que bloqueiam o preenchimento tradicional via JavaScript.
- **⏱️ Segunda Onda (Async Catch):** Formulários brasileiros costumam fazer requisições assíncronas (como consultas de ViaCEP que travam o campo de "Número"). A extensão realiza uma segunda varredura automática silenciosa 1.5s após a primeira execução para preencher os campos que acabaram de ser destravados pela API!
- **🎯 Focado no Brasil:** Gera CPF, CNPJ, RG e CEP reais/válidos para passar direto em qualquer validação de front-end ou back-end.

## 🚀 Como Instalar (Modo Desenvolvedor)

Enquanto a extensão aguarda revisão na Chrome Web Store, você pode usá-la imediatamente no seu Chrome/Edge:

1. Clone ou baixe este repositório.
2. Acesse a página de extensões do Chrome: `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"** no canto superior direito.
4. Clique no botão **"Carregar sem compactação"** e selecione a pasta do projeto.

## 🕹️ Como Usar

A magia acontece em milissegundos. Você tem três formas de dominar seus formulários:

1. **Atalho de Teclado (Recomendado):** Pressione `Alt + Shift + B` e a extensão varrerá a página preenchendo todos os inputs visíveis.
2. **Menu de Contexto:** Clique com o botão direito na página e vá em "Fake Filler BR". Lá você pode optar por preencher a página inteira, apenas o formulário atual, ou injetar em um campo específico isolado.
3. **Popup (Ação Rápida):** Clique no ícone da extensão na sua barra de tarefas para acessar as ações globais.

## 🤝 Como Contribuir

Contribuições são super bem-vindas! Se você encontrou um bug em alguma biblioteca exótica ou tem ideias para melhorar as heurísticas e geradores, sinta-se à vontade para participar:

1. Faça um **Fork** do projeto.
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/MinhaFeatureIncrivel`).
3. Faça os commits (`git commit -m 'feat: Adicionando suporte a máscaras XYZ'`).
4. Faça o push para a branch (`git push origin feature/MinhaFeatureIncrivel`).
5. Abra um **Pull Request**.

---

*Foque no código. Deixe que o Fake Filler lida com o "teste de digitação".*
