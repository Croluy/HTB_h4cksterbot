#!/usr/bin/env node
/**
 * HTB_H4cksterbot - index.js - main file with all the commands.
 * Copyright (C) 2023   Croluy
 * 
 * This program comes with ABSOLUTELY NO WARRANTY;
 * This is free software, and you are welcome to redistribute it under certain conditions;
 * See https://www.gnu.org/licenses/ for details.
 */

require("dotenv").config();
const {Telegraf} = require('telegraf');

const functions = require('functions.js');
//import {t} from './functions.js';
//require('funtions.js')();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

//Bot token expires after 1 year, save the creation date and check it
const HTBtokenExpiration={
    year: 2024,
    month: 7,
    day: 3
}
const HTBtoken_expiration_date=new Date(HTBtokenExpiration.year, HTBtokenExpiration.month, HTBtokenExpiration.day);
const current_date=new Date();
//If HTBtoken_expiration_date - current_date <= 0 the token is expired
if(HTBtoken_expiration_date-current_date<=0){
    console.log("HTB token expired, please update it");
    //send message to admin to update the token
    
    process.exit(1);
}

bot.start((ctx) => {
    ctx.reply('Welcome to HTB_H4cksterbot!');
});

//Has the be at the end of the file
bot.launch();   // Start the bot
//Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));