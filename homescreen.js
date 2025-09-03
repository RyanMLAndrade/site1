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
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background-color: #f4f4f4; margin: 0; padding: 20px; box-sizing: border-box; }
        .container { text-align: center; max-width: 800px; width: 100%; }
        h1 { margin-bottom: 20px; font-size: 2.5rem; color: #333; }
        p { margin-bottom: 40px; font-size: 1.2rem; color: #555; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .feature-box { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .feature-box:hover { transform: translateY(-5px); }
        .feature-box a { text-decoration: none; color: inherit; font-weight: bold; }
        .feature-box a:hover { text-decoration: underline; }
        .coming-soon { opacity: 0.6; cursor: not-allowed; }
        .coming-soon:hover { transform: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Place Holder</h1>
        <p>Funcionalidades:</p>
        <div class="features-grid">
          <div class="feature-box">
            <a href="/sala">Compartilhar textos, links e arquivos</a>
          </div>
          <div class="feature-box coming-soon">
            <span>Coming Soon!</span>
          </div>
          <div class="feature-box coming-soon">
            <span>Coming Soon!</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;