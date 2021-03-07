
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Channel    = require(`${ROOT}/modules/data/Channel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Message extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'message',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'id', type: 'snowflake', nullable: false },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'channel_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'guild_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'channel_group_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'event_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'orig_channel_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'orig_guild_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'orig_message_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'is_cloned_message', type: 'boolean', nullable: false },
            { dbFieldName: 'is_reaction_message', type: 'boolean', nullable: false },
            { dbFieldName: 'is_synced_message', type: 'boolean', nullable: false },
            { dbFieldName: 'reaction_message_type', type: 'string', length: 16, nullable: true },
            { dbFieldName: 'content', type: 'string', length: 2000, nullable: true },
            { dbFieldName: 'author_id', type: 'snowflake', nullable: false }
        ]
    });
    
    constructor(data) {
        super(data);
	}
	
    // *********** //
    // * Getters * //
    // *********** //
    
    // No custom getters required
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async sync(message) {
        const channel = await Channel.get({id: message.channel.id, unique: true});
        
        // Tap out if  this message is not from a channel being synced
        if (channel == null) {
            return;
        }
        
        // Get the synchronization channels to which we need to sync this message
        const linkedChannels = await Channel.get({
            id: message.channel.id,
            channelGroupId: channel.channelGroupId,
            getLinkedChannels: true
        });
        
        try {
            // Create the sync message for the original message
            const syncMessage = new Message({
                id             : message.id,
                channelId      : message.channel.id,
                guildId        : message.guild.id,
                channelGroupId : channel.channelGroupId,
                allianceId     : channel.allianceId,
                content        : message.content,
                authorId       : message.author.id
            });
            await syncMessage.create();
            
            // Share the message with the log, but make this conditional later
            client.logger.debug('Message to be Synchronized');
            client.logger.dump(syncMessage);
            
            for (let x = 0; x < linkedChannels.length; x++) {
                const linkedChannel = linkedChannels[x];
                const result = await linkedChannel.sendWebhookMessage(message);
                
                const data = {
                    id             : result.data.id,
                    channelId      : linkedChannel.id,
                    guildId        : linkedChannel.guildId,
                    origMessageId  : message.id,
                    origChannelId  : message.channel.id,
                    origGuildId    : message.guild.id,
                    channelGroupId : linkedChannel.channelGroupId,
                    allianceId     : channel.allianceId,
                    isClone        : true,
                    authorId       : message.author.id
                };
                
                const clonedMessage = new Message(data);
                await clonedMessage.create();
                
                client.logger.debug(`Message Cloned - Sync Channel [${x+1}]`);
                client.logger.dump(clonedMessage);
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
        const syncMessage        = await Message.get({id: newMessage.id, unique: true});
        const clonedMessages = await Message.get({origMessageId: newMessage.id});
        
        // Update the original message in the database
        syncMessage.content = newMessage.content;
        syncMessage.update();
        
        // Update the cloned messages
        for (let x = 0; x < clonedMessages.length; x++) {
            const clonedMessage = clonedMessages[x];
            const clonedChannel = await Channel.get({id: clonedMessage.channelId, unique: true});
            
            clonedChannel.editWebhookMessage(clonedMessage.id, newMessage);
       }
    }
    
    static async syncDelete(message) {
        const syncMessage        = await Message.get({id: message.id, unique: true});
        const clonedMessages = await Message.get({origMessageId: message.id});
        
        // Delete the cloned messages
        for (let x = 0; x < clonedMessages.length; x++) {
            const clonedMessage = clonedMessages[x];
            const clonedChannel = await Channel.get({id: clonedMessage.channelId, unique: true});
            
            clonedChannel.deleteWebhookMessage(clonedMessage.id);
            clonedMessage.delete();
       }
       
       // Delete the original sync message
       syncMessage.delete();
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Make sure this message has not already been synchronized
        const syncMessage = await Message.get({
            id: this.id,
            channelId: this.channelId,
            unique: true
        });
        
        if (syncMessage) {
            throw new DuplicateError(`This message has already been synchronized`);
        }
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = Message;
