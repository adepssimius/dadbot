
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance       = require(`${ROOT}/modules/alliance/Alliance`);
const Guild          = require(`${ROOT}/modules/alliance/Guild`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

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
    command: 'alliance',
    name: 'leave',
    category: 'Alliance Administration',
    description: 'Separate this clan discord from an alliance',
    usage: 'alliance leave'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length > 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const guilds = await Guild.get({guild_id: message.guild.id});
    if (guilds.length == 0) {
        message.channel.send(`This clan discord is not part of an alliance`);
        return;
    }
    const guild = guilds[0];
    
    let alliances = await Alliance.get({alliance_id: guild.alliance_id});
    if (alliances.length == 0) {
        message.channel.send(`**ERROR:** Cannot find the alliance for this clan discord: alliance_id = '${guild.alliance_id}'`);
        return;
    }
    const alliance = alliances[0];
    
    try {
        await guild.delete();
        message.channel.send(`Left clan alliance: ${alliance.getTitle()}`);
    
    } catch (error) {
        client.replyWithErrorAndDM(`Leaving of alliance failed: guild_id = ${message.guild.guild_id} : alliance = ${alliance.getTitle()}`, message, error);
    }
};
exports.run = run;
