
// Load our classes
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
    command: 'activity-category',
    name: 'info',
    category: 'Activity Category Administration',
    description: 'Show the details about an activity category',
    usage: 'activity-category info <name|abbreviation>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args[0];
    let activityCategories = await ActivityCategory.getByNameOrAbbr({category_name: value, category_abbr: value});
    
    if (activityCategories.length == 0) {
        message.channel.send(`Could not find activity category: '${value}'`);
        return;
    }
    
    const activityCategory = activityCategories[0];
    //message.channel.send(`Activity category found: ${activityCategory.category_name} [${activityCategory.category_abbr}]`);
    
    const embed = new Discord.MessageEmbed()
        .setTitle('Activity Category')
        .addFields(
            { name: 'Category Name', value: activityCategory.category_name },
            { name: 'Category Abbreviation', value: activityCategory.category_abbr }
        );
    message.channel.send(embed);
};
exports.run = run;
