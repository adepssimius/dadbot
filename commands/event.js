
// Load singletons
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['lfg'],
    permLevel: "User"
};
exports.conf = conf;

const help = {
    name: 'event',
    category: 'Event Coordination',
    description: 'Event coordination (lfg) command',
    usage: 'event|lfg <action> <args>'
};
exports.help = help;

const run = async (message, args, level) => {
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
