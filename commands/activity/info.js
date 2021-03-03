
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
    usage: 'activity info <name|alias>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args.join(' ');
    let activity = await Activity.get({
        nameOrAlias: true,
        name: value,
        alias: value
    }, true);
    
    if (!activity) {
        message.channel.send(`Could not find activity: ${value}`);
        return;
    }
    
    message.channel.send(await activity.toMessageContent());
};
exports.run = run;
