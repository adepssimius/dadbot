
// Determine our place in the world
const ROOT = '..';

// Load our classes
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load our classes
const Logger  = require(`${ROOT}/modules/Logger`);

// Load external modules
const chalk   = require('chalk');
const Discord = require('discord.js');
const fs      = require('fs');

// Create a new Discord client
const client = new Discord.Client();

// Add the logger
client.logger = Logger;

// Load the config
client.config = require(`${ROOT}/config.js`);

// Fill the permission level map
client.permLevelMap = new Map();

for (let x = 0; x < client.config.permLevels.length; x++) {
    const permLevel = client.config.permLevels[x];
    client.permLevelMap.set(permLevel.name, permLevel);
}

// Set some colors
const colorizeCommand = chalk.green;
const colorizeAlias   = chalk.cyan;
const colorizeAction  = chalk.yellow;

// Add Collections for commands and aliases
client.commands       = new Discord.Collection();
client.commandAliases = new Discord.Collection();

client.logger = require('./Logger');

client.loadCommand = (commandName) => {
    client.logger.log(`Loading command: ${colorizeCommand(commandName)}`);
    
    if (client.commands.has(commandName)) {
        throw new DuplicateError(`Cowardly refusing to replace command ${colorizeCommand(commandName)} that has already been loaded`);
    }
    
    const command = require(`${ROOT}/commands/${commandName}`);
    if (command.init) {
        command.init(client);
    }
    
    // Add actions and action aliases Collection
    command.actions       = new Discord.Collection();
    command.actionAliases = new Discord.Collection();
    
    // In this odd exception we do not use ${ROOT} because this is being
    // called at runtime and not as an include within this module
    const actionDir = `commands/${commandName}/`;
    
    // Load the command actions
    if (fs.existsSync(actionDir) && fs.statSync(actionDir).isDirectory()) {
        // Load the command actions
        const actionFiles = fs.readdirSync(actionDir);
        
        client.logger.log(`  -> Loading ${actionFiles.length} command actions`);
        actionFiles.forEach(actionFile => {
            if (!actionFile.endsWith('.js')) return;
            const actionName = actionFile.replace(/\.[^/.]+$/, '');
            const response = client.loadCommandAction(command, actionName);
            if (response) console.log(response);
        });
    }
    
    client.commands.set(commandName, command);
    
    command.conf.aliases.forEach(alias => {
        const previouslyAliasedCommandName = client.commandAliases.get(alias);
        
        if (previouslyAliasedCommandName) {
            throw new DuplicateError(`Cowardly refusing to add alias ${colorizeAlias(alias)} `
                                   + `for ${colorizeCommand(commandName)} `
                                   + `as it is already assigned to command ${colorizeCommand(previouslyAliasedCommandName)}`);
        }
        
        client.commandAliases.set(alias, commandName);
    });
    
    return false;
};

client.loadCommandAction = (command, actionName) => {
    client.logger.log(`  -> Loading command action: ${colorizeCommand(command.help.name)} ${colorizeAction(actionName)}`);
    
    if (command.actions.has(actionName)) {
        throw new DuplicateError(`Cowardly refusing to replace action `
                               + `${colorizeCommand(command.help.name)} ${colorizeAction(actionName)} `
                               + `that has already been loaded`);
    }
    
    const action = require(`${ROOT}/commands/${command.help.name}/${actionName}`);
    if (action.init) {
        action.init(client);
    }
    
    command.actions.set(actionName, action);
    
    action.conf.aliases.forEach(alias => {
        const previouslyAliasedActionName = command.actionAliases.get(alias);
        
        if (previouslyAliasedActionName) {
            throw new DuplicateError(`Cowardly refusing to add alias ${colorizeAlias(alias)} `
                                   + `for ${colorizeCommand(command.help.name)} ${colorizeAction(actionName)} `
                                   + `as it is already assigned to action ${colorizeAction(previouslyAliasedActionName)}`);
        }
        
        command.actionAliases.set(alias, actionName);
    });
    
    return false;
};

//
// TODO - Consider creating client.runCommand() and moving code from message event into here
//

client.runCommand = async (message) => {
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    
    // If the member on a guild is invisible or not cached, fetch them.
    if (message.guild && !message.member) {
        await message.guild.members.fetch(message.author);
    }
    
    // Check whether the command or alias exists
    const command = client.commands.get(commandName) || client.commands.get(client.commandAliases.get(commandName));
    if (!command) {
        message.reply(`Unrecognized command: ${client.config.prefix}${commandName}`);
        return;
    }
    
    // Some commands may not be useable in DMs
    if (command && !message.guild && command.conf.guildOnly) {
        return message.reply('This command is unavailable via private message. Please run this command in a Discord server channel.');
    }
    
    if (!client.checkPermLevel(message, command.conf.permLevel)) {
        return message.reply(`You do not have permission to use this command.`);
    }
    
    client.logger.cmd(`[CMD] ${message.author.username} (${message.author.id}) executed command: ${colorizeCommand(command.help.name)} ${args.join(' ')}`);
    
    try {
        command.run(message, commandName, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
};

client.runCommandAction = async (message, command, commandName, actionName, args) => {
    //
    // TODO - Add handling for unrecognized command actions (and make sure we have it for commands as well)
    //
    
    const action  = command.actions.get(actionName) || command.actions.get(command.actionAliases.get(actionName));
    if (!action) {
        message.reply(`Unrecognized command action: ${client.config.prefix}${commandName} ${actionName}`);
        return;
    }
    
    // Some commands may not be useable in DMs
    if (action  && !message.guild && action.conf.guildOnly) {
        return message.reply('This command action is unavailable via private message. Please run this command in a Discord server channel.');
    }
    
    if (!client.checkPermLevel(message, action.conf.permLevel)) {
        return message.reply(`You do not have permission to use this command.`);
    }
    
    client.logger.cmd(`[CMD] ${message.author.username} (${message.author.id}) executed action: ${colorizeCommand(command.help.name)} ${colorizeAction(action.help.name)} ${args.join(' ')}`);
    
    try {
        action.run(message, commandName, actionName, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command action!');
    }

};

/*
 * PERMISSION LEVEL FUNCTION
 * This is a very basic permission system for commands which uses "levels"
 * "spaces" are intentionally left black so you can add them if you want.
 * NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
 * command including the VERY DANGEROUS `eval` and `exec` commands!
 */
//client.permlevel = (message) => {
//    let permlevel = 0;
//    
//    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);
//    while (permOrder.length) {
//        const currentLevel = permOrder.shift();
//        if (message.guild && currentLevel.guildOnly) {
//            continue;
//        }
//        
//        if (currentLevel.check(message)) {
//            permlevel = currentLevel.level;
//            break;
//        }
//    }
//    
//    return permlevel;
//};

client.checkPermLevel = (message, permLevelName) => {
    // If this command or action does not have a permission level name, let everyone have at it
    if (permLevelName == null) {
        return true;
    }
    
    // Attempt to get the permission level
    const permLevel = client.permLevelMap.get(permLevelName);
    
    // If we did not find it, something is broken
    if (permLevel == null) {
        client.logger.error('Permission level not found');
        return false;
    }
    
    // Otherwise, finally check the permission level
    return permLevel.check(message);
};

client.replyWithError = async (oops, message) => {
    message.channel.send(`**ERROR**: ${oops}`);
};

client.replyWithErrorAndDM = async (oops, message, error) => {
    message.channel.send(`**ERROR**: ${oops}`);
    
    //await message.author.send(`**ERROR**: ${oops}`);
    //await message.author.send(error.message);
    //await message.author.send(error.stack);
    
    message.author.send(`**ERROR**: ${oops}\n` + '```' + error.message + '```');
    
    client.logger.error(oops);
    client.logger.dump(error);
};

client.usage = (help, commandName, actionName) => {
    const usageArgs = help.usage.split(' ');
    
    if (commandName) usageArgs[0] = commandName;
    if (actionName)  usageArgs[1] = actionName;
    
    return `Usage: ${client.config.prefix}${usageArgs.join(' ')}`;
};

client.argCountIsValid = (help, args, message, commandName, actionName) => {
    if ( (help.minArgs && args.length < help.minArgs) || (help.maxArgs && args.length > help.maxArgs) ) {
        message.reply(client.usage(help, commandName, actionName));
        return false;
    }
    
    return true;
};


// Load our extra functions, though we should just move them all here
//require('./ClientFunctions')(client);

// Freeze and export
//Object.freeze(client);
module.exports = client;
