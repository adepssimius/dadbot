
// Load singletons
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['act'],
    permLevel: "User"
};
exports.conf = conf;

const help = {
    name: 'activity',
    category: 'Activity Administration',
    description: 'Activity administration command',
    usage: 'activity <action> <args>'
};
exports.help = help;

const run = async (message, args, level) => {
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
