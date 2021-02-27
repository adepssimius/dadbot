
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity = require(`${ROOT}/modules/event/Activity`);

// Load external classes
const Discord = require('discord.js');

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
    let activities = await Activity.getByNameOrAlias({activity_name: value, alias: value});
    
    if (activities.length == 0) {
        message.channel.send(`Could not find activity: '${value}'`);
        return;
    }
    
    const activity = activities[0];
    const activityCategory = await activity.getActivityCategory();
    const activityAliases = await activity.getActivityAliases();
    
    //
    // TODO - Make this prettier
    //
    
    const aliases = [];
    for (let x = 0; x < activityAliases.length; x++) {
        aliases.push(activityAliases[x].alias);
    }
    const aliasList = ( activityAliases.length > 0 ? aliases.join(', ') : 'No aliases for this activity' );
    
    const embed = new Discord.MessageEmbed()
        .setTitle('Activity')
        .addFields(
            { name: 'Activity Name', value: activity.activityName },
            { name: 'Activity Alias', value: aliasList },
            { name: 'Activity Category', value: `${activityCategory.category_name} [${activityCategory.symbol}]` },
            { name: 'Maximum Fireteam Size', value: activity.fireteamSize },
            { name: 'Estimated Maximum Duration', value: `${activity.estMaxDuration} minutes` }
        );
    message.channel.send(embed);
};
exports.run = run;
