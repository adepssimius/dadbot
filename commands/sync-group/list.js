
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
    name: 'list',
    category: 'Message Synchronization',
    description: 'List all synchronization groups',
    usage: 'sync-command list'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    let response = `Found ${syncGroupManager.syncGroups.size} message group`;
    
    if (syncGroupManager.syncGroups.size == 0 || syncGroupManager.syncGroups.size > 1) {
        response += 's';
    }
    
    let index = 1;
    for (let syncGroup of syncGroupManager.syncGroups.values()) {
        response += `\n   ${index}. ${syncGroup.name} (${syncGroup.syncChannels.size} channel`;
        
        if (syncGroup.syncChannels.size == 0 || syncGroup.syncChannels.size > 1) {
            response += 's';
        }
        response += ')';
        
        index++;
    }
    
    message.channel.send(response);
};
exports.run = run;
