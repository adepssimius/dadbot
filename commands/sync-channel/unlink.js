
// Load singletons
const syncGroupManager = require('../../modules/sync/SyncGroupManager');

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

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const syncGroup = syncGroupManager.lookup(message.channel);
    
    if (syncGroup == null) {
        message.channel.send('Channel is not linked to a sync group');
        return;
    }
    
    syncGroupManager.deleteChannelFromGroup(message.channel, syncGroup);
    message.channel.send(`Channel unlinked from synchronization group '${syncGroup.name}'`);
};
exports.run = run;
