
// Load our classes
const ActivityCategory = require('../../modules/event/ActivityCategory');

// Load singletons
const client = require('../../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'User'
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
    response += ':';
    
    for (let x = 0; x < activityCategories.length; x++) {
        const activityCategory = activityCategories[x];
        response += `\n   ${x+1}. ${activityCategory.category_name} [${activityCategory.category_abbr}]`;
    }
    
    message.channel.send(response);
};
exports.run = run;
