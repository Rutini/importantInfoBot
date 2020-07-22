const express = require('express');
const app = express();
require('dotenv').config();
const { telegram_bot_token, rumunyChatId } = require('./config/telegramConfig');
const { defaultStickers,
        vinnik_ogo,
        stonks_up,
        stonks_down } = require('./constants/stickers');
const { on_sticker_answers, on_voice_answers, on_video_answers } = require('./constants/answers');

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(telegram_bot_token, {polling: true, onlyFirstMatch: true});

const axios = require('axios');
const { Random } = require('random-js');
const random = new Random();

const startCommand = '/start';
const getValutaCommandPrivate = '/valuta';
const getValutaCommandPublic = '/valuta@infoforubot';
const getHuyNaUkrVoice = 'а';
const getHuyNaEngVoice = 'a';
const getogoSticker = 'ого';

const cron = require('node-cron');

let previsousData;

(async function () {
    previsousData = await axios.get('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
})();

async function sendCurrentValues(chatId) {
    const {data: [{buy: newDollarBuy, sale: newDollarSale}, {buy: newEuroBuy, sale: newEuroSale}]} = await axios.get('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
    const {data: [{buy: oldDollarBuy, sale: oldDollarSale}, {buy: oldEuroBuy, sale: oldEuroSale}]} = previsousData;

    const buyDollarDiff = newDollarBuy - oldDollarBuy;
    const saleDollarDiff = newDollarSale - oldDollarSale;
    const buyEuroDiff = newEuroBuy - oldEuroBuy;
    const saleEuroDiff = newEuroSale - oldEuroSale;

    const dollarEmodji = '💵';
    const euroEmodji = '💶';
    const valutaMainText = `${dollarEmodji} buy: ${Number(newDollarBuy).toFixed(2)}  sale: ${Number(newDollarSale).toFixed(2)}\n${dollarEmodji}Різниця на купівлю: ${buyDollarDiff.toFixed(2)} та продаж: ${saleDollarDiff.toFixed(2)}\n${euroEmodji} buy: ${Number(newEuroBuy).toFixed(2)}  sale: ${Number(newEuroSale).toFixed(2)}\n${euroEmodji}Різниця на купівлю: ${buyEuroDiff.toFixed(2)} та продаж: ${saleEuroDiff.toFixed(2)}`;

    let sticker;
    Math.sign(buyDollarDiff) === 1 || !Math.sign(buyDollarDiff) ? sticker = stonks_up : sticker = stonks_down;

    await bot.sendSticker(chatId, sticker);
    await bot.sendMessage(chatId, valutaMainText);
}

cron.schedule('0 9 * * *',  async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 12 * * *', async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 15 * * *', async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 18 * * *', async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 21 * * *', async () => await sendCurrentValues(rumunyChatId), {});

bot.on('message',async msg => {
    if (!msg.text && !msg.voice && !msg.video_note && !msg.sticker) return;

    if (msg.voice) {
        let randomOnVoiceAnswer = random.integer(0, on_voice_answers.length - 1);
        return await bot.sendMessage(msg.chat.id, on_voice_answers[randomOnVoiceAnswer], {reply_to_message_id: msg.message_id});
    }
    if (msg.video_note) {
        let randomOnVideoAnswer = random.integer(0, on_video_answers.length - 1);
        return await bot.sendMessage(msg.chat.id, on_video_answers[randomOnVideoAnswer], {reply_to_message_id: msg.message_id});
    }
    if ((msg.chat.type === 'private' && msg.sticker) || (msg.chat.type === 'supergroup' && msg.sticker && msg.reply_to_message && msg.reply_to_message.from.username === 'infoForUBot')) {
        let randomOnStickerAnswer = random.integer(0, on_sticker_answers.length - 1);
        return await bot.sendMessage(msg.chat.id, on_sticker_answers[randomOnStickerAnswer], {reply_to_message_id: msg.message_id});
    }

    const inputMsg = msg.text.toLowerCase();
    switch (inputMsg) {
        case startCommand: {
            await bot.sendSticker(msg.chat.id, defaultStickers[1].id);
            break;
        }
        case getValutaCommandPrivate:
        case getValutaCommandPublic: {
            await sendCurrentValues(msg.chat.id);
            break;
        }
        case getHuyNaEngVoice:
        case getHuyNaUkrVoice: {
            await bot.sendAudio(msg.chat.id, __dirname + '/huyNa.mp3', {reply_to_message_id: msg.message_id});
            break;
        }
        case getogoSticker: {
            await bot.sendSticker(msg.chat.id, vinnik_ogo);
            break;
        }
        default: {
            if (msg.chat.type === 'supergroup') if (!msg.reply_to_message || (msg.reply_to_message && msg.reply_to_message.from.username !== 'infoForUBot')) return;

            let randomDefaultStickerIndex = random.integer(0, defaultStickers.length - 1);

            await bot.sendSticker(msg.chat.id, defaultStickers[randomDefaultStickerIndex].id, {reply_to_message_id: msg.message_id});
        }
    }
});

app.listen(5000, err => {
    err ? console.log(err) : console.log('Listening on 5000...');
});
