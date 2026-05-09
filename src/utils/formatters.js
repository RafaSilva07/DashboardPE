export const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export const formatadorNumero = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatadorMoedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})

export function obterDataPedido(valor) {
  const texto = String(valor || "").trim()
  const partesISO = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (partesISO) {
    const [, ano, mes, dia] = partesISO
    return new Date(Number(ano), Number(mes) - 1, Number(dia))
  }

  return new Date(texto)
}

export function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

export function criarDataLocalDeISO(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

export function formatarDataBR(dataISO) {
  return criarDataLocalDeISO(dataISO).toLocaleDateString("pt-BR")
}

export function formatarMesAno(mesISO) {
  const [ano, mes] = mesISO.split("-").map(Number)
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "2-digit",
    year: "numeric",
  })
}

export function formatarMesCurto(mesISO) {
  const [ano, mes] = mesISO.split("-").map(Number)
  const rotulo = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
  })

  return rotulo.replace(".", "")
}

export function calcularDiferencaDias(inicio, fim) {
  const umDia = 1000 * 60 * 60 * 24
  return Math.round((criarDataLocalDeISO(fim) - criarDataLocalDeISO(inicio)) / umDia)
}
