
// Load our classes
const Activity = require('../../modules/event/Activity');

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
    response += ':';
    
    for (let x = 0; x < activities.length; x++) {
        const activity = activities[x];
        response += `\n   ${x+1}. ${activity.activity_name} [${activity.activity_abbr}]`;
    }
    
    message.channel.send(response);
};
exports.run = run;
