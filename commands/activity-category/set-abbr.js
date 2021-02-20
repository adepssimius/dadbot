
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
    name: 'set-abbr',
    category: 'Activity Category Administration',
    description: 'Change the abbreviation of an activity category',
    usage: 'activity-category set-abbr <abbreviation> <new-abbreviation>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const oldAbbr = args[0];
    const newAbbr = args[1];
    
    let activityCategories = await ActivityCategory.get({category_abbr: oldAbbr});
    if (activityCategories.length == 0) {
        message.channel.send(`Could not find activity category: '${oldAbbr}'`);
        return;
    }
    
    const activityCategory = activityCategories[0];
    activityCategory.category_abbr = newAbbr;
    
    try {
        await activityCategory.update();
        message.channel.send(`Activity category abbreviation updated`);
    
    } catch (error) {
        const label = `${activityCategory.category_name} [${activityCategory.category_abbr}]`;
        client.replyWithErrorAndDM(`Update of activity category abbreviation failed: ${label}`, message, error);
    }
};
exports.run = run;
