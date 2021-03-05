
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

class SyncChannel extends BaseModel {
    static tableName = 'channel';
    static orderBy   = 'created_at';
    static fields    = ['id', 'guild_id', 'channel_group_id', 'alliance_id', 'webhook_id', 'webhook_url'];
    static fieldMap  = BaseModel.getFieldMap(SyncChannel.fields);
    
    constructor(data) {
        let channel;
        
        if (data.channel) {
            channel = data.channel;
            delete data.channel;
        }
        
        super(SyncChannel, data);
        this.channel = channel;
	}
	
	temp = {};
	
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return SyncChannel.tableName;
    }
    
    get guildId() {
        return this.data.guild_id;
    }
    
    get channelGroupId() {
        return this.data.channel_group_id;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    get webhookId() {
        return this.data.webhook_id;
    }
    
    get webhookUrl() {
        return this.data.webhook_url;
    }
    
    get channel() {
        return this.temp.channel;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set guildId(value) {
        this.data.guild_id = value;
    }
    
    set channelGroupId(value) {
        this.data.channel_group_id = value;
    }
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    set webhookId(value) {
        this.data.webhook_id = value;
    }
    
    set webhookUrl(value) {
        this.data.webhook_url = value;
    }
    
    set channel(value) {
        this.temp.channel = value;
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
        // Check to see if this channel is already in a synchronization group
        const syncChannel = await SyncChannel.get({id: this.id, unique: true});
        if (syncChannel != null) {
            throw new DuplicateError(`Channel already linked to channel synchronization group: ${syncChannel.name}`);
        }
        
        // Set webhook details
        //let webhook;
        const webhookName = await this.getWebhookName();
        
        // Check if we already have a webhook for this channel
        const webhooks = await this.channel.fetchWebhooks();
        let webhook = await webhooks.find(webhook => webhook.name == webhookName);
        
        //for (const nextWebhook of webhooks.values()) {
        //    if (nextWebhook.name == webhookName) {
        //        webhook = nextWebhook;
        //        break;
        //    }
        //}
        
        // If we do not, then attempt to create one
        if (webhook == null) {
            webhook = await this.channel.createWebhook(webhookName, {avatar: client.user.displayAvatarURL()});
        }
        
        // Set the webhook values
        this.webhookId  = webhook.id;
        this.webhookUrl = webhook.url;
        
        // Finally attempt to create the synchronization channel
        await BaseModel.prototype.create.call(this);
    }
    
    async delete() {
        try {
            const webhook = await client.fetchWebhook(this.webhookId);
            if (webhook != null) await webhook.delete();
        } catch (error) {
            if (error.name != 'DiscordAPIError' || error.message != 'Unknown Webhook') {
                throw error;
            }
        }
        await BaseModel.prototype.delete.call(this);
    }
    
    async getWebhookName() {
        if (this.channelGroupId == null) {
            return null;
        }
        
        const SyncChannelGroup  = require(`${ROOT}/modules/sync/SyncChannelGroup`);
        const syncChannelGroup = await SyncChannelGroup.get({id: this.channelGroupId, unique: true});
        
        return `Ninkasi - Channel Sync Group [${syncChannelGroup.name}]`;
    }
    
    getDiscordChannel() {
        return client.channels.fetch(this.id);
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

module.exports = SyncChannel;
