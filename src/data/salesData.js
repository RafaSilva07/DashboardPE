import Papa from "papaparse"
import { formatarDataISO, obterDataPedido } from "../utils/formatters.js"

export function parseCSV(textoCSV) {
  const { data, errors } = Papa.parse(textoCSV, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  const errosCriticos = errors.filter((erro) => erro.code !== "UndetectableDelimiter")

  if (errosCriticos.length) {
    throw new Error(errosCriticos[0].message)
  }

  return data
}

export function agregarDados(dados) {
  const produtos = {}
  const lucroProdutos = {}
  const regioes = {}
  const anos = {}
  const categorias = {}
  const distribuicaoVendasCategorias = {}
  const paresCorrelacao = []
  const vendasPeriodo = []
  const vendasHeatmap = []
  const registrosLucro = []
  const registrosAnalise = []
  let totalVendas = 0
  let totalLucro = 0
  const listaVendas = []
  let dataMaisAntiga = null
  let dataMaisNova = null

  dados.forEach((item) => {
    const produto = item["Product Name"]?.trim()
    const regiao = item["Region"]?.trim()
    const categoria = item["Category"]?.trim()

    const quantidade = Number(item["Quantity"])
    const vendas = Number(item["Sales"])
    const lucro = Number(item["Profit"])
    const dataPedido = obterDataPedido(item["Order Date"])
    const ano = dataPedido.getFullYear()

    if (!produto || !regiao || !categoria) {
      return
    }

    if ([quantidade, vendas, lucro, ano].some((valor) => Number.isNaN(valor)) || Number.isNaN(dataPedido.getTime())) {
      return
    }

    const dataKey = formatarDataISO(dataPedido)

    produtos[produto] = (produtos[produto] || 0) + quantidade
    lucroProdutos[produto] = (lucroProdutos[produto] || 0) + lucro
    regioes[regiao] = (regioes[regiao] || 0) + vendas
    anos[ano] = (anos[ano] || 0) + vendas
    categorias[categoria] = (categorias[categoria] || 0) + lucro

    if (!distribuicaoVendasCategorias[categoria]) {
      distribuicaoVendasCategorias[categoria] = []
    }

    distribuicaoVendasCategorias[categoria].push(vendas)
    totalVendas += vendas
    totalLucro += lucro
    listaVendas.push(vendas)
    paresCorrelacao.push({ x: vendas, y: lucro, categoria })
    vendasPeriodo.push({ data: dataKey, vendas, lucro })
    vendasHeatmap.push({ mes: dataKey.slice(0, 7), regiao, categoria, vendas })
    registrosAnalise.push({ data: dataKey, produto, regiao, categoria, quantidade, vendas, lucro })
    if (valorNumericoValido(item["Profit"])) {
      registrosLucro.push({ data: dataKey, mes: dataKey.slice(0, 7), regiao, categoria, lucro })
    }

    if (!dataMaisAntiga || dataKey < dataMaisAntiga) {
      dataMaisAntiga = dataKey
    }

    if (!dataMaisNova || dataKey > dataMaisNova) {
      dataMaisNova = dataKey
    }
  })

  if (!listaVendas.length) {
    return null
  }

  return {
    produtos,
    lucroProdutos,
    regioes,
    anos,
    categorias,
    distribuicaoVendasCategorias,
    paresCorrelacao,
    vendasPeriodo,
    vendasHeatmap,
    registrosLucro,
    registrosAnalise,
    intervaloDatas: {
      inicio: dataMaisAntiga,
      fim: dataMaisNova,
    },
    metricas: calcularMetricas(listaVendas, totalVendas, totalLucro),
  }
}

function valorNumericoValido(valor) {
  if (valor == null) {
    return false
  }

  const texto = String(valor).trim()

  if (!texto) {
    return false
  }

  return Number.isFinite(Number(texto))
}

function calcularMetricas(listaVendas, totalVendas, totalLucro) {
  const totalPedidos = listaVendas.length
  const ticket = totalPedidos ? totalVendas / totalPedidos : 0
  const media = totalPedidos ? totalVendas / totalPedidos : 0
  const variancia = totalPedidos
    ? listaVendas.reduce((acumulador, venda) => acumulador + (venda - media) ** 2, 0) / totalPedidos
    : 0
  const desvioPadrao = Math.sqrt(variancia)
  const ordenado = [...listaVendas].sort((a, b) => a - b)
  const meio = Math.floor(ordenado.length / 2)
  const mediana = ordenado.length
    ? ordenado.length % 2 === 0
      ? (ordenado[meio - 1] + ordenado[meio]) / 2
      : ordenado[meio]
    : 0

  let moda = 0

  if (ordenado.length) {
    const contagem = {}
    let frequenciaMaxima = 0

    ordenado.forEach((venda) => {
      contagem[venda] = (contagem[venda] || 0) + 1

      if (contagem[venda] > frequenciaMaxima) {
        frequenciaMaxima = contagem[venda]
        moda = venda
      }
    })
  }

  return {
    totalVendas,
    totalLucro,
    totalPedidos,
    ticket,
    media,
    mediana,
    moda,
    desvioPadrao,
    variancia,
  }
}
