const express = require("express");
const Redis = require("ioredis");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Importa os módulos de rotas (o share.js agora é uma função) ---
const homeRouter = require("./homescreen.js");
const createShareRouter = require("./share.js");

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

// ---------- FUNÇÃO PARA LIMPAR ARQUIVOS EXPIRADOS ----------
async function deleteExpiredFiles() {
  console.log("Executando a limpeza de arquivos expirados...");
  const stream = redis.scanStream({ match: 'arquivos:*' });
  stream.on('data', async (keys) => {
    if (keys.length) {
      const filesToDelete = [];
      for (const key of keys) {
        const fileList = await redis.lrange(key, 0, -1);
        fileList.forEach(file => filesToDelete.push(file));
      }
      
      filesToDelete.forEach(file => {
        const filePath = path.join(uploadFolder, file);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Erro ao apagar o arquivo ${filePath}:`, err);
            else console.log(`Arquivo ${filePath} apagado com sucesso.`);
          });
        }
      });
      // Deleta as chaves do Redis apenas após a exclusão dos arquivos
      for (const key of keys) {
        await redis.del(key);
      }
    }
  });
  stream.on('end', () => console.log("Limpeza de arquivos concluída."));
}

// Garante que o Express use os middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Conecta as rotas aos seus respectivos caminhos ---
app.use("/", homeRouter);
const shareRouter = createShareRouter(redis, upload, uploadFolder);
app.use("/", shareRouter);

// ---------- AGENDAMENTO DE LIMPEZA ----------
// Agenda a execução da função de limpeza a cada 10 minutos (600000 ms).
setInterval(deleteExpiredFiles, 600000);

// ---------- INICIA O SERVIDOR ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
