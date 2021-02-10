
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
    name: 'delete',
    category: 'Message Synchronization',
    description: 'Sync Channel administration command',
    usage: 'sync-command delete <group-name>'
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
    
    try {
        syncGroupManager.delete(syncGroup);
        message.channel.send(`Channel synchronization group '${syncGroup.name}' deleted`);
    } catch (error) {
        message.channel.send(`Error deleting synchronization group '${syncGroup.name}'`);
        throw `Error deleting synchronization group '${syncGroup.name}' - ${error}`;
    }
};
exports.run = run;
