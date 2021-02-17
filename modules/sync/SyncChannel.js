
// Load our classes
const DuplicateError = require('../error/DuplicateError');
const BaseModel = require('../BaseModel.js');

// Load singletons
const client = require('../Client.js'); // eslint-disable-line no-unused-vars

// Load external functions
const http_post   = require('../functions').http_post;
const http_patch  = require('../functions').http_patch;
const http_delete = require('../functions').http_delete;

class SyncChannel extends BaseModel {
    static tableName = 'channel';
    
    constructor(data) {
        super(data);
	}
	
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get channel_id() {
        return this.data.channel_id;
    }
    
    get guild_id() {
        return this.data.guild_id;
    }
    
    get sync_group_id() {
        return this.data.sync_group_id;
    }
    
    get webhook_id() {
        return this.data.webhook_id;
    }
    
    get webhook_url() {
        return this.data.webhook_url;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new SyncChannel(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const syncGroup = data.syncGroup;
        const channel   = data.channel;
        
        // Check to see if this channel is already in a synchronization group
        const syncChannels = await SyncChannel.get({'channel_id': channel.id});
        if (syncChannels.length > 0) {
            throw new DuplicateError(`This channel is already linked to a channel synchronization group`);
        }
        
        // Check if we need to create a webhook for this channel
        let webhook;
        let webhooks = await channel.fetchWebhooks();
        let sync_webhook_name = SyncChannel.getSyncWebhookName(syncGroup);
        
        for (webhook of webhooks.values()) {
            if (webhook.name == sync_webhook_name) {
                break; 
            } else {
                webhook = null;
            }
        }
        
        if (webhook == null) {
            webhook = await channel.createWebhook(sync_webhook_name, {avatar: client.user.displayAvatarURL()});
        }
        
        const syncChannelData = {
            'channel_id': channel.id,
            'guild_id': channel.guild.id,
            'sync_group_id': syncGroup.sync_group_id,
            'webhook_id': webhook.id,
            'webhook_url': webhook.url
        };
        
        client.logger.debug('syncChannelData');
        client.logger.dump(syncChannelData);
        
        let result = await this._create(syncChannelData); // eslint-disable-line no-unused-vars
        return new SyncChannel(syncChannelData);
    }
    
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
    
    static getSyncWebhookName(syncGroup) {
        return `Ninkasi Bot - Sync Group [${syncGroup.name}]`;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        const webhook = await client.fetchWebhook(this.webhook_id);
        
        if (webhook != null) {
            // Technically this does not need to be synchronous
            await webhook.delete();
        }
        
        return await SyncChannel._delete({channel_id: this.channel_id});
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
