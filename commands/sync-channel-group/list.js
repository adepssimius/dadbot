
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/data/Alliance`);
const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);
const Channel      = require(`${ROOT}/modules/data/Channel`);

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
    command: 'sync-channel-group',
    name: 'list',
    category: 'Message Synchronization',
    description: 'List all channel synchronization groups',
    usage: 'sync-channel-group list',
    minArgs: null,
    maxArgs: 0
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to be part of any channel synchronization groups`);
        return;
    }
    
    // Get the channel synchronization groups for this alliance
    const channelGroups = await ChannelGroup.get({allianceId: alliance.id});
    
    let response = `Found ${channelGroups.length} channel synchronization group`;
    if (channelGroups.length != 1) {
        response += 's';
    }
    
    const channelGroupNames = [];
    for (let x = 0; x < channelGroups.length; x++) {
        const channelGroup = channelGroups[x];
        const channels = await Channel.get({'channelGroupId': channelGroup.id});
        channelGroupNames.push(`${channelGroup.name} (${channels.length} channel${channels.length != 1 ? 's' : ''})`);
    }
    
    if (channelGroups.length > 0) {
        response += '\n```' + channelGroupNames.join('\n') + '```';
    }
    
    message.channel.send(response);
};
exports.run = run;
