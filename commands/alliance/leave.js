
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance       = require(`${ROOT}/modules/data/Alliance`);
const Guild          = require(`${ROOT}/modules/data/Guild`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'clan-admin'
};
exports.conf = conf;

const help = {
    command: 'alliance',
    name: 'leave',
    category: 'Alliance Administration',
    description: 'Separate this clan discord from an alliance',
    usage: 'alliance leave',
    minArgs: null,
    maxArgs: 0
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const guilds = await Guild.get({id: message.guild.id});
    if (guilds.length > 0 && guilds[0].allianceId == null) {
        message.channel.send(`This clan discord is not part of an alliance`);
        return;
    }
    const guild = guilds[0];
    
    const alliance = await Alliance.get({id: guild.allianceId, unique: true});
    if (!alliance) {
        message.channel.send(`Cannot find the alliance for this clan discord: alliance id = ${guild.allianceId}`);
        return;
    }
    
    //
    // Todo - Leaving an alliance currently leaves stuff in place
    //        This includes sync channels and will also include LFG
    //        This needs to be considered and dealt with
    //
    
    try {
        guild.allianceId = null;
        await guild.update();
        message.channel.send(`Left clan alliance: ${alliance.title}`);
    
    } catch (error) {
        client.replyWithErrorAndDM(`Leaving of alliance failed: guild id = ${message.guild.id} : alliance = ${alliance.title}`, message, error);
    }
};
exports.run = run;
