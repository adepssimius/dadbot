
// Load external modules
const Discord = require('discord.js');
const fs = require('fs');

module.exports = (client) => {
    client.logger = require('./Logger');

    client.loadCommand = (commandName) => {
        try {
            client.logger.log(`Loading command: ${commandName}`);
            
            const command = require(`../commands/${commandName}`);
            if (command.init) {
                command.init(client);
            }
            
            // Add actions and action aliases Collection
            command.actions       = new Discord.Collection();
            command.actionAliases = new Discord.Collection();
            
            const actionDir = `commands/${commandName}/`;
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
            return `Unable to load command ${commandName}: ${e}`;
        }
    };
    
    client.loadCommandAction = (command, actionName) => {
        try {
            client.logger.log(`  -> Loading command action: ${command.help.name} -> ${actionName}`);
            
            const action = require(`../commands/${command.help.name}/${actionName}`);
            if (action.init) {
                action.init(client);
            }
            
            command.actions.set(actionName, action);
            
            action.conf.aliases.forEach(alias => {
                command.actionAliases.set(alias, actionName);
            });
            
            return false;
        
        } catch (e) {
            return `Unable to load command action: ${command.help.name} -> ${actionName}: ${e}`;
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
        
        // Get the user or member's permission level from the elevation
        const level = client.permlevel(message);
        
        // Check whether the command or alias exists
        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
        if (!command) return;
        
        // Some commands may not be useable in DMs
        if (command && !message.guild && command.conf.guildOnly) {
            return message.channel.send('This command is unavailable via private message. Please run this command in a Discord server channel.');
        }
        
        /* TODO -
        if (level < client.levelCache[command.conf.permLevel]) {
            if (settings.systemNotice === 'true') {
                return message.channel.send(`You do not have permission to use this command.
  Your permission level is ${level} (${client.config.permLevels.find(l => l.level === level).name})
  This command requires level ${client.levelCache[command.conf.permLevel]} (command)`);
            } else {
                return;
            }
        }
        */
        
        // To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
        message.author.permLevel = level;
        
        message.flags = [];
        while (args[0] && args[0][0] === "-") {
            message.flags.push(args.shift().slice(1));
        }
        
        // TODO - Enable this after config.permLevels is sorted
        // If the command exists and the user has permission, run it
        // client.logger.cmd(`[CMD] ${client.config.permLevels.find(l => l.level === level).name}`
        //            + ' ' +` ${message.author.username} (${message.author.id}) ran command ${command.help.name}`);
        
        client.logger.cmd(`[CMD] ${message.author.username} (${message.author.id}) ran command ${command.help.name}`);
        
        try {
            command.run(message, args, level);
        } catch (error) {
            console.error(error);
            message.reply('There was an error trying to execute that command!');
        }
    };
    
    client.runCommandAction = async (message, command, actionName, args, level) => {
        //
        // TODO - Add handling for unrecognized command actions (and make sure we have it for commands as well)
        //
        
        const action  = command.actions.get(actionName) || command.actions.get(command.actionAliases.get(actionName));
        if (!action) return;
        
        // Some commands may not be useable in DMs
        if (action  && !message.guild && action.conf.guildOnly) {
            return message.channel.send('This command action is unavailable via private message. Please run this command in a Discord server channel.');
        }
        
        /* TODO -
        if (level < client.levelCache[action.conf.permLevel]) {
            if (settings.systemNotice === 'true') {
                return message.channel.send(`You do not have permission to use this command.
  Your permission level is ${level} (${client.config.permLevels.find(l => l.level === level).name})
  This command requires level ${client.levelCache[action.conf.permLevel]} (${cmd.action.permLevel})`);
            } else {
                return;
            }
        }
        */
        
        // To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
        message.author.permLevel = level;
        
        message.flags = [];
        while (args[0] && args[0][0] === "-") {
            message.flags.push(args.shift().slice(1));
        }
        
        // TODO - Enable this after config.permLevels is sorted
        // If the command exists and the user has permission, run it
        // client.logger.cmd(`[CMD] ${client.config.permLevels.find(l => l.level === level).name}`
        //            + ' ' +` ${message.author.username} (${message.author.id}) ran command ${command.help.name}`);
        
        client.logger.cmd(`[CMD] ${message.author.username} (${message.author.id}) ran command action ${command.help.name} ${action.help.name}`);
        
        try {
            action.run(message, args, level);
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
    client.permlevel = (message) => {
        let permlevel = 0;
        
        // TODO
        // const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);
        //
        // while (permOrder.length) {
        //     const currentLevel = permOrder.shift();
        //     if (message.guild && currentLevel.guildOnly) continue;
        //    
        //     if (currentLevel.check(message)) {
        //         permlevel = currentLevel.level;
        //         break;
        //     }
        // }
        
        return permlevel;
    };
      
}
