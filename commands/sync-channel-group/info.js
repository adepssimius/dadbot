
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
    name: 'info',
    category: 'Message Synchronization',
    description: 'Show the details about a channel synchronization group',
    usage: 'sync-channel-group info <name>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to be part of channel synchronization group`);
        return;
    }
    
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    const channelGroup = await ChannelGroup.get({name: name, allianceId: alliance.id, unique: true});
    
    if (channelGroup == null) {
        message.channel.send(`Could not find channel synchronization group in this alliance: ${name}`);
        return;
    }
    
    const channels = await Channel.get({'channelGroupId': channelGroup.id});
    let responseContent = `Channel synchronization group '${channelGroup.name}' found with ${channels.length} channel`;
    
    if (channels.length != 1) {
        responseContent += 's';
    }

    if (channels.length > 0) {
        responseContent += '\n';
    }
    
    for (let x = 0; x < channels.length; x++) {
        const channel = channels[x];
        const discordChannel = await channel.getDiscordChannel();
        responseContent += `\n    <#${discordChannel.id}> (${discordChannel.guild.name})`;
    }
    message.channel.send(responseContent);
};
exports.run = run;
