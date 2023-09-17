#!/usr/bin/env node
/**
 * HTB_H4cksterbot - index.js - main file with all the commands.
 * Copyright (C) 2023   Croluy
 * 
 * This program comes with ABSOLUTELY NO WARRANTY;
 * This is free software, and you are welcome to redistribute it under certain conditions;
 * See https://www.gnu.org/licenses/ for details.
 */

const axios = require('axios');
const {Telegraf} = require('telegraf');
const fs = require("fs");
const path = require("path");
require("dotenv").config();

//HTB Ranks
const rankString = {
    1: 'Noob',
    2: 'Script Kiddie',
    3: 'Hacker',
    4: 'Pro Hacker',
    5: 'Elite Hacker',
    6: 'Guru',
    7: 'Omniscient'
};

let botReply=null;  //variable to store the bot reply message, so it can be deleted after a certain amount of time
const msDelUserMessage=0;   //time in ms after which the user message is deleted
const msDelBotMessage=60000;    //time in ms after which the bot message is deleted

//importing Replies from BotReplies.json
const res = fs.readFileSync(path.resolve(__dirname, "Replies.json"));
const Replies = JSON.parse(res);

//Old method, requires 'fun.' prefix. But it provides with functions description.
const fun = require('./functions.js');
//New method, does not require prefix. But it does not provide with functions description.
//require('./functions.js')();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start(async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.initFiles();
    fun.checkExpiredToken(ctx);

    botReply=await ctx.reply(Replies.index.__start.start,{parse_mode: 'HTML'});

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.help(async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.checkExpiredToken(ctx);

    //send the help message
    botReply=await ctx.reply(Replies.index.__help.help,{parse_mode: 'HTML'});

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.command('token', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    //token can only be set in private chat, as the token is a sensitive information and anyone with access to it is able to retrieve loads of data about your account
    if(ctx.message.chat.type!='private'){
        //delete message sent in group
        await ctx.deleteMessage(ctx.message.message_id);
        botReply=await ctx.reply(Replies.index.__token.not_private,{parse_mode: 'HTML'});
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    //lets the user pass the token as an argument and adds it to tokens.json
    const args = ctx.message.text.split(' ');
    if(args.length!=3){
        botReply=await ctx.reply(Replies.index.__token.wrong_args,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }
    const d = args[1];
    const token = args[2];

    //check if args are valid, date must be numbers and / and must be 10 digit, token must be 995 characters long
    if(token.length!=995 || d.length!=10 || !fun.isOnlyNumbers(d)){
        botReply=await ctx.reply(Replies.index.__token.wrong_args,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }
    const date = {
        "day": parseInt(d.substring(0,2), 10)-1,
        "month": parseInt(d.substring(3,5), 10)-1,
        "year": parseInt(d.substring(6), 10)
    };
    //check if expiration date provided has already passed
    const currentDate = new Date();
    const expirationDate = new Date(date.year,date.month,date.day);
    if(expirationDate-currentDate <= 0){    //Token expired
        botReply=await ctx.reply(Replies.index.__token.wrong_args,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    //check if token is valid
    axios.get('https://www.hackthebox.com/api/v4/user/info', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then(async (response) => {
        //if token is valid, add it to tokens.json
        botReply=await fun.add_TokenToFile(ctx,token,date);
    }).catch(async (err) => {
        //if token is not valid, send a message to the user
        botReply=await ctx.reply(fun.s(Replies.index.__token.invalid_token,{tok:token}),{parse_mode: 'HTML'});
    });

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.command('instructions', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.checkExpiredToken(ctx);
    botReply=await ctx.reply(Replies.index.__instructions.how_to_set,{parse_mode: 'HTML'});

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.command('expire', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.checkExpiredToken(ctx);

    const token=fun.getToken(ctx.from.id);
    if(token==-1){
        botReply=await ctx.reply(Replies.index.no_token_found,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    //get token expiration date and if it's not found, send a message to the user
    const HTBtokenExpiration = fun.getTokenExpirationDate(ctx.from.id);
    if(HTBtokenExpiration==-1){
        botReply=await ctx.reply(Replies.index.__expireToken.no_token,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    //if day or month is <10, add a 0 in front so it's a 2 digit number
    let d=HTBtokenExpiration.day+1;
    let m=HTBtokenExpiration.month+1;
    if(d<10) d=0+''+d;
    if(m<10) m=0+''+m;

    //get number of days and weeks left for token expiration
    const currentDate = new Date();
    const expirationDate = new Date(HTBtokenExpiration.year,HTBtokenExpiration.month,HTBtokenExpiration.day+1);
    let daysLeft = Math.floor((expirationDate-currentDate) / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.floor((expirationDate-currentDate) / (1000 * 60 * 60 * 24 * 7));

    if(weeksLeft>1){
        daysLeft=daysLeft-weeksLeft*7;
        botReply=await ctx.reply(fun.s(Replies.index.__expireToken.daysandweeks,{year:HTBtokenExpiration.year,month:m,day:d,daysLeft:daysLeft,weeksLeft:weeksLeft}),{parse_mode: 'HTML'});
    }else{
        botReply=await ctx.reply(fun.s(Replies.index.__expireToken.daysonly,{year:HTBtokenExpiration.year,month:m,day:d,daysLeft:daysLeft}),{parse_mode: 'HTML'});
    }

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.command('rank', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.checkExpiredToken(ctx);

    //get token, if not found send a message to user
    const token=fun.getToken(ctx.from.id);
    if(token==-1){
        botReply=await ctx.reply(Replies.index.no_token_found,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    try{
        const response = await axios.get('https://www.hackthebox.com/api/v4/user/info', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        let rank = rankString[response.data.info.rank_id];
        //if(response.data.info.id == process.env.CREATOR_HTB_ID) rank="Omniscient";   //Troll with creator rank being Omniscient :P
        botReply=await ctx.reply(fun.startReplyWith(ctx)+fun.s(Replies.index.__rank.mess_rank,{rank:rank}),{parse_mode: 'HTML'});
    }catch(err){
        botReply=await ctx.reply(fun.s(Replies.index.req_error,{creator:process.env.CREATOR_USERNAME, error:err, headers:"No Headers"}),{parse_mode: 'HTML'});
    }

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.command('id', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.checkExpiredToken(ctx);

    //get token, if not found send a message to user
    const token=fun.getToken(ctx.from.id);
    if(token==-1){
        botReply=await ctx.reply(Replies.index.no_token_found,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    try{
        const response = await axios.get('https://www.hackthebox.com/api/v4/user/info', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        botReply=await ctx.reply(fun.startReplyWith(ctx)+fun.s(Replies.index.__id.mess_id,{id:response.data.info.id}),{parse_mode: 'HTML'});
    }catch(err){
        botReply=await ctx.reply(fun.s(Replies.index.req_error,{creator:process.env.CREATOR_USERNAME,error:err+"\n"+err.response.data.error,headers:err.config.headers}),{parse_mode: 'HTML'});
    }

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.command('team', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    fun.checkExpiredToken(ctx);

    //get token, if not found send a message to user
    const token=fun.getToken(ctx.from.id);
    if(token==-1){
        botReply=await ctx.reply(Replies.index.no_token_found,{parse_mode: 'HTML'});

        //Delete messages
        fun.deleteMessage(ctx,msDelUserMessage);
        fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
        return;
    }

    try{
        const response = await axios.get('https://www.hackthebox.com/api/v4/user/info', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        let team=response.data.info.team;
        if(team==null) team="No Team";
        botReply=await ctx.reply(fun.startReplyWith(ctx)+fun.s(Replies.index.__team.mess_team,{team:team}),{parse_mode: 'HTML'});
    }catch(err){
        botReply=await ctx.reply(fun.s(Replies.index.req_error,{creator:process.env.CREATOR_USERNAME, error:err, headers:"No Headers"}),{parse_mode: 'HTML'});
    }

    //Delete messages
    fun.deleteMessage(ctx,msDelUserMessage);
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

bot.on('text', async (ctx) => {
    if(fun.checkGroup(ctx)==false) return;
    const message = ctx.message.text;

    //message to test if bot is online
    if(message.toLowerCase()==='ping'){
        botReply=await ctx.reply('pong');
        fun.deleteMessage(ctx,msDelUserMessage);
    }
    fun.deleteBotMessage(ctx,botReply,msDelBotMessage);
});

//Has the be at the end of the file
bot.launch();   // Start the bot
//Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));