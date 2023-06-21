import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { Bot } from '../bot/index.js';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import recognize from '../scanner.js';
import yandexWorker from '../index.js';
import settings from '../settings.js';

const delay = settings.delay;
const scanImage = new Scenes.BaseScene<Bot>('scan-image');

const downloadImage: (url: URL, filename: string) => Promise<void> = async (
  url,
  filename
) => {
  const res = await fetch(url);
  const buf = await res.body;
  if (!buf) {
    throw new Error('Nothing found');
  }

  await writeFile(path.resolve('./images', filename), buf);
};

scanImage.enterHandler = async ctx => {
  try {
    const now = Date.now();
    const then = ctx.session.lastRequest;
    if (then && now - then <= delay) {
      await ctx.reply(
        // prettier-ignore
        `Сканировать изображения можно раз в ${delay} минут${delay === 1 ? 'у' : '(ы)'}, подождите пожалуйста`
      );
      ctx.scene.leave();
      return;
    }

    const menu = await ctx.reply('Отправьте мне изображение *как документ*', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Отмена', 'cancel')]
      ]).reply_markup,
      parse_mode: 'MarkdownV2'
    });

    ctx.session.lastRequest = Date.now();
    ctx.session.menuMessage = menu.message_id;
  } catch (error) {
    ctx.reply('Что-то пошло не так, попробуйте еще раз').catch(() => null);
    console.log(error);
  }
};

scanImage.action('cancel', ctx => {
  ctx.deleteMessage().catch(() => null);
  ctx.scene.leave();
});

scanImage.on('message', (ctx, next) => {
  ctx.deleteMessage().catch(() => null);
  next();
});

scanImage.on(message('photo'), (ctx, next) => {
  if (!ctx.session.loaded) {
    const context = ctx;
    ctx
      .reply('Отправьте изображение *как документ*', {
        parse_mode: 'MarkdownV2'
      })
      .then(({ message_id }) => {
        setTimeout(async () => {
          try {
            await context.telegram.deleteMessage(context.from.id, message_id);
          } catch {
            null;
          }
        }, 3000);
      });
  }

  next();
});

scanImage.on(message('document'), async ctx => {
  try {
    if (ctx.session.loaded) {
      await ctx.reply(
        'Вы уже отправили изображение подождите пока я его обработаю'
      );
      return;
    }

    if (!ctx.message.document.mime_type?.startsWith('image')) {
      throw new Error('Отправьте изображение');
    }

    ctx.session.loaded = true;

    const fileName = crypto
      .randomBytes(16)
      .toString('hex')
      .concat('.')
      .concat(ctx.message.document.mime_type.split('/')[1]);

    if (ctx.session.menuMessage) {
      ctx.telegram.editMessageText(
        ctx.from.id,
        ctx.session.menuMessage,
        undefined,
        'Распознавание текста займет некоторое время, подождите пожалуйста...'
      );
    }
    const downloadingMessage = await ctx.reply('Загружаю изображение...');
    await ctx.sendChatAction('upload_photo');
    const url = await ctx.telegram.getFileLink(ctx.message.document.file_id);
    await downloadImage(url, fileName);

    await ctx.telegram.editMessageText(
      ctx.from.id,
      downloadingMessage.message_id,
      undefined,
      'Сканирую изображение...'
    );
    await ctx.sendChatAction('typing');
    const text = await recognize(path.resolve('./images', fileName));

    ctx.telegram
      .deleteMessage(ctx.from.id, downloadingMessage.message_id)
      .catch(() => null);
    if (ctx.session.menuMessage) {
      ctx.telegram
        .deleteMessage(ctx.from.id, ctx.session.menuMessage)
        .catch(() => null);
    }

    const detectedLanguage = await yandexWorker.detectLanguage(
      text.substring(0, 200)
    );

    await ctx.replyWithPhoto(
      {
        source: path.resolve('./images', fileName)
      },
      {
        // prettier-ignore
        caption: `
\`${fileName.split('.')[0]}\`

*Символов*: ${text.length}
*Слов*: ${text.split(/\s+/).length}
*Язык*: ${detectedLanguage}
`,
        parse_mode: 'MarkdownV2'
      }
    );

    const blocks = Math.ceil(text.length / 4090);

    for (let block = 0; block < blocks; block++) {
      await ctx.reply(text.substring(block * 4090, (block + 1) * 4090));
    }

    ctx.scene.leave();
  } catch (error: any) {
    ctx.reply(error.message).catch(() => null);
    ctx.scene.leave();
  }
});

scanImage.leaveHandler = async (ctx, next) => {
  ctx.session.loaded = false;
  next();
};

export default scanImage;
