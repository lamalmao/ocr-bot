import bot from './bot/index.js';
import YandexWorker from './language-detect.js';
import settings from './settings.js';
import fs from 'fs';
import path from 'path';

const imagesPath = path.resolve('./images');
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath);
}

const yandexWorker = new YandexWorker(
  settings.yandexOAuthToken,
  settings.yandexFolderId
);

(async () => {
  await yandexWorker.init();
  bot.launch().then(() => console.log('Bot started'));
})();

export default yandexWorker;
