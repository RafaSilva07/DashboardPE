import { traduzirRotulo } from "../constants/translations.js"
import { formatadorMoeda, formatadorNumero, formatarMesAno, formatarMesCurto } from "../utils/formatters.js"
import {
  calcularCorrelacaoPearson,
  calcularRegressaoLinear,
  calcularResumoDistribuicao,
} from "../analytics/statistics.js"

export function atualizarIndicadores(metricas) {
  document.getElementById("totalVendas").innerText = formatadorMoeda.format(metricas.totalVendas)
  document.getElementById("totalLucro").innerText = formatadorMoeda.format(metricas.totalLucro)
  document.getElementById("totalPedidos").innerText = String(metricas.totalPedidos)
  document.getElementById("ticketMedio").innerText = formatadorMoeda.format(metricas.ticket)
  document.getElementById("mediaVendas").innerText = formatadorMoeda.format(metricas.media)
  document.getElementById("medianaVendas").innerText = formatadorMoeda.format(metricas.mediana)
  document.getElementById("modaVendas").innerText = formatadorMoeda.format(metricas.moda)
  document.getElementById("desvioPadraoVendas").innerText = formatadorMoeda.format(metricas.desvioPadrao)
  document.getElementById("varianciaVendas").innerText = formatadorNumero.format(metricas.variancia)
}

export function criarBotaoCategoria(categoria, rotulo, ativo) {
  const botao = document.createElement("button")
  botao.type = "button"
  botao.dataset.category = categoria
  botao.innerText = rotulo
  botao.classList.toggle("ativo", ativo)

  return botao
}

export function renderizarRankingRegioes(regioes) {
  const lista = document.getElementById("rankingRegioes")
  lista.innerHTML = ""

  const dadosRanking = Object.entries(regioes).sort((a, b) => b[1] - a[1])

  if (!dadosRanking.length) {
    return
  }

  const maior = dadosRanking[0][1]

  dadosRanking.forEach((regiao, index) => {
    const porcentagem = maior ? (regiao[1] / maior) * 100 : 0
    const li = document.createElement("li")

    li.innerHTML = `
      <div class="linhaRanking">
        <span>${index + 1}º ${traduzirRotulo(regiao[0])}</span>
        <span>${formatadorMoeda.format(regiao[1])}</span>
      </div>
      <div class="barraRanking">
        <div class="barraInterna" style="width:${porcentagem}%"></div>
      </div>
    `

    lista.appendChild(li)
  })
}

export function atualizarAlertas(produtos, regioes, categorias) {
  const produtoMenos = Object.entries(produtos).sort((a, b) => a[1] - b[1])[0]
  const regiaoMenos = Object.entries(regioes).sort((a, b) => a[1] - b[1])[0]
  const categoriaMais = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0]

  if (!produtoMenos || !regiaoMenos || !categoriaMais) {
    document.getElementById("alertas").innerText = "Importe um arquivo CSV para visualizar os destaques da análise."
    return
  }

  document.getElementById("alertas").innerText =
    `Produto com menos saída: ${traduzirRotulo(produtoMenos[0])} (${produtoMenos[1]}) | ` +
    `Região com menos vendas: ${traduzirRotulo(regiaoMenos[0])} | ` +
    `Categoria mais lucrativa: ${traduzirRotulo(categoriaMais[0])}`
}

export function renderizarHeatmapVendas({ dadosProcessados, categoriaHeatmap, anoHeatmap }) {
  const tabela = document.getElementById("tabelaHeatmap")
  const resumo = document.getElementById("resumoHeatmap")
  const dados = obterDadosHeatmapSelecionados(dadosProcessados, categoriaHeatmap, anoHeatmap)
  const meses = criarMesesDoAno(anoHeatmap)
  const regioes = [...new Set(dadosProcessados.vendasHeatmap.map((item) => item.regiao))].sort((a, b) =>
    traduzirRotulo(a).localeCompare(traduzirRotulo(b), "pt-BR")
  )
  const matriz = criarMatrizHeatmap(dados)
  const maiorValor = Math.max(...Object.values(matriz), 0)
  const total = dados.reduce((soma, item) => soma + item.vendas, 0)
  const rotuloCategoria = categoriaHeatmap === "geral" ? "todas as categorias" : traduzirRotulo(categoriaHeatmap)

  tabela.innerHTML = ""
  resumo.innerText = `Vendas por mês e região em ${rotuloCategoria} no ano de ${anoHeatmap}: ${formatadorMoeda.format(total)}`

  if (!meses.length || !regioes.length) {
    tabela.appendChild(criarLinhaHeatmap(["Sem dados para exibir."]))
    return
  }

  const cabecalho = document.createElement("thead")
  cabecalho.appendChild(criarLinhaHeatmap(["Região", ...meses.map(formatarMesCurto)], "th"))
  tabela.appendChild(cabecalho)

  const corpo = document.createElement("tbody")

  regioes.forEach((regiao) => {
    const tr = document.createElement("tr")
    const th = document.createElement("td")
    th.innerText = traduzirRotulo(regiao)
    tr.appendChild(th)

    meses.forEach((mes) => {
      const valor = matriz[`${regiao}|${mes}`] || 0
      const td = document.createElement("td")
      td.innerText = valor ? formatadorMoeda.format(valor) : "-"
      td.style.backgroundColor = obterCorHeatmap(valor, maiorValor)
      td.style.color = valor && valor / maiorValor > 0.65 ? "#ffffff" : "#0f172a"
      td.title = `${traduzirRotulo(regiao)} em ${formatarMesAno(mes)}: ${formatadorMoeda.format(valor)}`
      tr.appendChild(td)
    })

    corpo.appendChild(tr)
  })

  tabela.appendChild(corpo)
}

export function obterCategoriasOrdenadas(categorias) {
  return Object.keys(categorias).sort((a, b) => traduzirRotulo(a).localeCompare(traduzirRotulo(b), "pt-BR"))
}

export function obterAnosHeatmap(vendasHeatmap) {
  return [...new Set(vendasHeatmap.map((item) => item.mes.slice(0, 4)))].sort()
}

export function traduzirLinhasTooltipBoxplot(valorFormatado) {
  if (!valorFormatado) {
    return "Distribuição das vendas"
  }

  if (typeof valorFormatado === "object") {
    const linhas = [
      `Mínimo: ${valorFormatado.min}`,
      `Q1: ${valorFormatado.q1}`,
      `Mediana: ${valorFormatado.median}`,
      `Q3: ${valorFormatado.q3}`,
      `Máximo: ${valorFormatado.max}`,
    ]

    if (valorFormatado.mean != null) {
      linhas.splice(3, 0, `Média: ${valorFormatado.mean}`)
    }

    return linhas
  }

  if (typeof valorFormatado === "string") {
    return valorFormatado.split(", ").map((parte) =>
      parte
        .replace(/^min:/i, "Mínimo:")
        .replace(/^25% quantile:/i, "Q1:")
        .replace(/^median:/i, "Mediana:")
        .replace(/^mean:/i, "Média:")
        .replace(/^75% quantile:/i, "Q3:")
        .replace(/^max:/i, "Máximo:")
    )
  }

  return "Distribuição das vendas"
}

export function interpretarBoxplotCategorias(distribuicoes) {
  const resumo = document.getElementById("resumoBoxplot")
  const categoriasValidas = Object.entries(distribuicoes)
    .filter(([, valores]) => Array.isArray(valores) && valores.length)
    .map(([categoria, valores]) => ({
      categoria,
      ...calcularResumoDistribuicao(valores),
    }))

  if (!categoriasValidas.length) {
    resumo.innerText = "Importe um arquivo CSV para visualizar a dispersao das vendas por categoria."
    return
  }

  const maiorIqr = categoriasValidas.reduce((maior, atual) => (atual.iqr > maior.iqr ? atual : maior), categoriasValidas[0])
  const maiorAmplitude = categoriasValidas.reduce((maior, atual) => (atual.amplitude > maior.amplitude ? atual : maior), categoriasValidas[0])
  const categoriasComOutliers = categoriasValidas
    .filter((item) => item.outliers.length)
    .sort((a, b) => b.outliers.length - a.outliers.length)

  let textoOutliers = "Nenhuma categoria apresentou outliers pelo critério de 1,5 x IQR."

  if (categoriasComOutliers.length) {
    const destaqueOutlier = categoriasComOutliers[0]
    textoOutliers = `Mais outliers: ${traduzirRotulo(destaqueOutlier.categoria)} (${destaqueOutlier.outliers.length})`
  }

  resumo.innerText =
    `Maior faixa interquartil: ${traduzirRotulo(maiorIqr.categoria)} (${formatadorMoeda.format(maiorIqr.iqr)}). ` +
    `Maior amplitude total: ${traduzirRotulo(maiorAmplitude.categoria)} (${formatadorMoeda.format(maiorAmplitude.amplitude)}). ` +
    textoOutliers
}

export function interpretarCorrelacao(pontos) {
  if (pontos.length < 2) {
    document.getElementById("tendenciaCorrelacao").innerText = "Dados insuficientes"
    document.getElementById("valorCorrelacao").innerText = "Correlação (Vendas x Lucro): não disponível"
    document.getElementById("valorR2").innerText =
      "R² (coeficiente de determinação): não disponível. São necessários pelo menos dois registros para calcular a correlação."
    return
  }

  const correlacao = calcularCorrelacaoPearson(pontos)
  const r2 = correlacao ** 2
  let tendencia = "Tendência nula ou fraca"
  const correlacaoFormatada = correlacao.toFixed(3).replace(".", ",")
  const r2Formatado = r2.toFixed(3).replace(".", ",")
  const percentualExplicado = Math.round(r2 * 100)
  const percentualRestante = 100 - percentualExplicado

  if (correlacao > 0.3) {
    tendencia = "Tendência positiva"
  } else if (correlacao < -0.3) {
    tendencia = "Tendência negativa"
  }

  document.getElementById("tendenciaCorrelacao").innerText = tendencia
  document.getElementById("valorCorrelacao").innerText = `Correlação (Vendas x Lucro): ${correlacaoFormatada}`
  document.getElementById("valorR2").innerText =
    `R² (coeficiente de determinação): ${r2Formatado}. ` +
    `Isso indica quanto da variação do lucro pode ser explicada pelas vendas. ` +
    `Cerca de ${percentualExplicado}% da variação do lucro pode ser explicada pelas vendas, ` +
    `enquanto os outros ${percentualRestante}% podem estar associados a fatores adicionais.`
}

export function interpretarRegressao(pontos) {
  if (pontos.length < 2) {
    document.getElementById("equacaoRegressao").innerText = "Equação da reta: não disponível"
    document.getElementById("inclinacaoRegressao").innerText =
      "Inclinação: não disponível. São necessários pelo menos dois registros para estimar a reta."
    document.getElementById("interceptoRegressao").innerText = "Intercepto: não disponível"
    document.getElementById("resumoRegressao").innerText =
      "A regressão linear não pode ser calculada para a categoria selecionada."
    return
  }

  const { inclinacao, intercepto, r2 } = calcularRegressaoLinear(pontos)
  const inclinacaoFormatada = formatadorNumero.format(inclinacao)
  const interceptoFormatado = formatadorNumero.format(intercepto)
  const r2Formatado = formatadorNumero.format(r2)

  document.getElementById("equacaoRegressao").innerText =
    `Equação da reta: y = ${inclinacaoFormatada}x + ${interceptoFormatado}`
  document.getElementById("inclinacaoRegressao").innerText =
    `Inclinação: ${inclinacaoFormatada}. Em média, o lucro tende a variar esse valor a cada aumento de 1 unidade em vendas.`
  document.getElementById("interceptoRegressao").innerText =
    `Intercepto: ${interceptoFormatado}. Este e o valor estimado do lucro quando x = 0.`
  document.getElementById("resumoRegressao").innerText =
    `A reta de regressão resume a tendência média entre vendas e lucro. O ajuste atual apresenta R² de ${r2Formatado}.`
}

function obterDadosHeatmapSelecionados(dadosProcessados, categoriaHeatmap, anoHeatmap) {
  const dadosDoAno = dadosProcessados.vendasHeatmap.filter((item) => item.mes.startsWith(`${anoHeatmap}-`))

  if (categoriaHeatmap === "geral") {
    return dadosDoAno
  }

  return dadosDoAno.filter((item) => item.categoria === categoriaHeatmap)
}

function criarMatrizHeatmap(dados) {
  return dados.reduce((matriz, item) => {
    const chave = `${item.regiao}|${item.mes}`
    matriz[chave] = (matriz[chave] || 0) + item.vendas
    return matriz
  }, {})
}

function criarLinhaHeatmap(celulas, tipo = "td") {
  const tr = document.createElement("tr")

  celulas.forEach((texto) => {
    const celula = document.createElement(tipo)
    celula.innerText = texto
    tr.appendChild(celula)
  })

  return tr
}

function obterCorHeatmap(valor, maiorValor) {
  if (!valor || !maiorValor) {
    return "#f8fafc"
  }

  const intensidade = Math.max(0.12, valor / maiorValor)
  return `rgba(44, 123, 229, ${intensidade})`
}

function criarMesesDoAno(ano) {
  if (!ano) {
    return []
  }

  return Array.from({ length: 12 }, (_, indice) => `${ano}-${String(indice + 1).padStart(2, "0")}`)
}
