
// Include required classes
const SyncGroup = require('./../lib/SyncGroup');

// Include singletons
const syncGroupManager = require('./../lib/SyncGroupManager');

module.exports = {
    name: 'sync-group',
    description: 'Sync Group administration command',
    guildOnly: true,
    
    execute(message, args) {
        const subCommand = args.shift().toLowerCase();
        
        switch (subCommand) {
            case 'info'   : cmd_syncGroup_info   (message, args, subCommand); break;
            case 'create' : cmd_syncGroup_create (message, args, subCommand); break;
            case 'delete' : cmd_syncGroup_delete (message, args, subCommand); break;
            case 'list'   : cmd_syncGroup_list   (message, args, subCommand); break;
            default : message.channel.send(this.name + ' sub-command not recognized: ' + subCommand);
        }
    }
};

function cmd_syncGroup_info(message, args, subCommand) {
    let syncGroup = syncGroupManager.lookup(args[0]);
    
    if (syncGroup == null) {
        message.channel.send('Could not find sync group named: ' + args[0]);
    
    } else {
        message.channel.send("Sync group '" + syncGroup.name + "' found with " + syncGroup.syncChannels.size + ' channel(s)');
    
    }
}

function cmd_syncGroup_create(message, args, subCommand) {
    let syncGroup = syncGroupManager.lookup(args[0]);
    
    if (syncGroup == null) {
        let syncGroup = new SyncGroup(args[0]);
        syncGroupManager.add(syncGroup);
        message.channel.send('Created sync group: ' + args[0]);
        
        console.log('Sync Group:');
        console.log(syncGroup);
        console.log();
    
    } else {
        message.channel.send('Sync group already exists: ' + args[0]);
    
    }
}

function cmd_syncGroup_delete(message, args, subCommand) {
    message.channel.send(this.name + ' ' + subCommand + ' not yet implemented');
}

function cmd_syncGroup_list(message, args, subCommand) {
    message.channel.send(this.name + ' ' + subCommand + ' not yet implemented');
}
