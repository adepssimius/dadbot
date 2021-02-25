
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['acc','category','cat'],
    permLevel: 'viewer'
};
exports.conf = conf;

const help = {
    name: 'activity-category',
    category: 'Activity Category Administration',
    description: 'Activity category administration command',
    usage: 'activity-category <action> <args>'
};
exports.help = help;

const run = async (message, args, level) => {
    const actionName = args.shift().toLowerCase();
    client.runCommandAction(message, this, actionName, args, level);
};
exports.run = run;
