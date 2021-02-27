
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityAlias  = require(`${ROOT}/modules/event/ActivityAlias`);

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
    usage: 'activity delete-alias <alias>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const alias = args[0];
    
    // Get the activity alias
    let activityAliases = await ActivityAlias.get({alias: alias});
    
    if (activityAliases.length == 0) {
        message.channel.send(`Could not find that alias for an activity: '${alias}'`);
        return;
    }
    const activityAlias = activityAliases[0];
    
    // Attempt to delete the alias
    try {
        await activityAlias.delete();
        message.channel.send(`Activity alias deleted`);
    
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of activity alias failed: ${activityAlias.alias}`, message, error);
    }
};
exports.run = run;
