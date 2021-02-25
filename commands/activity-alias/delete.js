
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);

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
    category: 'Activity Alias Administration',
    description: 'Activity alias administration command',
    usage: 'activity-alias delete <alias>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const alias = args[0];
    const activityAliases = await ActivityAlias.get({alias: alias});
    
    if (activityAliases.length == 0) {
        message.channel.send(`Cannot find that activity alias`);
        return;
    }
    
    const activityAlias = activityAliases[0];
    try {
        await activityAlias.delete();
        message.channel.send(`Activity alias deleted`);
    
    } catch (error) {
        const label = `${activityAlias.category_name} [${activityAlias.symbol}]`;
        client.replyWithErrorAndDM(`Deletion of activity alias failed: ${label}`, message, error);
    }
};
exports.run = run;
