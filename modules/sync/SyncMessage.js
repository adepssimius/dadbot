
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const SyncChannel    = require(`${ROOT}/modules/sync/SyncChannel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

//const SyncGroup      = require(`${ROOT}/modules/sync/SyncGroup`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class SyncMessage extends BaseModel {
    static tableName = 'message';
    static orderBy   = 'created_at';
    static fields    = [ 'channel', 'guild_id'
                       , 'orig_message_id', 'orig_channel_id', 'orig_guild_id'
                       , 'is_clone', 'content', 'author_id' ];
    static fieldMap  = BaseModel.getFieldMap(SyncMessage.fields);
    
    constructor(data) {
        super(SyncMessage, data);
	}
	
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return SyncMessage.tableName;
    }
    
    get channelId() {
        return this.data.channel_id;
    }
    
    get guildId() {
        return this.data.guild_id;
    }
    
    get origMessageId() {
        return this.data.orig_message_id;
    }
    
    get origChannelId() {
        return this.data.orig_channel_id;
    }
    
    get origGuildId() {
        return this.data.orig_guild_id;
    }
    
    get channelGroupId() {
        return this.data.channel_group_id;
    }
    
    get isClone() {
        return this.data.is_clone;
    }
    
    get content() {
        return this.data.content;
    }
    
    get authorId() {
        return this.data.author_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set tableName(value) {
        SyncMessage.tableName = value;
    }
    
    set channelId(value) {
        this.data.channel_id = value;
    }
    
    set guildId(value) {
        this.data.guild_id = value;
    }
    
    set origMessageId(value) {
        this.data.orig_message_id = value;
    }
    
    set origChannelId(value) {
        this.data.orig_channel_id = value;
    }
    
    set origGuildId(value) {
        this.data.orig_guild_id = value;
    }
    
    set channelGroupId(value) {
        this.data.channel_group_id = value;
    }
    
    set isClone(value) {
        this.data.is_clone = value;
    }
    
    set content(value) {
        this.data.content = value;
    }
    
    set authorId(value) {
        this.data.author_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
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
    
    static async create(data) {
        // Make sure this message has not already been synchronized
        const syncMessages = await SyncMessage.get({
            id: this.messageId,
            channelId: this.channelId
        });
        
        if (syncMessages.length > 0) {
            throw new DuplicateError(`This message has already been synchronized`);
        }
        
        //let syncMessageData;
        //
        //if (message.channel.id == syncChannel.channel_id) {
        //    syncMessageData = {
        //        'message_id'    : message.id,
        //        'channel_id'    : message.channel.id,
        //        'guild_id'      : message.guild.id,
        //        'sync_group_id' : syncChannel.sync_group_id,
        //        'content'       : message.content
        //    };
        //    
        //} else {
        //    const result = await syncChannel.sendWebhookMessage(message);
        //    syncMessageData = {
        //        'message_id'      : result.data.id,
        //        'channel_id'      : syncChannel.channel_id,
        //        'guild_id'        : syncChannel.guild_id,
        //        'sync_group_id'   : syncChannel.sync_group_id,
        //        'is_clone'        : true,
        //        'orig_message_id' : message.id,
        //        'orig_channel_id' : message.channel.id,
        //        'orig_guild_id'   : message.guild.id
        //    };
        //}
        //
        //client.logger.debug('syncMessageData');
        //client.logger.dump(syncMessageData);
        //
        //const result = await this._create(syncMessageData); // eslint-disable-line no-unused-vars
        //const syncMessage = new SyncMessage(syncMessageData);
        //return syncMessage;
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = SyncMessage;
