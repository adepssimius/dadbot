
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity       = require(`${ROOT}/modules/data/Activity`);
const ActivityAlias  = require(`${ROOT}/modules/data/ActivityAlias`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

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
    name: 'create-alias',
    category: 'Activity Administration',
    description: 'Create an alias for an activity',
    usage: 'activity create-alias <name|existing-alias> <new-alias>',
    minArgs: 2,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const alias = args.pop();
    const activitySearchString = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    
    // Find the given activity
    let activity = await Activity.get({
        nameOrAliasOrShortName: true,
        name: activitySearchString,
        alias: activitySearchString,
        shortName: activitySearchString,
        unique: true
    });
    
    if (!activity) {
        message.channel.send(`Could not find activity: ${activitySearchString}`);
        return;
    }
    
    // Check if this alias already exists
    let activityAlias = await ActivityAlias.get({alias: alias, unique: true});
    
    if (activityAlias) {
        message.channel.send(`There is already an activity with that alias`);
        return;
    }
    
    // Create the activity alias
    activityAlias = new ActivityAlias({
        alias: alias,
        activityId: activity.id,
        creatorId: message.author.id
    });
    
    // Attempt to create the alias
    try {
        await activityAlias.create();
        message.channel.send(`Activity alias created: ${activity.name} [${activityAlias.alias}]`);
        
        client.logger.debug('Activity Alias:');
        client.logger.dump(activityAlias);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            client.replyWithErrorAndDM(`Creation of activity alias failed: ${activity.name} [${activityAlias.alias}]`, message, error);
        }
    }
};
exports.run = run;
