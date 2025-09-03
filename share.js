const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

module.exports = (redis, upload, uploadFolder) => {
  // Rota para a página de entrada da senha
  router.get("/compartilhar", (req, res) => {
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

  // Rota para a página do editor de texto e arquivos
  router.get("/sala", async (req, res) => {
    const { senha } = req.query;
    if (!senha) {
      return res.redirect("/compartilhar");
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
            /* Reset básico */
            body { font-family: sans-serif; padding: 2rem; background-color: #f4f4f4; color: #333; transition: background-color 0.3s, color 0.3s; }
            .container { max-width: 1200px; margin: auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background 0.3s, box-shadow 0.3s; }
            h1 { text-align: center; margin-bottom: 1rem; }
            hr { margin: 2rem 0; border: 0; border-top: 1px solid #ccc; }

            /* Modo Escuro */
            body.dark-mode { background-color: #121212; color: #e0e0e0; }
            body.dark-mode .container { background: #1e1e1e; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            body.dark-mode h1, body.dark-mode h2, body.dark-mode p, body.dark-mode label { color: #e0e0e0; }
            body.dark-mode textarea { background-color: #2c2c2c; border-color: #555; color: #e0e0e0; }
            body.dark-mode input[type="file"] { color: #e0e0e0; }
            body.dark-mode button { background-color: #444; color: #e0e0e0; }
            body.dark-mode button:hover { background-color: #555; }
            body.dark-mode hr { border-color: #444; }
            body.dark-mode .file-item { background: #282828; }
            body.dark-mode .file-item a { color: #87cefa; }

            /* Switch de Modo Escuro */
            .dark-mode-switch { position: fixed; top: 20px; right: 20px; z-index: 100; }
            .switch-label { display: block; cursor: pointer; text-indent: -9999px; width: 50px; height: 25px; background: grey; border-radius: 100px; position: relative; }
            .switch-label:after { content: ''; position: absolute; top: 2px; left: 2px; width: 21px; height: 21px; background: #fff; border-radius: 90px; transition: 0.3s; }
            .dark-mode-input:checked + .switch-label { background: #007bff; }
            .dark-mode-input:checked + .switch-label:after { left: calc(100% - 2px); transform: translateX(-100%); }
            .dark-mode-input { display: none; }

            /* Layout de Duas Colunas */
            .main-content { display: flex; gap: 20px; }
            .left-column { flex: 2; display: flex; flex-direction: column; gap: 20px; }
            .right-column { flex: 1; display: flex; flex-direction: column; gap: 20px; background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: inset 0 0 5px rgba(0,0,0,0.1); }
            body.dark-mode .right-column { background: #222; box-shadow: inset 0 0 5px rgba(0,0,0,0.3); }

            /* Estilos de Botões e Elementos */
            textarea { width: 100%; min-height: 400px; font-size: 1rem; padding: 1rem; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; resize: none; }
            
            #upload-form button { background-color: #28a745; color: white; }
            #upload-form button:hover { background-color: #218838; }

            .buttons { display: flex; justify-content: flex-end; gap: 1rem; }
            button { padding: 0.75rem 1.5rem; font-size: 1rem; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.3s; }
            #save-btn { background-color: #28a745; }
            #save-btn:hover { background-color: #218838; }
            #copy-btn { background-color: #007bff; }
            #copy-btn:hover { background-color: #0056b3; }
            .message { text-align: center; margin-top: 1rem; color: #333; }
            
            #file-list { list-style: none; padding: 0; }
            .file-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #eee; padding: 8px; border-radius: 4px; }
            .file-item a { text-decoration: none; color: #007bff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .file-item button { padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .file-item button:hover { background-color: #c82333; }
          </style>
        </head>
        <body>
          <div class="dark-mode-switch">
            <input type="checkbox" class="dark-mode-input" id="dark-mode-toggle">
            <label class="switch-label" for="dark-mode-toggle">Toggle</label>
          </div>

          <div class="container">
            <h1>Sala: ${senha}</h1>
            <div class="main-content">
              <div class="left-column">
                <h2>Editor de Texto</h2>
                <textarea id="text-editor" placeholder="Digite ou cole seu texto aqui...">${conteudo || ""}</textarea>
                <div class="buttons">
                  <button id="copy-btn">Copiar</button>
                  <button id="save-btn">Salvar</button>
                </div>
                <p id="status-message" class="message"></p>
              </div>

              <div class="right-column">
                <h2>Arquivos</h2>
                <form id="upload-form" enctype="multipart/form-data">
                  <input type="file" name="arquivo" id="file-input">
                  <button type="submit">Enviar Arquivo</button>
                </form>
                <ul id="file-list">
                  ${arquivos.map(file => `
                    <li class="file-item">
                      <a href="/sala/${senha}/arquivo/${file}" target="_blank">${file}</a>
                      <button class="delete-file-btn" data-filename="${file}">Excluir</button>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </div>

          <script>
            // Lógica do Modo Escuro
            const darkModeToggle = document.getElementById("dark-mode-toggle");
            const body = document.body;
            const isDarkMode = localStorage.getItem('dark-mode') === 'enabled';
            if (isDarkMode) {
              body.classList.add('dark-mode');
              darkModeToggle.checked = true;
            }
            darkModeToggle.addEventListener('change', () => {
              if (darkModeToggle.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('dark-mode', 'enabled');
              } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('dark-mode', 'disabled');
              }
            });

            // Lógica de manipulação de texto e arquivos
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
                  fetchFiles();
                } else {
                  statusMessage.textContent = \`Erro: \${result.erro}\`;
                }
              } catch (err) {
                statusMessage.textContent = "Erro ao enviar o arquivo.";
                console.error(err);
              }
            });

            // Lógica para Excluir Arquivos
            fileList.addEventListener("click", async (e) => {
              if (e.target.classList.contains("delete-file-btn")) {
                const filename = e.target.getAttribute("data-filename");
                const confirmed = confirm(\`Tem certeza que deseja excluir o arquivo \${filename}?\`);
                if (!confirmed) return;

                statusMessage.textContent = "Excluindo arquivo...";
                try {
                  const response = await fetch(\`/api/sala/\${salaSenha}/arquivo/\${filename}\`, {
                    method: "DELETE"
                  });
                  if (response.ok) {
                    statusMessage.textContent = "Arquivo excluído com sucesso!";
                    fetchFiles();
                  } else {
                    const result = await response.json();
                    statusMessage.textContent = \`Erro: \${result.erro}\`;
                  }
                } catch (err) {
                  statusMessage.textContent = "Erro ao excluir o arquivo.";
                  console.error(err);
                }
              }
            });

            async function fetchFiles() {
              try {
                const response = await fetch(\`/api/sala/\${salaSenha}/arquivos\`);
                const data = await response.json();
                fileList.innerHTML = data.arquivos.map(file =>  
                  \`
                  <li class="file-item">
                    <a href="/sala/\${salaSenha}/arquivo/\${file}" target="_blank">\${file}</a>
                    <button class="delete-file-btn" data-filename="\${file}">Excluir</button>
                  </li>
                  \`
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

  // ---------- NOVAS ROTAS DA API ----------

  // Rota para apagar um arquivo
  router.delete("/api/sala/:senha/arquivo/:nome", async (req, res) => {
    try {
      const { senha, nome } = req.params;
      const filePath = path.join(uploadFolder, nome);

      // Remove a referência do Redis
      await redis.lrem(`arquivos:${senha}`, 0, nome);

      // Apaga o arquivo físico do servidor
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erro ao apagar o arquivo físico ${filePath}:`, err);
          return res.status(500).send({ erro: "Erro ao apagar o arquivo" });
        }
        console.log(`Arquivo físico ${filePath} apagado com sucesso.`);
        res.status(200).send({ status: "ok", mensagem: "Arquivo excluído com sucesso!" });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ erro: "Erro interno do servidor." });
    }
  });

  // Rota de criação/atualização de texto
  router.post("/api/sala/:senha", async (req, res) => {
    try {
      const { senha } = req.params;
      const { conteudo } = req.body;
      if (!conteudo) return res.status(400).send({ erro: "Conteúdo vazio" });
      await redis.set(`sala:${senha}`, conteudo, "EX", 3600);
      res.status(200).send({ status: "ok" });
    } catch (err) {
      console.error(err);
      res.status(500).send({ erro: "Erro interno do servidor." });
    }
  });

  // Rota de upload de arquivos
  router.post("/api/sala/:senha/upload", (req, res) => {
    try {
      upload.single("arquivo")(req, res, async (err) => {
        if (err) return res.status(400).send({ erro: "Erro no upload" });
        if (!req.file) return res.status(400).send({ erro: "Nenhum arquivo enviado" });
        await redis.lpush(`arquivos:${req.params.senha}`, req.file.filename);
        await redis.expire(`arquivos:${req.params.senha}`, 3600);
        res.status(200).send({ status: "ok", mensagem: "Arquivo enviado!" });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ erro: "Erro interno do servidor." });
    }
  });

  // Rota para buscar a lista de arquivos
  router.get("/api/sala/:senha/arquivos", async (req, res) => {
    try {
      const arquivos = await redis.lrange(`arquivos:${req.params.senha}`, 0, -1);
      res.send({ arquivos });
    } catch (err) {
      console.error(err);
      res.status(500).send({ erro: "Erro interno do servidor." });
    }
  });

  // Rota para download de arquivos
  router.get("/sala/:senha/arquivo/:nome", async (req, res) => {
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

  return router;
};
