
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
    static fields    = ['id', 'guild_id', 'channel_group_id', 'webhook_id', 'webhook_url'];
    static fieldMap  = BaseModel.getFieldMap(SyncChannel.fields);
    
    constructor(data) {
        super(SyncChannel, data);
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
    
    static async getLinkedSyncChannelData(channel_id) {
        // Get the sync channel for the original message
        let syncChannels = await SyncChannel.get({'channel_id': channel_id});
        
        // Quit immediately if this message is not from a channel being synced
        if (syncChannels.length == 0) {
            return;
        } else if (syncChannels.length > 1) {
            throw new Error('Too many records found for the same channel id, something is wrong!');
        }
        
        const linkedSyncChannels = await SyncChannel.get({sync_group_id: syncChannels[0].sync_group_id});
        const cloneSyncChannels = [];
        
        for (let x = 0; x < linkedSyncChannels.length; x++) {
            const linkedSyncChannel = linkedSyncChannels[x];
            
            if (linkedSyncChannel.channel_id != channel_id) {
                cloneSyncChannels.push(linkedSyncChannel);
            }
        }
        
        return {syncChannel: syncChannels[0], cloneSyncChannels: cloneSyncChannels};
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Check to see if this channel is already in a synchronization group
        const syncChannels = await SyncChannel.get({id: this.id});
        if (syncChannels.length > 0) {
            throw new DuplicateError(`This channel is already linked to a channel synchronization group`);
        }
        
        // Set webhook details
        let webhook;
        let webhookName = await this.getWebhookName();
        
        // Check if we already have a webhook for this channel
        let webhooks = await this.channel.fetchWebhooks();
        for (const nextWebhook of webhooks.values()) {
            if (nextWebhook.name == webhookName) {
                webhook = nextWebhook;
                break;
            }
        }
        
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
        const webhook = await client.fetchWebhook(this.webhook_id);
        
        if (webhook != null) {
            await webhook.delete();
        }
        
        await BaseModel.prototype.delete.call(this);
    }
    
    async getWebhookName() {
        if (this.channelGroupId == null) {
            return null;
        }
        
        const SyncChannelGroup  = require(`${ROOT}/modules/sync/SyncChannelGroup`);
        const syncChannelGroups = await SyncChannelGroup.get({id: this.channelGroupId});
        const syncChannelGroup  = syncChannelGroups[0];
        
        return `Ninkasi Bot - Sync Group [${syncChannelGroup.name}]`;
    }
    
    getDiscordChannel() {
        return client.channels.fetch(this.channel_id);
    }
    
    getWebhookExecuteURL(messageID) {
        return this.webhook_url + '?wait=true';
    }
    
    getWebhookMessageEditURL(messageID) {
        return this.webhook_url + '/messages/' + messageID;
    }
    
    getWebhookMessageDeleteURL(messageID) {
        return this.webhook_url + '/messages/' + messageID;
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
