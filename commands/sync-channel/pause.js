
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
    name: 'pause',
    category: 'Message Synchronization',
    description: 'Pause synchronization for this channel',
    usage: 'sync-command pause [<channel>]'
};
exports.help = help;

const run = async (message, args, level) => {
    message.channel.send(`${help.command} ${help.name} not yet implemented`);
};
exports.run = run;
