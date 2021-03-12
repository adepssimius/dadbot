
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['cg'],
    permLevel: 'viewer'
};
exports.conf = conf;

const help = {
    name: 'channel-group',
    category: 'Channel Group Administration',
    description: 'Channel group administration command',
    usage: 'channel-group <action> [<args>]',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName)) return;
    
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, commandName, actionName, args);
};
exports.run = run;
