
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity = require(`${ROOT}/modules/event/Activity`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['del'],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'activity',
    name: 'delete',
    category: 'Activity Administration',
    description: 'Activity administration command',
    usage: 'activity delete <activity-abbreviation>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args[0];
    let activity = await Activity.get({
        nameOrAlias: true,
        name: value,
        alias: value
    }, true);
    
    if (!activity) {
        message.channel.send(`Could not find activity: '${value}'`);
        return;
    }
    
    try {
        await activity.delete();
        message.channel.send(`Activity deleted: ${activity.title}`);
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of activity failed: ${activity.title}`, message, error);
    }
};
exports.run = run;
