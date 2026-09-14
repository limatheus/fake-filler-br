// Background Service Worker

chrome.commands.onCommand.addListener((command) => {
  if (command === "fill_form") {
    // Pegar a aba ativa e enviar mensagem para o content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "fill_forms"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Erro ao enviar mensagem:", chrome.runtime.lastError);
          }
        });
      }
    });
  }
});

// Listener para cliques no botão da action do Chrome (se quiséssemos rodar sem popup,
// mas nós temos popup, então o popup enviará a mensagem)

// Criar o menu de contexto na instalação
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fake_filler_br_parent",
    title: "Fake Filler BR",
    contexts: ["page", "editable"]
  });

  chrome.contextMenus.create({
    id: "fill_all",
    parentId: "fake_filler_br_parent",
    title: "Preencher tudo",
    contexts: ["page", "editable"]
  });

  chrome.contextMenus.create({
    id: "fill_form",
    parentId: "fake_filler_br_parent",
    title: "Preencher este formulário",
    contexts: ["page", "editable"]
  });

  chrome.contextMenus.create({
    id: "fill_input",
    parentId: "fake_filler_br_parent",
    title: "Preencher este campo",
    contexts: ["editable"]
  });
});

// Listener para cliques no menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && (info.menuItemId === "fill_all" || info.menuItemId === "fill_form" || info.menuItemId === "fill_input")) {
    const scope = info.menuItemId.replace('fill_', '');
    chrome.tabs.sendMessage(tab.id, {action: "fill_forms", scope: scope}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Erro ao enviar mensagem via contexto:", chrome.runtime.lastError);
      }
    });
  }
});
