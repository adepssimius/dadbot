
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
    permLevel: null
};
exports.conf = conf;

const help = {
    command: 'activity-category',
    name: 'list',
    category: 'Activity Category Administration',
    description: 'List all activity categories',
    usage: 'activity-category list'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
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
