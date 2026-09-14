document.addEventListener('DOMContentLoaded', () => {
  const fillBtn = document.getElementById('fill-btn');

  fillBtn.addEventListener('click', () => {
    // Pegar a aba ativa e enviar mensagem para o content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "fill_forms"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Erro ao enviar mensagem:", chrome.runtime.lastError);
            // Mostrar feedback visual de erro (opcional)
            fillBtn.textContent = 'Erro! Recarregue a pág.';
            fillBtn.style.backgroundColor = '#EF4444'; // Red 500
          } else {
            // Sucesso
            const originalText = fillBtn.innerHTML;
            fillBtn.classList.add('success');
            fillBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Preenchido!
            `;
            
            setTimeout(() => {
              fillBtn.classList.remove('success');
              fillBtn.innerHTML = originalText;
            }, 2000);
          }
        });
      }
    });
  });
});
