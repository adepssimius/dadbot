
// Load singletons
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['sc'],
    permLevel: 'User'
};
exports.conf = conf;

const help = {
    name: 'sync-channel',
    category: 'Message Syncronization',
    description: 'Synchronization channel administration command',
    usage: 'sync-command <action> <args>'
};
exports.help = help;

const run = async (message, args, level) => {
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
