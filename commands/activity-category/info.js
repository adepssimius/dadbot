
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);

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
    command: 'activity-category',
    name: 'info',
    category: 'Activity Category Administration',
    description: 'Show the details about an activity category',
    usage: 'activity-category info <name|symbol>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    
    let activityCategory = await ActivityCategory.get({
        nameOrSymbol: true,
        name: value,
        symbol: value
    }, true);
    
    if (!activityCategory) {
        message.channel.send(`Could not find activity category: '${value}'`);
        return;
    }
    
    //message.channel.send(`Activity category found: ${activityCategory.name} [${activityCategory.symbol}]`);
    
    const embed = new Discord.MessageEmbed()
        .setTitle('Activity Category')
        .addFields(
            { name: 'Name', value: activityCategory.name },
            { name: 'Symbol', value: activityCategory.symbol }
        );
    message.channel.send(embed);
};
exports.run = run;
