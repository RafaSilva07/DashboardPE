let graficoProdutos
let graficoLucroProdutos
let graficoRegioes
let graficoAno
let graficoCategoria
let graficoCorrelacao
let graficoBoxplot
let dadosProcessados = null

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
style: "currency",
currency: "BRL"
})

const formatadorNumero = new Intl.NumberFormat("pt-BR", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
})

const traducoesRegioes = {
North: "Norte",
South: "Sul",
East: "Leste",
West: "Oeste"
}

const traducoesProdutos = {
Camera: "Câmera",
Headphones: "Fones de ouvido",
Keyboard: "Teclado",
Laptop: "Notebook",
Monitor: "Monitor",
Mouse: "Mouse",
Printer: "Impressora",
Smartphone: "Smartphone",
Smartwatch: "Smartwatch",
Tablet: "Tablet"
}

const configuracoesGraficos = {
produtos: {
chartId: "graficoProdutos",
tituloId: "tituloGraficoProdutos",
label: "Quantidade vendida",
type: "bar",
limit: 5,
titles: {
top: "Produtos mais vendidos",
bottom: "Produtos menos vendidos"
}
},
lucroProdutos: {
chartId: "graficoLucroProdutos",
tituloId: "tituloGraficoLucroProdutos",
label: "Lucro",
type: "bar",
limit: 5,
titles: {
top: "Produtos mais lucrativos",
bottom: "Produtos menos lucrativos"
}
},
categorias: {
chartId: "graficoCategoria",
tituloId: "tituloGraficoCategoria",
label: "Lucro",
type: "bar",
limit: 10,
titles: {
top: "Categorias mais lucrativas",
bottom: "Categorias menos lucrativas"
}
}
}

const estadoAlternadores = {
produtos: "top",
lucroProdutos: "top",
categorias: "top"
}

document.getElementById("csvFile").addEventListener("change", enviarCSV)
configurarAlternadores()
carregarDados()

function enviarCSV(){
const file = document.getElementById("csvFile").files[0]

if(!file){
return
}

const formData = new FormData()
formData.append("file", file)

fetch("http://localhost:3000/upload", {
method: "POST",
body: formData
})
.then(res => res.json())
.then(() => carregarDados())
}

function carregarDados(){
fetch("http://localhost:3000/dados")
.then(res => res.json())
.then(dados => {
const produtos = {}
const lucroProdutos = {}
const regioes = {}
const anos = {}
const categorias = {}
const distribuicaoVendasCategorias = {}
const paresCorrelacao = []

let totalVendas = 0
let totalLucro = 0
const listaVendas = []

dados.forEach(item => {
const produto = item["Product Name"]
const regiao = item["Region"]
const categoria = item["Category"]

const quantidade = Number(item["Quantity"])
const vendas = Number(item["Sales"])
const lucro = Number(item["Profit"])
const ano = new Date(item["Order Date"]).getFullYear()

if(!produto || !regiao || !categoria){
return
}

if([quantidade, vendas, lucro].some(Number.isNaN)){
return
}

produtos[produto] = (produtos[produto] || 0) + quantidade
lucroProdutos[produto] = (lucroProdutos[produto] || 0) + lucro
regioes[regiao] = (regioes[regiao] || 0) + vendas
anos[ano] = (anos[ano] || 0) + vendas
categorias[categoria] = (categorias[categoria] || 0) + lucro

if(!distribuicaoVendasCategorias[categoria]){
distribuicaoVendasCategorias[categoria] = []
}

distribuicaoVendasCategorias[categoria].push(vendas)

totalVendas += vendas
totalLucro += lucro
listaVendas.push(vendas)
paresCorrelacao.push({ x: vendas, y: lucro })
})

const totalPedidos = listaVendas.length
const ticket = totalPedidos ? totalVendas / totalPedidos : 0
const media = totalPedidos ? listaVendas.reduce((a, b) => a + b, 0) / totalPedidos : 0
const variancia = totalPedidos
? listaVendas.reduce((acumulador, venda) => acumulador + ((venda - media) ** 2), 0) / totalPedidos
: 0
const desvioPadrao = Math.sqrt(variancia)

const ordenado = [...listaVendas].sort((a, b) => a - b)
const meio = Math.floor(ordenado.length / 2)

let mediana = 0
if(ordenado.length){
mediana = ordenado.length % 2 === 0
? (ordenado[meio - 1] + ordenado[meio]) / 2
: ordenado[meio]
}

let moda = 0
if(ordenado.length){
const contagem = {}
let max = 0

ordenado.forEach(venda => {
contagem[venda] = (contagem[venda] || 0) + 1
if(contagem[venda] > max){
max = contagem[venda]
moda = venda
}
})
}

document.getElementById("totalVendas").innerText = formatadorMoeda.format(totalVendas)
document.getElementById("totalLucro").innerText = formatadorMoeda.format(totalLucro)
document.getElementById("totalPedidos").innerText = totalPedidos
document.getElementById("ticketMedio").innerText = formatadorMoeda.format(ticket)
document.getElementById("mediaVendas").innerText = formatadorMoeda.format(media)
document.getElementById("medianaVendas").innerText = formatadorMoeda.format(mediana)
document.getElementById("modaVendas").innerText = formatadorMoeda.format(moda)
document.getElementById("desvioPadraoVendas").innerText = formatadorMoeda.format(desvioPadrao)
document.getElementById("varianciaVendas").innerText = formatadorNumero.format(variancia)

dadosProcessados = {
produtos,
lucroProdutos,
regioes,
anos,
categorias,
distribuicaoVendasCategorias,
paresCorrelacao
}

renderizarGraficos()
ranking(regioes)
alertas(produtos, regioes, categorias)
})
}

function renderizarGraficos(){
if(!dadosProcessados){
return
}

renderizarGraficoAlternavel("produtos")
renderizarGraficoAlternavel("lucroProdutos")
graficoPizza(dadosProcessados.regioes, "graficoRegioes")
graficoLinha(dadosProcessados.anos, "graficoAno")
renderizarGraficoAlternavel("categorias")
graficoBoxplotCategorias(dadosProcessados.distribuicaoVendasCategorias)
interpretarBoxplotCategorias(dadosProcessados.distribuicaoVendasCategorias)
graficoDispersaoCorrelacao(dadosProcessados.paresCorrelacao)
interpretarCorrelacao(dadosProcessados.paresCorrelacao)
}

function configurarAlternadores(){
document.querySelectorAll(".alternadorGrafico").forEach(alternador => {
alternador.addEventListener("click", evento => {
const botao = evento.target.closest("button")

if(!botao){
return
}

const target = alternador.dataset.target
const mode = botao.dataset.mode

estadoAlternadores[target] = mode

alternador.querySelectorAll("button").forEach(item => {
item.classList.toggle("ativo", item === botao)
})

renderizarGraficoAlternavel(target)
})
})
}

function renderizarGraficoAlternavel(chave){
if(!dadosProcessados){
return
}

const mapasDados = {
produtos: dadosProcessados.produtos,
lucroProdutos: dadosProcessados.lucroProdutos,
categorias: dadosProcessados.categorias
}

if(!mapasDados[chave]){
return
}

renderizarGraficoOrdenado(chave, mapasDados[chave])
}

function renderizarGraficoOrdenado(chave, data){
const configuracao = configuracoesGraficos[chave]
const modo = estadoAlternadores[chave]
const limite = configuracao.limit || 10
const ordenado = Object.entries(data).sort((a, b) => {
return modo === "bottom" ? a[1] - b[1] : b[1] - a[1]
})
const selecionado = ordenado.slice(0, limite)

document.getElementById(configuracao.tituloId).innerText = configuracao.titles[modo]

const graficoAtual = obterInstanciaGrafico(chave)
if(graficoAtual){
graficoAtual.destroy()
}

const chart = criarGraficoOrdenado(configuracao, selecionado)
definirInstanciaGrafico(chave, chart)
}

function obterInstanciaGrafico(chave){
if(chave === "produtos"){
return graficoProdutos
}

if(chave === "lucroProdutos"){
return graficoLucroProdutos
}

if(chave === "regioes"){
return graficoRegioes
}

if(chave === "categorias"){
return graficoCategoria
}

return null
}

function definirInstanciaGrafico(chave, chart){
if(chave === "produtos"){
graficoProdutos = chart
}

if(chave === "lucroProdutos"){
graficoLucroProdutos = chart
}

if(chave === "regioes"){
graficoRegioes = chart
}

if(chave === "categorias"){
graficoCategoria = chart
}
}

function criarGraficoOrdenado(configuracao, itens){
const labels = itens.map(item => traduzirRotulo(item[0]))
const valores = itens.map(item => item[1])
const canvas = document.getElementById(configuracao.chartId)

return new Chart(canvas, {
type: configuracao.type,
data: {
labels,
datasets: [{
label: configuracao.label,
data: valores,
backgroundColor: [
"#e74c3c",
"#3498db",
"#2ecc71",
"#f39c12",
"#9b59b6",
"#1abc9c",
"#34495e",
"#ff6b6b",
"#16a085",
"#e67e22"
]
}]
},
options: {
responsive: true,
maintainAspectRatio: true,
plugins: {
legend: {
display: configuracao.type !== "bar"
}
}
}
})
}

function graficoPizza(data, id){
if(graficoRegioes){
graficoRegioes.destroy()
}

graficoRegioes = new Chart(document.getElementById(id), {
type: "doughnut",
data: {
labels: Object.keys(data).map(regiao => traduzirRotulo(regiao)),
datasets: [{
data: Object.values(data),
backgroundColor: [
"#ff6b6b",
"#4dabf7",
"#51cf66",
"#ffd43b",
"#845ef7",
"#ff922b"
]
}]
},
options: {
responsive: true,
maintainAspectRatio: true
}
})
}

function graficoLinha(data, id){
if(graficoAno){
graficoAno.destroy()
}

graficoAno = new Chart(document.getElementById(id), {
type: "line",
data: {
labels: Object.keys(data),
datasets: [{
label: "Vendas",
data: Object.values(data),
borderColor: "#2c7be5",
fill: false,
tension: 0.3
}]
}
})
}

function ranking(regioes){
const lista = document.getElementById("rankingRegioes")
lista.innerHTML = ""

const dadosRanking = Object.entries(regioes).sort((a, b) => b[1] - a[1])

if(!dadosRanking.length){
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

function alertas(produtos, regioes, categorias){
const produtoMenos = Object.entries(produtos).sort((a, b) => a[1] - b[1])[0]
const regiaoMenos = Object.entries(regioes).sort((a, b) => a[1] - b[1])[0]
const categoriaMais = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0]

if(!produtoMenos || !regiaoMenos || !categoriaMais){
document.getElementById("alertas").innerText = "Importe um arquivo CSV para visualizar os destaques da análise."
return
}

document.getElementById("alertas").innerText =
`Produto com menos saída: ${traduzirRotulo(produtoMenos[0])} (${produtoMenos[1]}) | Região com menos vendas: ${traduzirRotulo(regiaoMenos[0])} | Categoria mais lucrativa: ${categoriaMais[0]}`
}

function graficoDispersaoCorrelacao(pontos){
if(graficoCorrelacao){
graficoCorrelacao.destroy()
}

graficoCorrelacao = new Chart(document.getElementById("graficoCorrelacao"), {
type: "scatter",
data: {
datasets: [{
label: "Vendas x Lucro",
data: pontos,
backgroundColor: "rgba(44,123,229,0.65)",
borderColor: "#2c7be5",
pointRadius: 4
}]
},
options: {
plugins: {
legend: { display: false }
},
scales: {
x: {
title: {
display: true,
text: "Vendas"
}
},
y: {
title: {
display: true,
text: "Lucro"
}
}
}
}
})
}

function graficoBoxplotCategorias(distribuicoes){
if(graficoBoxplot){
graficoBoxplot.destroy()
}

const categoriasValidas = Object.entries(distribuicoes)
.filter(([, valores]) => Array.isArray(valores) && valores.length)
.sort((a, b) => traduzirRotulo(a[0]).localeCompare(traduzirRotulo(b[0]), "pt-BR"))

if(!categoriasValidas.length){
return
}

graficoBoxplot = new Chart(document.getElementById("graficoBoxplotCategoria"), {
type: "boxplot",
data: {
labels: categoriasValidas.map(([categoria]) => traduzirRotulo(categoria)),
datasets: [{
label: "Distribuicao de vendas",
data: categoriasValidas.map(([, valores]) => valores),
backgroundColor: "rgba(44,123,229,0.35)",
borderColor: "#2c7be5",
borderWidth: 1.5,
outlierBackgroundColor: "#e74c3c",
outlierBorderColor: "#c0392b",
itemBackgroundColor: "#1f2937",
itemBorderColor: "#1f2937"
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
layout: {
padding: {
top: 12,
right: 12,
bottom: 0,
left: 8
}
},
plugins: {
legend: {
display: false
},
tooltip: {
callbacks: {
title: itens => itens.length ? `Categoria: ${itens[0].label}` : "",
label: contexto => traduzirLinhasTooltipBoxplot(contexto.formattedValue)
}
}
},
scales: {
y: {
title: {
display: true,
text: "Vendas"
},
ticks: {
font: {
size: 13
},
callback: valor => formatadorMoeda.format(valor)
}
},
x: {
ticks: {
font: {
size: 13
},
maxRotation: 0,
minRotation: 0,
autoSkip: false
}
}
}
}
})
}

function interpretarBoxplotCategorias(distribuicoes){
const resumo = document.getElementById("resumoBoxplot")
const categoriasValidas = Object.entries(distribuicoes)
.filter(([, valores]) => Array.isArray(valores) && valores.length)
.map(([categoria, valores]) => ({
categoria,
...calcularResumoDistribuicao(valores)
}))

if(!categoriasValidas.length){
resumo.innerText = "Importe um arquivo CSV para visualizar a dispersao das vendas por categoria."
return
}

const maiorIqr = categoriasValidas.reduce((maior, atual) => atual.iqr > maior.iqr ? atual : maior, categoriasValidas[0])
const maiorAmplitude = categoriasValidas.reduce((maior, atual) => atual.amplitude > maior.amplitude ? atual : maior, categoriasValidas[0])
const categoriasComOutliers = categoriasValidas
.filter(item => item.outliers.length)
.sort((a, b) => b.outliers.length - a.outliers.length)

let textoOutliers = "Nenhuma categoria apresentou outliers pelo criterio de 1,5 x IQR."

if(categoriasComOutliers.length){
const destaqueOutlier = categoriasComOutliers[0]
textoOutliers =
`Mais outliers: ${traduzirRotulo(destaqueOutlier.categoria)} (${destaqueOutlier.outliers.length})`
}

resumo.innerText =
`Maior faixa interquartil: ${traduzirRotulo(maiorIqr.categoria)} (${formatadorMoeda.format(maiorIqr.iqr)}). ` +
`Maior amplitude total: ${traduzirRotulo(maiorAmplitude.categoria)} (${formatadorMoeda.format(maiorAmplitude.amplitude)}). ` +
textoOutliers
}

function calcularResumoDistribuicao(valores){
const ordenado = [...valores]
.filter(valor => Number.isFinite(valor))
.sort((a, b) => a - b)

if(!ordenado.length){
return {
min: 0,
max: 0,
q1: 0,
median: 0,
q3: 0,
iqr: 0,
amplitude: 0,
outliers: []
}
}

const q1 = calcularQuantil(ordenado, 0.25)
const median = calcularQuantil(ordenado, 0.5)
const q3 = calcularQuantil(ordenado, 0.75)
const iqr = q3 - q1
const lowerFence = q1 - (1.5 * iqr)
const upperFence = q3 + (1.5 * iqr)

return {
min: ordenado[0],
max: ordenado[ordenado.length - 1],
q1,
median,
q3,
iqr,
amplitude: ordenado[ordenado.length - 1] - ordenado[0],
outliers: ordenado.filter(valor => valor < lowerFence || valor > upperFence)
}
}

function calcularQuantil(valoresOrdenados, percentual){
if(!valoresOrdenados.length){
return 0
}

const posicao = (valoresOrdenados.length - 1) * percentual
const indiceBase = Math.floor(posicao)
const peso = posicao - indiceBase
const valorBase = valoresOrdenados[indiceBase]
const proximoValor = valoresOrdenados[Math.min(indiceBase + 1, valoresOrdenados.length - 1)]

return valorBase + ((proximoValor - valorBase) * peso)
}

function traduzirLinhasTooltipBoxplot(valorFormatado){
if(!valorFormatado){
return "Distribuicao das vendas"
}

if(typeof valorFormatado === "object"){
const linhas = [
`Minimo: ${valorFormatado.min}`,
`Q1: ${valorFormatado.q1}`,
`Mediana: ${valorFormatado.median}`,
`Q3: ${valorFormatado.q3}`,
`Maximo: ${valorFormatado.max}`
]

if(valorFormatado.mean != null){
linhas.splice(3, 0, `Media: ${valorFormatado.mean}`)
}

return linhas
}

if(typeof valorFormatado === "string"){
return valorFormatado
.split(", ")
.map(parte => parte
.replace(/^min:/i, "Minimo:")
.replace(/^25% quantile:/i, "Q1:")
.replace(/^median:/i, "Mediana:")
.replace(/^mean:/i, "Media:")
.replace(/^75% quantile:/i, "Q3:")
.replace(/^max:/i, "Maximo:")
)
}

return "Distribuicao das vendas"
}

function interpretarCorrelacao(pontos){
const correlacao = calcularCorrelacaoPearson(pontos)
const r2 = correlacao ** 2
let tendencia = "Tendência nula ou fraca"
const correlacaoFormatada = correlacao.toFixed(2).replace(".", ",")
const r2Formatado = r2.toFixed(2).replace(".", ",")
const percentualExplicado = Math.round(r2 * 100)
const percentualRestante = 100 - percentualExplicado

if(correlacao > 0.3){
tendencia = "Tendência positiva"
}else if(correlacao < -0.3){
tendencia = "Tendência negativa"
}

document.getElementById("tendenciaCorrelacao").innerText = tendencia
document.getElementById("valorCorrelacao").innerText = `Correlação (Vendas x Lucro): ${correlacaoFormatada}`
document.getElementById("valorR2").innerText =
`R² (coeficiente de determinação): ${r2Formatado}. Isso indica quanto da variação do lucro pode ser explicada pelas vendas. Cerca de ${percentualExplicado}% da variação do lucro pode ser explicada pelas vendas, enquanto os outros ${percentualRestante}% podem estar associados a fatores adicionais.`
}

function calcularCorrelacaoPearson(pontos){
if(pontos.length < 2){
return 0
}

let somaX = 0
let somaY = 0
let somaXY = 0
let somaX2 = 0
let somaY2 = 0

pontos.forEach(ponto => {
somaX += ponto.x
somaY += ponto.y
somaXY += ponto.x * ponto.y
somaX2 += ponto.x * ponto.x
somaY2 += ponto.y * ponto.y
})

const n = pontos.length
const numerador = (n * somaXY) - (somaX * somaY)
const denominador = Math.sqrt(((n * somaX2) - (somaX * somaX)) * ((n * somaY2) - (somaY * somaY)))

if(!denominador){
return 0
}

return numerador / denominador
}

function traduzirRotulo(valor){
return traducoesProdutos[valor] || traducoesRegioes[valor] || valor
}
