const fs = require("fs");
const path = require("path");
require("dotenv").config();

//importing Replies from BotReplies.json
const res = fs.readFileSync(path.resolve(__dirname, "Replies.json"));
const Replies = JSON.parse(res);
const {
    functions: {
        checkExpiredToken: {
            log,
            toAdmin,
            toAdmin_1week
        }
    }
} = Replies;

/**
 * Parse template literal so it can be used in JSON elements.
 * 
 * @param {string} expression - string to interpret
 * @param {obj} variablesObj - object with variables to replace
 * @returns {string} final string with replaced variables
 */
function s(expression, variablesObj){
    const regexp = /\${\s?([^{}\s]*)\s?}/g;
    let t = expression.replace(regexp, (substring, variables, index) => {
        variables = variablesObj[variables];
        return variables;
    });
    return t;
}

/**
 * If the token is expired, send a message to admin to update it and stops the bot.
 * If the token is about to expire in 1 week, suggests to admin to update it.
 * 
 * @param {obj} expirationDateObj - object with the expiration date of the token (year, month, day)
 * @param {obj} ctx - Telegram context
 */
function checkExpiredToken(expirationDateObj,ctx){
    const expirationDate = new Date(expirationDateObj.year,expirationDateObj.month,expirationDateObj.day);
    const currentDate = new Date();
    if(expirationDate-currentDate <= 0){    //Token expired
        console.log(Replies.functions.checkExpiredToken.log);   //Prints to log to update the token
        //send message to admin to update the token
        ctx.telegram.sendMessage(process.env.CREATOR_ID,Replies.functions.checkExpiredToken.toAdmin,{parse_mode: 'HTML'});
        process.exit(1);    //Stop the bot
    }else if(expirationDate-currentDate <= (1000 * 60 * 60 * 24 * 7)){
        //If expirationDate - currentDate <= 604800000 (7 days in milliseconds) the token is going to expire in 1 week
        //send message to admin to update the token
        ctx.telegram.sendMessage(process.env.CREATOR_ID,Replies.functions.checkExpiredToken.toAdmin_1week,{parse_mode: 'HTML'});
    }
}

//Old method, requires 'fun.' prefix. But it provides with functions description.
module.exports = {
    s,
    checkExpiredToken
}

/*//New method, does not require prefix. But it does not provide with functions description.
module.exports = function (){
    this.checkExpiredToken=checkExpiredToken;
}
*/
