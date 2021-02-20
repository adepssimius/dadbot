
// Load our classes
const ActivityCategory = require('../../modules/event/ActivityCategory');

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
    command: 'activity-category',
    name: 'delete',
    category: 'Activity Category Administration',
    description: 'Activity Category administration command',
    usage: 'activity-category delete <category-abbreviation>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args[0];
    const activityCategories = await ActivityCategory.getByNameOrAbbr({category_name: value, category_abbr: value});
    
    if (activityCategories.length == 0) {
        message.channel.send(`Cannot find activity category with that name or abbreviation`);
        return;
    }
    
    const activityCategory = activityCategories[0];
    try {
        await activityCategory.delete();
        message.channel.send(`Activity category deleted`);
    
    } catch (error) {
        const label = `${activityCategory.category_name} [${activityCategory.category_abbr}]`;
        client.replyWithErrorAndDM(`Deletion of activity category failed: ${label}`, message, error);
    }
};
exports.run = run;
