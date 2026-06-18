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
import { configurarLayoutAb } from "./ui/layoutAb.js"
import { configurarPainelHipotese } from "./ui/hypothesisPanel.js"
import { configurarAnaliseClientes } from "./ui/customerAnalysisPage.js"
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
  configurarLayoutAb({ aoAlternar: atualizarResumoFiltrosLayoutB })
  configurarPainelHipotese()
  configurarAnaliseClientes(graficos)
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
  document.getElementById("filtroRegiaoLayoutB").addEventListener("change", atualizarResumoFiltrosLayoutB)
  document.getElementById("filtroCategoriaLayoutB").addEventListener("change", alternarCategoriaLayoutB)
  document.getElementById("filtroProdutoLayoutB").addEventListener("change", atualizarResumoFiltrosLayoutB)
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
  configurarFiltrosLayoutB()
  renderizarGraficos()
  renderizarRankingRegioes(resultado.regioes)
  atualizarResumoFiltrosLayoutB()
}

function configurarFiltrosLayoutB() {
  preencherSelectFiltro("filtroRegiaoLayoutB", dadosProcessados.regioes, "Todas as regioes")
  preencherSelectFiltro("filtroCategoriaLayoutB", dadosProcessados.categorias, "Todas as categorias")
  preencherSelectFiltro("filtroProdutoLayoutB", dadosProcessados.produtos, "Todos os produtos")
}

function preencherSelectFiltro(id, dados, rotuloGeral) {
  const select = document.getElementById(id)
  const valorAtual = select.value || "geral"
  const opcoes = Object.keys(dados).sort((a, b) => traduzirRotulo(a).localeCompare(traduzirRotulo(b), "pt-BR"))

  select.innerHTML = ""
  select.appendChild(criarOpcaoFiltro("geral", rotuloGeral))

  opcoes.forEach((valor) => {
    select.appendChild(criarOpcaoFiltro(valor, traduzirRotulo(valor)))
  })

  select.value = opcoes.includes(valorAtual) ? valorAtual : "geral"
}

function criarOpcaoFiltro(valor, rotulo) {
  const option = document.createElement("option")
  option.value = valor
  option.innerText = rotulo
  return option
}

function alternarCategoriaLayoutB(evento) {
  if (!dadosProcessados) {
    return
  }

  const categoriaSelecionada = evento.target.value

  categoriaCorrelacao = categoriaSelecionada
  categoriaHeatmap = categoriaSelecionada
  configurarAlternadorCorrelacao()
  configurarAlternadorHeatmap()
  renderizarAnaliseCorrelacao()
  renderizarHeatmapSelecionado()
  renderizarDistribuicaoNormalLucro()
  atualizarResumoFiltrosLayoutB()
}

function atualizarResumoFiltrosLayoutB() {
  const resumo = document.getElementById("resumoFiltrosLayoutB")

  if (!dadosProcessados || !resumo) {
    return
  }

  const regiao = document.getElementById("filtroRegiaoLayoutB").value
  const categoria = document.getElementById("filtroCategoriaLayoutB").value
  const produto = document.getElementById("filtroProdutoLayoutB").value
  const inicio = document.getElementById("dataInicioPeriodo").value
  const fim = document.getElementById("dataFimPeriodo").value
  const registros = obterRegistrosFiltradosLayoutB({ regiao, categoria, produto, inicio, fim })
  const totalVendas = registros.reduce((total, item) => total + item.vendas, 0)
  const totalLucro = registros.reduce((total, item) => total + item.lucro, 0)
  const quantidade = registros.reduce((total, item) => total + item.quantidade, 0)
  const periodo = inicio && fim ? `${formatarDataBR(inicio)} ate ${formatarDataBR(fim)}` : "periodo completo"

  resumo.innerText =
    `Recorte selecionado (${periodo}): ${registros.length} pedidos, ` +
    `${quantidade} itens vendidos, ${formatadorMoeda.format(totalVendas)} em faturamento e ` +
    `${formatadorMoeda.format(totalLucro)} em lucro.`
}

function obterRegistrosFiltradosLayoutB({ regiao, categoria, produto, inicio, fim }) {
  return dadosProcessados.registrosAnalise.filter((registro) => {
    if (regiao !== "geral" && registro.regiao !== regiao) {
      return false
    }

    if (categoria !== "geral" && registro.categoria !== categoria) {
      return false
    }

    if (produto !== "geral" && registro.produto !== produto) {
      return false
    }

    if (inicio && registro.data < inicio) {
      return false
    }

    if (fim && registro.data > fim) {
      return false
    }

    return true
  })
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
  sincronizarCategoriaFiltroLayoutB(categoriaCorrelacao)
  atualizarResumoFiltrosLayoutB()
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
  sincronizarCategoriaFiltroLayoutB(categoriaHeatmap)
  atualizarResumoFiltrosLayoutB()
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
  atualizarResumoFiltrosLayoutB()
}

function sincronizarCategoriaFiltroLayoutB(categoria) {
  const select = document.getElementById("filtroCategoriaLayoutB")

  if (select && [...select.options].some((option) => option.value === categoria)) {
    select.value = categoria
  }
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
