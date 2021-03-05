
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
    name: 'set-symbol',
    category: 'Activity Category Administration',
    description: 'Change the symbol of an activity category',
    usage: 'activity-category set-symbol <symbol> <new-symbol>',
    minArgs: 2,
    maxArgs: 2
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const oldSymbol = args[0];
    const newSymbol = args[1];
    
    let activityCategory = await ActivityCategory.get({symbol: oldSymbol, unique: true});
    if (!activityCategory) {
        message.channel.send(`Could not find activity category: '${oldSymbol}'`);
        return;
    }
    
    activityCategory.symbol = newSymbol;
    
    try {
        await activityCategory.update();
        message.channel.send(`Activity category symbol updated: ${activityCategory.title}`);
    } catch (error) {
        client.replyWithErrorAndDM(`Update of activity category symbol failed: ${activityCategory.title}`, message, error);
    }
};
exports.run = run;
