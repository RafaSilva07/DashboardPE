export function calcularResumoDistribuicao(valores) {
  const ordenado = [...valores].filter((valor) => Number.isFinite(valor)).sort((a, b) => a - b)

  if (!ordenado.length) {
    return {
      min: 0,
      max: 0,
      q1: 0,
      median: 0,
      q3: 0,
      iqr: 0,
      amplitude: 0,
      outliers: [],
    }
  }

  const q1 = calcularQuantil(ordenado, 0.25)
  const median = calcularQuantil(ordenado, 0.5)
  const q3 = calcularQuantil(ordenado, 0.75)
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr

  return {
    min: ordenado[0],
    max: ordenado[ordenado.length - 1],
    q1,
    median,
    q3,
    iqr,
    amplitude: ordenado[ordenado.length - 1] - ordenado[0],
    outliers: ordenado.filter((valor) => valor < lowerFence || valor > upperFence),
  }
}

export function calcularCorrelacaoPearson(pontos) {
  if (pontos.length < 2) {
    return 0
  }

  let somaX = 0
  let somaY = 0
  let somaXY = 0
  let somaX2 = 0
  let somaY2 = 0

  pontos.forEach((ponto) => {
    somaX += ponto.x
    somaY += ponto.y
    somaXY += ponto.x * ponto.y
    somaX2 += ponto.x * ponto.x
    somaY2 += ponto.y * ponto.y
  })

  const n = pontos.length
  const numerador = n * somaXY - somaX * somaY
  const denominador = Math.sqrt((n * somaX2 - somaX * somaX) * (n * somaY2 - somaY * somaY))

  if (!denominador) {
    return 0
  }

  return numerador / denominador
}

export function calcularRegressaoLinear(pontos) {
  if (pontos.length < 2) {
    return {
      inclinacao: 0,
      intercepto: 0,
      r2: 0,
    }
  }

  let somaX = 0
  let somaY = 0
  let somaXY = 0
  let somaX2 = 0

  pontos.forEach((ponto) => {
    somaX += ponto.x
    somaY += ponto.y
    somaXY += ponto.x * ponto.y
    somaX2 += ponto.x * ponto.x
  })

  const n = pontos.length
  const denominador = n * somaX2 - somaX * somaX
  const inclinacao = denominador ? (n * somaXY - somaX * somaY) / denominador : 0
  const mediaX = somaX / n
  const mediaY = somaY / n
  const intercepto = mediaY - inclinacao * mediaX
  const correlacao = calcularCorrelacaoPearson(pontos)

  return {
    inclinacao,
    intercepto,
    r2: correlacao ** 2,
  }
}

export function criarPontosDaReta(regressao, pontos) {
  if (pontos.length < 2) {
    return []
  }

  const valoresX = pontos.map((ponto) => ponto.x)
  const minimoX = Math.min(...valoresX)
  const maximoX = Math.max(...valoresX)

  return [
    { x: minimoX, y: regressao.inclinacao * minimoX + regressao.intercepto },
    { x: maximoX, y: regressao.inclinacao * maximoX + regressao.intercepto },
  ]
}

function calcularQuantil(valoresOrdenados, percentual) {
  if (!valoresOrdenados.length) {
    return 0
  }

  const posicao = (valoresOrdenados.length - 1) * percentual
  const indiceBase = Math.floor(posicao)
  const peso = posicao - indiceBase
  const valorBase = valoresOrdenados[indiceBase]
  const proximoValor = valoresOrdenados[Math.min(indiceBase + 1, valoresOrdenados.length - 1)]

  return valorBase + (proximoValor - valorBase) * peso
}
