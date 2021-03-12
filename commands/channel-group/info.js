
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance     = require(`${ROOT}/modules/data/Alliance`);
const Channel      = require(`${ROOT}/modules/data/Channel`);
const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);

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
    command: 'channel-group',
    name: 'info',
    category: 'Channel Group Administration',
    description: 'Show the details about a channel group',
    usage: `channel-group info [<${ChannelGroup.getFieldValidValues('type').join('|')}>] <name>`,
    minArgs: null,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to be part of channel group`);
        return;
    }
    
    let type;
    let channelGroupNotFoundError;
    const channelGroupQuery = {
        allianceId: alliance.id,
        unique: true
    };
    
    if (args.length == 0) {
        const channelQuery = {id: message.channel.id, unique: true};
        const channel = await Channel.get(channelQuery);
        
        if (!channel) {
            message.channel.send(`This channel is not in a channel group`);
            return;
        }
        
        channelGroupQuery.id = channel.channelGroupId;
        channelGroupNotFoundError = `Did not find expected channel group: id = ${channel.channelGroupId}`;
        type = channel.type;
        
    } else {
        type = args.shift();
        
        if (!ChannelGroup.getFieldValidValues('type').includes(type)) {
            args.unshift(type);
            type = null;
        }
        
        if (args.length == 0) {
            message.reply(client.usage(help, commandName, actionName));
            return;
        }
        
        channelGroupQuery.name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
        
        if (type) {
            channelGroupQuery.type = type;
        }
        channelGroupNotFoundError = `Invalid ${type ? `${type} ` : ''}channel group: ${channelGroupQuery.name}`;
    }
    
    const channelGroup = await ChannelGroup.get(channelGroupQuery);
    if (channelGroup == null) {
        message.channel.send(channelGroupNotFoundError);
        return;
    }
    
    const channels = await Channel.get({'channelGroupId': channelGroup.id});
    let response = '';
    
    if (type) response = type.charAt(0).toUpperCase() + type.slice(1) + ' channel group ';
    else      response = 'Channel group ';

    response += `**${channelGroup.name}** found with ${channels.length} channel`;
    
    if (channels.length != 1) {
        response += 's';
    }
    
    const channelDetails = [];
    for (let x = 0; x < channels.length; x++) {
        const channel = channels[x];
        const discordChannel = await channel.getDiscordChannel();
        channelDetails.push(`<#${discordChannel.id}> (${discordChannel.guild.name})`);
    }
    
    if (channelDetails.length > 0) {
        response += `\n    ${channelDetails.join('\n    ')}`;
    }
    
    message.channel.send(response);
};
exports.run = run;
