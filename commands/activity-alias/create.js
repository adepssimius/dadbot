
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity       = require(`${ROOT}/modules/event/Activity`);
const ActivityAlias  = require(`${ROOT}/modules/event/ActivityAlias`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'activity-alias',
    name: 'create',
    category: 'Activity Alias Administration',
    description: 'Create a new activity alias',
    usage: 'activity-alias create <new-alias> <activity-alias|name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length < 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const newAlias    = args.pop();
    const nameOrAlias = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
    
    // Try to find the given activity
    const activities = await Activity.getByNameOrAlias({activity_name: nameOrAlias, alias: nameOrAlias});
    
    if (activities.length == 0) {
        message.channel.send(`Could not find activity: ${nameOrAlias}`);
        return;
    } else if (activities.length > 1) {
        message.channel.send(`Unexpectedly found more then one activity: ${nameOrAlias}`);
        return;
    }
    
    const activity = activities[0];
    const data = {
        alias: newAlias,
        activity_id: activity.activity_id,
        creator_id: message.author.id
    };
    
    try {
        const activityAlias = await ActivityAlias.create(data);
        message.channel.send(`Activity alias created`);
        
        client.logger.debug('Activity Alias:');
        client.logger.dump(activityAlias);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            const label = `${data.category_name} [${data.symbol}]`;
            client.replyWithErrorAndDM(`Creation of activity category failed: ${label}`, message, error);
        }
    }
};
exports.run = run;
