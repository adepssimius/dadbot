
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
    usage: 'activity-category delete <name|symbol>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const value = args.join(' ').replace(/^"(.+)"$/g, '$1').replace(/^'(.+)'$/g, '$1');
    let activityCategory = await ActivityCategory.get({
        nameOrSymbol: true,
        name: value,
        symbol: value
    }, true);
    
    if (!activityCategory) {
        message.channel.send(`Could not find activity category: '${value}'`);
        return;
    }
    
    const activities = await Activity.get({activityCategoryId: activityCategory.id});
    
    if (activities.length > 0) {
        const activityNames = [];
        for (let x = 0; x < activities.length; x++) {
            const activity = activities[x];
            activityNames.push(activity.name);
        }
        const activityNameList = activityNames.join('\n');
        
        message.channel.send('Cowardly refusing to delete category while activities still exist\n' + '```' + activityNameList + '```');
        return;
    }
    
    try {
        await activityCategory.delete();
        message.channel.send(`Activity category deleted: ${activityCategory.title}`);
    
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of activity category failed: ${activityCategory.title}`, message, error);
    }
};
exports.run = run;
