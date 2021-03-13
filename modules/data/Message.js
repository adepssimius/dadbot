
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Channel        = require(`${ROOT}/modules/data/Channel`);
const Guardian       = require(`${ROOT}/modules/data/Guardian`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Message extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'message',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'id',                    type: 'snowflake', nullable: false },
            { dbFieldName: 'type',                  type: 'string',    nullable: false, length: 16 },
            { dbFieldName: 'alliance_id',           type: 'snowflake', nullable: false, refTableName: 'alliance' },
            { dbFieldName: 'channel_id',            type: 'snowflake', nullable: false, refTableName: 'channel' },
            { dbFieldName: 'guild_id',              type: 'snowflake', nullable: false, refTableName: 'guild' },
            { dbFieldName: 'channel_group_id',      type: 'snowflake', nullable: true,  refTableName: 'channel_group' },
            { dbFieldName: 'event_id',              type: 'snowflake', nullable: true,  refTableName: 'event' },
            { dbFieldName: 'orig_channel_id',       type: 'snowflake', nullable: true,  refTableName: 'channel' },
            { dbFieldName: 'orig_guild_id',         type: 'snowflake', nullable: true,  refTableName: 'guild' },
            { dbFieldName: 'orig_message_id',       type: 'snowflake', nullable: true,  refTableName: 'message' },
            { dbFieldName: 'is_sync_message',       type: 'boolean',   nullable: false, default: false },
            { dbFieldName: 'is_clone_message',      type: 'boolean',   nullable: false, default: false },
            { dbFieldName: 'is_reaction_message',   type: 'boolean',   nullable: false, default: false },
            { dbFieldName: 'reaction_message_type', type: 'string',    nullable: true,  length: 16 },
            { dbFieldName: 'content',               type: 'string',    nullable: true,  length: 2000 },
            { dbFieldName: 'author_id',             type: 'snowflake', nullable: false, refTableName: 'guardian' }
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
        // See if we can find a sync channel for this message
        const channel = await Channel.get({
            id: message.channel.id,
            type: 'sync',
            unique: true
        });
        
        // Tap out if  this message is not from a channel being synced
        if (!channel) {
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
            const syncMessageData = {
                id             : message.id,
                type           : 'sync',
                allianceId     : channel.allianceId,
                channelId      : message.channel.id,
                eventId        : channel.event_id,
                guildId        : message.guild.id,
                channelGroupId : channel.channelGroupId,
                isSyncMessage  : true,
                content        : message.content,
                authorId       : message.author.id
            };
            const syncMessage = new Message(syncMessageData);
            await syncMessage.create();
            
            // Share the message with the log, but make this conditional later
            client.logger.debug('Message to be Synchronized');
            client.logger.dump(syncMessage);
            
            for (let x = 0; x < linkedChannels.length; x++) {
                const linkedChannel = linkedChannels[x];
                const result = await linkedChannel.sendWebhookMessage(message);
                
                const clonedMessagData = {
                    id             : result.data.id,
                    type           : 'sync',
                    allianceId     : channel.allianceId,
                    channelId      : linkedChannel.id,
                    channelGroupId : linkedChannel.channelGroupId,
                    guildId        : linkedChannel.guildId,
                    origChannelId  : message.channel.id,
                    origGuildId    : message.guild.id,
                    origMessageId  : message.id,
                    isCloneMessage : true,
                    authorId       : message.author.id
                };
                
                const clonedMessage = new Message(clonedMessagData);
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
        const syncMessageQuery = {
            id: newMessage.id,
            isSyncMessage: true,
            unique: true
        };
        const syncMessage = await Message.get(syncMessageQuery);
        
        if (!syncMessage) {
            return;
        }
        
        const clonedMessagesQuery = {
            origMessageId: newMessage.id,
            isCloneMessage: true
        };
        const cloneMessages = await Message.get(clonedMessagesQuery);
        
        // Update the original message in the database
        syncMessage.content = newMessage.content;
        syncMessage.update();
        
        // Update the cloned messages
        for (let x = 0; x < cloneMessages.length; x++) {
            const cloneMessage = cloneMessages[x];
            
            const cloneChannelQuery = {
                id: cloneMessage.channelId,
                isSyncChannel: true,
                unique: true
            };
            const cloneChannel = await Channel.get(cloneChannelQuery);
            
            cloneChannel.editWebhookMessage(cloneMessage.id, newMessage);
       }
    }
    
    static async syncDelete(message) {
        const syncMessageQuery = {
            id: message.id,
            isSyncMessage: true,
            unique: true
        };
        const syncMessage = await Message.get(syncMessageQuery);
        
        if (!syncMessage) {
            return;
        }
        
        const cloneMessagesQuery = {
            origMessageId: message.id,
            isCloneMessage: true
        };
        const cloneMessages = await Message.get(cloneMessagesQuery);
        
        // Delete the cloned messages
        for (let x = 0; x < cloneMessages.length; x++) {
            const cloneMessage = cloneMessages[x];
            
            const cloneChannelQuery = {
                id: cloneMessage.channelId,
                isSyncChannel: true,
                unique: true
            };
            const cloneChannel = await Channel.get(cloneChannelQuery);
            
            cloneChannel.deleteWebhookMessage(cloneMessage.id);
            cloneMessage.delete();
       }
       
       // Delete the original sync message
       syncMessage.delete();
    }
    
    static async loadMessageCache() {
        const messageQuery = {isReactionMessage: true};
        const messages = await Message.get(messageQuery);
        
        for (let m = 0; m < messages.length; m++) {
            const message = messages[m];
            
            try {
                await message.getDiscordMessage();
            } catch (error) {
                client.logger.error(`Error while caching message: ${message.id} (channel id = ${message.channelId})`);
                client.logger.dump(error);
                
                // Clean this up since the channel is gone
                //message.delete();
            }
        }
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
        
        // Make sure the author is in the database
        if (await this.getAuthor() == null) {
            this.author = new Guardian({id: this.authorId});
            await this.author.create();
        }
        
        if (syncMessage) {
            throw new DuplicateError(`This message has already been synchronized`);
        }
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
    
    async handleReaction(messageReaction, user) {
        switch (this.reactionMessageType) {
            case 'event': await this.handleEventReaction(messageReaction, user); break;
            default: throw new Error(`Unrecognized reaction message type: ${this.reactionMessageType}`);
        }
        
        //messageReaction.remove();
    }
    
    async handleEventReaction(messageReaction, user) {
        // Always remove the user's reaction first
        messageReaction.users.remove(user);
        
        // Get the event
        const Event = require(`${ROOT}/modules/data/Event`);
        const event = await Event.get({id: this.eventId, unique: true});
        
        if (!event) {
            throw new Error(`Unexpected could not find event: id = ${this.eventId}`);
        }
        
        const discordChannel = messageReaction.message.channel;
        switch (messageReaction.emoji.name) {
            case 'join'      : await event.join(user, discordChannel); break;
            case 'alternate' : await event.join(user, discordChannel, false); break;
            case 'leave'     : await event.leave(user, discordChannel); break;
        }
    }
}

module.exports = Message;
