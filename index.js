const express = require("express");
const Redis = require("ioredis");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Conecta ao Redis
const redis = new Redis(process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL);

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

// ---------- ROTAS PRINCIPAIS ----------

// Rota inicial para inserir a chave da sala
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo!</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f4f4; }
        .container { text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        input[type="text"] { padding: 0.5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; margin-top: 1rem; }
        button { padding: 0.75rem 1.5rem; font-size: 1rem; color: white; background-color: #007bff; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem; }
        button:hover { background-color: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Compartilhador de Texto e Arquivos</h1>
        <p>Insira a chave da sala para entrar:</p>
        <form id="key-form" action="/sala" method="GET">
          <input type="text" name="senha" id="sala-senha" placeholder="Ex: minha-sala" required />
          <br>
          <button type="submit">Entrar</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Rota para a página do editor de texto
app.get("/sala", async (req, res) => {
  const { senha } = req.query;
  if (!senha) {
    return res.redirect("/");
  }

  try {
    const conteudo = await redis.get(`sala:${senha}`);
    const arquivos = await redis.lrange(`arquivos:${senha}`, 0, -1);
    
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sala: ${senha}</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; background-color: #f4f4f4; }
          .container { max-width: 800px; margin: auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { text-align: center; }
          textarea { width: 100%; min-height: 400px; font-size: 1rem; padding: 1rem; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; margin-top: 1rem; }
          .buttons { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
          button { padding: 0.75rem 1.5rem; font-size: 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; }
          #save-btn { background-color: #28a745; }
          #save-btn:hover { background-color: #218838; }
          #copy-btn { background-color: #007bff; }
          #copy-btn:hover { background-color: #0056b3; }
          .message { text-align: center; margin-top: 1rem; color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Sala: "${senha}"</h1>
          <textarea id="text-editor" placeholder="Digite ou cole seu texto aqui...">${conteudo || ""}</textarea>
          <div class="buttons">
            <button id="copy-btn">Copiar</button>
            <button id="save-btn">Salvar</button>
          </div>
          <p id="status-message" class="message"></p>

          <hr style="margin: 2rem 0;">

          <h2>Arquivos da Sala</h2>
          <form id="upload-form" enctype="multipart/form-data">
            <input type="file" name="arquivo" id="file-input">
            <button type="submit">Enviar Arquivo</button>
          </form>
          <ul id="file-list">
            ${arquivos.map(file => `<li><a href="/sala/${senha}/arquivo/${file}" target="_blank">${file}</a></li>`).join('')}
          </ul>
        </div>

        <script>
          const editor = document.getElementById("text-editor");
          const saveBtn = document.getElementById("save-btn");
          const copyBtn = document.getElementById("copy-btn");
          const statusMessage = document.getElementById("status-message");
          const uploadForm = document.getElementById("upload-form");
          const fileList = document.getElementById("file-list");
          const salaSenha = "${senha}";

          saveBtn.addEventListener("click", async () => {
            const conteudo = editor.value;
            statusMessage.textContent = "Salvando...";
            try {
              const response = await fetch(\`/api/sala/\${salaSenha}\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conteudo })
              });
              if (response.ok) {
                statusMessage.textContent = "Texto salvo com sucesso!";
              } else {
                statusMessage.textContent = "Erro ao salvar o texto.";
              }
            } catch (err) {
              statusMessage.textContent = "Erro interno do servidor.";
              console.error(err);
            }
          });

          copyBtn.addEventListener("click", () => {
            editor.select();
            document.execCommand("copy");
            statusMessage.textContent = "Texto copiado para a área de transferência!";
          });

          uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(uploadForm);
            try {
              const response = await fetch(\`/api/sala/\${salaSenha}/upload\`, {
                method: "POST",
                body: formData
              });
              const result = await response.json();
              if (response.ok) {
                statusMessage.textContent = "Arquivo enviado com sucesso!";
                // Atualiza a lista de arquivos
                fetchFiles();
              } else {
                statusMessage.textContent = \`Erro: \${result.erro}\`;
              }
            } catch (err) {
              statusMessage.textContent = "Erro ao enviar o arquivo.";
              console.error(err);
            }
          });

          async function fetchFiles() {
            try {
              const response = await fetch(\`/api/sala/\${salaSenha}/arquivos\`);
              const data = await response.json();
              fileList.innerHTML = data.arquivos.map(file => 
                \`<li><a href="/sala/\${salaSenha}/arquivo/\${file}" target="_blank">\${file}</a></li>\`
              ).join('');
            } catch (err) {
              console.error("Erro ao buscar arquivos:", err);
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno do servidor.");
  }
});

// ---------- ROTAS DA API (para manipulação de dados) ----------

app.post("/api/sala/:senha", async (req, res) => {
  try {
    const { senha } = req.params;
    const { conteudo } = req.body;
    if (!conteudo) return res.status(400).send({ erro: "Conteúdo vazio" });

    await redis.set(`sala:${senha}`, conteudo, "EX", 1800); // Expira em 30 min
    res.status(200).send({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ erro: "Erro interno do servidor." });
  }
});

app.post("/api/sala/:senha/upload", async (req, res) => {
  try {
    upload.single("arquivo")(req, res, async (err) => {
      if (err) return res.status(400).send({ erro: "Erro no upload" });
      if (!req.file) return res.status(400).send({ erro: "Nenhum arquivo enviado" });

      await redis.lpush(`arquivos:${req.params.senha}`, req.file.filename);
      await redis.expire(`arquivos:${req.params.senha}`, 1800);

      res.status(200).send({ status: "ok", mensagem: "Arquivo enviado!" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ erro: "Erro interno do servidor." });
  }
});

app.get("/api/sala/:senha/arquivos", async (req, res) => {
  try {
    const arquivos = await redis.lrange(`arquivos:${req.params.senha}`, 0, -1);
    res.send({ arquivos });
  } catch (err) {
    console.error(err);
    res.status(500).send({ erro: "Erro interno do servidor." });
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