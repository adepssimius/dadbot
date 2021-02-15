
// Load our classes
const SyncGroup   = require('../../modules/sync/SyncGroup');
const SyncChannel = require('../../modules/sync/SyncChannel');

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
    command: 'sync-channel',
    name: 'unlink',
    category: 'Message Synchronization',
    description: 'Unlink this channel from a synchronization group',
    usage: 'sync-command unlink [<channel>]'
};
exports.help = help;

const run = async (message, args, level) => {
    //
    // TODO - Enhance this function so that a channel reference can be given
    // instead of always linking to the channel from which the command was called
    //
    
    if (args.length != 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const syncChannels = await SyncChannel.get({channel_id: message.channel.id});
    
    if (syncChannels.length == 0) {
        message.channel.send(`This channel is not linked to a channel synchronization group`);
        return;
    }
    
    const syncChannel = syncChannels[0];
    const syncGroups  = await SyncGroup.get({sync_group_id: syncChannel.sync_group_id});
    const syncGroup   = syncGroups[0];
    
    try {
        await syncChannel.delete();
        message.channel.send(`Channel unlinked from synchronization group '${syncGroup.name}'`);
    } catch (error) {
        const details = `Error unlinking channel from synchronization group '${syncGroup.name}'`;
        message.channel.send(details);
        client.logger.error(details);
        client.logger.dump(error);
    }
};
exports.run = run;
