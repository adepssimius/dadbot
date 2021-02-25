
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
    name: 'join',
    category: 'Alliance Administration',
    description: 'Join this clan discord to an alliance',
    usage: 'alliance join <alliance-name|alias>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
    let alliances = await Alliance.getByNameOrAlias({alliance_name: value, alliance_alias: value});
    
    if (alliances.length == 0) {
        message.channel.send(`Cannot find alliance: '${value}'`);
        return;
    }
    const alliance = alliances[0];
    
    // See if this guild is already in an alliance
    const guilds = await Guild.get({guild_id: message.guild.id});
    
    if ( (guilds.length > 0) && (guilds[0].alliance_id != null) ) {
        message.channel.send('This discord is already part of an alliance');
        return;
    }
    
    try {
        const guild = await Guild.create({guild_id: message.guild.id, alliance_id: alliance.alliance_id});
        message.channel.send(`Joined clan alliance: ${alliance.getTitle()}`);
        
        client.logger.debug('Guild:');
        client.logger.dump(guild);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            client.replyWithErrorAndDM(`Joining of alliance failed: guild_id = ${message.guild.guild_id} : alliance = ${alliance.getTitle()}`, message, error);
        }
    }
};
exports.run = run;
