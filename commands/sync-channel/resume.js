
// Determine our place in the world
const ROOT = '../..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'sync-channel',
    name: 'resume',
    category: 'Message Synchronization',
    description: 'Resume synchronization for a channel',
    usage: 'sync-command resume [<channel>]'
};
exports.help = help;

const run = async (message, args, level) => {
    message.channel.send(`${help.command} ${help.name} not yet implemented`);
};
exports.run = run;
