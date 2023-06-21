import { createWorker } from 'tesseract.js';

const langs = 'eng+rus+ukr';

const scanner = createWorker();

export default async function recognize(image: string): Promise<string> {
  const worker = await scanner;
  await worker.loadLanguage(langs);
  await worker.initialize(langs);

  const {
    data: { text }
  } = await worker.recognize(image);

  // await worker.terminate();

  return text;
}
