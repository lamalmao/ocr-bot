import { Telegraf, Context, Scenes } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import stage from '../scenes/index.js';
import settings from '../settings.js';

export interface SessionData {
  lastRequest: number;
  menuMessage: number;
  loaded: boolean;
}

type BotContext = Context & Scenes.SceneContext;
type BotSession = Partial<SessionData> &
  Scenes.SceneSession<Scenes.SceneSessionData>;

export interface Bot extends BotContext {
  session: BotSession;
}

const telegramKey: string = settings.telegramKey;
const bot = new Telegraf<Bot>(telegramKey);
const session = new LocalSession<Bot>({
  property: 'session'
});

bot.start(async ctx => {
  try {
    await ctx.reply(
      'Приветствую, я умею распознавать текст на изображениях.\nЧтобы начать этот процесс, напиши мне /recognize'
    );
  } catch {
    null;
  }
});

bot.use(session.middleware());
bot.use(stage.middleware());

bot.command('recognize', ctx => ctx.scene.enter('scan-image'));

export default bot;
