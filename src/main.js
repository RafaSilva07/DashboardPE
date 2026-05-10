import "./style.css"
import { configuracoesGraficos, estadoAlternadores } from "./constants/chartConfig.js"
import { traduzirRotulo } from "./constants/translations.js"
import { agregarDados, parseCSV } from "./data/salesData.js"
import {
  GerenciadorGraficos,
  criarGraficoBoxplotCategorias,
  criarGraficoDispersaoCorrelacao,
  criarGraficoLinha,
  criarGraficoOrdenado,
  criarGraficoPeriodo,
  criarGraficoPizza,
} from "./charts/chartFactory.js"
import { renderizarNormalDistributionProfitChart } from "./charts/NormalDistributionProfitChart.tsx"
import {
  atualizarAlertas,
  atualizarIndicadores,
  criarBotaoCategoria,
  interpretarBoxplotCategorias,
  interpretarCorrelacao,
  interpretarRegressao,
  obterAnosHeatmap,
  obterCategoriasOrdenadas,
  renderizarHeatmapVendas,
  renderizarRankingRegioes,
  traduzirLinhasTooltipBoxplot,
} from "./ui/dashboardUi.js"
import { configurarTema } from "./ui/theme.js"
import { calcularDiferencaDias, formatadorMoeda, formatarDataBR, formatarMesAno } from "./utils/formatters.js"

const ARQUIVO_PADRAO = "/default-data.csv"

const graficos = new GerenciadorGraficos()
let dadosProcessados = null
let metricaPeriodo = "vendas"
let categoriaCorrelacao = "geral"
let categoriaHeatmap = "geral"
let anoHeatmap = ""
let anoHeatmapAtivo = false

inicializarAplicacao()

function inicializarAplicacao() {
  configurarTema()
  configurarEventos()
  configurarAlternadores()
  carregarCSVPadrao()
}

function configurarEventos() {
  document.getElementById("csvFile").addEventListener("change", carregarCSVLocal)
  document.getElementById("dataInicioPeriodo").addEventListener("change", renderizarGraficoPeriodo)
  document.getElementById("dataFimPeriodo").addEventListener("change", renderizarGraficoPeriodo)
  document.querySelector(".alternadorPeriodo").addEventListener("click", alternarMetricaPeriodo)
  document.getElementById("alternadorCorrelacao").addEventListener("click", alternarCategoriaCorrelacao)
  document.getElementById("alternadorHeatmap").addEventListener("click", alternarCategoriaHeatmap)
  document.getElementById("anoHeatmap").addEventListener("change", alternarAnoHeatmap)
}

async function carregarCSVPadrao() {
  try {
    const resposta = await fetch(ARQUIVO_PADRAO)

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar a base padrão.")
    }

    const texto = await resposta.text()
    processarCSV(texto)
    document.getElementById("alertas").innerText = "Base padrão carregada com sucesso."
    atualizarAlertas(dadosProcessados.produtos, dadosProcessados.regioes, dadosProcessados.categorias)
  } catch (erro) {
    exibirErro("Não foi possível carregar a base CSV padrão.")
    console.error(erro)
  }
}

function carregarCSVLocal(evento) {
  const [arquivo] = evento.target.files || []

  if (!arquivo) {
    return
  }

  const leitor = new FileReader()

  leitor.onload = ({ target }) => {
    try {
      processarCSV(String(target?.result || ""))
      document.getElementById("alertas").innerText = `Arquivo carregado: ${arquivo.name}`
      atualizarAlertas(dadosProcessados.produtos, dadosProcessados.regioes, dadosProcessados.categorias)
    } catch (erro) {
      exibirErro("Não foi possível processar o arquivo selecionado.")
      console.error(erro)
    }
  }

  leitor.onerror = () => {
    exibirErro("Erro ao ler o arquivo CSV enviado.")
  }

  leitor.readAsText(arquivo, "utf-8")
}

function processarCSV(textoCSV) {
  const resultado = agregarDados(parseCSV(textoCSV))

  if (!resultado) {
    throw new Error("A base CSV não possui registros válidos.")
  }

  dadosProcessados = resultado
  anoHeatmapAtivo = false
  atualizarIndicadores(resultado.metricas)
  renderizarGraficos()
  renderizarRankingRegioes(resultado.regioes)
}

function renderizarGraficos() {
  if (!dadosProcessados) {
    return
  }

  renderizarGraficoAlternavel("produtos")
  renderizarGraficoAlternavel("lucroProdutos")
  graficos.atualizar("regioes", () => criarGraficoPizza(dadosProcessados.regioes, "graficoRegioes"))
  graficos.atualizar("ano", () => criarGraficoLinha(dadosProcessados.anos, "graficoAno"))
  configurarFiltroPeriodo()
  renderizarGraficoPeriodo()
  renderizarGraficoAlternavel("categorias")
  configurarAlternadorHeatmap()
  configurarFiltroAnoHeatmap()
  renderizarHeatmapSelecionado()
  graficos.atualizar(
    "boxplot",
    () => criarGraficoBoxplotCategorias(dadosProcessados.distribuicaoVendasCategorias, traduzirLinhasTooltipBoxplot)
  )
  interpretarBoxplotCategorias(dadosProcessados.distribuicaoVendasCategorias)
  configurarAlternadorCorrelacao()
  renderizarAnaliseCorrelacao()
  renderizarDistribuicaoNormalLucro()
}

function configurarAlternadores() {
  document.querySelectorAll(".alternadorGrafico").forEach((alternador) => {
    if (!alternador.dataset.target) {
      return
    }

    alternador.addEventListener("click", (evento) => {
      const botao = evento.target.closest("button")

      if (!botao) {
        return
      }

      const target = alternador.dataset.target
      const mode = botao.dataset.mode

      estadoAlternadores[target] = mode

      alternador.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("ativo", item === botao)
      })

      renderizarGraficoAlternavel(target)
    })
  })
}

function configurarAlternadorCorrelacao() {
  const alternador = document.getElementById("alternadorCorrelacao")
  const categorias = obterCategoriasOrdenadas(dadosProcessados.categorias)

  if (categoriaCorrelacao !== "geral" && !categorias.includes(categoriaCorrelacao)) {
    categoriaCorrelacao = "geral"
  }

  alternador.innerHTML = ""
  alternador.appendChild(criarBotaoCategoria("geral", "Geral", categoriaCorrelacao === "geral"))

  categorias.forEach((categoria) => {
    alternador.appendChild(criarBotaoCategoria(categoria, traduzirRotulo(categoria), categoriaCorrelacao === categoria))
  })
}

function alternarCategoriaCorrelacao(evento) {
  const botao = evento.target.closest("button")

  if (!botao) {
    return
  }

  categoriaCorrelacao = botao.dataset.category

  document.querySelectorAll("#alternadorCorrelacao button").forEach((item) => {
    item.classList.toggle("ativo", item === botao)
  })

  renderizarAnaliseCorrelacao()
  renderizarDistribuicaoNormalLucro()
}

function renderizarAnaliseCorrelacao() {
  const pontos = obterPontosCorrelacaoSelecionados()

  graficos.atualizar("correlacao", () => criarGraficoDispersaoCorrelacao(pontos))
  interpretarCorrelacao(pontos)
  interpretarRegressao(pontos)
}

function obterPontosCorrelacaoSelecionados() {
  if (categoriaCorrelacao === "geral") {
    return dadosProcessados.paresCorrelacao
  }

  return dadosProcessados.paresCorrelacao.filter((ponto) => ponto.categoria === categoriaCorrelacao)
}

function configurarAlternadorHeatmap() {
  const alternador = document.getElementById("alternadorHeatmap")
  const categorias = obterCategoriasOrdenadas(dadosProcessados.categorias)

  if (categoriaHeatmap !== "geral" && !categorias.includes(categoriaHeatmap)) {
    categoriaHeatmap = "geral"
  }

  alternador.innerHTML = ""
  alternador.appendChild(criarBotaoCategoria("geral", "Geral", categoriaHeatmap === "geral"))

  categorias.forEach((categoria) => {
    alternador.appendChild(criarBotaoCategoria(categoria, traduzirRotulo(categoria), categoriaHeatmap === categoria))
  })
}

function configurarFiltroAnoHeatmap() {
  const select = document.getElementById("anoHeatmap")
  const anos = obterAnosHeatmap(dadosProcessados.vendasHeatmap)

  if (!anos.length) {
    select.innerHTML = ""
    select.disabled = true
    anoHeatmap = ""
    return
  }

  if (!anoHeatmap || !anos.includes(anoHeatmap)) {
    anoHeatmap = anos[anos.length - 1]
  }

  select.disabled = false
  select.innerHTML = ""

  anos.forEach((ano) => {
    const option = document.createElement("option")
    option.value = ano
    option.innerText = ano
    option.selected = ano === anoHeatmap
    select.appendChild(option)
  })
}

function alternarCategoriaHeatmap(evento) {
  const botao = evento.target.closest("button")

  if (!botao) {
    return
  }

  categoriaHeatmap = botao.dataset.category

  document.querySelectorAll("#alternadorHeatmap button").forEach((item) => {
    item.classList.toggle("ativo", item === botao)
  })

  renderizarHeatmapSelecionado()
  renderizarDistribuicaoNormalLucro()
}

function alternarAnoHeatmap(evento) {
  anoHeatmap = evento.target.value
  anoHeatmapAtivo = true
  renderizarHeatmapSelecionado()
  renderizarDistribuicaoNormalLucro()
}

function renderizarHeatmapSelecionado() {
  renderizarHeatmapVendas({
    dadosProcessados,
    categoriaHeatmap,
    anoHeatmap,
  })
}

function renderizarGraficoAlternavel(chave) {
  if (!dadosProcessados) {
    return
  }

  const mapasDados = {
    produtos: dadosProcessados.produtos,
    lucroProdutos: dadosProcessados.lucroProdutos,
    categorias: dadosProcessados.categorias,
  }

  if (!mapasDados[chave]) {
    return
  }

  renderizarGraficoOrdenado(chave, mapasDados[chave])
}

function renderizarGraficoOrdenado(chave, data) {
  const configuracao = configuracoesGraficos[chave]
  const modo = estadoAlternadores[chave]
  const limite = configuracao.limit || 10
  const ordenado = Object.entries(data).sort((a, b) => (modo === "bottom" ? a[1] - b[1] : b[1] - a[1]))
  const selecionado = ordenado.slice(0, limite)

  document.getElementById(configuracao.tituloId).innerText = configuracao.titles[modo]
  graficos.atualizar(chave, () => criarGraficoOrdenado(configuracao, selecionado))
}

function configurarFiltroPeriodo() {
  const inicioInput = document.getElementById("dataInicioPeriodo")
  const fimInput = document.getElementById("dataFimPeriodo")
  const { inicio, fim } = dadosProcessados.intervaloDatas

  if (!inicio || !fim) {
    inicioInput.disabled = true
    fimInput.disabled = true
    return
  }

  inicioInput.disabled = false
  fimInput.disabled = false
  inicioInput.min = inicio
  inicioInput.max = fim
  fimInput.min = inicio
  fimInput.max = fim
  inicioInput.value = inicio
  fimInput.value = fim
}

function alternarMetricaPeriodo(evento) {
  const botao = evento.target.closest("button")

  if (!botao) {
    return
  }

  metricaPeriodo = botao.dataset.metric

  document.querySelectorAll(".alternadorPeriodo button").forEach((item) => {
    item.classList.toggle("ativo", item === botao)
  })

  renderizarGraficoPeriodo()
}

function renderizarGraficoPeriodo() {
  if (!dadosProcessados) {
    return
  }

  const inicio = document.getElementById("dataInicioPeriodo").value
  const fim = document.getElementById("dataFimPeriodo").value
  const resumo = document.getElementById("resumoPeriodo")

  if (!inicio || !fim) {
    return
  }

  const configuracaoMetrica = obterConfiguracaoMetricaPeriodo()
  const vendasFiltradas = dadosProcessados.vendasPeriodo.filter((item) => item.data >= inicio && item.data <= fim)
  const totalPeriodo = vendasFiltradas.reduce((total, item) => total + item[metricaPeriodo], 0)
  const agrupamento = agruparDadosPeriodo(vendasFiltradas, inicio, fim, metricaPeriodo)

  document.getElementById("tituloGraficoPeriodo").innerText = `${configuracaoMetrica.titulo} por período`
  resumo.innerText =
    `${configuracaoMetrica.titulo} de ${formatarDataBR(inicio)} até ${formatarDataBR(fim)}: ` +
    `${formatadorMoeda.format(totalPeriodo)}`

  graficos.atualizar("periodo", () => criarGraficoPeriodo({ agrupamento, configuracaoMetrica }))
  renderizarDistribuicaoNormalLucro()
}

function renderizarDistribuicaoNormalLucro() {
  if (!dadosProcessados) {
    return
  }

  renderizarNormalDistributionProfitChart({
    registros: dadosProcessados.registrosLucro,
    graficos,
    filtros: {
      dataInicio: document.getElementById("dataInicioPeriodo").value,
      dataFim: document.getElementById("dataFimPeriodo").value,
      categoria: categoriaCorrelacao !== "geral" ? categoriaCorrelacao : categoriaHeatmap,
      ano: anoHeatmapAtivo ? anoHeatmap : "",
    },
  })
}

function obterConfiguracaoMetricaPeriodo() {
  if (metricaPeriodo === "lucro") {
    return {
      titulo: "Lucro",
      cor: "#2c7be5",
      fundo: "rgba(44, 123, 229, 0.16)",
    }
  }

  return {
    titulo: "Faturamento",
    cor: "#10b981",
    fundo: "rgba(16, 185, 129, 0.18)",
  }
}

function agruparDadosPeriodo(vendas, inicio, fim, metrica) {
  const agruparPorMes = calcularDiferencaDias(inicio, fim) > 90
  const totais = {}

  vendas.forEach((item) => {
    const chave = agruparPorMes ? item.data.slice(0, 7) : item.data
    totais[chave] = (totais[chave] || 0) + item[metrica]
  })

  const ordenado = Object.entries(totais).sort(([dataA], [dataB]) => dataA.localeCompare(dataB))

  if (!ordenado.length) {
    return {
      labels: ["Sem dados"],
      valores: [0],
    }
  }

  return {
    labels: ordenado.map(([data]) => (agruparPorMes ? formatarMesAno(data) : formatarDataBR(data))),
    valores: ordenado.map(([, valor]) => valor),
  }
}

function exibirErro(mensagem) {
  document.getElementById("alertas").innerText = mensagem
}
