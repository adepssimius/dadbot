
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);

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
    command: 'activity-category',
    name: 'set-name',
    category: 'Activity Category Administration',
    description: 'Change the name of an activity category',
    usage: 'activity-category set-name <symbol> <name>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length < 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const symbol  = args.shift();
    const newName = args.join(' ');
    
    let activityCategories = await ActivityCategory.get({symbol: symbol});
    if (activityCategories.length == 0) {
        message.channel.send(`Could not find activity category: '${symbol}'`);
        return;
    }
    
    const activityCategory = activityCategories[0];
    activityCategory.categoryName = newName;
    
    try {
        await activityCategory.update();
        message.channel.send(`Activity category name updated`);
    
    } catch (error) {
        const label = `${activityCategory.categoryName} [${activityCategory.symbol}]`;
        client.replyWithErrorAndDM(`Update of activity category name failed: ${label}`, message, error);
    }
};
exports.run = run;
