
// Load our classes
const SyncGroup = require('../../modules/sync/SyncGroup');

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
    name: 'create',
    category: 'Message Synchronization',
    description: 'Create a new channel synchronization group',
    usage: 'sync-command create <group-name>'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const syncGroupName = args[0];
    let syncGroup = syncGroupManager.lookup(syncGroupName);
    
    if (syncGroup != null) {
        message.channel.send(`There is already a channel synchronization group called '${syncGroupName}'`);
        return;
    }
    
    syncGroup = new SyncGroup(syncGroupName);
    syncGroupManager.add(syncGroup);
    message.channel.send('Created sync group: ' + syncGroupName);
    
    console.log('Sync Group:');
    console.log(syncGroup);
    console.log();
};
exports.run = run;
