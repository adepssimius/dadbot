
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity = require(`${ROOT}/modules/event/Activity`);

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
    name: 'list',
    category: 'Activity Administration',
    description: 'List all activities',
    usage: 'activity list'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const activities = await Activity.get();
    
    let response = `Found ${activities.length} activity `;
    if (activities.length == 0 || activities.length > 1) {
        response += 'activities';
    } else {
        response += 'activity';
    }
    
    const names = [];
    for (let x = 0; x < activities.length; x++) {
        const activity = activities[x];
        const activityCategory = await activity.getActivityCategory();
        
        names.push(`${activity.activity_name} [${activityCategory.category_name}]`);
    }
    const nameList = ( names.length > 0 ? names.join('\n') : null );
    
    message.channel.send(response + (nameList != null ? '\n```' + nameList + '```' : ''));
};
exports.run = run;
