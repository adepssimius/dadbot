
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
    name: 'link',
    category: 'Message Syncronization',
    description: 'Link this channel to a synchronization group',
    usage: 'sync-command link <sync-group> [<channel>]'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const syncGroupName = args[0];
    const syncGroup = syncGroupManager.lookup(syncGroupName);
    
    if (syncGroup == null) {
        message.channel.send(`Could not find a synchronization group named '${syncGroupName}'`);
        return;
    }
    
    const syncChannel = syncGroupManager.addChannelToGroup(message.channel, syncGroup);
    // TODO - replace this with a check inside of addChannel to see if we need to create the webhook
    syncChannel.createWebhook();
    
    message.channel.send(`Channel linked to synchronization group '${syncGroup.name}'`);
    
    console.log('Sync Channel:');
    console.log(syncChannel);
    console.log();
};
exports.run = run;
