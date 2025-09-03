const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Place Holder</title>
      <script>
        (function() {
          if (localStorage.getItem('dark-mode') === 'enabled') {
            document.body.classList.add('dark-mode');
          }
        })();
      </script>
      <style>
        /* Variáveis CSS para cores */
        :root {
          --bg-color: #f4f4f4;
          --text-color: #333;
          --container-bg: white;
          --container-shadow: rgba(0,0,0,0.1);
          --top-bar-bg: #f8f9fa;
          --top-bar-shadow: rgba(0,0,0,0.1);
          --button-bg-hover: #e9ecef;
          --feature-box-bg: white;
          --feature-box-shadow: rgba(0,0,0,0.1);
        }

        body.dark-mode {
          --bg-color: #121212;
          --text-color: #e0e0e0;
          --container-bg: #1e1e1e;
          --container-shadow: rgba(0,0,0,0.3);
          --top-bar-bg: #2c2c2c;
          --top-bar-shadow: rgba(0,0,0,0.3);
          --button-bg-hover: #444;
          --feature-box-bg: #282828;
          --feature-box-shadow: rgba(0,0,0,0.3);
        }

        /* Estilos universais para a barra superior */
        body { font-family: sans-serif; margin: 0; padding-top: 70px; background-color: var(--bg-color); color: var(--text-color); transition: background-color 0.3s, color 0.3s; }
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
        .top-bar-left { display: flex; align-items: center; }
        .top-bar-right { display: flex; align-items: center; gap: 20px; }

        /* Estilos do Botão Voltar */
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
        
        /* Estilos da Página */
        .container { 
          text-align: center; max-width: 800px; width: 100%; margin: 0 auto;
          background: var(--container-bg); 
          padding: 2rem; border-radius: 8px; 
          box-shadow: 0 4px 6px var(--container-shadow); 
          transition: background 0.3s, box-shadow 0.3s; 
        }
        h1, p { color: var(--text-color); }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .feature-box { 
          background: var(--feature-box-bg); 
          color: var(--text-color); 
          padding: 30px; border-radius: 10px; 
          box-shadow: 0 5px 15px var(--feature-box-shadow); 
          transition: transform 0.3s ease, background 0.3s, color 0.3s, box-shadow 0.3s; 
          display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; 
        }
        .feature-box:hover { transform: translateY(-5px); }
        .feature-box a { text-decoration: none; color: inherit; font-weight: bold; }
        .feature-box a:hover { text-decoration: underline; }
        .coming-soon { opacity: 0.6; cursor: not-allowed; }
        .coming-soon:hover { transform: none; }
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

      <div class="container">
        <h1>Place Holder</h1>
        <p>Funcionalidades:</p>
        <div class="features-grid">
          <div class="feature-box">
            <a href="/compartilhar">Compartilhar textos, links e arquivos</a>
          </div>
          <div class="feature-box coming-soon">
            <span>Coming Soon!</span>
          </div>
          <div class="feature-box coming-soon">
            <span>Coming Soon!</span>
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
        
        const isDarkModeInitial = localStorage.getItem('dark-mode') === 'enabled';
        updateDarkModeUI(isDarkModeInitial);

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

module.exports = router;