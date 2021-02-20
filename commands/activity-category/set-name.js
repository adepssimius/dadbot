
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
    name: 'set-name',
    category: 'Activity Category Administration',
    description: 'Change the name of an activity category',
    usage: 'activity-category set-name <abbreviation> <name>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length < 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const abbr = args.shift();
    const name = args.join(' ');
    
    let activityCategories = await ActivityCategory.get({category_abbr: abbr});
    if (activityCategories.length == 0) {
        message.channel.send(`Could not find activity category: '${abbr}'`);
        return;
    }
    
    const activityCategory = activityCategories[0];
    activityCategory.category_name = name;
    
    try {
        activityCategory.update();
        message.channel.send(`Activity category name updated`);
    
    } catch (error) {
        const label = `${activityCategory.category_name} [${activityCategory.category_abbr}]`;
        client.replyWithErrorAndDM(`Update of activity category name failed: ${label}`, message, error);
    }
};
exports.run = run;
