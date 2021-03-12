
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Load external functions
const http_post   = require(`${ROOT}/modules/Functions`).http_post;
const http_patch  = require(`${ROOT}/modules/Functions`).http_patch;
const http_delete = require(`${ROOT}/modules/Functions`).http_delete;

class Channel extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'channel',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'id',                   type: 'snowflake', nullable: false },
            { dbFieldName: 'type',                 type: 'string',    nullable: false, length: 16,
              validValues: ['admin', 'event', 'event-config', 'sync'] },
            { dbFieldName: 'alliance_id',          type: 'snowflake', nullable: false, refTableName: 'alliance' },
            { dbFieldName: 'guild_id',             type: 'snowflake', nullable: false, refTableName: 'guild' },
            { dbFieldName: 'channel_group_id',     type: 'snowflake', nullable: true,  refTableName: 'channel_group' },
            { dbFieldName: 'event_id',             type: 'snowflake', nullable: true,  refTableName: 'event' },
            { dbFieldName: 'is_event_channel',     type: 'boolean',   nullable: false, default: false },
            { dbFieldName: 'is_sync_channel',      type: 'boolean',   nullable: false, default: false },
            { dbFieldName: 'command_channel_type', type: 'string',    nullable: true, length: 16 },
            { dbFieldName: 'webhook_id',           type: 'snowflake', nullable: true },
            { dbFieldName: 'webhook_url',          type: 'string',    nullable: true, length: 256 },
        ],
        objects: [
            { objectName: 'discordChannel' },
            { objectName: 'webhook' }
        ]
    });
    
    constructor(data) {
        super(data);
	}
	
    // *********** //
    // * Getters * //
    // *********** //
    
    get discordChannel() {
        return this.temp.discordChannel;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set discordChannel(value) {
        this.temp.discordChannel = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        if (conditions.getLinkedChannels) {
            return (query) => {
                query.where('channel_group_id', conditions.channelGroupId).whereNot('id', conditions.id);
            };
        }
        
        return conditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Check to see if this channel is already in a channel group
        const channel = await Channel.get({id: this.id, unique: true});
        if (channel != null) {
            throw new DuplicateError(`Channel already joined to channel ${this.type} group: ${channel.name}`);
        }
        
        // If this is a sync channel, then set that up
        if (this.isSyncChannel) {
            // Set webhook details
            const webhookName = await this.getWebhookName();
            
            // Make sure we have the discord channel
            if (!this.discordChannel) {
                this.discordChannel = await client.channels.fetch(this.id);
            }
            
            // Check if we already have a webhook for this channel
            const webhooks = await this.discordChannel.fetchWebhooks();
            let webhook = await webhooks.find(webhook => webhook.name == webhookName);
            
            // If we do not, then attempt to create one
            if (webhook == null) {
                webhook = await this.discordChannel.createWebhook(webhookName, {avatar: client.user.displayAvatarURL()});
            }
            
            // Set the webhook
            this.webhook = webhook;
        }
        
        // Finally attempt to create the synchronization channel
        await BaseModel.prototype.create.call(this);
    }
    
    async delete() {
        try {
            const webhook = await client.fetchWebhook(this.webhookId);
            if (webhook) await webhook.delete();
        } catch (error) {
            if ( !(error.name == 'DiscordAPIError' && (error.httpStatus == 404 || error.message != 'Unknown Webhook')) ) {
                throw error;
            }
        }
        await BaseModel.prototype.delete.call(this);
    }
    
    async getWebhookName() {
        if (this.channelGroupId == null) {
            return null;
        }
        
        const ChannelGroup  = require(`${ROOT}/modules/data/ChannelGroup`);
        const channelGroup = await ChannelGroup.get({id: this.channelGroupId, unique: true});
        
        return `Ninkasi - Channel Sync Group [${channelGroup.name}]`;
    }
    
    async getDiscordChannel() {
        return await client.channels.fetch(this.id);
    }
    
    getWebhookExecuteURL(messageID) {
        return this.webhookUrl + '?wait=true';
    }
    
    getWebhookMessageEditURL(messageID) {
        return this.webhookUrl + '/messages/' + messageID;
    }
    
    getWebhookMessageDeleteURL(messageID) {
        return this.webhookUrl + '/messages/' + messageID;
    }
    
    async sendWebhookMessage(message) {
        const payload = {
            content: message.content,
            username: message.author.username,
            avatar_url: message.author.displayAvatarURL()
        };
        return await http_post(this.getWebhookExecuteURL(), payload);
    }
    
    async editWebhookMessage(messageID, newMessage) {
        const payload = { content: newMessage.content };
        const result = await http_patch(this.getWebhookMessageEditURL(messageID), payload);
        
        client.logger.debug('result');
        client.logger.dump(result);
        
        return result;
    }
    
    async deleteWebhookMessage(messageID) {
        const result = await http_delete(this.getWebhookMessageDeleteURL(messageID));
        return result;
    }
}

module.exports = Channel;
