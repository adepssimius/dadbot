
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Guild     = require(`${ROOT}/modules/alliance/Guild`);
const Timestamp = require(`${ROOT}/modules/Timestamp`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: null
};
exports.conf = conf;

const help = {
    command: 'clan',
    name: 'info',
    category: 'Clan Administration',
    description: 'Set the value for a clan attriibute',
    usage: 'clan set [name|alias|id|timezone] <value>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length < 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const attribute = args.shift();
    const value     = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    
    let guilds = await Guild.get({guild_id: message.guild.id});
    
    if (guilds.length == 0) {
        message.channel.send(`This discord clan is not currently part of an alliance`);
        return;
    }
    
    const guild = guilds[0];
    
    switch (attribute) {
        case 'name'     : guild.clan_name  = value; break;
        case 'alias'    : guild.clan_alias = value; break;
        case 'id'       : guild.clan_id    = parseInt(value, 10); break;
        
        case 'timezone' :
            if (!Timestamp.timeZoneIsValid(value)) {
                await message.channel.send(`Invalid time zone: ${value}`);
                return;
            }
            
            guild.timezone = value;
            break;
            
        default:
            message.channel.send(`**ERROR:** Unrecognized attribute '${attribute}'`);
    }
    
    try {
        await guild.update();
        message.channel.send(`Clan ${attribute} updated`);
    
    } catch (error) {
        client.replyWithErrorAndDM(`Update of activity category name failed: ${guild.getName()}`, message, error);
    }
};
exports.run = run;
