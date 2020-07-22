const express = require('express');
const app = express();
require('dotenv').config();
const {telegram_bot_token, rumunyChatId} = require('./config/telegramConfig');

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(telegram_bot_token, {polling: true, onlyFirstMatch: true});

const axios = require('axios');

const startCommand = '/start';
const getValutaCommandPrivate = '/valuta';
const getValutaCommandPublic = '/valuta@infoforubot';
const getHuyNaUkrVoice = 'а';
const getHuyNaEngVoice = 'a';
const getogoSticker = 'ого';

const cron = require('node-cron');

async function sendCurrentValues(chatId) {
    const {data: [{buy: dollarBuy, sale: dollarSale}, {buy: euroBuy, sale: euroSale}]} = await axios.get('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');

    const dollarEmodji = '💵';
    const euroEmodji = '💶';
    const valutaMainText = `${dollarEmodji} buy: ${Number(dollarBuy).toFixed(2)}  sale: ${Number(dollarSale).toFixed(2)} 
    \n${euroEmodji} buy: ${Number(euroBuy).toFixed(2)}  sale: ${Number(euroSale).toFixed(2)}`;

    await bot.sendPhoto(chatId, __dirname + '/stonks-template.png', {caption: valutaMainText});
}

cron.schedule('0 9 * * *',  async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 12 * * *', async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 15 * * *', async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 18 * * *', async () => await sendCurrentValues(rumunyChatId), {});
cron.schedule('0 21 * * *', async () => await sendCurrentValues(rumunyChatId), {});

let toBeOrNot2Be;

bot.on('message',async msg => {
    if (!msg.text && !msg.voice && !msg.video_note) return;

    if (msg.voice) return await bot.sendMessage(msg.chat.id, 'Завали єбло.', {reply_to_message_id: msg.message_id});
    if (msg.video_note) return await bot.sendMessage(msg.chat.id, 'Їбать ти уродіна, скройся.', {reply_to_message_id: msg.message_id});

    const inputMsg = msg.text.toLowerCase();
    switch (inputMsg) {
        case startCommand: {
            await bot.sendSticker(msg.chat.id, 'CAACAgIAAxkBAAMSXxb41FtpP-0jAniGIsF1DLt0lZAAAmIAA_IEIBauBak-amt-jRoE');
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
            await bot.sendSticker(msg.chat.id, 'CAACAgIAAxkBAAIBml8YPxYIZqbaMdzvad_ZOw3AmRx6AAIcAQACtIBKJGEipCBAGzrcGgQ');
            break;
        }
        default: {
            if (msg.chat.type === 'supergroup') if (!msg.reply_to_message || (msg.reply_to_message && msg.reply_to_message.from.username !== 'infoForUBot')) return;
            toBeOrNot2Be = Math.round((Math.random()));

            let sticker;

            toBeOrNot2Be ? sticker = 'CAACAgIAAxkBAAMSXxb41FtpP-0jAniGIsF1DLt0lZAAAmIAA_IEIBauBak-amt-jRoE' : sticker = 'CAACAgIAAxkBAAOEXxdbvKsXtIxwW01l3JlvfhzjArMAAsQFAAIjBQ0AAe5L2KGTqlu8GgQ';

            await bot.sendSticker(msg.chat.id, sticker, {reply_to_message_id: msg.message_id});
        }
    }
});

app.listen(5000, err => {
    err ? console.log(err) : console.log('Listening on 5000...');
});
