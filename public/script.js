let graficoProdutos
let graficoLucroProdutos
let graficoRegioes
let graficoAno
let graficoCategoria
let graficoCorrelacao

document.getElementById("csvFile").addEventListener("change", enviarCSV)
carregarDados()

function enviarCSV(){

const file=document.getElementById("csvFile").files[0]

const formData=new FormData()
formData.append("file",file)

fetch("http://localhost:3000/upload",{
method:"POST",
body:formData
})
.then(res=>res.json())
.then(()=>carregarDados())

}

function carregarDados(){

fetch("http://localhost:3000/dados")

.then(res=>res.json())

.then(dados=>{

let produtos={}
let lucroProdutos={}
let regioes={}
let anos={}
let categorias={}
let paresCorrelacao=[]

let totalVendas=0
let totalLucro=0

let listaVendas=[]   // <<< NOVO (para calcular média, mediana e moda)

dados.forEach(item=>{

let produto=item["Product Name"]
let regiao=item["Region"]
let categoria=item["Category"]

let quantidade=Number(item["Quantity"])
let vendas=Number(item["Sales"])
let lucro=Number(item["Profit"])

let ano=new Date(item["Order Date"]).getFullYear()

if(!produto||!regiao||!categoria) return
if(isNaN(vendas)||isNaN(lucro)) return

produtos[produto]=(produtos[produto]||0)+quantidade
lucroProdutos[produto]=(lucroProdutos[produto]||0)+lucro
regioes[regiao]=(regioes[regiao]||0)+vendas
anos[ano]=(anos[ano]||0)+vendas
categorias[categoria]=(categorias[categoria]||0)+lucro

totalVendas+=vendas
totalLucro+=lucro

listaVendas.push(vendas)   // <<< NOVO
paresCorrelacao.push({x:vendas,y:lucro})

})

let ticket=totalVendas/dados.length

document.getElementById("totalVendas").innerText="R$ "+totalVendas.toLocaleString()
document.getElementById("totalLucro").innerText="R$ "+totalLucro.toLocaleString()
document.getElementById("totalPedidos").innerText=dados.length
document.getElementById("ticketMedio").innerText="R$ "+ticket.toFixed(2)


// ===============================
// CÁLCULO DE MÉDIA, MEDIANA E MODA
// ===============================

// MÉDIA
let media = listaVendas.reduce((a,b)=>a+b,0) / listaVendas.length

// MEDIANA
let ordenado=[...listaVendas].sort((a,b)=>a-b)
let meio=Math.floor(ordenado.length/2)

let mediana
if(ordenado.length%2===0){
mediana=(ordenado[meio-1]+ordenado[meio])/2
}else{
mediana=ordenado[meio]
}

// MODA
let contagem={}
let moda=ordenado[0]
let max=0

ordenado.forEach(v=>{
contagem[v]=(contagem[v]||0)+1
if(contagem[v]>max){
max=contagem[v]
moda=v
}
})

// MOSTRAR NO DASHBOARD
document.getElementById("mediaVendas").innerText="R$ "+media.toFixed(2)
document.getElementById("medianaVendas").innerText="R$ "+mediana.toFixed(2)
document.getElementById("modaVendas").innerText="R$ "+moda.toFixed(2)



graficoTop(produtos,"graficoProdutos","Quantidade Vendida")

graficoTop(lucroProdutos,"graficoLucroProdutos","Lucro")

graficoPizza(regioes,"graficoRegioes")

graficoLinha(anos,"graficoAno")

graficoBar(categorias,"graficoCategoria")

graficoDispersaoCorrelacao(paresCorrelacao)

interpretarCorrelacao(paresCorrelacao)

ranking(regioes)

alertas(produtos,regioes,categorias)

})

}

function graficoTop(data,id,label){

let top=Object.entries(data)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)

new Chart(document.getElementById(id),{

type:"bar",

data:{
labels:top.map(i=>i[0]),
datasets:[{
label:label,
data:top.map(i=>i[1]),
backgroundColor:[
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

options:{
plugins:{legend:{display:false}}
}

})

}

function graficoPizza(data,id){

new Chart(document.getElementById(id),{

type:"pie",

data:{
labels:Object.keys(data),
datasets:[{
data:Object.values(data),
backgroundColor:[
"#ff6b6b",
"#4dabf7",
"#51cf66",
"#ffd43b",
"#845ef7",
"#ff922b"
]
}]
}

})

}

function graficoLinha(data,id){

new Chart(document.getElementById(id),{

type:"line",

data:{
labels:Object.keys(data),
datasets:[{
label:"Vendas",
data:Object.values(data),
borderColor:"#2c7be5",
fill:false,
tension:0.3
}]
}

})

}

function graficoBar(data,id){

new Chart(document.getElementById(id),{

type:"bar",

data:{
labels:Object.keys(data),
datasets:[{
data:Object.values(data),
backgroundColor:["#00b894","#e17055","#0984e3","#6c5ce7","#fdcb6e"]
}]
},

options:{
plugins:{legend:{display:false}}
}

})

}

function ranking(regioes){

let lista=document.getElementById("rankingRegioes")
lista.innerHTML=""

let ranking=Object.entries(regioes)
.sort((a,b)=>b[1]-a[1])

let maior=ranking[0][1]

ranking.forEach((r,index)=>{

let porcentagem=(r[1]/maior)*100

let li=document.createElement("li")

li.innerHTML=`

<div class="linhaRanking">
<span>${index+1}º ${r[0]}</span>
<span>R$ ${r[1].toLocaleString()}</span>
</div>

<div class="barraRanking">
<div class="barraInterna" style="width:${porcentagem}%"></div>
</div>

`

lista.appendChild(li)

})

}

function alertas(produtos,regioes,categorias){

let produtoMenos=Object.entries(produtos).sort((a,b)=>a[1]-b[1])[0]
let regiaoMenos=Object.entries(regioes).sort((a,b)=>a[1]-b[1])[0]
let categoriaMais=Object.entries(categorias).sort((a,b)=>b[1]-a[1])[0]

document.getElementById("alertas").innerHTML=

"⚠ Produto com menos saída: "+produtoMenos[0]+" ("+produtoMenos[1]+")"+
" | ⚠ Região com menos vendas: "+regiaoMenos[0]+
" | 🏆 Categoria mais lucrativa: "+categoriaMais[0]

}

function graficoDispersaoCorrelacao(pontos){

if(graficoCorrelacao){
graficoCorrelacao.destroy()
}

graficoCorrelacao=new Chart(document.getElementById("graficoCorrelacao"),{

type:"scatter",

data:{
datasets:[{
label:"Sales x Profit",
data:pontos,
backgroundColor:"rgba(44,123,229,0.65)",
borderColor:"#2c7be5",
pointRadius:4
}]
},

options:{
plugins:{
legend:{display:false}
},
scales:{
x:{
title:{
display:true,
text:"Sales"
}
},
y:{
title:{
display:true,
text:"Profit"
}
}
}
}

})

}

function interpretarCorrelacao(pontos){

let correlacao=calcularCorrelacaoPearson(pontos)
let tendencia="Tendência nula ou fraca"

if(correlacao>0.3){
tendencia="Tendência positiva"
}else if(correlacao<-0.3){
tendencia="Tendência negativa"
}

document.getElementById("tendenciaCorrelacao").innerText=tendencia
document.getElementById("valorCorrelacao").innerText="Correlação (Sales x Profit): "+correlacao.toFixed(2)

}

function calcularCorrelacaoPearson(pontos){

if(pontos.length<2) return 0

let somaX=0
let somaY=0
let somaXY=0
let somaX2=0
let somaY2=0

pontos.forEach(ponto=>{
somaX+=ponto.x
somaY+=ponto.y
somaXY+=ponto.x*ponto.y
somaX2+=ponto.x*ponto.x
somaY2+=ponto.y*ponto.y
})

let n=pontos.length
let numerador=(n*somaXY)-(somaX*somaY)
let denominador=Math.sqrt(((n*somaX2)-(somaX*somaX))*((n*somaY2)-(somaY*somaY)))

if(!denominador) return 0

return numerador/denominador

}
