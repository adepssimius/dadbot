
// Determine our place in the world
const ROOT = '..';

// Load our classes
const DuplicateError  = require(`${ROOT}/modules/error/DuplicateError`);
const PermissionError = require(`${ROOT}/modules/error/PermissionError`);

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

// Set the log level
client.logger.logLevel = client.config.logLevel;

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
    
    // Add purge to the conf if it does not exist
    if (!command.conf.purge) {
        command.conf.purge = {onSuccess: false, onFail: false};
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

client.runCommand = async (discordMessage) => {
    const args = discordMessage.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    let failure;
    
    // If the member on a guild is invisible or not cached, fetch them.
    if (discordMessage.guild && !discordMessage.member) {
        await discordMessage.guild.members.fetch(discordMessage.author);
    }
    
    // Check whether the command or alias exists
    const command = client.commands.get(commandName) || client.commands.get(client.commandAliases.get(commandName));
    if (!command) {
        failure = `unrecognized command: ${client.config.prefix}${commandName}`;
    
    // Some commands are not be useable in DMs
    } else if (command.conf.guildOnly && !discordMessage.guild) {
        failure = 'this command is unavailable via private message. Please run this command in a Discord server channel.';
    
    } else {
        try {
            const hasPermLevel = await client.checkPermLevel(discordMessage, command.conf.permLevel);
            
            if (hasPermLevel) {
                client.logger.cmd(`[CMD] ${discordMessage.author.username} (${discordMessage.author.id}) executed command: ${colorizeCommand(command.help.name)} ${args.join(' ')}`);
                command.run(discordMessage, commandName, args);
            } else {
                failure = `you do not have permission to use this command`;
            }
        } catch (error) {
            client.logger.error(error);
            failure = 'there was an error trying to execute that command!';
        }
    }
    
    if (failure) {
        client.replyWithPurge(failure, discordMessage, {purge: command.conf.purge, success: false});
    }
};

client.runCommandAction = async (discordMessage, command, commandName, actionName, args) => {
    let failure;
    
    const action  = command.actions.get(actionName) || command.actions.get(command.actionAliases.get(actionName));
    if (!action) {
        failure = `unrecognized command action: ${client.config.prefix}${commandName} ${actionName}`;
    
    // Some commands are not be useable in DMs
    } else if (action.conf.guildOnly && !discordMessage.guild) {
        failure = 'this command action is unavailable via private message. Please run this command in a Discord server channel.';
    
    } else {
        try {
            const hasPermLevel = await client.checkPermLevel(discordMessage, action.conf.permLevel);
            if (hasPermLevel) {
                client.logger.cmd(`[CMD] ${discordMessage.author.username} (${discordMessage.author.id}) executed action: ${colorizeCommand(command.help.name)} ${colorizeAction(action.help.name)} ${args.join(' ')}`);
                action.run(discordMessage, commandName, actionName, args);
            } else {
                failure = `you do not have permission to use this command`;
            }
            
        } catch (error) {
            console.error(error);
            failure = `there was an error trying to execute that command action!`;
        }
    }
    
    if (failure) {
        client.replyWithPurge(failure, discordMessage, {purge: action.conf.purge, success: false});
    }
};

client.checkPermLevel = async (message, permLevel) => {
    // If this command/action does not have a permission level, let everyone have at it
    if (!permLevel) {
        return true;
    }
    
    // Look for invalid permission levels
    if (/^[\w]+-[\w]+$/.test(permLevel)) {
        // Parse the permission level
        const permLevelParts = permLevel.split('-');
        const permType = permLevelParts[0];
        const permRole = permLevelParts[1];
        
        // Check the various permission types
        switch (permType) {
            case 'bot':
                return await client.checkBotPermLevel(message, permLevel, permRole);
            
            case 'alliance':
                const Alliance = require(`${ROOT}/modules/data/Alliance`);
                return await Alliance.checkPermLevel(message, permLevel, permRole);
            
            case 'guild':
                const Guild = require(`${ROOT}/modules/data/Guild`);
                return await Guild.checkPermLevel(message, permLevel, permRole);
        }
    }
    
    throw new PermissionError(`Invalid permission level: ${permLevel}`);
};

client.checkBotPermLevel = async (message, permLevel, permRole) => {
    switch (permRole) {
        case 'owner': return await client.userHasRole(message.member, client.config.botOwnerRoleId);
        case 'admin': return await client.userHasRole(message.member, client.config.botAdminRoleId);
    }
    
    throw new PermissionError(`Invalid permission level: ${permLevel}`);
};

client.userHasRole = async (discordGuildMember, roleId) => {
    //const role = await discordGuildMember.roles.find(r => r.id == roleId);
    //return (role != undefined);
    
    return await discordGuildMember.roles.cache.has(roleId);
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

//
// Messaging functions
//

//client.augmentDiscordMessage = (discordMessage) => {
//    Object.defineProperty(discordMessage, 'replyWithPurge', {
//        value: client.replyWithPurge,
//        enumerable: false // it's already the default
//    });
//    console.log(discordMessage);
//};

client.replyWithPurge = async (messageContent, discordMessage, args) => {
    const success = (args.success != undefined ? args.success : true);
    const purge   = (args.purge   != undefined ? args.purge : {onSuccess: false, onFail: false});
    
    if (purge.onSuccess == undefined) purge.onSuccess = false;
    if (purge.onFail    == undefined) purge.onFail = false;
    
    const responseDiscordMessage = await discordMessage.reply(messageContent);
    
    if ( (success && purge.onSuccess) || (!success && purge.onFail) ) {
        const delaySec = ( success ? purge.onSuccess : purge.onFail );
        setTimeout(() => {
            discordMessage.delete();
            responseDiscordMessage.delete();
        }, delaySec * 1000);
    }
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

client.sendAndDelete = async(message, discordChannel, delaySec = 5) => {
    const discordMessage = await discordChannel.send(message);
    setTimeout(() => { discordMessage.delete(); }, delaySec * 1000);
};

client.deleteLater = async(deletable, delaySec = 10) => {
    setTimeout(() => {deletable.delete(); }, delaySec * 1000);
};

// Load our extra functions, though we should just move them all here
//require('./ClientFunctions')(client);

// Freeze and export
//Object.freeze(client);
module.exports = client;
