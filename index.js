const express = require("express");
const Redis = require("ioredis");
const multer = require("multer"); // Para upload de arquivos
const path = require("path");
const fs = require("fs");


const app = express();

// Conecta ao Redis (URL vem da variável de ambiente REDIS_URL)
const redis = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pasta temporária para arquivos
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ---------- ROTAS ----------

// Salvar texto em uma "sala"
app.post("/sala/:senha", async (req, res) => {
  const { senha } = req.params;
  const { conteudo } = req.body;

  if (!conteudo) return res.status(400).send({ erro: "Conteúdo vazio" });

  // Salva no Redis com expiração de 30 minutos (1800 segundos)
  await redis.set(`sala:${senha}`, conteudo, "EX", 1800);
  res.send({ status: "ok", mensagem: "Texto salvo!" });
});

// Buscar texto de uma "sala"
app.get("/sala/:senha", async (req, res) => {
  const { senha } = req.params;
  const conteudo = await redis.get(`sala:${senha}`);

  if (conteudo) {
    res.send({ conteudo });
  } else {
    res.status(404).send({ erro: "Sala vazia ou expirada." });
  }
});

// Upload de arquivos
app.post("/sala/:senha/upload", upload.single("arquivo"), async (req, res) => {
  if (!req.file) return res.status(400).send({ erro: "Nenhum arquivo enviado" });

  // Guarda no Redis apenas referência à sala
  await redis.lpush(`arquivos:${req.params.senha}`, req.file.filename);
  await redis.expire(`arquivos:${req.params.senha}`, 1800); // Expira em 30 min

  res.send({ status: "ok", mensagem: "Arquivo enviado!" });
});

// Listar arquivos de uma sala
app.get("/sala/:senha/arquivos", async (req, res) => {
  const arquivos = await redis.lrange(`arquivos:${req.params.senha}`, 0, -1);
  res.send({ arquivos });
});

// Baixar arquivo
app.get("/sala/:senha/arquivo/:nome", (req, res) => {
  const { nome } = req.params;
  const filePath = path.join(uploadFolder, nome);

  if (!fs.existsSync(filePath)) return res.status(404).send({ erro: "Arquivo não encontrado" });

  res.download(filePath);
});

// ---------- START SERVER ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
