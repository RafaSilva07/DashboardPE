import { jStat } from "jstat"

export const ALPHA_PADRAO = 0.05

export const DADOS_TESTE_HIPOTESE = [
  {
    registro: 1,
    participante: "Participante 1",
    tarefa: "Encontrar a regiao com menor lucro",
    tempoAntes: 22,
    tempoDepois: 15,
  },
  {
    registro: 2,
    participante: "Participante 1",
    tarefa: "Encontrar o produto com maior venda",
    tempoAntes: 20,
    tempoDepois: 14,
  },
  {
    registro: 3,
    participante: "Participante 1",
    tarefa: "Identificar a categoria com maior lucro",
    tempoAntes: 18,
    tempoDepois: 12,
  },
  {
    registro: 4,
    participante: "Participante 1",
    tarefa: "Localizar regiao/produto com baixo desempenho",
    tempoAntes: 24,
    tempoDepois: 16,
  },
  {
    registro: 5,
    participante: "Participante 2",
    tarefa: "Encontrar a regiao com menor lucro",
    tempoAntes: 21,
    tempoDepois: 14,
  },
  {
    registro: 6,
    participante: "Participante 2",
    tarefa: "Encontrar o produto com maior venda",
    tempoAntes: 19,
    tempoDepois: 13,
  },
  {
    registro: 7,
    participante: "Participante 2",
    tarefa: "Identificar a categoria com maior lucro",
    tempoAntes: 17,
    tempoDepois: 11,
  },
  {
    registro: 8,
    participante: "Participante 2",
    tarefa: "Localizar regiao/produto com baixo desempenho",
    tempoAntes: 23,
    tempoDepois: 15,
  },
]

export function calcularTesteHipoteseMelhoria(dados = DADOS_TESTE_HIPOTESE, alpha = ALPHA_PADRAO) {
  const linhas = dados.map((item) => ({
    ...item,
    diferenca: item.tempoAntes - item.tempoDepois,
  }))
  const diferencas = linhas.map((item) => item.diferenca)
  const temposAntes = linhas.map((item) => item.tempoAntes)
  const temposDepois = linhas.map((item) => item.tempoDepois)
  const n = linhas.length
  const grausDeLiberdade = Math.max(0, n - 1)
  const mediaAntes = calcularMedia(temposAntes)
  const mediaDepois = calcularMedia(temposDepois)
  const mediaDiferencas = calcularMedia(diferencas)
  const desvioPadraoDiferencas = calcularDesvioPadraoAmostral(diferencas, mediaDiferencas)
  const erroPadrao = n > 0 ? desvioPadraoDiferencas / Math.sqrt(n) : 0
  const valorT = erroPadrao > 0 ? mediaDiferencas / erroPadrao : 0
  const pValue = grausDeLiberdade > 0 ? 1 - jStat.studentt.cdf(valorT, grausDeLiberdade) : 1
  const rejeitarH0 = pValue < alpha

  return {
    linhas,
    alpha,
    n,
    grausDeLiberdade,
    mediaAntes,
    mediaDepois,
    mediaDiferencas,
    desvioPadraoDiferencas,
    valorT,
    pValue,
    rejeitarH0,
    decisao: rejeitarH0 ? "H0 rejeitada." : "H0 nao rejeitada.",
    decisaoSimplificada: rejeitarH0 ? "H0 rejeitada" : "H0 nao rejeitada",
    interpretacao: rejeitarH0
      ? "Como o P-Valor e menor que 0,05, rejeitamos a hipotese nula. Isso indica que ha evidencia estatistica de que as melhorias implementadas reduziram o tempo necessario para encontrar informacoes no dashboard."
      : "Como o P-Valor e maior ou igual a 0,05, nao rejeitamos a hipotese nula. Isso indica que, com os dados coletados, nao ha evidencia estatistica suficiente para afirmar que as melhorias reduziram o tempo necessario para encontrar informacoes no dashboard.",
  }
}

function calcularMedia(valores) {
  if (!valores.length) {
    return 0
  }

  return valores.reduce((total, atual) => total + atual, 0) / valores.length
}

function calcularDesvioPadraoAmostral(valores, media = calcularMedia(valores)) {
  if (valores.length < 2) {
    return 0
  }

  const somaQuadrados = valores.reduce((total, valor) => total + (valor - media) ** 2, 0)
  const varianciaAmostral = somaQuadrados / (valores.length - 1)
  return Math.sqrt(varianciaAmostral)
}
