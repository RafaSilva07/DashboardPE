export const traducoesRegioes = {
  North: "Norte",
  South: "Sul",
  East: "Leste",
  West: "Oeste",
}

export const traducoesProdutos = {
  Camera: "Câmera",
  Headphones: "Fones de ouvido",
  Keyboard: "Teclado",
  Laptop: "Notebook",
  Monitor: "Monitor",
  Mouse: "Mouse",
  Printer: "Impressora",
  Smartphone: "Smartphone",
  Smartwatch: "Smartwatch",
  Tablet: "Tablet",
}

export const traducoesCategorias = {
  Accessories: "Acessórios",
  Electronics: "Eletrônicos",
  Office: "Escritório",
}

export function traduzirRotulo(valor) {
  return traducoesProdutos[valor] || traducoesRegioes[valor] || traducoesCategorias[valor] || valor
}
