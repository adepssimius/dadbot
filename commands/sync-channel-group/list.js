
// Determine our place in the world
const ROOT = '../..';

// Load our classes
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
    name: 'list',
    category: 'Message Synchronization',
    description: 'List all channel synchronization groups',
    usage: 'sync-channel-group list'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const syncChannelGroups = await SyncChannelGroup.get();
    
    let response = `Found ${syncChannelGroups.length} channel synchronization group`;
    if (syncChannelGroups.length != 1) {
        response += 's';
    }
    
    const syncChannelGroupNames = [];
    for (let x = 0; x < syncChannelGroups.length; x++) {
        const syncChannelGroup = syncChannelGroups[x];
        const syncChannels = await SyncChannel.get({'channelGroupId': syncChannelGroup.id});
        syncChannelGroupNames = `${syncChannelGroup.name} (${syncChannels.length} channel${syncChannels.length != 1 ? 's' : ''})`;
    }
    
    if (syncChannelGroups.length > 0) {
        response += '\n```' + syncChannelGroupNames.join('\n') + '```';
    }
    
    message.channel.send(response);
};
exports.run = run;
