// Geradores de dados brasileiros
const BrGenerators = {
  // Funções utilitárias
  randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomElement: (arr) => arr[Math.floor(Math.random() * arr.length)],
  
  cpf: (formatted = true) => {
    const calcDigit = (cpfPartial) => {
      let sum = 0;
      for (let i = 0; i < cpfPartial.length; i++) {
        sum += parseInt(cpfPartial[i]) * (cpfPartial.length + 1 - i);
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const n = Array.from({ length: 9 }, () => BrGenerators.randomInt(0, 9)).join('');
    const d1 = calcDigit(n);
    const d2 = calcDigit(n + d1);
    const cpf = n + d1 + d2;

    return formatted ? `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}` : cpf;
  },

  cnpj: (formatted = true) => {
    const calcDigit = (cnpjPartial, weights) => {
      let sum = 0;
      for (let i = 0; i < cnpjPartial.length; i++) {
        sum += parseInt(cnpjPartial[i]) * weights[i];
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const n = Array.from({ length: 8 }, () => BrGenerators.randomInt(0, 9)).join('');
    const base = n + '0001';
    
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = calcDigit(base, w1);
    
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d2 = calcDigit(base + d1, w2);
    
    const cnpj = base + d1 + d2;

    return formatted ? `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}` : cnpj;
  },

  rg: (formatted = true) => {
    const n = Array.from({ length: 9 }, () => BrGenerators.randomInt(0, 9)).join('');
    return formatted ? `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}-${n.slice(8, 9)}` : n;
  },

  cep: (formatted = true) => {
    // Lista de CEPs reais e válidos para garantir sucesso em validações de API (ex: ViaCEP)
    const validCeps = [
      '01001000', // São Paulo, SP (Praça da Sé)
      '20040002', // Rio de Janeiro, RJ (Centro)
      '30140071', // Belo Horizonte, MG (Savassi)
      '80010000', // Curitiba, PR (Centro)
      '90010150', // Porto Alegre, RS (Centro)
      '70040010', // Brasília, DF (Asa Norte)
      '40020000', // Salvador, BA (Centro)
      '60060440', // Fortaleza, CE (Centro)
      '50010000', // Recife, PE (Recife)
      '69010000', // Manaus, AM (Centro)
      '74005901', // Goiânia, GO (Setor Central)
      '29010020', // Vitória, ES (Centro)
    ];
    
    const cep = BrGenerators.randomElement(validCeps);
    return formatted ? `${cep.slice(0, 5)}-${cep.slice(5, 8)}` : cep;
  },

  phone: (formatted = true) => {
    const ddd = BrGenerators.randomInt(11, 99);
    const firstPart = `9${BrGenerators.randomInt(1000, 9999)}`;
    const secondPart = `${BrGenerators.randomInt(1000, 9999)}`;
    
    return formatted ? `(${ddd}) ${firstPart}-${secondPart}` : `${ddd}${firstPart}${secondPart}`;
  },
  
  landline: (formatted = true) => {
    const ddd = BrGenerators.randomInt(11, 99);
    const firstPart = `${BrGenerators.randomInt(2000, 5999)}`;
    const secondPart = `${BrGenerators.randomInt(1000, 9999)}`;
    
    return formatted ? `(${ddd}) ${firstPart}-${secondPart}` : `${ddd}${firstPart}${secondPart}`;
  },

  company: () => {
    const words1 = ['Comercial', 'Indústria', 'Serviços', 'Tecnologia', 'Consultoria', 'Logística', 'Distribuidora'];
    const words2 = ['Brasil', 'Nacional', 'Global', 'Sul', 'Paulista', 'Líder', 'Alpha', 'Omega'];
    const suffixes = ['LTDA', 'S.A.', 'ME', 'EPP'];
    return `${BrGenerators.randomElement(words1)} ${BrGenerators.randomElement(words2)} ${BrGenerators.randomElement(suffixes)}`;
  },

  date: (type = 'birthdate', formatType = 'formatted') => {
    const currentYear = new Date().getFullYear();
    let year;
    if (type === 'birthdate') {
      year = BrGenerators.randomInt(currentYear - 65, currentYear - 18); // 18 a 65 anos atrás
    } else if (type === 'future') {
      year = BrGenerators.randomInt(currentYear + 1, currentYear + 5); // 1 a 5 anos no futuro (validade)
    } else if (type === 'recent') {
      year = BrGenerators.randomInt(currentYear - 10, currentYear - 1); // 1 a 10 anos atrás (emissão RG/CNH)
    } else {
      year = BrGenerators.randomInt(currentYear - 5, currentYear); // Passado genérico recente
    }
    
    const month = BrGenerators.randomInt(1, 12);
    const day = BrGenerators.randomInt(1, 28); // Limita a 28 para evitar erros de fevereiro ou meses sem dia 31
    
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = year;

    if (formatType === 'native') return `${yyyy}-${mm}-${dd}`;
    if (formatType === 'unformatted') return `${dd}${mm}${yyyy}`;
    return `${dd}/${mm}/${yyyy}`; // formatted
  },
  
  password: () => {
    return `Senha@${BrGenerators.randomInt(1000, 9999)}`;
  },

  // ---- NOVO SISTEMA DE PERFIL CONSISTENTE ----

  generateProfile: () => {
    const maleNames = ['Bruno', 'Carlos', 'Eduardo', 'Gabriel', 'Igor', 'Lucas', 'Pedro', 'Rafael', 'Thiago', 'Matheus', 'João', 'Felipe', 'Gustavo', 'Ricardo', 'Fernando'];
    const femaleNames = ['Ana', 'Daniela', 'Fernanda', 'Helena', 'Julia', 'Mariana', 'Sofia', 'Vitória', 'Beatriz', 'Camila', 'Laura', 'Letícia', 'Isabela', 'Amanda'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Mendes'];
    
    const gender = BrGenerators.randomElement(['M', 'F']);
    const firstName = gender === 'M' ? BrGenerators.randomElement(maleNames) : BrGenerators.randomElement(femaleNames);
    const lastName1 = BrGenerators.randomElement(lastNames);
    const lastName2 = BrGenerators.randomElement(lastNames.filter(n => n !== lastName1)); // Evita repetição
    
    const fullName = `${firstName} ${lastName1} ${lastName2}`;
    
    // Email amigável e limpo sem números
    const cleanFirstName = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const cleanLastName = lastName2.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    
    const domains = ['example.com', 'example.org', 'teste.com.br', 'meudominio.com.br'];
    const email = `${cleanFirstName}.${cleanLastName}@${BrGenerators.randomElement(domains)}`;

    return {
      gender,
      firstName,
      lastName: `${lastName1} ${lastName2}`,
      fullName,
      email,
      cpf: BrGenerators.cpf(false),
      cnpj: BrGenerators.cnpj(false),
      rg: BrGenerators.rg(false),
      cep: BrGenerators.cep(false),
      phone: BrGenerators.phone(false),
      landline: BrGenerators.landline(false),
      company: BrGenerators.company(),
      birthdate: BrGenerators.date('birthdate', 'unformatted'),
      password: BrGenerators.password()
    };
  }
};

// Se estiver rodando em Node (testes), exportar. No browser, fica no window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrGenerators;
} else if (typeof window !== 'undefined') {
  window.BrGenerators = BrGenerators;
}
