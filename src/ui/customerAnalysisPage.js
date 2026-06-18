import { Chart } from "chart.js"
import { carregarDadosAnaliseClientes } from "../data/customerAnalysisData.js"
import { formatadorMoeda, formatadorNumero, formatarMesAno } from "../utils/formatters.js"

const CORES = ["#2c7be5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b"]
const inteiro = new Intl.NumberFormat("pt-BR")
const porcentagem = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

let dadosAnalise = null
let carregando = false

export function configurarAnaliseClientes(graficos) {
  const abrir = document.getElementById("abrirAnaliseClientes")
  const voltar = document.getElementById("voltarDashboard")

  abrir.addEventListener("click", () => abrirAnaliseClientes(graficos))
  voltar.addEventListener("click", voltarDashboard)

  if (window.location.pathname === "/analise-clientes") {
    abrirAnaliseClientes(graficos, { atualizarHistorico: false })
  }

  window.addEventListener("popstate", () => {
    if (window.location.pathname === "/analise-clientes") {
      abrirAnaliseClientes(graficos, { atualizarHistorico: false })
      return
    }

    voltarDashboard({ atualizarHistorico: false })
  })
}

async function abrirAnaliseClientes(graficos, opcoes = {}) {
  alternarTela("analise")

  if (opcoes.atualizarHistorico !== false && window.location.pathname !== "/analise-clientes") {
    window.history.pushState({}, "", "/analise-clientes")
  }

  if (dadosAnalise) {
    renderizarAnalise(dadosAnalise, graficos)
    return
  }

  if (carregando) {
    return
  }

  carregando = true
  document.getElementById("statusAnaliseClientes").innerText = "Carregando dataset de clientes..."

  try {
    dadosAnalise = await carregarDadosAnaliseClientes()
    renderizarAnalise(dadosAnalise, graficos)
  } catch (erro) {
    document.getElementById("statusAnaliseClientes").innerText = "Nao foi possivel carregar a analise de clientes."
    console.error(erro)
  } finally {
    carregando = false
  }
}

function voltarDashboard(opcoes = {}) {
  alternarTela("dashboard")

  if (opcoes.atualizarHistorico !== false && window.location.pathname !== "/") {
    window.history.pushState({}, "", "/")
  }
}

function alternarTela(tela) {
  const exibindoAnalise = tela === "analise"

  document.getElementById("dashboardView").hidden = exibindoAnalise
  document.getElementById("analiseClientesView").hidden = !exibindoAnalise
  document.body.dataset.pagina = tela
}

function renderizarAnalise(dados, graficos) {
  renderizarMetricas(dados.metricas)
  renderizarTextosDestaque(dados)
  renderizarGraficos(dados.graficos, graficos)
  document.getElementById("statusAnaliseClientes").innerText =
    `Analise gerada com ${inteiro.format(dados.metricas.totalRegistros)} registros do CSV.`
}

function renderizarMetricas(metricas) {
  preencherTexto("clientesTotalRegistros", inteiro.format(metricas.totalRegistros))
  preencherTexto("clientesUnicos", inteiro.format(metricas.clientesUnicos))
  preencherTexto("clientesReceitaTotal", formatadorMoeda.format(metricas.receitaTotal))
  preencherTexto("clientesTicketMedio", formatadorMoeda.format(metricas.ticketMedio))
  preencherTexto("clientesQuantidadeTotal", inteiro.format(metricas.quantidadeTotal))
  preencherTexto("clientesTaxaChurn", porcentagem.format(metricas.taxaChurn))
  preencherTexto("clientesTaxaDevolucao", porcentagem.format(metricas.taxaDevolucao))
}

function renderizarTextosDestaque(dados) {
  const { destaques, metricas } = dados

  preencherTexto(
    "resultadoAnaliseClientes",
    `A categoria com mais compras foi ${destaques.categoriaMaisComprada[0]}, enquanto ${destaques.categoriaMaiorReceita[0]} gerou a maior receita. ` +
      `O metodo de pagamento mais usado foi ${destaques.pagamentoMaisUsado[0]}. A taxa de churn ficou em ${porcentagem.format(metricas.taxaChurn)} ` +
      `e a taxa de devolucao ficou em ${porcentagem.format(metricas.taxaDevolucao)}.`
  )
  preencherTexto(
    "aplicacaoAnaliseClientes",
    `Esses resultados ajudam o dashboard a destacar categorias importantes para faturamento, acompanhar devolucoes em ${destaques.categoriaMaisDevolvida[0]}, ` +
      `priorizar o metodo ${destaques.pagamentoMaisUsado[0]} no checkout e monitorar a retencao dos clientes.`
  )
  preencherTexto(
    "conclusaoAnaliseClientes",
    `A analise mostra que o CSV pode apoiar decisoes sobre vendas, estoque, pagamento e relacionamento com clientes. ` +
      `A faixa etaria mais frequente foi ${destaques.faixaEtariaMaisFrequente[0]}, o que tambem pode orientar campanhas e comunicacao.`
  )
}

function renderizarGraficos(graficosDados, graficos) {
  graficos.atualizar("clientesComprasCategoria", () =>
    criarGraficoBarras("graficoClientesComprasCategoria", "Compras", graficosDados.comprasPorCategoria)
  )
  graficos.atualizar("clientesReceitaCategoria", () =>
    criarGraficoBarras("graficoClientesReceitaCategoria", "Receita", graficosDados.receitaPorCategoria, true)
  )
  graficos.atualizar("clientesPagamentos", () =>
    criarGraficoRosca("graficoClientesPagamentos", "Pagamentos", graficosDados.pagamentos)
  )
  graficos.atualizar("clientesChurn", () => criarGraficoRosca("graficoClientesChurn", "Churn", graficosDados.churn))
  graficos.atualizar("clientesDevolucoesCategoria", () =>
    criarGraficoBarras("graficoClientesDevolucoesCategoria", "Devolucoes", graficosDados.devolucoesPorCategoria)
  )
  graficos.atualizar("clientesFaixaEtaria", () =>
    criarGraficoBarras("graficoClientesFaixaEtaria", "Compras", graficosDados.comprasPorFaixaEtaria)
  )
  graficos.atualizar("clientesTempo", () => criarGraficoLinhaTempo(graficosDados.comprasPorMes))
}

function criarGraficoBarras(canvasId, label, dados, monetario = false) {
  const entradas = Object.entries(dados)

  return new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: entradas.map(([chave]) => chave),
      datasets: [
        {
          label,
          data: entradas.map(([, valor]) => valor),
          backgroundColor: CORES,
        },
      ],
    },
    options: opcoesBase(monetario),
  })
}

function criarGraficoRosca(canvasId, label, dados) {
  const entradas = Object.entries(dados)

  return new Chart(document.getElementById(canvasId), {
    type: "doughnut",
    data: {
      labels: entradas.map(([chave]) => chave),
      datasets: [
        {
          label,
          data: entradas.map(([, valor]) => valor),
          backgroundColor: CORES,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  })
}

function criarGraficoLinhaTempo(dados) {
  const entradas = Object.entries(dados)

  return new Chart(document.getElementById("graficoClientesTempo"), {
    type: "line",
    data: {
      labels: entradas.map(([mes]) => formatarMesAno(mes)),
      datasets: [
        {
          label: "Compras",
          data: entradas.map(([, valor]) => valor),
          borderColor: "#2c7be5",
          backgroundColor: "rgba(44, 123, 229, 0.16)",
          fill: true,
          tension: 0.25,
          pointRadius: 2,
        },
      ],
    },
    options: opcoesBase(false),
  })
}

function opcoesBase(monetario) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (valor) => (monetario ? formatadorMoeda.format(valor) : inteiro.format(valor)),
        },
      },
    },
  }
}

function preencherTexto(id, texto) {
  document.getElementById(id).innerText = texto
}
