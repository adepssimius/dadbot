
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['all'],
    permLevel: null,
    purge: { onFail: 10 }
};
exports.conf = conf;

const help = {
    name: 'alliance',
    category: 'Alliance Administration',
    description: 'Alliance administration command',
    usage: 'alliance <action> [<args>]',
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
