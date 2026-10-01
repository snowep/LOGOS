import http from 'http';
import { createApp } from './server';
import { initializeSchema } from './db';
import { startWatcher } from './services/watcher';
import { installConsoleCapture } from './routes/system';
import { config } from './config';

initializeSchema();
installConsoleCapture();

const app = createApp();
const server = http.createServer(app);

startWatcher();

server.listen(config.port, config.host, () => {
  console.log(`LOGOS API listening on http://${config.host}:${config.port}`);
  console.log(`Vault: ${config.vaultPath}`);
  console.log(`DB: ${config.dbPath}`);
});

export default server;
