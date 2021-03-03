
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
    
    let activityCategory = await ActivityCategory.get({symbol: symbol, unique: true});
    if (!activityCategory) {
        message.channel.send(`Could not find activity category: '${symbol}'`);
        return;
    }
    
    activityCategory.name = newName;
    
    try {
        await activityCategory.update();
        message.channel.send(`Activity category name updated: ${activityCategory.title}`);
    } catch (error) {
        client.replyWithErrorAndDM(`Update of activity category name failed: ${activityCategory.title}`, message, error);
    }
};
exports.run = run;
