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
const fs = require("fs");
const path = require("path");
require("dotenv").config();

//importing Replies from BotReplies.json
const res = fs.readFileSync(path.resolve(__dirname, "Replies.json"));
const Replies = JSON.parse(res);
const {
    index: {
        __expireToken:{
            daysonly,
            daysandweeks,
        }
    }
} = Replies;

//Old method, requires 'fun.' prefix. But it provides with functions description.
const fun = require('./functions.js');
//New method, does not require prefix. But it does not provide with functions description.
//require('./functions.js')();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

//Bot token expires after 1 year, save the creation date (months and days start at 0, so 2024-07-01 is 2024-08-02 for the program)
const HTBtokenExpiration={
    year: 2024,
    month: 8  -1,
    day: 2  -1
}

bot.start((ctx) => {
    fun.checkExpiredToken(HTBtokenExpiration,ctx);
    ctx.reply('Welcome to HTB_H4cksterbot!');
});

bot.command('expire', (ctx) => {
    fun.checkExpiredToken(HTBtokenExpiration,ctx);
    if(ctx.message.from.id!=process.env.CREATOR_ID) return; //Only creator can use this command

    //if day or month is <10, add a 0 in front so it's a 2 digit number
    let d=HTBtokenExpiration.day+1;
    let m=HTBtokenExpiration.month+1;
    if(d<10) d=0+''+d;
    if(m<10) m=0+''+m;

    //get number of days and weeks left for token expiration
    const currentDate = new Date();
    const expirationDate = new Date(HTBtokenExpiration.year,HTBtokenExpiration.month,HTBtokenExpiration.day);
    let daysLeft = Math.floor((expirationDate-currentDate) / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.floor((expirationDate-currentDate) / (1000 * 60 * 60 * 24 * 7));

    if(weeksLeft>1){
        daysLeft=daysLeft-weeksLeft*7;
        ctx.reply(fun.s(Replies.index.__expireToken.daysandweeks,{year:HTBtokenExpiration.year,month:m,day:d,daysLeft:daysLeft,weeksLeft:weeksLeft}),{parse_mode: 'HTML'});
    }else{
        ctx.reply(fun.s(Replies.index.__expireToken.daysonly,{year:HTBtokenExpiration.year,month:m,day:d,daysLeft:daysLeft}),{parse_mode: 'HTML'});
    }
});

//Has the be at the end of the file
bot.launch();   // Start the bot
//Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));