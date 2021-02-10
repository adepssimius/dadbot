
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

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    message.channel.send(`${help.command} ${help.name} not yet implemented`);
};
exports.run = run;
