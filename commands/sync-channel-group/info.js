
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/alliance/Alliance`);
const SyncChannelGroup = require(`${ROOT}/modules/sync/SyncChannelGroup`);
const SyncChannel      = require(`${ROOT}/modules/sync/SyncChannel`);

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
    usage: 'sync-channel-group info <group-name>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to be part of channel synchronization group`);
        return;
    }
    
    const name = args[0];
    const syncChannelGroup = await SyncChannelGroup.get({name: name, allianceId: alliance.id, unique: true});
    
    if (syncChannelGroup == null) {
        message.channel.send(`Could not find channel synchronization group in this alliance: ${name}`);
        return;
    }
    
    const syncChannels = await SyncChannel.get({'channelGroupId': syncChannelGroup.id});
    let responseContent = `Channel synchronization group '${syncChannelGroup.name}' found with ${syncChannels.length} channel`;
    
    if (syncChannels.length != 1) {
        responseContent += 's';
    }

    if (syncChannels.length > 0) {
        responseContent += '\n';
    }
    
    for (let x = 0; x < syncChannels.length; x++) {
        const syncChannel = syncChannels[x];
        const channel = await syncChannel.getDiscordChannel();
        responseContent += `\n    <#${channel.id}> (${channel.guild.name})`;
    }
    message.channel.send(responseContent);
};
exports.run = run;
