import { ALPHA_PADRAO, calcularTesteHipoteseMelhoria } from "../analytics/hypothesisTest.js"

export function renderizarTesteHipoteseMelhoria() {
  const resultado = calcularTesteHipoteseMelhoria()
  renderizarTabela(resultado.linhas)
  preencherResumoCalculos(resultado)
  preencherInterpretacao(resultado)
}

function renderizarTabela(linhas) {
  const corpoTabela = document.getElementById("linhasTesteHipotese")

  if (!corpoTabela) {
    return
  }

  corpoTabela.innerHTML = ""

  linhas.forEach((linha) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${linha.registro}</td>
      <td>${linha.participante}</td>
      <td>${linha.tarefa}</td>
      <td>${formatarDecimal(linha.tempoAntes, 2)}</td>
      <td>${formatarDecimal(linha.tempoDepois, 2)}</td>
      <td>${formatarDecimal(linha.diferenca, 2)}</td>
    `
    corpoTabela.appendChild(tr)
  })
}

function preencherResumoCalculos(resultado) {
  setText("mediaAntesHipotese", formatarDecimal(resultado.mediaAntes, 2))
  setText("mediaDepoisHipotese", formatarDecimal(resultado.mediaDepois, 2))
  setText("mediaDiferencasHipotese", formatarDecimal(resultado.mediaDiferencas, 2))
  setText("desvioDiferencasHipotese", formatarDecimal(resultado.desvioPadraoDiferencas, 2))
  setText("nRegistrosHipotese", String(resultado.n))
  setText("glHipotese", String(resultado.grausDeLiberdade))
  setText("valorTHipotese", formatarDecimal(resultado.valorT, 4))
  setText("pValorHipotese", formatarPValor(resultado.pValue))
  setText("alphaHipotese", formatarDecimal(ALPHA_PADRAO, 2))
}

function preencherInterpretacao(resultado) {
  const badge = document.getElementById("decisaoHipotese")
  const textoDecisao = document.getElementById("textoDecisaoHipotese")
  const textoInterpretacao = document.getElementById("textoInterpretacaoHipotese")
  const evidencia = document.getElementById("evidenciaHipotese")
  const comparacao = document.getElementById("comparacaoPValorHipotese")

  if (!badge || !textoDecisao || !textoInterpretacao || !evidencia || !comparacao) {
    return
  }

  const classeResultado = resultado.rejeitarH0 ? "hipoteseSucesso" : "hipoteseNeutro"
  evidencia.classList.remove("hipoteseSucesso", "hipoteseNeutro")
  evidencia.classList.add(classeResultado)

  badge.innerText = resultado.rejeitarH0 ? "Evidencia de melhora" : "Evidencia inconclusiva"
  textoDecisao.innerText = `Decisao: ${resultado.decisaoSimplificada}.`
  comparacao.innerText = `P-Valor ${formatarPValor(resultado.pValue)} ${resultado.rejeitarH0 ? "<" : ">="} alpha ${formatarDecimal(resultado.alpha, 2)}.`
  textoInterpretacao.innerText = resultado.interpretacao
}

function setText(id, valor) {
  const elemento = document.getElementById(id)

  if (elemento) {
    elemento.innerText = valor
  }
}

function formatarDecimal(valor, casas) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

function formatarPValor(pValor) {
  if (pValor < 0.0001) {
    return "< 0,0001"
  }

  return formatarDecimal(pValor, 4)
}
