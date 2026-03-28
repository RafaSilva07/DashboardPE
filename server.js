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

app.post("/upload",upload.single("file"),(req,res)=>{

dados=[]

fs.createReadStream(req.file.path)

.pipe(csv())

.on("data",(row)=>{

dados.push(row)

})

.on("end",()=>{

fs.unlinkSync(req.file.path)

res.json({message:"CSV carregado",dados})

})

})

app.get("/dados",(req,res)=>{

res.json(dados)

})

app.listen(3000,()=>{

console.log("Servidor rodando em http://localhost:3000")

})