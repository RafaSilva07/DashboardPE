import { parseCSV } from "./salesData.js"
import { formatarDataISO } from "../utils/formatters.js"

export const ARQUIVO_ANALISE_CLIENTES = new URL("../../uploads/ecommerce_customer_data_large.csv", import.meta.url)

export async function carregarDadosAnaliseClientes() {
  const resposta = await fetch(ARQUIVO_ANALISE_CLIENTES)

  if (!resposta.ok) {
    throw new Error("Nao foi possivel carregar o CSV de clientes.")
  }

  const textoCSV = await resposta.text()
  return analisarClientesEcommerce(parseCSV(textoCSV))
}

export function analisarClientesEcommerce(linhas) {
  const registros = []
  const clientesUnicos = new Set()
  const comprasPorCategoria = {}
  const receitaPorCategoria = {}
  const pagamentos = {}
  const churn = { "Sem churn": 0, "Com churn": 0 }
  const devolucoesPorCategoria = {}
  const comprasPorFaixaEtaria = criarFaixasEtarias()
  const comprasPorMes = {}
  let receitaTotal = 0
  let quantidadeTotal = 0
  let totalChurn = 0
  let totalDevolucoes = 0

  linhas.forEach((linha) => {
    const categoria = texto(linha["Product Category"])
    const clienteId = texto(linha["Customer ID"])
    const pagamento = texto(linha["Payment Method"])
    const dataCompra = parseData(linha["Purchase Date"])
    const preco = numero(linha["Product Price"])
    const quantidade = numero(linha["Quantity"])
    const valorCompra = numero(linha["Total Purchase Amount"])
    const idade = numero(linha["Age"] || linha["Customer Age"])
    const devolucao = numero(linha["Returns"], 0)
    const saiu = numero(linha["Churn"], 0)

    if (!categoria || !clienteId || !pagamento || Number.isNaN(dataCompra.getTime())) {
      return
    }

    if ([preco, quantidade, valorCompra, idade, devolucao, saiu].some((valor) => !Number.isFinite(valor))) {
      return
    }

    const mes = formatarDataISO(dataCompra).slice(0, 7)
    const faixa = obterFaixaEtaria(idade)
    const temDevolucao = devolucao === 1
    const temChurn = saiu === 1

    registros.push({ categoria, clienteId, pagamento, dataCompra, preco, quantidade, valorCompra, idade, devolucao, churn: saiu })
    clientesUnicos.add(clienteId)
    comprasPorCategoria[categoria] = (comprasPorCategoria[categoria] || 0) + 1
    receitaPorCategoria[categoria] = (receitaPorCategoria[categoria] || 0) + valorCompra
    pagamentos[pagamento] = (pagamentos[pagamento] || 0) + 1
    devolucoesPorCategoria[categoria] = (devolucoesPorCategoria[categoria] || 0) + (temDevolucao ? 1 : 0)
    comprasPorFaixaEtaria[faixa] += 1
    comprasPorMes[mes] = (comprasPorMes[mes] || 0) + 1
    churn[temChurn ? "Com churn" : "Sem churn"] += 1
    receitaTotal += valorCompra
    quantidadeTotal += quantidade
    totalChurn += temChurn ? 1 : 0
    totalDevolucoes += temDevolucao ? 1 : 0
  })

  const totalRegistros = registros.length

  return {
    metricas: {
      totalRegistros,
      clientesUnicos: clientesUnicos.size,
      receitaTotal,
      ticketMedio: totalRegistros ? receitaTotal / totalRegistros : 0,
      quantidadeTotal,
      taxaChurn: totalRegistros ? totalChurn / totalRegistros : 0,
      taxaDevolucao: totalRegistros ? totalDevolucoes / totalRegistros : 0,
    },
    graficos: {
      comprasPorCategoria: ordenarMapa(comprasPorCategoria),
      receitaPorCategoria: ordenarMapa(receitaPorCategoria),
      pagamentos: ordenarMapa(pagamentos),
      churn,
      devolucoesPorCategoria: ordenarMapa(devolucoesPorCategoria),
      comprasPorFaixaEtaria,
      comprasPorMes: ordenarMapaPorChave(comprasPorMes),
    },
    destaques: criarDestaques({ comprasPorCategoria, receitaPorCategoria, pagamentos, devolucoesPorCategoria, comprasPorFaixaEtaria }),
  }
}

function texto(valor) {
  return String(valor || "").trim()
}

function numero(valor, padrao = NaN) {
  const textoValor = texto(valor)

  if (!textoValor) {
    return padrao
  }

  return Number(textoValor.replace(",", "."))
}

function parseData(valor) {
  const textoData = texto(valor).replace(" ", "T")
  return new Date(textoData)
}

function criarFaixasEtarias() {
  return {
    "Ate 20 anos": 0,
    "21 a 30 anos": 0,
    "31 a 40 anos": 0,
    "41 a 50 anos": 0,
    "Acima de 50 anos": 0,
  }
}

function obterFaixaEtaria(idade) {
  if (idade <= 20) {
    return "Ate 20 anos"
  }

  if (idade <= 30) {
    return "21 a 30 anos"
  }

  if (idade <= 40) {
    return "31 a 40 anos"
  }

  if (idade <= 50) {
    return "41 a 50 anos"
  }

  return "Acima de 50 anos"
}

function ordenarMapa(mapa) {
  return Object.fromEntries(Object.entries(mapa).sort((a, b) => b[1] - a[1]))
}

function ordenarMapaPorChave(mapa) {
  return Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)))
}

function criarDestaques({ comprasPorCategoria, receitaPorCategoria, pagamentos, devolucoesPorCategoria, comprasPorFaixaEtaria }) {
  return {
    categoriaMaisComprada: primeiroItem(comprasPorCategoria),
    categoriaMaiorReceita: primeiroItem(receitaPorCategoria),
    pagamentoMaisUsado: primeiroItem(pagamentos),
    categoriaMaisDevolvida: primeiroItem(devolucoesPorCategoria),
    faixaEtariaMaisFrequente: primeiroItem(comprasPorFaixaEtaria),
  }
}

function primeiroItem(mapa) {
  return Object.entries(mapa).sort((a, b) => b[1] - a[1])[0] || ["Sem dados", 0]
}
