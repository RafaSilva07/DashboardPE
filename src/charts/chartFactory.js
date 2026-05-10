import { Chart, registerables } from "chart.js"
import { BoxAndWiskers, BoxPlotController } from "@sgratzl/chartjs-chart-boxplot"
import { formatadorMoeda } from "../utils/formatters.js"
import { traduzirRotulo } from "../constants/translations.js"
import { calcularRegressaoLinear, criarPontosDaReta } from "../analytics/statistics.js"

Chart.register(...registerables, BoxPlotController, BoxAndWiskers)

export class GerenciadorGraficos {
  #instancias = {}

  substituir(chave, chart) {
    this.destruir(chave)
    this.#instancias[chave] = chart
    return chart
  }

  atualizar(chave, criarChart) {
    this.destruir(chave)
    this.#instancias[chave] = criarChart()
    return this.#instancias[chave]
  }

  destruir(chave) {
    if (this.#instancias[chave]) {
      this.#instancias[chave].destroy()
      this.#instancias[chave] = null
    }
  }
}

export function criarGraficoOrdenado(configuracao, itens) {
  const labels = itens.map((item) => traduzirRotulo(item[0]))
  const valores = itens.map((item) => item[1])

  return new Chart(document.getElementById(configuracao.chartId), {
    type: configuracao.type,
    data: {
      labels,
      datasets: [
        {
          label: configuracao.label,
          data: valores,
          backgroundColor: [
            "#e74c3c",
            "#3498db",
            "#2ecc71",
            "#f39c12",
            "#9b59b6",
            "#1abc9c",
            "#34495e",
            "#ff6b6b",
            "#16a085",
            "#e67e22",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: configuracao.type !== "bar",
        },
      },
    },
  })
}

export function criarGraficoPizza(data, id) {
  return new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels: Object.keys(data).map((regiao) => traduzirRotulo(regiao)),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b", "#845ef7", "#ff922b"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  })
}

export function criarGraficoLinha(data, id) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Vendas",
          data: Object.values(data),
          borderColor: "#2c7be5",
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  })
}

export function criarGraficoPeriodo({ agrupamento, configuracaoMetrica }) {
  return new Chart(document.getElementById("graficoPeriodo"), {
    type: "line",
    data: {
      labels: agrupamento.labels,
      datasets: [
        {
          label: configuracaoMetrica.titulo,
          data: agrupamento.valores,
          borderColor: configuracaoMetrica.cor,
          backgroundColor: configuracaoMetrica.fundo,
          fill: true,
          tension: 0.25,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (valor) => formatadorMoeda.format(valor),
          },
        },
      },
    },
  })
}

export function criarGraficoDispersaoCorrelacao(pontos) {
  const regressao = calcularRegressaoLinear(pontos)
  const linhaRegressao = criarPontosDaReta(regressao, pontos)

  return new Chart(document.getElementById("graficoCorrelacao"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Observações",
          data: pontos,
          backgroundColor: "rgba(44,123,229,0.65)",
          borderColor: "#2c7be5",
          pointRadius: 4,
        },
        {
          label: "Reta de regressão",
          data: linhaRegressao,
          type: "line",
          borderColor: "#e74c3c",
          backgroundColor: "#e74c3c",
          pointRadius: 0,
          borderWidth: 2.5,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Vendas",
          },
        },
        y: {
          title: {
            display: true,
            text: "Lucro",
          },
        },
      },
    },
  })
}

export function criarGraficoBoxplotCategorias(distribuicoes, traduzirTooltip) {
  const categoriasValidas = Object.entries(distribuicoes)
    .filter(([, valores]) => Array.isArray(valores) && valores.length)
    .sort((a, b) => traduzirRotulo(a[0]).localeCompare(traduzirRotulo(b[0]), "pt-BR"))

  if (!categoriasValidas.length) {
    return null
  }

  return new Chart(document.getElementById("graficoBoxplotCategoria"), {
    type: "boxplot",
    data: {
      labels: categoriasValidas.map(([categoria]) => traduzirRotulo(categoria)),
      datasets: [
        {
          label: "Distribuicao de vendas",
          data: categoriasValidas.map(([, valores]) => valores),
          backgroundColor: "rgba(44,123,229,0.35)",
          borderColor: "#2c7be5",
          borderWidth: 1.5,
          outlierBackgroundColor: "#e74c3c",
          outlierBorderColor: "#c0392b",
          itemBackgroundColor: "#1f2937",
          itemBorderColor: "#1f2937",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 12,
          right: 12,
          bottom: 0,
          left: 8,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (itens) => (itens.length ? `Categoria: ${itens[0].label}` : ""),
            label: (contexto) => traduzirTooltip(contexto.formattedValue),
          },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Vendas",
          },
          ticks: {
            font: {
              size: 13,
            },
            callback: (valor) => formatadorMoeda.format(valor),
          },
        },
        x: {
          ticks: {
            font: {
              size: 13,
            },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
          },
        },
      },
    },
  })
}
