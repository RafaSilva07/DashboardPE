export function configurarTema() {
  const botaoTema = document.getElementById("alternadorTema")
  const temaSalvo = localStorage.getItem("temaDashboard")
  const temaInicial = temaSalvo || "claro"

  aplicarTema(temaInicial)

  botaoTema.addEventListener("click", () => {
    const proximoTema = document.body.dataset.tema === "escuro" ? "claro" : "escuro"
    aplicarTema(proximoTema)
    localStorage.setItem("temaDashboard", proximoTema)
  })
}

function aplicarTema(tema) {
  const botaoTema = document.getElementById("alternadorTema")
  const temaEscuro = tema === "escuro"

  document.body.dataset.tema = temaEscuro ? "escuro" : "claro"
  botaoTema.setAttribute("aria-pressed", String(temaEscuro))
  botaoTema.title = temaEscuro ? "Alternar para modo claro" : "Alternar para modo escuro"
}
