
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity         = require(`${ROOT}/modules/event/Activity`);
const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);

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
    command: 'activity-category',
    name: 'delete',
    category: 'Activity Category Administration',
    description: 'Command for deleting activity categories',
    usage: 'activity-category delete <category-name|symbol>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
    const activityCategories = await ActivityCategory.getByNameOrSymbol({
        categoryName: value,
        symbol: value
    });
    
    if (activityCategories.length == 0) {
        message.channel.send(`Cannot find activity category with that name or symbol`);
        return;
    }
    
    const activityCategory = activityCategories[0];
    const activities = await Activity.get({category_id: activityCategory.categoryId});
    
    if (activities.length > 0) {
        const activityNames = [];
        for (let x = 0; x < activities.length; x++) {
            const activity = activities[x];
            activityNames.push(activity.activityName);
        }
        const activityNameList = activityNames.join('\n');
        
        message.channel.send('Cowardly refusing to delete category while activities still exist\n' + '```' + activityNameList + '```');
        return;
    }
    
    try {
        await activityCategory.delete();
        message.channel.send(`Activity category deleted`);
    
    } catch (error) {
        const label = `${activityCategory.categoryName} [${activityCategory.symbol}]`;
        client.replyWithErrorAndDM(`Deletion of activity category failed: ${label}`, message, error);
    }
};
exports.run = run;
