import { renderizarTesteHipoteseMelhoria } from "./hypothesisTestUi.js"

export function configurarPainelHipotese() {
  const painel = document.getElementById("painelHipotese")

  if (!painel) {
    return
  }

  if (painel.open) {
    renderizarTesteHipoteseMelhoria()
    painel.dataset.renderizado = "true"
  }

  painel.addEventListener("toggle", () => {
    if (!painel.open || painel.dataset.renderizado === "true") {
      return
    }

    renderizarTesteHipoteseMelhoria()
    painel.dataset.renderizado = "true"
  })
}
