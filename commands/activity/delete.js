
// Load our classes
const Activity = require('../../modules/event/Activity');

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
    const activities = await Activity.getByNameOrAbbr({activity_name: value, activity_abbr: value});
    
    if (activities.length == 0) {
        message.channel.send(`Cannot find activity with that name or abbreviation`);
        return;
    }
    
    const activity = activities[0];
    try {
        await activity.delete();
        message.channel.send(`Activity category deleted`);
    
    } catch (error) {
        const label = `${activity.activity_name} [${activity.activity_abbr}]`;
        client.replyWithErrorAndDM(`Deletion of activity category failed: ${label}`, message, error);
    }
};
exports.run = run;
