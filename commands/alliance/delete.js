
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance = require(`${ROOT}/modules/data/Alliance`);
const Guild    = require(`${ROOT}/modules/data/Guild`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['del'],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'alliance',
    name: 'delete',
    category: 'Alliance Administration',
    description: 'Command for deleting an alliance',
    usage: 'alliance delete <name|alias>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const value = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
    
    const alliances = await Alliance.get({nameOrShortName: true, name: value, shortName: value});
    if (alliances.length == 0) {
        message.channel.send(`Cannot find an alliance with that name or alias`);
        return;
    }
    const alliance = alliances[0];
    
    // Check if there are any guilds in the alliance
    const guilds = await Guild.get({allianceId: alliance.id});
    if (guilds.length > 0) {
        message.channel.send(`Cowardly refusing to delete alliance while there are still clan discords in it`);
        return;
    }
    
    try {
        await alliance.delete();
        message.channel.send(`Alliance deleted`);
    
    } catch (error) {
        const label = `${alliance.name} [${alliance.shortName}]`;
        client.replyWithErrorAndDM(`Deletion of alliance failed: ${label}`, message, error);
    }
};
exports.run = run;
