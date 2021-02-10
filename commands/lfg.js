
const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: "User"
};
exports.conf = conf;

const help = {
    name: 'lfg',
    category: 'Activity Coordination',
    description: 'Looking for group command',
    usage: 'lfg <add-stuff-here>'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
