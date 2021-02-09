
// Include required classes
const SyncGroup = require('./../lib/SyncGroup');

// Include singletons
const syncGroupManager = require('./../lib/SyncGroupManager');

module.exports = {
    name: 'sync-channel',
    description: 'Sync Channel administration command',
    guildOnly: true,
    
    execute(message, args) {
        const subCommand = args.shift().toLowerCase();
        
        switch (subCommand) {
            case 'info'   : cmd_syncChannel_info   (message, args, subCommand); break;
            case 'link'   : cmd_syncChannel_link   (message, args, subCommand); break;
            case 'unlink' : cmd_syncChannel_unlink (message, args, subCommand); break;
            case 'pause'  : cmd_syncChannel_pause  (message, args, subCommand); break;
            case 'resume' : cmd_syncChannel_resume (message, args, subCommand); break;
            default : message.channel.send(this.name + ' sub-command not recognized: ' + subCommand);
        }
    }
};

function cmd_syncChannel_info(message, args, subCommand) {
    message.channel.send(this.name + ' ' + subCommand + ' not yet implemented');
}

function cmd_syncChannel_link(message, args, subCommand) {
    let syncGroup = syncGroupManager.lookup(args[0]);
    
    if (syncGroup == null) {
        message.channel.send('Could not find sync group named: ' + args[0]);
        return;
    }
    
    let syncChannel = syncGroup.addChannel(message.channel);
    syncChannel.createWebhook();
    
    message.channel.send("Channel linked to sync group '" + syncGroup.name + "'");
    
    console.log('Sync Channel:');
    console.log(syncChannel);
    console.log();
}

function cmd_syncChannel_unlink(message, args, subCommand) {
    let syncGroup = syncGroupManager.lookup(message.channel);
    
    if (syncGroup == null) {
        message.channel.send('Channel is not linked to a sync group');
        return;
    }
    
    let syncChannel = syncGroup.lookup(message.channel);
    syncChannel.deleteWebhook();
    syncGroup.deleteChannel(message.channel);
    
    message.channel.send("Channel linked from sync group '" + syncGroup.name + "'");
}

function cmd_syncChannel_pause(message, args, subCommand) {
    message.channel.send(this.name + ' ' + subCommand + ' not yet implemented');
}

function cmd_syncChannel_resume(message, args, subCommand) {
    message.channel.send(this.name + ' ' + subCommand + ' not yet implemented');
}
