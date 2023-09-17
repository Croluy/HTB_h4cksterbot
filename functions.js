const fs = require("fs");
const path = require("path");
require("dotenv").config();
const editJsonFile = require("edit-json-file");
let tokens_file = editJsonFile('./tokens.json', {autosave: true});
let tokensListIndex=tokens_file.get("TokensNumber");

//importing Replies from BotReplies.json
const res = fs.readFileSync(path.resolve(__dirname, "Replies.json"));
const Replies = JSON.parse(res);

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
 * Checks if a string is only made by numbers separated by /.
 * The format is DD/MM/YYYY
 * 
 * @param {string} input 
 * @returns true if it's date, false otherwise
 */
function isOnlyNumbers(input) {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(input);
}

/**
 * Initializes tokens.json file.
 */
function initFiles(){
    // Reload file from the disk
    tokens_file = editJsonFile(`./tokens.json`, {autosave: true});
    //if the file is empty (tokens number doesn't exist), set token number to 0
    if(tokens_file.get("TokensNumber") == null || tokens_file.get("TokensNumber") == undefined){
        tokensListIndex=0;
        tokens_file.set("TokensNumber",tokensListIndex);  //write the number of tokens at the beginning of the file
        tokens_file.set("List",[]);  //clear the list of tokens
    }
    tokens_file.set("TokensNumber",tokensListIndex);  //write the number of tokens at the beginning of the file
    tokens_file.save();
    //if there is no token
    if(tokens_file.get("TokensNumber") == 0){
        //write creator as 1st token
        tokens_file.append("List", {"ID":parseInt(process.env.CREATOR_ID), "Token":process.env.HTB_TOKEN,
                                    "ExpirationDate":{"day": 1,"month": 7,"year": 2024}});
        tokensListIndex++;   //increment number of the next token
        tokens_file.set("TokensNumber",tokensListIndex);  //update token index
        tokens_file.save();      //save file
    }
}

/**
 * Adds a new token to tokens.json file.
 * If token is already saved, it replies to user with a message.
 * 
 * @param {obj} ctx - telegraf context
 * @param {string} token - token to add
 * @param {obj} d - date of expiration of token
 */
function add_TokenToFile(ctx,token,d){
    //check if token is already in tokens.json file
    if(isTokenInFile(ctx.from.id)) return ctx.reply(Replies.functions.__addTokenToFile.duplicate,{parse_mode: 'HTML'});

    // Reload file from the disk
    tokens_file = editJsonFile(`./tokens.json`, {autosave: true});

    //if file is empty, fills it with the correct JSON structure
    if(tokens_file.get("TokensNumber") == null || tokens_file.get("TokensNumber") == undefined){
        tokensListIndex=0;
        tokens_file.set("TokensNumber",tokensListIndex);  //write the number of tokens at the beginning of the file
        tokens_file.set("List",[]);  //clear the list of tokens
    }

    tokens_file.append("List", {"ID":ctx.from.id, "Token":token,
                                "ExpirationDate":{"day":d.day, "month":d.month, "year":d.year}});
    tokensListIndex++;   //increment number of the next token
    tokens_file.set("TokensNumber",tokensListIndex);  //update token index
    tokens_file.save();
    ctx.reply(Replies.functions.__addTokenToFile.added);
}

/**
 * Check if token that we are trying to add is already in tokens.json file.
 * 
 * @param {int} id - id of the user
 * @returns true if token is already in tokens.json file, false otherwise
 */
function isTokenInFile(id){
    // Reload file from the disk
    tokens_file = editJsonFile(`./tokens.json`, {autosave: true});
    //check if token is already in tokens.json file
    const tokensList = tokens_file.get("List");
    for(let i=0; i<tokensListIndex; i++){
        if(tokensList[i].ID==id){
            return true;
        }
    }
    return false;
}

/**
 * Get token position in tokens.json file.
 * 
 * @param {int} id - id of the user
 * @returns position of token in tokens.json file, -1 if not found
 */
function getTokenPosition(id){
    // Reload file from the disk
    tokens_file = editJsonFile(`./tokens.json`, {autosave: true});
    //check if token is already in tokens.json file
    const tokensList = tokens_file.get("List");
    for(let i=0; i<tokensListIndex; i++){
        if(tokensList[i].ID==id){
            return i;
        }
    }
    return -1;
}

/**
 * Get token from tokens.json file using user ID.
 * 
 * @param {int} id - id of the user
 * @returns token from tokens.json file, -1 if not found
 */
function getToken(id){
    // Reload file from the disk
    tokens_file = editJsonFile(`./tokens.json`, {autosave: true});
    //check if token is already in tokens.json file
    const tokensList = tokens_file.get("List");
    for(let i=0; i<tokensListIndex; i++){
        if(tokensList[i].ID==id){
            return tokensList[i].Token;
        }
    }
    return -1;
}

/**
 * Get expiration date of token in tokens.json file.
 * 
 * @param {int} id - id of the user
 * @returns expiration date of token in tokens.json file, -1 if not found
 */
function getTokenExpirationDate(id){
    // Reload file from the disk
    tokens_file = editJsonFile(`./tokens.json`, {autosave: true});
    //check if token is already in tokens.json file
    const tokensList = tokens_file.get("List");
    for(let i=0; i<tokensListIndex; i++){
        if(tokensList[i].ID==id){
            return tokensList[i].ExpirationDate;
        }
    }
    return -1;
}

/**
 * If the token is expired, send a message to user to update it.
 * If the token is about to expire in 1 week, suggests user to update it.
 * 
 * @param {obj} ctx - Telegram context
 */
function checkExpiredToken(ctx){
    const expirationDateObj = getTokenExpirationDate(ctx.from.id);
    if(expirationDateObj==-1) return;   //Token not found

    const expirationDate = new Date(expirationDateObj.year,expirationDateObj.month,expirationDateObj.day);
    const currentDate = new Date();
    if(expirationDate-currentDate <= 0){    //Token expired
        //send message asking to update the token
        ctx.reply(Replies.functions.checkExpiredToken.toAdmin,{parse_mode: 'HTML'});
    }else if(expirationDate-currentDate <= (1000 * 60 * 60 * 24 * 7)){
        //If expirationDate - currentDate <= 604800000 (7 days in milliseconds) the token is going to expire in 1 week
        //send message asking to update the token soon
        ctx.reply(Replies.functions.checkExpiredToken.toAdmin_1week,{parse_mode: 'HTML'});
    }
}

/**
 * Using ctx object check if user has:
 * 1. no username, no last name
 * 2. no username
 * 3. no last name
 * 4. has all the fields
 * 
 * @param {obj} ctx - Telegram context
 * @returns 1 if no username, no last name
 * @returns 2 if no username
 * @returns 3 if no last name
 * @returns 4 if has all the fields
 */
function checkUserFields(ctx){
    if(ctx.from.username==undefined && ctx.from.last_name==undefined){
        return 1;
    }else if(ctx.from.username==undefined){
        return 2;
    }else if(ctx.from.last_name==undefined){
        return 3;
    }
    return 4;
}

/**
 * Using ctx object starts the message with the name of the user using all possible fields.
 * 
 * @param {obj} ctx - Telegram context
 * @returns string with the full name, username and id of the user
 */
function startReplyWith(ctx){
    switch(checkUserFields(ctx)){
        case 1:
            return ctx.from.first_name+" [<code>"+ctx.from.id+"</code>]\n------------------\n";
        case 2:
            return ctx.from.first_name+" "+ctx.from.last_name+" [<code>"+ctx.from.id+"</code>]\n------------------\n";
        case 3:
            return ctx.from.first_name+" @"+ctx.from.username+" [<code>"+ctx.from.id+"</code>]\n------------------\n";
        case 4:
            return ctx.from.first_name+" "+ctx.from.last_name+" @"+ctx.from.username+" [<code>"+ctx.from.id+"</code>]\n------------------\n";
    }
}

/**
 * Deletes user message after (ms) milliseconds.
 * 
 * @param {obj} ctx Telegraf context
 * @param {int} ms Time in milliseconds
 */
function deleteMessage(ctx,ms){
    setTimeout(() => {
        ctx.deleteMessage(ctx.message.message_id)
            .catch((error) => {
                console.error('Errore durante la cancellazione del messaggio:', error);
            });
    }, ms);
}

/**
 * Deletes bot message after (ms) milliseconds.
 * 
 * @param {obj} ctx Telegraf context
 * @param {obj} reply message to delete
 * @param {int} ms Time in milliseconds
 */
function deleteBotMessage(ctx,reply,ms){
    setTimeout(async () => {
        try {
            await ctx.telegram.deleteMessage(ctx.chat.id, reply.message_id);
        } catch (error) {
            console.error(error);
        }
    }, ms);

    /*setTimeout(async () => {
        await ctx.telegram.deleteMessage(ctx.chat.id,reply.message_id)
            .catch((error) => {
                console.error('Errore durante la cancellazione del messaggio:', error);
            });
    }, ms);*/
}

/**
 * Checks if the chat is a group/supergroup/private chat.
 * If it's a group/supergroup, checks if it's the original one.
 * 
 * @param {obj} ctx Telegram context
 * @returns true if the chat is a group/supergroup/private chat
 * @returns false if the chat is a group/supergroup but not the original one
 */
function checkGroup(ctx){
    if(ctx.chat.type=="group" || ctx.chat.type=="supergroup"){
        if(ctx.chat.id==process.env.GROUP_ID || ctx.chat.id == process.env.TEST_GROUP_ID) return true;
        else return false;
    }
    return true;
}

//Old method, requires 'fun.' prefix. But it provides with functions description.
module.exports = {
    initFiles,
    add_TokenToFile,
    s,
    isOnlyNumbers,
    getToken,
    getTokenExpirationDate,
    checkExpiredToken,
    checkUserFields,
    startReplyWith,
    deleteMessage,
    deleteBotMessage,
    checkGroup
}

/*//New method, does not require prefix. But it does not provide with functions description.
module.exports = function (){
    this.checkExpiredToken=checkExpiredToken;
}
*/
