
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Guild = require(`${ROOT}/modules/alliance/Guild`);

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
    description: 'Show the details about a clan',
    usage: 'clan info [<name|alias>]'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    //if (args.length == 0) {
    //    message.reply(`Usage: ${client.config.prefix}${help.usage}`);
    //    return;
    //}
    
    let guild;
    
    if (args.length == 0) {
        const guilds = await Guild.get({guildId: message.guild.id});
        
        if (guilds.length == 0) {
            message.channel.send(`This discord clan is not currently part of an alliance`);
            return;
        }
        
        guild = guilds[0];
    
    } else {
        const value = args.join(' ').replace(/^"(.+)"$/g, '$1').replace(/^'(.+)'$/g, '$1');
        let guilds = await Guild.getByNameOrAlias({guild_id: message.guild.id, clan_name: value, clan_alias: value});
        
        if (guilds.length == 0) {
            message.channel.send(`Cannot find a discord clan in this alliance by that name or alias: ${value}`);
            return;
        }
        
        guild = guilds[0];
    
    }
    
    const embed = new Discord.MessageEmbed()
        .setTitle('Clan')
        .addFields(
            { name: 'Clan Name',  value: ( guild.clan_name  != null ? guild.clan_name  : 'Not Set' )},
            { name: 'Clan Alias', value: ( guild.clan_alias != null ? guild.clan_alias : 'Not Set' )},
            { name: 'Clan ID',    value: ( guild.clan_id    != null ? guild.clan_id    : 'Not Set' )},
            { name: 'Timezone',   value: ( guild.timezone   != null ? guild.timezone   : 'Not Set' )}
        );
    message.channel.send(embed);
};
exports.run = run;
