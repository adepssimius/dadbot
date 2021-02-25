
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const SyncGroup      = require(`${ROOT}/modules/sync/SyncGroup`);
const SyncChannel    = require(`${ROOT}/modules/sync/SyncChannel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class SyncMessage extends BaseModel {
    static tableName = 'message';
    
    constructor(data) {
        super(data);
	}
	
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get message_id() {
        return this.data.message_id;
    }
    
    get channel_id() {
        return this.data.channel_id;
    }
    
    get guild_id() {
        return this.data.guild_id;
    }
    
    get sync_group_id() {
        return this.data.sync_group_id;
    }
    
    get is_clone() {
        return this.data.is_clone;
    }
    
    get orig_message_id() {
        return this.data.orig_message_id;
    }
    
    get orig_channel_id() {
        return this.data.orig_channel_id;
    }
    
    get orig_guild_id() {
        return this.data.orig_guild_id;
    }
    
    get content() {
        return this.data.content;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(conditions) {
        let result = [];
        let rows = await this._get(conditions);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new SyncMessage(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const message     = data.message;
        const syncChannel = data.syncChannel;

        // Make sure this message has not already been synchronized
        const syncMessages = await SyncMessage.get({
            message_id: message.id,
            channel_id: syncChannel.channel_id
        });
        
        if (syncMessages.length > 0) {
            throw new DuplicateError(`This message has already been synchronized`);
        }
        
        let syncMessageData;
        
        if (message.channel.id == syncChannel.channel_id) {
            syncMessageData = {
                'message_id'    : message.id,
                'channel_id'    : message.channel.id,
                'guild_id'      : message.guild.id,
                'sync_group_id' : syncChannel.sync_group_id,
                'content'       : message.content
            };
            
        } else {
            const result = await syncChannel.sendWebhookMessage(message);
            syncMessageData = {
                'message_id'      : result.data.id,
                'channel_id'      : syncChannel.channel_id,
                'guild_id'        : syncChannel.guild_id,
                'sync_group_id'   : syncChannel.sync_group_id,
                'is_clone'        : true,
                'orig_message_id' : message.id,
                'orig_channel_id' : message.channel.id,
                'orig_guild_id'   : message.guild.id
            };
        }
        
        client.logger.debug('syncMessageData');
        client.logger.dump(syncMessageData);
        
        const result = await this._create(syncMessageData); // eslint-disable-line no-unused-vars
        const syncMessage = new SyncMessage(syncMessageData);
        return syncMessage;
    }
    
    static async sync(message) {
        const linkedSyncChannelData = await SyncChannel.getLinkedSyncChannelData(message.channel.id);
        
        // Tap out if  this message is not from a channel being synced
        if (linkedSyncChannelData == null) {
            return;
        }
        
        // Reassign to immediate local variables for convenience 
        const syncChannel       = linkedSyncChannelData.syncChannel;
        const cloneSyncChannels = linkedSyncChannelData.cloneSyncChannels;
        
        // Create the sync message for the original message
        const syncMessage = await SyncMessage.create({'message': message, 'syncChannel': syncChannel});
        client.logger.debug('Original SyncMessage:');
        client.logger.dump(syncMessage);
        
        for (let x = 0; x < cloneSyncChannels.length; x++) {
            const cloneSyncMessage = await SyncMessage.create({'message': message, 'syncChannel': cloneSyncChannels[x]});
            client.logger.debug('Clone SyncMessage:');
            client.logger.dump(cloneSyncMessage);
        }
    }
    
    static async syncUpdate(oldMessage, newMessage){
        const cloneSyncMessages = await SyncMessage.get({orig_message_id: newMessage.id});
        
        for (let x = 0; x < cloneSyncMessages.length; x++) {
            const cloneSyncChannels = await SyncChannel.get({channel_id: cloneSyncMessages[x].channel_id});
            cloneSyncChannels[0].editWebhookMessage(cloneSyncMessages[x].message_id, newMessage);
       }
    }
    
    static async syncDelete(message) {
        const cloneSyncMessages = await SyncMessage.get({orig_message_id: message.id});
        
        for (let x = 0; x < cloneSyncMessages.length; x++) {
            const cloneSyncChannels = await SyncChannel.get({channel_id: cloneSyncMessages[x].channel_id});
            cloneSyncChannels[0].deleteWebhookMessage(cloneSyncMessages[x].message_id);
       }
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await SyncGroup._delete({message_id: this.message_id});
    }
}

module.exports = SyncMessage;
