require("dotenv").config();
const app = require("./src/app");
const config = require("./src/config");

const { checkConnection } = require("./src/services/blockchain.service");

async function start() {
  // Vérifier la connexion blockchain au démarrage
  await checkConnection();

  app.listen(config.port, () => {
    console.log(` Backend    : http://localhost:${config.port}`);
    console.log(`   Env        : ${config.nodeEnv}`);
    console.log(`   RPC URL    : ${process.env.BLOCKCHAIN_RPC_URL}`);
  });
}

start().catch(err => {
  console.error(" Erreur au démarrage :", err.message);
  process.exit(1);
});