import { jStat } from "jstat"

export const ALPHA_PADRAO = 0.05

export const DADOS_TESTE_HIPOTESE = [
  {
    registro: 1,
    tarefa: "Encontrar a regiao com menor lucro",
    tempoPlanilha: 105,
    tempoDashboardMedio: 21.5,
  },
  {
    registro: 2,
    tarefa: "Encontrar o produto com maior venda",
    tempoPlanilha: 98,
    tempoDashboardMedio: 19.5,
  },
  {
    registro: 3,
    tarefa: "Identificar a categoria com maior lucro",
    tempoPlanilha: 88,
    tempoDashboardMedio: 17.5,
  },
  {
    registro: 4,
    tarefa: "Localizar regiao/produto com baixo desempenho",
    tempoPlanilha: 120,
    tempoDashboardMedio: 23.5,
  },
]

export function calcularTesteHipoteseMelhoria(dados = DADOS_TESTE_HIPOTESE, alpha = ALPHA_PADRAO) {
  const linhas = dados.map((item) => ({
    ...item,
    diferenca: item.tempoPlanilha - item.tempoDashboardMedio,
  }))
  const diferencas = linhas.map((item) => item.diferenca)
  const temposPlanilha = linhas.map((item) => item.tempoPlanilha)
  const temposDashboardMedio = linhas.map((item) => item.tempoDashboardMedio)
  const n = linhas.length
  const grausDeLiberdade = Math.max(0, n - 1)
  const mediaPlanilha = calcularMedia(temposPlanilha)
  const mediaDashboardMedio = calcularMedia(temposDashboardMedio)
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
    mediaPlanilha,
    mediaDashboardMedio,
    mediaDiferencas,
    desvioPadraoDiferencas,
    valorT,
    pValue,
    rejeitarH0,
    decisao: rejeitarH0 ? "H0 rejeitada." : "H0 nao rejeitada.",
    decisaoSimplificada: rejeitarH0 ? "H0 rejeitada" : "H0 nao rejeitada",
    interpretacao: rejeitarH0
      ? "Como o P-Valor e menor que 0,05, rejeitamos a hipotese nula. Isso indica que ha evidencia estatistica de que o dashboard reduziu o tempo necessario para encontrar informacoes em comparacao com a pesquisa direta na planilha."
      : "Como o P-Valor e maior ou igual a 0,05, nao rejeitamos a hipotese nula. Isso indica que, com os dados coletados, nao ha evidencia estatistica suficiente para afirmar que o dashboard reduziu o tempo necessario para encontrar informacoes em comparacao com a pesquisa direta na planilha.",
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
