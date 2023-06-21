import { Scenes } from 'telegraf';
import scanImage from './scanImage.js';
import { Bot } from '../bot/index.js';

const stage = new Scenes.Stage<Bot>([scanImage]);

export default stage;
