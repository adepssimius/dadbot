
// Determine our place in the world
const ROOT = '..';

// Load external modules
const chalk   = require('chalk');
const Discord = require('discord.js');
const fs      = require('fs');

// Set some colors
const colorizeCommand = chalk.green;
const colorizeAction  = chalk.yellow;

module.exports = (client) => {
    client.logger = require('./Logger');

    client.loadCommand = (commandName) => {
        try {
            client.logger.log(`Loading command: ${colorizeCommand(commandName)}`);
            
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
                client.aliases.set(alias, commandName);
            });
            
            return false;
        
        } catch (e) {
            return `Unable to load command ${colorizeCommand(commandName)}: ${e}`;
        }
    };
    
    client.loadCommandAction = (command, actionName) => {
        try {
            client.logger.log(`  -> Loading command action: ${colorizeCommand(command.help.name)} ${colorizeAction(actionName)}`);
            
            const action = require(`${ROOT}/commands/${command.help.name}/${actionName}`);
            if (action.init) {
                action.init(client);
            }
            
            command.actions.set(actionName, action);
            
            action.conf.aliases.forEach(alias => {
                command.actionAliases.set(alias, actionName);
            });
            
            return false;
        
        } catch (e) {
            return `Unable to load command action: ${colorizeCommand(command.help.name)} ${colorizeAction(actionName)}: ${e}`;
        }
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
        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
        if (!command) {
            message.channel.send(`Unrecognized command: ${client.config.prefix}${commandName}`);
            return;
        }
        
        // Some commands may not be useable in DMs
        if (command && !message.guild && command.conf.guildOnly) {
            return message.channel.send('This command is unavailable via private message. Please run this command in a Discord server channel.');
        }
        
        if (!client.checkPermLevel(message, command.conf.permLevel)) {
            return message.channel.send(`You do not have permission to use this command.`);
        }
        
        client.logger.cmd(`[CMD] ${message.author.username} (${message.author.id}) executed command: ${colorizeCommand(command.help.name)} ${args.join(' ')}`);
        
        try {
            command.run(message, args);
        } catch (error) {
            console.error(error);
            message.reply('There was an error trying to execute that command!');
        }
    };
    
    client.runCommandAction = async (message, command, actionName, args) => {
        //
        // TODO - Add handling for unrecognized command actions (and make sure we have it for commands as well)
        //
        
        const action  = command.actions.get(actionName) || command.actions.get(command.actionAliases.get(actionName));
        if (!action) {
            message.channel.send(`Unrecognized command action: ${client.config.prefix}${command.help.name} ${actionName}`);
            return;
        }
        
        // Some commands may not be useable in DMs
        if (action  && !message.guild && action.conf.guildOnly) {
            return message.channel.send('This command action is unavailable via private message. Please run this command in a Discord server channel.');
        }
        
        if (!client.checkPermLevel(message, action.conf.permLevel)) {
            return message.channel.send(`You do not have permission to use this command.`);
        }
        
        client.logger.cmd(`[CMD] ${message.author.username} (${message.author.id}) executed action: ${colorizeCommand(command.help.name)} ${colorizeAction(action.help.name)} ${args.join(' ')}`);
        
        try {
            action.run(message, args);
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
};
