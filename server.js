const express = require("express")
const multer = require("multer")
const csv = require("csv-parser")
const fs = require("fs")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.static("public"))

let dados=[]

const upload=multer({dest:"uploads/"})

function carregarCSVDoArquivo(caminho,removerAoFinal=false){

return new Promise((resolve,reject)=>{

const dadosLidos=[]

fs.createReadStream(caminho)

.pipe(csv())

.on("data",(row)=>{

dadosLidos.push(row)

})

.on("end",()=>{

dados=dadosLidos

if(removerAoFinal){
fs.unlinkSync(caminho)
}

resolve(dados)

})

.on("error",(erro)=>{
reject(erro)
})

})

}

function carregarCSVInicial(){

const pastaUploads="uploads"

if(!fs.existsSync(pastaUploads)) return

const arquivosCSV=fs.readdirSync(pastaUploads)
.filter(nome=>nome.toLowerCase().endsWith(".csv"))
.map(nome=>{
const caminho=`${pastaUploads}/${nome}`
return {
nome,
 caminho,
tempo:fs.statSync(caminho).mtimeMs
}
})
.sort((a,b)=>b.tempo-a.tempo)

if(!arquivosCSV.length) return

carregarCSVDoArquivo(arquivosCSV[0].caminho)
.then(()=>{
console.log(`CSV inicial carregado: ${arquivosCSV[0].nome}`)
})
.catch((erro)=>{
console.error("Erro ao carregar CSV inicial:",erro)
})

}

app.post("/upload",upload.single("file"),(req,res)=>{

carregarCSVDoArquivo(req.file.path,true)
.then((dadosCarregados)=>{
res.json({message:"CSV carregado",dados:dadosCarregados})
})
.catch(()=>{
res.status(500).json({message:"Erro ao carregar CSV"})
})

})

app.get("/dados",(req,res)=>{

res.json(dados)

})

app.listen(3000,()=>{

console.log("Servidor rodando em http://localhost:3000")

})

carregarCSVInicial()
