const express = require("express");
const Redis = require("ioredis");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Conecta ao Redis
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

// ---------- ROTA INICIAL (interface mínima) ----------
app.get("/", (req, res) => {
  res.send(`
    <h1>Bem-vindo ao Compartilhador!</h1>
    <form method="POST" action="/sala/teste">
      <label>Senha da Sala:</label>
      <input type="text" name="senha" value="teste" required />
      <br/><br/>
      <textarea name="conteudo" rows="5" cols="40" placeholder="Digite ou cole o texto aqui"></textarea>
      <br/><br/>
      <button type="submit">Salvar Texto</button>
    </form>
    <p>Após salvar, acesse <a href="/sala/teste">/sala/teste</a> para ver o conteúdo.</p>
  `);
});

// ---------- ROTAS DE TEXTO ----------

// Criar/editar texto
app.post("/sala/:senha", async (req, res) => {
  try {
    const { senha } = req.params;
    const { conteudo } = req.body;
    if (!conteudo) return res.status(400).send({ erro: "Conteúdo vazio" });

    await redis.set(`sala:${senha}`, conteudo, "EX", 1800); // Expira 30 min
    res.send(`<p>Texto salvo com sucesso!</p><p><a href="/sala/${senha}">Ver Sala</a></p>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor.");
  }
});

// Ler texto
app.get("/sala/:senha", async (req, res) => {
  try {
    const { senha } = req.params;
    const conteudo = await redis.get(`sala:${senha}`);
    if (conteudo) {
      res.send(`
        <h2>Conteúdo da sala "${senha}":</h2>
        <pre>${conteudo}</pre>
        <p><a href="/">Voltar</a></p>
      `);
    } else {
      res.send(`<p>Sala vazia ou expirada.</p><p><a href="/">Voltar</a></p>`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor.");
  }
});

// ---------- ROTAS DE ARQUIVOS ----------

app.post("/sala/:senha/upload", async (req, res) => {
  try {
    upload.single("arquivo")(req, res, async (err) => {
      if (err) return res.status(400).send({ erro: "Erro no upload" });
      if (!req.file) return res.status(400).send({ erro: "Nenhum arquivo enviado" });

      await redis.lpush(`arquivos:${req.params.senha}`, req.file.filename);
      await redis.expire(`arquivos:${req.params.senha}`, 1800);

      res.send({ status: "ok", mensagem: "Arquivo enviado!" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor.");
  }
});

app.get("/sala/:senha/arquivos", async (req, res) => {
  try {
    const arquivos = await redis.lrange(`arquivos:${req.params.senha}`, 0, -1);
    res.send({ arquivos });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor.");
  }
});

app.get("/sala/:senha/arquivo/:nome", async (req, res) => {
  try {
    const { nome } = req.params;
    const filePath = path.join(uploadFolder, nome);
    if (!fs.existsSync(filePath)) return res.status(404).send({ erro: "Arquivo não encontrado" });
    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor.");
  }
});

// ---------- START SERVER ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
