
// Load singletons
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['sg'],
    permLevel: 'User'
};
exports.conf = conf;

const help = {
    name: 'sync-group',
    category: 'Message Syncronization',
    description: 'Synchronization group administration command',
    usage: 'sync-group <action> <args>'
};
exports.help = help;

const run = async (message, args, level) => {
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
