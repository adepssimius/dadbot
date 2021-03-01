
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
    
    const guilds = await Guild.get({id: message.guild.id});
    if (guilds.length > 0 && guilds[0].allianceId == null) {
        message.channel.send(`This clan discord is not part of an alliance`);
        return;
    }
    const guild = guilds[0];
    
    const alliances = await Alliance.get({id: guild.allianceId});
    if (alliances.length == 0) {
        message.channel.send(`Cannot find the alliance for this clan discord: alliance id = '${guild.allianceId}'`);
        return;
    }
    const alliance = alliances[0];
    
    try {
        guild.allianceId = null;
        await guild.update();
        message.channel.send(`Left clan alliance: ${alliance.getTitle()}`);
    
    } catch (error) {
        client.replyWithErrorAndDM(`Leaving of alliance failed: guild id = ${message.guild.id} : alliance = ${alliance.getTitle()}`, message, error);
    }
};
exports.run = run;
