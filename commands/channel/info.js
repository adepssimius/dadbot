
// Determine our place in the world
const ROOT = '../..';

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
    command: 'sync-channel',
    name: 'info',
    category: 'Message Synchronization',
    description: 'Show the details about a synchronized channel',
    usage: 'sync-channel info [<channel>]',
    minArgs: null,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    message.channel.send(`${client.config.prefix}${commandName} ${actionName} not yet implemented`);
};
exports.run = run;
