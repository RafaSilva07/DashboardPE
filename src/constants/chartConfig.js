export const configuracoesGraficos = {
  produtos: {
    chartId: "graficoProdutos",
    tituloId: "tituloGraficoProdutos",
    label: "Quantidade vendida",
    type: "bar",
    limit: 5,
    titles: {
      top: "Produtos mais vendidos",
      bottom: "Produtos menos vendidos",
    },
  },
  lucroProdutos: {
    chartId: "graficoLucroProdutos",
    tituloId: "tituloGraficoLucroProdutos",
    label: "Lucro",
    type: "bar",
    limit: 5,
    titles: {
      top: "Produtos mais lucrativos",
      bottom: "Produtos menos lucrativos",
    },
  },
  categorias: {
    chartId: "graficoCategoria",
    tituloId: "tituloGraficoCategoria",
    label: "Lucro",
    type: "bar",
    limit: 10,
    titles: {
      top: "Categorias mais lucrativas",
      bottom: "Categorias menos lucrativas",
    },
  },
}

export const estadoAlternadores = {
  produtos: "top",
  lucroProdutos: "top",
  categorias: "top",
}
