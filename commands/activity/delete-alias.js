
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity      = require(`${ROOT}/modules/data/Activity`);
const ActivityAlias = require(`${ROOT}/modules/data/ActivityAlias`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: null
};
exports.conf = conf;

const help = {
    command: 'activity',
    name: 'delete-alias',
    category: 'Activity Administration',
    description: 'Delete an alias for an activity',
    usage: 'activity delete-alias <alias>',
    minArgs: 1,
    maxArgs: 1
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const alias = args[0];
    
    // Get the activity alias
    let activityAlias = await ActivityAlias.get({alias: alias, unique: true});
    
    if (!activityAlias) {
        message.channel.send(`Could not find that alias for an activity: '${alias}'`);
        return;
    }
    
    // Get the activity
    const activity = await Activity.get({alias: alias, unique: true});
    
    // Attempt to delete the alias
    try {
        await activityAlias.delete();
        message.channel.send(`Activity alias deleted: ${activity.name} [${activityAlias.alias}]`);
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of activity alias failed: ${activity.name} [${activityAlias.alias}]`, message, error);
    }
};
exports.run = run;
