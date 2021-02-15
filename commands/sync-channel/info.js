
// Load singletons
const client = require('../../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'User'
};
exports.conf = conf;

const help = {
    command: 'sync-channel',
    name: 'info',
    category: 'Message Synchronization',
    description: 'Show the details about a synchronized channel',
    usage: 'sync-command info [<channel>]'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    message.channel.send(`${help.command} ${help.name} not yet implemented`);
};
exports.run = run;
