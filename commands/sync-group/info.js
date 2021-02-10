
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
    command: 'sync-group',
    name: 'info',
    category: 'Message Synchronization',
    description: 'Show the details about a channel synchronization group',
    usage: 'sync-group info <group-name>'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const syncGroupName = args[0];
    const syncGroup = syncGroupManager.lookup(syncGroupName);
    
    if (syncGroup == null) {
        message.channel.send(`Could not find a channel synchronization group named '${syncGroupName}'`);
        return;
    }
    
    message.channel.send(`Channel synchronization group '${syncGroup.name} found with ${syncGroup.syncChannels.size} channel(s)`);
};
exports.run = run;
