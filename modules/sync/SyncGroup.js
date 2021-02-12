
// Load our classes
const BaseModel        = require('../BaseModel.js');
const SyncChannel      = require('./SyncChannel');
const SyncMessage      = require('./SyncMessage');
const SyncMessageQueue = require('./SyncMessageQueue');

// Load singletons
const client           = require('../Client.js');
const knex             = require('../Database.js');
const syncGroupManager = require('./SyncGroupManager');

class SyncGroup extends BaseModel {
    static tableName = 'sync_group';
    
    static async get(conditions) {
        let result = [];
        
        if (conditions != null) {
            await knex(this.getTableName())
                .where(conditions)
                .then(function(rows) {
                    for (let x = 0; x < rows.length; x++) {
                        result.push(new SyncGroup(rows[x]));
                    }
                });
        } else {
            await knex(this.getTableName())
                .then(function(rows) {
                    for (let x = 0; x < rows.length; x++) {
                        result.push(new SyncGroup(rows[x]));
                    }
                });
        }
            
        return result;
    }
    
    static async create(data) {
        data.sync_group_id = data.name;
        
        await knex(this.getTableName())
            .insert(data)
            .then(function(result) {
                console.log('Insert Result:');
                console.log(result);
                return new SyncGroup(data);
            });
    }

    constructor(data) {
        super();
        this.id   = data.sync_group_id;
		this.name = data.name;
        this.syncChannels = new Map();
        this.syncMessageQueue = new SyncMessageQueue();
    }
    
    //
    // TODO - Knex refactor not done below here
    //
    
    lookup(lookupValue) {
        console.log('Searching sync group: ' + this.name);
        
        // When lookupValue is the channel ID
        const syncChannelID = (typeof lookupValue == 'string' ? lookupValue : lookupValue.id);
        return this.syncChannels.get(syncChannelID);
    }

	addChannel(channel) {
	    // Add the SyncChannnel to our SyncChannel Map
        const syncChannel = new SyncChannel(channel, this.name);
        this.syncChannels.set(channel.id, syncChannel);
        
        return syncChannel;
    }
    
    deleteChannel(channel) {
        // Delete the webhook first
        const syncChannel = this.lookup(channel.id);
        syncChannel.deleteWebhook();
        
        // Then remove the channel from this SyncGroup
        this.syncChannels.delete(channel.id);
    }
    
    async sendMessage(message) {
        let message_to_send = {
            content: message.content,
            username: message.author.username,
            avatar_url: message.author.displayAvatarURL()
        };
        
        console.log('Outgoing Message:');
        console.log(message_to_send);
        console.log();
        
        // Create a syncMessage record for this message
        let syncMessage = new SyncMessage(message.id, message.channel.id, message.content);
        
        // console.log('this.syncChannels');
        // console.log(this.syncChannels);
        // console.log();
        
        //for (let syncChannel of this.syncChannels.values()) {
        for (let [channelID, syncChannel] of this.syncChannels) {
            if (message.channel.id != channelID) {
                let result = await syncChannel.sendMessage(message, message_to_send);
                
                // console.log('Result:');
                // console.log(result);
                // console.log();
                
                // console.log('Data:');
                // console.log(result.data);
                // console.log();
                
                let childSyncMessage = new SyncMessage(result.data.id, result.data.channel_id, result.content);
                syncMessage.addChildMessage(childSyncMessage);
            }
        }
    
        this.syncMessageQueue.add(syncMessage);

        console.log('Queue:');
        console.log(this.syncMessageQueue);
        console.log();
    }
    
    async editMessage(newMessage) {
        let message_to_send = { content: newMessage.content };
        let syncMessage = this.syncMessageQueue.get(newMessage.id);
        
        // console.log('--------------------------------------------------------------------------------');
        // console.log('New Message:');
        // console.log(newMessage);
        // console.log();
        
        // console.log('syncMessage:');
        // console.log(syncMessage);
        // console.log();
        
        for (let x = 0; x < syncMessage.childSyncMessages.length; x++) {
            let childSyncMessage = syncMessage.childSyncMessages[x];
            let syncChannel = this.lookup(childSyncMessage.channelID);
            
            // console.log('childSyncMessage:');
            // console.log(childSyncMessage);
            // console.log();
            
            // console.log('syncChannel:');
            // console.log(syncChannel);
            // console.log();
            
            let result = await syncChannel.editMessage(childSyncMessage.messageID, message_to_send);
            
            /*
            console.log('Result:');
            console.log(result);
            console.log();
            */
        }
    }
    
    async deleteMessage(message) {
        let syncMessage = this.syncMessageQueue.get(message.id);
        
        for (let x = 0; x < syncMessage.childSyncMessages.length; x++) {
            let childSyncMessage = syncMessage.childSyncMessages[x];
            let syncChannel = this.lookup(childSyncMessage.channelID);
            
            let result = await syncChannel.deleteMessage(childSyncMessage.messageID);
        }
        
        this.syncMessageQueue.delete(message.id);
    }
}

module.exports = SyncGroup;
