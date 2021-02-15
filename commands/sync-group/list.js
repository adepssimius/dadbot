
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
    command: 'sync-group',
    name: 'list',
    category: 'Message Synchronization',
    description: 'List all synchronization groups',
    usage: 'sync-group list'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const syncGroups = await SyncGroup.get();
    
    let response = `Found ${syncGroups.length} message group`;
    
    if (syncGroups.length == 0 || syncGroups.length > 1) {
        response += 's';
    }
    
    for (let x = 0; x < syncGroups.length; x++) {
        const syncGroup    = syncGroups[x];
        const syncChannels = await SyncChannel.get({'sync_group_id': syncGroup.sync_group_id});
        response += `\n   ${x+1}. ${syncGroup.name} (${syncChannels.length} channel${syncChannels.length != 1 ? 's' : ''})`;
    }
    
    message.channel.send(response);
};
exports.run = run;
