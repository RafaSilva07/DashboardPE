const CHAVE_LAYOUT_DASHBOARD = "dashboard-layout-version"
const IDS_CARDS_SECUNDARIOS = [
  "mediaVendas",
  "medianaVendas",
  "modaVendas",
  "desvioPadraoVendas",
  "varianciaVendas",
]

let layoutAtual = obterLayoutSalvo()

export function configurarLayoutAb({ aoAlternar } = {}) {
  const alternador = document.getElementById("alternadorLayoutDashboard")

  aplicarLayoutDashboard(layoutAtual)

  alternador?.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button")

    if (!botao) {
      return
    }

    layoutAtual = botao.dataset.layout === "B" ? "B" : "A"
    localStorage.setItem(CHAVE_LAYOUT_DASHBOARD, layoutAtual)
    aplicarLayoutDashboard(layoutAtual)
    aoAlternar?.(layoutAtual)
  })
}

export function obterLayoutAtual() {
  return layoutAtual
}

function obterLayoutSalvo() {
  return localStorage.getItem(CHAVE_LAYOUT_DASHBOARD) === "B" ? "B" : "A"
}

function aplicarLayoutDashboard(layout) {
  const layoutB = layout === "B"

  document.body.dataset.layoutDashboard = layoutB ? "B" : "A"
  atualizarBotoesLayout(layoutB ? "B" : "A")
  posicionarFiltrosPeriodo(layoutB)
  organizarCardsResumo(layoutB)
}

function atualizarBotoesLayout(layout) {
  document.querySelectorAll("#alternadorLayoutDashboard button").forEach((botao) => {
    const ativo = botao.dataset.layout === layout
    botao.classList.toggle("ativo", ativo)
    botao.setAttribute("aria-pressed", String(ativo))
  })
}

function posicionarFiltrosPeriodo(layoutB) {
  const controlesPeriodo = document.querySelector(".controlesPeriodo")
  const destinoLayoutB = document.getElementById("filtrosLayoutBPeriodo")
  const cabecalhoPeriodo = document.querySelector(".graficoPeriodo .cabecalhoGrafico")

  if (!controlesPeriodo || !destinoLayoutB || !cabecalhoPeriodo) {
    return
  }

  if (layoutB) {
    destinoLayoutB.appendChild(controlesPeriodo)
  } else {
    cabecalhoPeriodo.appendChild(controlesPeriodo)
  }
}

function organizarCardsResumo(layoutB) {
  if (layoutB) {
    moverCardsSecundariosParaDetalhes()
  } else {
    restaurarCardsSecundarios()
  }
}

function moverCardsSecundariosParaDetalhes() {
  const cards = document.querySelector(".cards")
  const detalhes = obterOuCriarDetalhesEstatisticas(cards)
  const grade = detalhes?.querySelector(".cardsSecundariosLayoutB")

  if (!cards || !detalhes || !grade) {
    return
  }

  obterCardsSecundarios().forEach((card) => {
    grade.appendChild(card)
  })

  if (!detalhes.parentElement) {
    cards.insertAdjacentElement("afterend", detalhes)
  }
}

function restaurarCardsSecundarios() {
  const cards = document.querySelector(".cards")
  const detalhes = document.getElementById("estatisticasSecundariasLayoutB")

  if (!cards) {
    return
  }

  obterCardsSecundarios().forEach((card) => {
    cards.appendChild(card)
  })

  detalhes?.remove()
}

function obterCardsSecundarios() {
  return IDS_CARDS_SECUNDARIOS
    .map((id) => document.getElementById(id)?.closest(".card"))
    .filter(Boolean)
}

function obterOuCriarDetalhesEstatisticas(cards) {
  const existente = document.getElementById("estatisticasSecundariasLayoutB")

  if (existente) {
    return existente
  }

  if (!cards) {
    return null
  }

  const detalhes = document.createElement("details")
  detalhes.id = "estatisticasSecundariasLayoutB"
  detalhes.className = "estatisticasSecundariasLayoutB"
  detalhes.innerHTML = `
    <summary>Ver estatisticas descritivas <span class="setaResumo">&#9662;</span></summary>
    <div class="cardsSecundariosLayoutB"></div>
  `

  return detalhes
}
