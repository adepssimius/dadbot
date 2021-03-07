
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityCategory = require(`${ROOT}/modules/data/ActivityCategory`);

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
    command: 'activity-category',
    name: 'list',
    category: 'Activity Category Administration',
    description: 'List all activity categories',
    usage: 'activity-category list',
    minArgs: null,
    maxArgs: 0
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const activityCategories = await ActivityCategory.get();
    
    let response = `Found ${activityCategories.length} activity `;
    if (activityCategories.length == 0 || activityCategories.length > 1) {
        response += 'categories';
    } else {
        response += 'category';
    }
    
    if (activityCategories.length > 0) {
        const categoryListElements = [];
        
        for (let x = 0; x < activityCategories.length; x++) {
            const activityCategory = activityCategories[x];
            categoryListElements.push(`[${activityCategory.symbol}] ${activityCategory.name}`);
        }
        
        response += '```' + categoryListElements.join('\n') + '```';
    }
    
    message.channel.send(response);
};
exports.run = run;
