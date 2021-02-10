
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
    description: 'Sync Group administration command',
    usage: 'sync-group <add-stuff-here>'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
