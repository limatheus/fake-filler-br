// Content Script para injetar os dados gerados

const brFiller = {
  // Disparar eventos no elemento para que frameworks (React, Vue, Angular) percebam a mudança
  triggerEvents: (element) => {
    ['focus', 'input', 'change', 'blur'].forEach(eventType => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    });
  },

  isOptional: (input, labelText) => {
    if (input.required) return false;
    if (input.getAttribute('aria-required') === 'true') return false;
    if (labelText.includes('*')) return false;
    if (typeof input.className === 'string' && input.className.toLowerCase().includes('required')) return false;
    return true;
  },

  shouldIgnore: (combinedText) => {
    const ignoreWords = ['cupom', 'desconto', 'voucher', 'promocao', 'promocode', 'token', 'opcional', 'optional', 'complemento', 'observacao', 'obs', 'pesquisa', 'search'];
    return ignoreWords.some(word => combinedText.includes(word));
  },

  // Tenta adivinhar se o campo aceita pontuação
  // Retorna true se deve usar pontuação, false se não
  acceptsFormatting: (element, unformattedLength) => {
    const maxLength = element.getAttribute('maxlength');
    if (maxLength && parseInt(maxLength) === unformattedLength) return false;
    const pattern = element.getAttribute('pattern');
    if (pattern && (pattern === '[0-9]*' || pattern === '\\d+')) return false;
    return true;
  },

  formatData: (value, type) => {
    if (type === 'cpf') return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
    if (type === 'cnpj') return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
    if (type === 'rg') return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}-${value.slice(8, 9)}`;
    if (type === 'cep') return `${value.slice(0, 5)}-${value.slice(5, 8)}`;
    if (type === 'phone') return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    if (type === 'landline') return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    if (type === 'date') return `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 8)}`;
    if (type === 'date-native') return `${value.slice(4, 8)}-${value.slice(2, 4)}-${value.slice(0, 2)}`;
    if (type === 'creditcard') return `${value.slice(0, 4)} ${value.slice(4, 8)} ${value.slice(8, 12)} ${value.slice(12, 16)}`;
    return value;
  },

  fillInput: (element, value) => {
    let nativeSetter = null;
    const tag = element.tagName ? element.tagName.toLowerCase() : '';
    
    if (tag === 'select') {
      nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
    } else if (tag === 'textarea') {
      nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    } else {
      nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    }

    element.focus();

    // Para inputs de texto, o insertText é a melhor forma de simular digitação real para bypassar máscaras do Vue
    let success = false;
    if (tag === 'input' && element.type !== 'radio' && element.type !== 'checkbox') {
       element.select(); // Seleciona tudo para sobrescrever
       success = document.execCommand('insertText', false, value);
    }

    // Fallback se o execCommand não for suportado ou se for select/textarea
    if (!success) {
      if (nativeSetter) {
        nativeSetter.call(element, value);
      } else {
        element.value = value;
      }
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    }
    
    element.blur();
  },

  // Resolve o label text para um input, buscando em diversas fontes
  // (incluindo wrappers do Vuetify/MUI que não usam label[for])
  getLabelText: (input) => {
    let labelText = '';
    
    // 1. label[for="id"]
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) labelText = (label.textContent || label.innerText || '').toLowerCase();
    }
    
    // 2. parent <label>
    if (!labelText) {
      const parentLabel = input.closest('label');
      if (parentLabel) labelText = (parentLabel.textContent || parentLabel.innerText || '').toLowerCase();
    }

    // 3. Vuetify: label dentro do .v-input wrapper pai
    if (!labelText) {
      const vInput = input.closest('.v-input, .v-text-field, .v-field');
      if (vInput) {
        const vLabel = vInput.querySelector('.v-label, label');
        if (vLabel) labelText = (vLabel.textContent || vLabel.innerText || '').toLowerCase();
      }
    }

    // 4. aria-label / aria-labelledby
    if (!labelText) {
      const ariaLabel = input.getAttribute('aria-label');
      if (ariaLabel) labelText = ariaLabel.toLowerCase();
    }
    if (!labelText) {
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const labelEl = document.getElementById(ariaLabelledBy);
        if (labelEl) labelText = (labelEl.textContent || labelEl.innerText || '').toLowerCase();
      }
    }

    // 5. placeholder como fallback
    if (!labelText && input.placeholder) {
      labelText = input.placeholder.toLowerCase();
    }

    return labelText;
  },

  // Preenche v-selects do Vuetify 3 (que não são <select> nem <input>, mas usam role="combobox")
  fillVuetifySelects: () => {
    // Busca direto pelo role="combobox" (Vuetify 3 coloca no .v-field e não tem <input> interno visível)
    const comboboxes = document.querySelectorAll('[role="combobox"]');
    
    comboboxes.forEach((combobox, index) => {
      // Pular comboboxes que já tem seleção de texto (Vuetify injeta no .v-select__selection ou div de input)
      const selectionEl = combobox.querySelector('.v-select__selection-text, .v-select__selection, .v-field__input');
      if (selectionEl && selectionEl.textContent && selectionEl.textContent.trim() !== '') return;

      // Buscar o label (que fica irmão ou dentro do combobox no Vuetify)
      const labelEl = combobox.closest('.v-input')?.querySelector('.v-label') || combobox.querySelector('.v-label, label');
      const labelText = labelEl ? (labelEl.textContent || labelEl.innerText || '').toLowerCase() : '';
      if (brFiller.shouldIgnore(labelText)) return;
      
      const isGender = labelText.includes('gênero') || labelText.includes('genero') || labelText.includes('sexo');

      // Abrir o dropdown com delay sequencial pra cada select não se atropelar
      setTimeout(() => {
        combobox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        combobox.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        // Aguardar o overlay abrir e clicar numa opção
        setTimeout(() => {
          const listItems = document.querySelectorAll('.v-overlay--active .v-list-item[role="option"]');
          if (listItems.length > 0) {
            let targetItem = null;

            // Se for campo de gênero, tenta escolher a opção que bate com o perfil atual
            if (isGender && brFiller.currentProfile) {
               const target1 = brFiller.currentProfile.gender === 'M' ? 'masculino' : 'feminino';
               const target2 = brFiller.currentProfile.gender === 'M' ? 'homem' : 'mulher';
               targetItem = Array.from(listItems).find(item => {
                 const text = item.innerText.toLowerCase();
                 return text.includes(target1) || text.includes(target2);
               });
            }

            // Fallback se não for gênero ou não achou a opção
            if (!targetItem) {
               const startIndex = (listItems.length > 1 && listItems[0].innerText.trim() === '') ? 1 : 0;
               const randomIndex = Math.floor(Math.random() * (listItems.length - startIndex)) + startIndex;
               targetItem = listItems[randomIndex];
            }
            
            targetItem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        }, 200);
      }, index * 400); // Delay sequencial para não abrir todos ao mesmo tempo
    });
  },

  fill: (scope = 'all', isSecondPass = false) => {
    // Gerar um perfil consistente para esta sessão de preenchimento (ou reutilizar se for segunda onda)
    if (!isSecondPass || !brFiller.currentProfile) {
       brFiller.currentProfile = window.BrGenerators.generateProfile();
    }
    const profile = brFiller.currentProfile;

    let inputs = [];
    
    if (scope === 'input' && brFiller.lastRightClickedElement) {
      const el = brFiller.lastRightClickedElement;
      // Se clicou direto num input/textarea/select
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        inputs = [el];
      } else {
        // Checar se é um v-select do Vuetify
        const vSelect = el.closest('.v-select, .v-combobox, .v-autocomplete');
        if (vSelect) {
          const combobox = vSelect.querySelector('[role="combobox"]') || vSelect.querySelector('.v-field');
          if (combobox) {
            combobox.click();
            setTimeout(() => {
              const listItems = document.querySelectorAll('.v-overlay--active .v-list-item[role="option"]');
              if (listItems.length > 0) {
                const randomIndex = Math.floor(Math.random() * listItems.length);
                listItems[randomIndex].click();
              }
            }, 150);
          }
          return;
        }
        // Procurar o primeiro input dentro do elemento clicado
        const closestInput = el.querySelector('input, textarea, select') || el.closest('label')?.querySelector('input, textarea, select');
        if (closestInput) inputs = [closestInput];
      }
    } 
    else if (scope === 'form' && brFiller.lastRightClickedElement) {
      const form = brFiller.lastRightClickedElement.closest('form');
      if (form) {
        inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
      } else {
        // Se não houver <form>, pega todos na tela (comum em SPAs)
        inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
      }
    } 
    else {
      // Escopo 'all' (Padrão)
      inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
    }
    
    // Processar inputs normais (text, email, tel, select nativo, etc)
    inputs.forEach(input => {
      if (input.disabled) return;

      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const className = (typeof input.className === 'string' ? input.className : '').toLowerCase();
      const labelText = brFiller.getLabelText(input);

      const combinedText = `${name} ${id} ${placeholder} ${className} ${labelText}`;

      // Detectar se este input pertence a um v-select do Vuetify (será tratado separadamente)
      if (input.closest && input.closest('.v-select, .v-combobox, .v-autocomplete')) {
        return; // Pula — será tratado em fillVuetifySelects()
      }

      // Campos readonly — permitir apenas datepickers
      const isReadonlyDatepicker = input.readOnly && combinedText.match(/data|date|nascimento|vencimento|validade/i);
      if (input.readOnly && !isReadonlyDatepicker) return;

      // Regras de Ignorar (Cupons, Pesquisa, etc)
      if (brFiller.shouldIgnore(combinedText)) return;

      // Regras de Campos Opcionais
      const isAddressNumber = combinedText.includes('numero') || combinedText.includes('número') || (combinedText.includes('number') && !combinedText.includes('card') && !combinedText.includes('cartao'));
      
      if (input.type !== 'checkbox' && input.type !== 'radio' && input.tagName.toLowerCase() !== 'select' && !isAddressNumber) {
        if (brFiller.isOptional(input, labelText)) return;
      }

      // Tratar Checkbox
      if (input.type === 'checkbox') {
        // Toggles e Switches não devem ser ativados por padrão
        const isToggle = input.getAttribute('role') === 'switch' || className.includes('switch') || className.includes('toggle');
        if (isToggle) return;

        if (!input.checked) {
          input.checked = true;
          brFiller.triggerEvents(input);
        }
        return;
      }
      
      // Tratar Radio Buttons
      if (input.type === 'radio') {
        if (input.name) {
          const group = document.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
          const anyChecked = Array.from(group).some(r => r.checked);
          if (!anyChecked && group.length > 0) {
            let targetRadio = null;
            // Se for gênero, escolhe a opção certa do perfil
            if (combinedText.includes('gênero') || combinedText.includes('genero') || combinedText.includes('sexo')) {
               const target1 = profile.gender === 'M' ? 'masculino' : 'feminino';
               const target2 = profile.gender === 'M' ? 'homem' : 'mulher';
               targetRadio = Array.from(group).find(r => {
                 const label = brFiller.getLabelText(r) || r.value.toLowerCase();
                 return label.includes(target1) || label.includes(target2);
               });
            }
            if (!targetRadio) {
               targetRadio = group[Math.floor(Math.random() * group.length)];
            }
            targetRadio.checked = true;
            brFiller.triggerEvents(targetRadio);
          }
        } else {
          if (!input.checked) {
            input.checked = true;
            brFiller.triggerEvents(input);
          }
        }
        return;
      }

      // Tratar Selects Nativos
      if (input.tagName && input.tagName.toLowerCase() === 'select') {
        const selectedOpt = input.options[input.selectedIndex];
        if (selectedOpt && selectedOpt.value && selectedOpt.value.trim() !== '') return;

        const options = Array.from(input.options).filter(opt => opt.value && opt.value.trim() !== '' && !opt.disabled);
        if (options.length > 0) {
          let targetOpt = null;
          // Se for gênero, escolhe a opção certa do perfil
          if (combinedText.includes('gênero') || combinedText.includes('genero') || combinedText.includes('sexo')) {
             const target1 = profile.gender === 'M' ? 'masculino' : 'feminino';
             const target2 = profile.gender === 'M' ? 'homem' : 'mulher';
             targetOpt = options.find(opt => {
               const text = opt.text.toLowerCase();
               return text.includes(target1) || text.includes(target2);
             });
          }
          if (!targetOpt) {
             targetOpt = options[Math.floor(Math.random() * options.length)];
          }
          brFiller.fillInput(input, targetOpt.value);
        }
        return;
      }

      // Pular inputs que já têm valor preenchido
      // Correção Mágica para Máscaras: muitas máscaras inicializam o value com "__/__/____" 
      // O que faz a extensão achar que o campo já está preenchido!
      if (input.value) {
        // Remove underlines, espaços, barras e parênteses. 
        // Se não sobrar nada, é só a máscara vazia!
        const cleanValue = input.value.replace(/[_ \/\-\(\)]/g, '');
        if (cleanValue !== '') return; // Realmente preenchido pelo usuário, então pula
      }

      // Lógica de Heurística de Campos usando o Perfil Único (Consistent Data)
      let generatedValue = null;

      if (combinedText.includes('cpf')) {
        const formatted = brFiller.acceptsFormatting(input, 11);
        generatedValue = formatted ? brFiller.formatData(profile.cpf, 'cpf') : profile.cpf;
      } 
      else if (combinedText.includes('cnpj')) {
        const formatted = brFiller.acceptsFormatting(input, 14);
        generatedValue = formatted ? brFiller.formatData(profile.cnpj, 'cnpj') : profile.cnpj;
      } 
      else if (combinedText.includes('cep') || combinedText.includes('zip')) {
        const formatted = brFiller.acceptsFormatting(input, 8);
        generatedValue = formatted ? brFiller.formatData(profile.cep, 'cep') : profile.cep;
      } 
      else if (combinedText.includes('rg') && !combinedText.includes('cargo') && !combinedText.includes('org')) {
        const formatted = brFiller.acceptsFormatting(input, 9);
        generatedValue = formatted ? brFiller.formatData(profile.rg, 'rg') : profile.rg;
      } 
      else if (combinedText.includes('celular') || combinedText.includes('whatsapp') || combinedText.includes('mobile')) {
        const formatted = brFiller.acceptsFormatting(input, 11);
        generatedValue = formatted ? brFiller.formatData(profile.phone, 'phone') : profile.phone;
      }
      else if (combinedText.includes('telefone') || combinedText.includes('phone') || input.type === 'tel') {
        const formatted = brFiller.acceptsFormatting(input, 10);
        generatedValue = formatted ? brFiller.formatData(profile.landline, 'landline') : profile.landline;
      }
      else if (combinedText.includes('email') || combinedText.includes('e-mail') || input.type === 'email') {
        generatedValue = profile.email;
      }
      else if (combinedText.includes('nome') || combinedText.includes('name') || combinedText.includes('firstname') || combinedText.includes('lastname')) {
        if (combinedText.includes('empresa') || combinedText.includes('razao') || combinedText.includes('company')) {
          generatedValue = profile.company;
        } else if (combinedText.includes('sobrenome') || combinedText.includes('last name') || combinedText.includes('last_name') || combinedText.includes('lastname')) {
          generatedValue = profile.lastName;
        } else if (combinedText.includes('primeiro nome') || combinedText.includes('first name') || combinedText.includes('first_name') || combinedText.includes('firstname')) {
          generatedValue = profile.firstName;
        } else {
          generatedValue = profile.fullName;
        }
      }
      else if (combinedText.includes('data') || combinedText.includes('date') || combinedText.includes('nascimento') || combinedText.includes('birth') || combinedText.includes('validade') || combinedText.includes('vencimento') || combinedText.includes('expedicao') || combinedText.includes('emissao') || input.type === 'date' || input.type === 'month') {
        
        // Se não for nascimento, gera uma data nova específica para o contexto
        if (combinedText.includes('validade') || combinedText.includes('vencimento') || combinedText.includes('expir') || combinedText.includes('expiry')) {
          generatedValue = BrGenerators.date('future', 'unformatted');
        } else if (combinedText.includes('expedicao') || combinedText.includes('emissao')) {
          generatedValue = BrGenerators.date('recent', 'unformatted');
        } else {
          // Usa a data de nascimento consistente do perfil
          generatedValue = profile.birthdate; 
        }

        let formatType = 'formatted';
        if (input.type === 'date' || input.type === 'month') {
           formatType = 'native';
           generatedValue = brFiller.formatData(generatedValue, 'date-native');
        } else if (brFiller.acceptsFormatting(input, 8)) {
           generatedValue = brFiller.formatData(generatedValue, 'date');
        }
        
        // Tratamento especial para formatos curtos (ex: Validade de Cartão MM/YY ou MM/YYYY e input type="month")
        if (input.type === 'month') {
           generatedValue = generatedValue.substring(0, 7); 
        } else if (formatType === 'formatted') {
           const maxLength = input.maxLength || parseInt(input.getAttribute('maxlength') || '20', 10);
           if (maxLength === 5) {
             // Retorna apenas MM/YY
             generatedValue = generatedValue.split('/')[1] + '/' + generatedValue.split('/')[2].slice(2);
           } else if (maxLength === 7) {
             // Retorna MM/YYYY
             generatedValue = generatedValue.split('/')[1] + '/' + generatedValue.split('/')[2];
           }
        }
      }
      else if (combinedText.includes('senha') || combinedText.includes('password') || input.type === 'password') {
        generatedValue = BrGenerators.password();
      }
      else if (combinedText.includes('cartao') || combinedText.includes('cartão') || combinedText.includes('card') || combinedText.includes('ccnum')) {
        // Se for o nome impresso no cartão
        if (combinedText.includes('nome') || combinedText.includes('name')) {
           generatedValue = profile.fullName;
        } else {
           const formatted = brFiller.acceptsFormatting(input, 16);
           generatedValue = formatted ? brFiller.formatData(profile.creditCard, 'creditcard') : profile.creditCard;
        }
      }
      else if (combinedText.includes('cvv') || combinedText.includes('cvc') || combinedText.includes('codigo de seguranca') || combinedText.includes('código de segurança')) {
        generatedValue = profile.cvv;
      }
      // Outros campos de endereço genéricos
      else if (combinedText.includes('endereco') || combinedText.includes('endereço') || combinedText.includes('address') || combinedText.includes('rua') || combinedText.includes('logradouro')) {
        generatedValue = "Rua Teste da Silva"; // Sem o número, para casos de campos separados
      }
      else if (combinedText.includes('numero') || combinedText.includes('número') || (combinedText.includes('number') && !combinedText.includes('card') && !combinedText.includes('cartao'))) {
        generatedValue = String(BrGenerators.randomInt(10, 9999));
      }
      else if (combinedText.includes('bairro') || combinedText.includes('neighborhood')) {
        generatedValue = "Centro";
      }
      else if (combinedText.includes('cidade') || combinedText.includes('city')) {
        generatedValue = "São Paulo";
      }
      else if (combinedText.includes('estado') || combinedText.includes('uf') || combinedText.includes('state')) {
        generatedValue = "SP";
      }
      // Se não reconheceu nada mas é texto
      else if (input.type === 'text' || !input.type) {
        if (name || id) {
           generatedValue = "Teste " + (name || id);
        } else {
           generatedValue = "Teste";
        }
      }

      if (generatedValue) {
        brFiller.fillInput(input, generatedValue);
      }
    });

    // Processar v-selects do Vuetify (que não são inputs nativos)
    if (scope === 'all' || scope === 'form') {
      brFiller.fillVuetifySelects();
    }

    // Segunda e Terceira onda: re-executa a varredura após 1.5s e 3.0s para capturar campos 
    // que foram desbloqueados ou inseridos no DOM por APIs (ex: campo Número após consulta ViaCEP)
    if (!isSecondPass) {
      setTimeout(() => {
        brFiller.fill(scope, true);
      }, 1500);
      setTimeout(() => {
        brFiller.fill(scope, true);
      }, 3000);
    }
  }
};

// Rastrear o último elemento clicado com o botão direito para sabermos em qual form ou input atuar
document.addEventListener('contextmenu', (e) => {
  brFiller.lastRightClickedElement = e.target;
}, true);

// Escutar mensagens do Background ou Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_forms") {
    // Apagar perfil atual para gerar um NOVO perfil a cada clique da extensão!
    brFiller.currentProfile = null;
    brFiller.fill(request.scope || 'all');
    sendResponse({status: "success"});
  }
});
