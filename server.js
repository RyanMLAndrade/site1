const express = require("express");
const Redis = require("ioredis");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Importe os módulos de rotas ---
const homeRouter = require("./homescreen.js");
const shareRouter = require("./share.js");

const app = express();

// Conecta ao Redis e configura o Multer (código de setup)
const redis = new Redis(process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL);
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Garanta que o Express use os middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Conecte as rotas aos seus respectivos caminhos ---
app.use("/", homeRouter);
app.use("/", shareRouter); // Se as rotas de compartilhamento não tiverem um prefixo, pode usar assim. Se tiverem, adicione o prefixo.

// Coloque todas as rotas da API e as funções de limpeza aqui, como no seu código original.
// O código para as rotas da API (`/api/sala`, etc.) deve ser movido para `share.js`.
// Exemplo:
// app.post("/api/sala/:senha", async (req, res) => { ... });

// ---------- AGENDAMENTO DE LIMPEZA ----------
// Coloque sua função de limpeza aqui...
// setInterval(deleteExpiredFiles, 600000);

// ---------- START SERVER ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));