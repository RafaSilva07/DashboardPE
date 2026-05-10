import { Chart, registerables } from "chart.js"
import { formatadorMoeda, formatadorNumero } from "../utils/formatters.js"

Chart.register(...registerables)

type ProfitRecord = {
  data?: string
  mes?: string
  regiao?: string
  categoria?: string
  lucro?: number | string | null
}

type ProfitFilters = {
  dataInicio?: string
  dataFim?: string
  categoria?: string
  ano?: string
}

type NormalPoint = {
  x: number
  y: number
}

type NormalStats = {
  valores: number[]
  media: number
  desvioPadrao: number
  limiteSuperior: number
  maiorLucro: number
  pontosCurva: NormalPoint[]
  pontoAtencao: NormalPoint | null
  interpretacao: string
}

type ChartManager = {
  atualizar: (chave: string, criarChart: () => Chart | null) => Chart | null
  destruir: (chave: string) => void
}

type RenderOptions = {
  registros: ProfitRecord[]
  filtros?: ProfitFilters
  graficos: ChartManager
  chartKey?: string
}

const TOTAL_PONTOS_CURVA = 121
const CHART_KEY_PADRAO = "distribuicaoNormalLucro"
const ESCALA_DENSIDADE_VISUAL = 1000

export function renderizarNormalDistributionProfitChart({
  registros,
  filtros = {},
  graficos,
  chartKey = CHART_KEY_PADRAO,
}: RenderOptions): void {
  const registrosFiltrados = filtrarRegistrosLucro(registros, filtros)
  const stats = calcularEstatisticasNormais(registrosFiltrados)

  atualizarCards(stats)
  atualizarInterpretacao(stats)

  if (!stats || stats.valores.length < 3 || stats.desvioPadrao === 0) {
    graficos.destruir(chartKey)
    limparGrafico()
    return
  }

  graficos.atualizar(chartKey, () => criarGraficoDistribuicaoNormal(stats))
}

export function obterValoresNumericosValidosDeLucro(registros: ProfitRecord[]): number[] {
  return registros
    .filter((registro) => valorLucroValido(registro.lucro))
    .map((registro) => Number(registro.lucro))
    .filter((valor) => Number.isFinite(valor))
}

export function calcularMedia(valores: number[]): number {
  if (!valores.length) {
    return 0
  }

  return valores.reduce((total, valor) => total + valor, 0) / valores.length
}

export function calcularDesvioPadraoPopulacional(valores: number[], media = calcularMedia(valores)): number {
  if (!valores.length) {
    return 0
  }

  const variancia = valores.reduce((total, valor) => total + (valor - media) ** 2, 0) / valores.length
  return Math.sqrt(variancia)
}

export function calcularDensidadeNormal(x: number, media: number, desvioPadrao: number): number {
  if (desvioPadrao === 0) {
    return 0
  }

  const expoente = -0.5 * ((x - media) / desvioPadrao) ** 2
  return (1 / (desvioPadrao * Math.sqrt(2 * Math.PI))) * Math.exp(expoente)
}

export function gerarPontosCurvaNormal(media: number, desvioPadrao: number): NormalPoint[] {
  if (desvioPadrao === 0) {
    return []
  }

  const inicio = media - 4 * desvioPadrao
  const fim = media + 4 * desvioPadrao
  const passo = (fim - inicio) / (TOTAL_PONTOS_CURVA - 1)

  return Array.from({ length: TOTAL_PONTOS_CURVA }, (_, indice) => {
    const x = inicio + passo * indice
    return {
      x,
      y: calcularDensidadeNormal(x, media, desvioPadrao),
    }
  })
}

export function formatarMoedaBR(valor: number): string {
  return formatadorMoeda.format(valor)
}

export function gerarInterpretacaoAutomatica({
  quantidadeRegistros,
  desvioPadrao,
  media,
  maiorLucro,
  limiteSuperior,
}: {
  quantidadeRegistros: number
  desvioPadrao: number
  media: number
  maiorLucro: number
  limiteSuperior: number
}): string {
  if (quantidadeRegistros < 3) {
    return "Há poucos registros válidos para uma análise confiável da distribuição normal. A interpretação deve ser feita com cautela."
  }

  if (desvioPadrao === 0) {
    return "Todos os valores de lucro são iguais. Não há dispersão suficiente para gerar uma curva normal interpretável."
  }

  let texto =
    maiorLucro >= limiteSuperior
      ? "Existe pelo menos um valor de lucro igual ou acima de 3 desvios padrão da média. Esse comportamento pode indicar uma possível anomalia positiva ou um registro fora do padrão esperado."
      : "Os valores de lucro observados estão dentro do comportamento esperado pela distribuição calculada. Não há indício forte de anomalia superior nesta métrica."

  if (desvioPadrao > Math.abs(media)) {
    texto +=
      " Além disso, a métrica apresenta alta dispersão, indicando grande variação entre os lucros registrados."
  }

  return texto
}

function filtrarRegistrosLucro(registros: ProfitRecord[], filtros: ProfitFilters): ProfitRecord[] {
  return registros.filter((registro) => {
    if (filtros.dataInicio && registro.data && registro.data < filtros.dataInicio) {
      return false
    }

    if (filtros.dataFim && registro.data && registro.data > filtros.dataFim) {
      return false
    }

    if (filtros.categoria && filtros.categoria !== "geral" && registro.categoria !== filtros.categoria) {
      return false
    }

    if (filtros.ano && registro.mes && !registro.mes.startsWith(`${filtros.ano}-`)) {
      return false
    }

    return true
  })
}

function calcularEstatisticasNormais(registros: ProfitRecord[]): NormalStats | null {
  const valores = obterValoresNumericosValidosDeLucro(registros)

  if (!valores.length) {
    return null
  }

  const media = calcularMedia(valores)
  const desvioPadrao = calcularDesvioPadraoPopulacional(valores, media)
  const limiteSuperior = media + 3 * desvioPadrao
  const maiorLucro = Math.max(...valores)
  const pontosCurva = valores.length >= 3 && desvioPadrao !== 0 ? gerarPontosCurvaNormal(media, desvioPadrao) : []
  const pontoAtencao =
    valores.length >= 3 && desvioPadrao !== 0
      ? { x: limiteSuperior, y: calcularDensidadeNormal(limiteSuperior, media, desvioPadrao) }
      : null

  return {
    valores,
    media,
    desvioPadrao,
    limiteSuperior,
    maiorLucro,
    pontosCurva,
    pontoAtencao,
    interpretacao: gerarInterpretacaoAutomatica({
      quantidadeRegistros: valores.length,
      desvioPadrao,
      media,
      maiorLucro,
      limiteSuperior,
    }),
  }
}

function criarGraficoDistribuicaoNormal(stats: NormalStats): Chart {
  const pontosCurvaEscalados = stats.pontosCurva.map(escalarDensidadeVisual)
  const pontoAtencaoEscalado = stats.pontoAtencao ? escalarDensidadeVisual(stats.pontoAtencao) : null

  return new Chart(document.getElementById("graficoDistribuicaoNormalLucro") as HTMLCanvasElement, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Curva normal do lucro",
          data: pontosCurvaEscalados,
          borderColor: "#2c7be5",
          backgroundColor: "rgba(44, 123, 229, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2.5,
        },
        {
          label: "Limite superior",
          data: pontoAtencaoEscalado ? [pontoAtencaoEscalado] : [],
          borderColor: "#e74c3c",
          backgroundColor: "#e74c3c",
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: (contexto) => {
              const ponto = contexto.raw as NormalPoint
              const densidade = formatadorNumero.format(ponto.y)

              if (contexto.datasetIndex === 1) {
                return [
                  "Ponto de atenção: Limite superior",
                  `Lucro: ${formatarMoedaBR(ponto.x)}`,
                  `Densidade x1000: ${densidade}`,
                ]
              }

              return [`Lucro aproximado: ${formatarMoedaBR(ponto.x)}`, `Densidade x1000: ${densidade}`]
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Lucro",
          },
          ticks: {
            callback: (valor) => formatarMoedaBR(Number(valor)),
          },
        },
        y: {
          title: {
            display: true,
            text: "Densidade x1000",
          },
          ticks: {
            callback: (valor) => formatadorNumero.format(Number(valor)),
          },
        },
      },
    },
  })
}

function escalarDensidadeVisual(ponto: NormalPoint): NormalPoint {
  return {
    x: ponto.x,
    y: ponto.y * ESCALA_DENSIDADE_VISUAL,
  }
}

function atualizarCards(stats: NormalStats | null): void {
  setText("normalMetrica", "Lucro")
  setText("normalMediaLucro", stats ? formatarMoedaBR(stats.media) : "-")
  setText("normalDesvioPadrao", stats ? formatarMoedaBR(stats.desvioPadrao) : "-")
  setText("normalLimiteSuperior", stats ? formatarMoedaBR(stats.limiteSuperior) : "-")
  setText("normalMaiorLucro", stats ? formatarMoedaBR(stats.maiorLucro) : "-")
  setText("normalRegistrosValidos", stats ? String(stats.valores.length) : "0")
}

function atualizarInterpretacao(stats: NormalStats | null): void {
  const mensagem = stats
    ? stats.interpretacao
    : "Não há valores válidos de lucro para gerar a distribuição normal."

  setText("interpretacaoDistribuicaoNormal", mensagem)
}

function limparGrafico(): void {
  const canvas = document.getElementById("graficoDistribuicaoNormalLucro") as HTMLCanvasElement | null
  const contexto = canvas?.getContext("2d")

  if (canvas && contexto) {
    contexto.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function setText(id: string, valor: string): void {
  const elemento = document.getElementById(id)

  if (elemento) {
    elemento.innerText = valor
  }
}

function valorLucroValido(valor: ProfitRecord["lucro"]): boolean {
  if (valor == null) {
    return false
  }

  const texto = String(valor).trim()

  if (!texto) {
    return false
  }

  return Number.isFinite(Number(texto))
}
