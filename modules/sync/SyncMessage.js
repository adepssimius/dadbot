
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
    static fields    = [ 'id', 'channel_id', 'guild_id'
                       , 'orig_message_id', 'orig_channel_id', 'orig_guild_id'
                       , 'channel_group_id', 'alliance_id', 'is_clone', 'content', 'author_id' ];
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
    
    get allianceId() {
        return this.data.alliance_id;
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
    
    set allianceId(value) {
        this.data.alliance_id = value;
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
        const syncChannel = await SyncChannel.get({id: message.channel.id, unique: true});
        
        // Tap out if  this message is not from a channel being synced
        if (syncChannel == null) {
            return;
        }
        
        // Get the synchronization channels to which we need to sync this message
        const linkedSyncChannels = await SyncChannel.get({
            id: message.channel.id,
            channelGroupId: syncChannel.channelGroupId,
            getLinkedChannels: true
        });
        
        try {
            // Create the sync message for the original message
            const syncMessage = new SyncMessage({
                id             : message.id,
                channelId      : message.channel.id,
                guildId        : message.guild.id,
                channelGroupId : syncChannel.channelGroupId,
                allianceId     : syncChannel.allianceId,
                content        : message.content,
                authorId       : message.author.id
            });
            await syncMessage.create();
            
            // Share the message with the log, but make this conditional later
            client.logger.debug('Message to be Synchronized');
            client.logger.dump(syncMessage);
            
            for (let x = 0; x < linkedSyncChannels.length; x++) {
                const linkedSyncChannel = linkedSyncChannels[x];
                const result = await linkedSyncChannel.sendWebhookMessage(message);
                
                const data = {
                    id             : result.data.id,
                    channelId      : linkedSyncChannel.id,
                    guildId        : linkedSyncChannel.guildId,
                    origMessageId  : message.id,
                    origChannelId  : message.channel.id,
                    origGuildId    : message.guild.id,
                    channelGroupId : linkedSyncChannel.channelGroupId,
                    allianceId     : syncChannel.allianceId,
                    isClone        : true,
                    authorId       : message.author.id
                };
                
                const clonedSyncMessage = new SyncMessage(data);
                clonedSyncMessage.create();
                
                client.logger.debug(`Message Cloned - Sync Channel [${x+1}]`);
                client.logger.dump(clonedSyncMessage);
            }
        
        } catch (error) {
            if (error instanceof DuplicateError) {
                message.channel.send(error.message);
                return;
            } else {
                client.replyWithErrorAndDM(`Synchronization of message ran into an error: ${message.id}`, message, error);
            }
        }
        
    }
    
    static async syncUpdate(oldMessage, newMessage){
        const syncMessage        = await SyncMessage.get({id: newMessage.id, unique: true});
        const clonedSyncMessages = await SyncMessage.get({origMessageId: newMessage.id});
        
        // Update the original message in the database
        syncMessage.content = newMessage.content;
        syncMessage.update();
        
        // Update the cloned messages
        for (let x = 0; x < clonedSyncMessages.length; x++) {
            const clonedSyncMessage = clonedSyncMessages[x];
            const clonedSyncChannel = await SyncChannel.get({id: clonedSyncMessage.channelId, unique: true});
            
            clonedSyncChannel.editWebhookMessage(clonedSyncMessage.id, newMessage);
       }
    }
    
    static async syncDelete(message) {
        const syncMessage        = await SyncMessage.get({id: message.id, unique: true});
        const clonedSyncMessages = await SyncMessage.get({origMessageId: message.id});
        
        // Delete the cloned messages
        for (let x = 0; x < clonedSyncMessages.length; x++) {
            const clonedSyncMessage = clonedSyncMessages[x];
            const clonedSyncChannel = await SyncChannel.get({id: clonedSyncMessage.channelId, unique: true});
            
            clonedSyncChannel.deleteWebhookMessage(clonedSyncMessage.id);
            clonedSyncMessage.delete();
       }
       
       // Delete the original sync message
       syncMessage.delete();
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Make sure this message has not already been synchronized
        const syncMessage = await SyncMessage.get({
            id: this.id,
            channelId: this.channelId,
            unique: true
        });
        
        if (syncMessage != null) {
            throw new DuplicateError(`This message has already been synchronized`);
        }
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = SyncMessage;
