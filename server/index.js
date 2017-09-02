import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import staticServer from 'koa-static';

import server from './server';
import ssr from './middleware/vue-server-render';


const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

console.log(path.resolve(__dirname, '../client'));
server
  .use(staticServer(path.resolve(__dirname, '../client')))
  .use(ssr({
    bundle: path.resolve(__dirname, '../client/vue-ssr-bundle.json'),
    manifest: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../client/vue-ssr-manifest.json'), 'utf8')),
  }))
  .listen(PORT, HOST);

console.log(chalk.green(`🌏  Server Start at ${HOST}:${PORT}`));
