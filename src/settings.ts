import dotenv from 'dotenv';
const result = dotenv.config();
if (result.error || !result.parsed) {
  throw result.error || new Error('No data loaded from env');
}

const { TELEGRAM_KEY, YANDEX_OAUTH_TOKEN, YANDEX_FOLDER_ID, DELAY } =
  result.parsed as {
    TELEGRAM_KEY: string;
    FOLDER_ID: string;
    YANDEX_OAUTH_TOKEN: string;
    YANDEX_FOLDER_ID: string;
    DELAY: string;
  };

const settings = {
  telegramKey: TELEGRAM_KEY,
  yandexOAuthToken: YANDEX_OAUTH_TOKEN,
  yandexFolderId: YANDEX_FOLDER_ID,
  delay: Number(DELAY)
};

export default settings;
