import { createWorker } from 'tesseract.js';

const langs = 'eng+rus+ukr+spa+ita';

const scanner = createWorker();

export default async function recognize(image: string): Promise<string> {
  const worker = await scanner;
  await worker.loadLanguage(langs);
  await worker.initialize(langs);

  const {
    data: { text }
  } = await worker.recognize(image);

  return text;
}
