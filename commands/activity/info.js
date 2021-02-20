
// Load our classes
const Activity         = require('../../modules/event/Activity');
const ActivityCategory = require('../../modules/event/ActivityCategory');

// Load external classes
const Discord = require('discord.js');

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
    name: 'info',
    category: 'Activity Administration',
    description: 'Show the details about an activity',
    usage: 'activity info <name|abbreviation>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args.join(' ');
    let activities = await Activity.getByNameOrAbbr({activity_name: value, activity_abbr: value});
    
    if (activities.length == 0) {
        message.channel.send(`Could not find activity: '${value}'`);
        return;
    }
    
    const activity = activities[0];
    const activityCategory = await activity.getActivityCategory();
    
    //
    // TODO - Make this prettier
    //
    
    const embed = new Discord.MessageEmbed()
        .setTitle('Activity Category')
        .addFields(
            { name: 'Activity Name', value: activity.activity_name },
            { name: 'Activity Abbreviation', value: activity.activity_abbr },
            { name: 'Activity Category', value: `${activityCategory.category_name} [${activityCategory.category_abbr}]` },
            { name: 'Fireteam Size', value: activity.fireteam_size },
            { name: 'Estimated Duration', value: `${activity.estimated_mins} minutes` }
        );
    message.channel.send(embed);
};
exports.run = run;
