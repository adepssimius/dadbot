
// Load external modules
const TextChannel = require('discord.js').TextChannel;

// Load our classes
const SyncGroup = require('./SyncGroup');

class SyncGroupManager {
    constructor() {
        this.syncGroups = new Map();
        this.channelMap = new Map();
    }
    
    lookup(lookupValue) {
        let syncGroupName;
        
        if (typeof lookupValue == 'string') {
            syncGroupName = lookupValue;
            
        } else if (lookupValue instanceof TextChannel) {
            const channel = lookupValue;
            syncGroupName = this.channelMap.get(channel.id);
        }
        
        return this.syncGroups.get(syncGroupName);
    }
    
    add(syncGroup) {
        if ( !(syncGroup instanceof SyncGroup) ) {
            throw 'Invalid parameter type - syncGroup must be a SyncGroup object';
        }
        
        if (this.syncGroups.has(syncGroup.name)) {
            throw `Error - SyncGroup already exists named '${syncGroup.name}'`;
        }
        
        this.syncGroups.set(syncGroup.name, syncGroup);
    }
    
    delete(syncGroup) {
        if ( !(syncGroup instanceof SyncGroup) ) {
            throw 'Invalid parameter type - syncGroup must be a SyncGroup object';
        }
        
        if (!this.syncGroups.has(syncGroup.name)) {
            throw `Error - SyncGroup not found named '${syncGroup.name}'`;
        }
        
        // Unlink all SyncChannels first
        for (let syncChannel of syncGroup.syncChannels.values()) {
            this.deleteChannelFromGroup(syncChannel.channel, syncGroup);
        }
        
        this.syncGroups.delete(syncGroup.name);
    }
    
    addChannelToGroup(channel, syncGroup) {
        const syncChannel = syncGroup.addChannel(channel);
        this.addChannelToMap(channel, syncGroup);
        
        return syncChannel;
    }
    
    deleteChannelFromGroup(channel, syncGroup) {
        syncGroup.deleteChannel(channel);
        this.deleteChannelFromMap(channel, syncGroup);
    }
    
    addChannelToMap(channel, syncGroup) {
        if (this.channelMap.has(channel.id)) {
            throw `Error - Channel already exists in channel map`;
        }
        
        this.channelMap.set(channel.id, syncGroup.name);
    }
    
    deleteChannelFromMap(channel, syncGroup) {
        if (!this.channelMap.has(channel.id)) {
            throw `Error - Channel does not exist in channel map`;
        }
        
        this.channelMap.delete(channel.id);
    }
    
    sendMessage(client, message) {
        // See if we can find a sync group for this message's channel
        let syncGroup = syncGroupManager.lookup(message.channel);
        
        if (syncGroup != null) {
            console.log('Found sync group:');
            console.log(syncGroup);
            console.log();
                
            syncGroup.sendMessage(message);
        } else {
            console.log('Could not find sync group for channel');
            console.log();
        }
    }
    
    updateMessage(client, oldMessage, newMessage) {
    // See if we can find a sync group for this message's channel
        let syncGroup = syncGroupManager.lookup(newMessage.channel);
        
        if (syncGroup != null) {
            console.log('Found sync group:');
            console.log(syncGroup);
            console.log();
            
            syncGroup.editMessage(newMessage);
        } else {
            console.log('Could not find sync group for channel');
            console.log();
        }
    }
    
    deleteMessage(client, message) {
        // See if we can find a sync group for this message's channel
        let syncGroup = syncGroupManager.lookup(message.channel);
        
        if (syncGroup != null) {
            console.log('Found sync group:');
            console.log(syncGroup);
            console.log();
            
            syncGroup.deleteMessage(message);
        } else {
            console.log('Could not find sync group for channel');
            console.log();
        }
    }
}

const syncGroupManager = new SyncGroupManager();
Object.freeze(syncGroupManager);

module.exports = syncGroupManager;
