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
          /* Variáveis CSS para cores */
          :root {
            --bg-color: #f4f4f4;
            --text-color: #333;
            --container-bg: white;
            --container-shadow: rgba(0,0,0,0.1);
            --top-bar-bg: #f8f9fa;
            --top-bar-shadow: rgba(0,0,0,0.1);
            --button-primary-bg: #007bff;
            --button-primary-hover-bg: #0056b3;
            --input-bg: white;
            --input-border: #ccc;
            --right-column-bg: #f9f9f9;
            --right-column-shadow: rgba(0,0,0,0.1);
            --file-item-bg: #eee;
            --file-item-link-color: #007bff;
          }

          body.dark-mode {
            --bg-color: #121212;
            --text-color: #e0e0e0;
            --container-bg: #1e1e1e;
            --container-shadow: rgba(0,0,0,0.3);
            --top-bar-bg: #2c2c2c;
            --top-bar-shadow: rgba(0,0,0,0.3);
            --button-primary-bg: #444;
            --button-primary-hover-bg: #555;
            --input-bg: #2c2c2c;
            --input-border: #555;
            --right-column-bg: #222;
            --right-column-shadow: rgba(0,0,0,0.3);
            --file-item-bg: #282828;
            --file-item-link-color: #87cefa;
          }

          /* Estilos globais */
          body { 
            font-family: sans-serif; 
            margin: 0; 
            padding-top: 70px; 
            background-color: var(--bg-color); 
            color: var(--text-color); 
            transition: background-color 0.3s, color 0.3s; 
          }

          /* Barra Superior */
          .top-bar {
            position: fixed; top: 0; left: 0; width: 100%;
            background-color: var(--top-bar-bg);
            padding: 10px 20px;
            display: flex; justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 5px var(--top-bar-shadow);
            z-index: 1000;
            box-sizing: border-box;
            transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
          }
          .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 20px; }

          /* Botão Voltar */
          .back-button {
            background-color: transparent;
            color: var(--text-color);
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            text-decoration: none;
            transition: background-color 0.3s, color 0.3s;
          }
          .back-button span { font-size: 1.2em; line-height: 1; }
          .back-button:hover { background-color: var(--button-bg-hover); }

          /* Switch de Modo Escuro */
          .dark-mode-switch { display: flex; align-items: center; gap: 10px; }
          .switch-text { color: var(--text-color); transition: color 0.3s; }
          .switch-label { display: block; cursor: pointer; text-indent: -9999px; width: 50px; height: 25px; background: grey; border-radius: 100px; position: relative; }
          .switch-label:after { content: ''; position: absolute; top: 2px; left: 2px; width: 21px; height: 21px; background: #fff; border-radius: 90px; transition: 0.3s; }
          .dark-mode-input:checked + .switch-label { background: #007bff; }
          .dark-mode-input:checked + .switch-label:after { left: calc(100% - 2px); transform: translateX(-100%); }
          .dark-mode-input { display: none; }
          
          /* Estilos da Página de Entrada (Compartilhar) */
          .page-container { 
            display: flex; justify-content: center; align-items: center; height: calc(100vh - 70px);
            text-align: center; 
            background: var(--container-bg); 
            padding: 2rem; border-radius: 8px; 
            box-shadow: 0 4px 6px var(--container-shadow); 
            max-width: 500px; margin: 0 auto; 
            transition: background 0.3s, box-shadow 0.3s;
          }
          .page-container h1, .page-container p { color: var(--text-color); }
          input[type="text"] { 
            padding: 0.5rem; font-size: 1rem; 
            border: 1px solid var(--input-border); 
            border-radius: 4px; margin-top: 1rem;
            background-color: var(--input-bg);
            color: var(--text-color);
            transition: background-color 0.3s, border-color 0.3s, color 0.3s;
          }
          button { 
            padding: 0.75rem 1.5rem; font-size: 1rem; color: white; 
            background-color: var(--button-primary-bg); 
            border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem; 
            transition: background-color 0.3s;
          }
          button:hover { background-color: var(--button-primary-hover-bg); }

          /* Estilos da Página de Sala */
          .main-content { display: flex; gap: 20px; }
          .left-column { flex: 2; display: flex; flex-direction: column; gap: 20px; }
          .right-column { flex: 1; display: flex; flex-direction: column; gap: 20px; background: #f9f9f9; padding: 20px; border-radius: 8px; box-shadow: inset 0 0 5px rgba(0,0,0,0.1); }
          body.dark-mode .right-column { background: #222; box-shadow: inset 0 0 5px rgba(0,0,0,0.3); }

          .container h1, .container h2, .container p, .container label { color: var(--text-color); }
          hr { margin: 2rem 0; border: 0; border-top: 1px solid var(--input-border); }

          textarea { 
            width: 100%; min-height: 400px; font-size: 1rem; padding: 1rem; box-sizing: border-box; 
            border: 1px solid var(--input-border); border-radius: 4px; resize: none; 
            background-color: var(--input-bg); color: var(--text-color);
            transition: background-color 0.3s, border-color 0.3s, color 0.3s;
          }
          
          #upload-form button { background-color: #28a745; color: white; }
          #upload-form button:hover { background-color: #218838; }

          .buttons { display: flex; justify-content: flex-end; gap: 1rem; }
          button { 
            padding: 0.75rem 1.5rem; font-size: 1rem; color: white; 
            border: none; border-radius: 4px; cursor: pointer; 
            transition: background-color 0.3s; 
          }
          #save-btn { background-color: #28a745; }
          #save-btn:hover { background-color: #218838; }
          #copy-btn { background-color: var(--button-primary-bg); }
          #copy-btn:hover { background-color: var(--button-primary-hover-bg); }
          .message { text-align: center; margin-top: 1rem; color: var(--text-color); }
          #file-list { list-style: none; padding: 0; }
          .file-item { 
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; 
            background: var(--file-item-bg); padding: 8px; border-radius: 4px; 
            transition: background 0.3s;
          }
          .file-item a { 
            text-decoration: none; 
            color: var(--file-item-link-color); 
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; 
          }
          .file-item button { padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }
          .file-item button:hover { background-color: #c82333; }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <div class="top-bar-left">
            <a href="/" class="back-button">
              <span>&#11013;</span> Voltar
            </a>
          </div>
          <div class="top-bar-right">
            <div class="dark-mode-switch">
              <span class="switch-text" id="dark-mode-label">Modo Escuro ☀︎</span>
              <input type="checkbox" class="dark-mode-input" id="dark-mode-toggle">
              <label class="switch-label" for="dark-mode-toggle">Toggle</label>
            </div>
          </div>
        </div>
        <div class="page-container">
          <div>
            <h1>Compartilhador de Texto e Arquivos</h1>
            <p>Insira a chave da sala para entrar:</p>
            <form id="key-form" action="/sala" method="GET">
              <input type="text" name="senha" id="sala-senha" placeholder="Ex: minha-sala" required />
              <br>
              <button type="submit">Entrar</button>
            </form>
          </div>
        </div>

        <script>
          const darkModeToggle = document.getElementById("dark-mode-toggle");
          const darkModeLabel = document.getElementById("dark-mode-label");
          const body = document.body;

          function updateDarkModeUI(isDarkMode) {
            if (isDarkMode) {
              body.classList.add('dark-mode');
              darkModeLabel.textContent = "Modo Escuro ☾";
              darkModeToggle.checked = true;
            } else {
              body.classList.remove('dark-mode');
              darkModeLabel.textContent = "Modo Escuro ☀︎";
              darkModeToggle.checked = false;
            }
          }
          const isDarkMode = localStorage.getItem('dark-mode') === 'enabled';
          updateDarkModeUI(isDarkMode);
          darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
              localStorage.setItem('dark-mode', 'enabled');
              updateDarkModeUI(true);
            } else {
              localStorage.setItem('dark-mode', 'disabled');
              updateDarkModeUI(false);
            }
          });
        </script>
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
            /* Variáveis CSS para cores */
            :root {
              --bg-color: #f4f4f4;
              --text-color: #333;
              --container-bg: white;
              --container-shadow: rgba(0,0,0,0.1);
              --top-bar-bg: #f8f9fa;
              --top-bar-shadow: rgba(0,0,0,0.1);
              --button-primary-bg: #007bff;
              --button-primary-hover-bg: #0056b3;
              --input-bg: white;
              --input-border: #ccc;
              --right-column-bg: #f9f9f9;
              --right-column-shadow: rgba(0,0,0,0.1);
              --file-item-bg: #eee;
              --file-item-link-color: #007bff;
            }

            body.dark-mode {
              --bg-color: #121212;
              --text-color: #e0e0e0;
              --container-bg: #1e1e1e;
              --container-shadow: rgba(0,0,0,0.3);
              --top-bar-bg: #2c2c2c;
              --top-bar-shadow: rgba(0,0,0,0.3);
              --button-primary-bg: #444;
              --button-primary-hover-bg: #555;
              --input-bg: #2c2c2c;
              --input-border: #555;
              --right-column-bg: #222;
              --right-column-shadow: rgba(0,0,0,0.3);
              --file-item-bg: #282828;
              --file-item-link-color: #87cefa;
            }

            /* Estilos globais */
            body { 
              font-family: sans-serif; 
              margin: 0; 
              padding-top: 70px; 
              background-color: var(--bg-color); 
              color: var(--text-color); 
              transition: background-color 0.3s, color 0.3s; 
            }

            /* Barra Superior */
            .top-bar {
              position: fixed; top: 0; left: 0; width: 100%;
              background-color: var(--top-bar-bg);
              padding: 10px 20px;
              display: flex; justify-content: space-between;
              align-items: center;
              box-shadow: 0 2px 5px var(--top-bar-shadow);
              z-index: 1000;
              box-sizing: border-box;
              transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
            }
            .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 20px; }
            .back-button {
              background-color: transparent; color: var(--text-color); border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; text-decoration: none; transition: background-color 0.3s, color 0.3s;
            }
            .back-button span { font-size: 1.2em; line-height: 1; }
            .back-button:hover { background-color: var(--button-bg-hover); }

            /* Switch de Modo Escuro */
            .dark-mode-switch { display: flex; align-items: center; gap: 10px; }
            .switch-text { color: var(--text-color); transition: color 0.3s; }
            .switch-label { display: block; cursor: pointer; text-indent: -9999px; width: 50px; height: 25px; background: grey; border-radius: 100px; position: relative; }
            .switch-label:after { content: ''; position: absolute; top: 2px; left: 2px; width: 21px; height: 21px; background: #fff; border-radius: 90px; transition: 0.3s; }
            .dark-mode-input:checked + .switch-label { background: #007bff; }
            .dark-mode-input:checked + .switch-label:after { left: calc(100% - 2px); transform: translateX(-100%); }
            .dark-mode-input { display: none; }
            
            /* Estilos da Página de Sala */
            .container { 
              max-width: 1200px; margin: 20px auto; 
              background: var(--container-bg); 
              padding: 2rem; border-radius: 8px; 
              box-shadow: 0 4px 6px var(--container-shadow); 
              transition: background 0.3s, box-shadow 0.3s; 
            }
            h1, h2, p, label { color: var(--text-color); }
            hr { margin: 2rem 0; border: 0; border-top: 1px solid var(--input-border); }

            .main-content { display: flex; gap: 20px; }
            .left-column { flex: 2; display: flex; flex-direction: column; gap: 20px; }
            .right-column { 
              flex: 1; display: flex; flex-direction: column; gap: 20px; 
              background: var(--right-column-bg); 
              padding: 20px; border-radius: 8px; 
              box-shadow: inset 0 0 5px var(--right-column-shadow); 
              transition: background 0.3s, box-shadow 0.3s;
            }

            textarea { 
              width: 100%; min-height: 400px; font-size: 1rem; padding: 1rem; box-sizing: border-box; 
              border: 1px solid var(--input-border); border-radius: 4px; resize: none; 
              background-color: var(--input-bg); color: var(--text-color);
              transition: background-color 0.3s, border-color 0.3s, color 0.3s;
            }
            
            #upload-form button { background-color: #28a745; color: white; }
            #upload-form button:hover { background-color: #218838; }

            .buttons { display: flex; justify-content: flex-end; gap: 1rem; }
            button { 
              padding: 0.75rem 1.5rem; font-size: 1rem; color: white; 
              border: none; border-radius: 4px; cursor: pointer; 
              transition: background-color 0.3s; 
            }
            #save-btn { background-color: #28a745; }
            #save-btn:hover { background-color: #218838; }
            #copy-btn { background-color: var(--button-primary-bg); }
            #copy-btn:hover { background-color: var(--button-primary-hover-bg); }
            .message { text-align: center; margin-top: 1rem; color: var(--text-color); }
            #file-list { list-style: none; padding: 0; }
            .file-item { 
              display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; 
              background: var(--file-item-bg); padding: 8px; border-radius: 4px; 
              transition: background 0.3s;
            }
            .file-item a { 
              text-decoration: none; 
              color: var(--file-item-link-color); 
              overflow: hidden; text-overflow: ellipsis; white-space: nowrap; 
            }
            .file-item button { padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .file-item button:hover { background-color: #c82333; }
          </style>
        </head>
        <body>
          <div class="top-bar">
            <div class="top-bar-left">
              <a href="/compartilhar" class="back-button">
                <span>&#11013;</span> Voltar
              </a>
            </div>
            <div class="top-bar-right">
              <div class="dark-mode-switch">
                <span class="switch-text" id="dark-mode-label">Modo Escuro ☀︎</span>
                <input type="checkbox" class="dark-mode-input" id="dark-mode-toggle">
                <label class="switch-label" for="dark-mode-toggle">Toggle</label>
              </div>
            </div>
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
            const darkModeToggle = document.getElementById("dark-mode-toggle");
            const darkModeLabel = document.getElementById("dark-mode-label");
            const body = document.body;

            function updateDarkModeUI(isDarkMode) {
                if (isDarkMode) {
                    body.classList.add('dark-mode');
                    darkModeLabel.textContent = "Modo Escuro ☾";
                    darkModeToggle.checked = true;
                } else {
                    body.classList.remove('dark-mode');
                    darkModeLabel.textContent = "Modo Escuro ☀︎";
                    darkModeToggle.checked = false;
                }
            }

            const isDarkMode = localStorage.getItem('dark-mode') === 'enabled';
            updateDarkModeUI(isDarkMode);
            darkModeToggle.addEventListener('change', () => {
              if (darkModeToggle.checked) {
                localStorage.setItem('dark-mode', 'enabled');
                updateDarkModeUI(true);
              } else {
                localStorage.setItem('dark-mode', 'disabled');
                updateDarkModeUI(false);
              }
            });

            // Lógica de manipulação de texto e arquivos
            const editor = document.getElementById("text-editor");
            const saveBtn = document.getElementById("save-btn");
            const