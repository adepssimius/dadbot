
// Load singletons
const knex = require('../Database.js');

// Load external functions
const http_post   = require('../../modules/functions').http_post;
const http_patch  = require('../../modules/functions').http_patch;
const http_delete = require('../../modules/functions').http_delete;

// Load our classes
const BaseModel = require('../BaseModel.js');

class SyncChannel extends BaseModel {
    static tableName = 'channel';
    
    static async get(conditions) {
        let result = [];
        
        if (conditions != null) {
            await knex(this.getTableName())
                .where(conditions)
                .then(function(rows) {
                    for (let x = 0; x < rows.length; x++) {
                        result.push(new SyncChannel(rows[x]));
                    }
                });
        } else {
            await knex(this.getTableName())
                .then(function(rows) {
                    for (let x = 0; x < rows.length; x++) {
                        result.push(new SyncChannel(rows[x]));
                    }
                });
        }
            
        return result;
    }
    
    //
    // TODO - Knex refactor not done below here
    //
    
    constructor(channel, syncGroupName) {
        super();
        this.channel       = channel;
        this.syncGroupName = syncGroupName;
        this.webhook       = null;
	}
    
    async createWebhook() {
        try {
            this.webhook = await this.channel.createWebhook('sync - ' + this.syncGroupName);
            
            console.log('New Webhoook:');
            console.log(this.webhook);
            console.log();
        
        } catch (error) {
            this.channel.send('Error creating webhook, check bot permissions');
            
            console.log('Error while creating webhook:');
            console.log(error);
            console.log();
        }
    }
    
    async deleteWebhook() {
        try {
            await this.webhook.delete();
        } catch (error) {
            this.channel.send('Error deleting webhook, check bot permissions');
            
            console.log('Error while deleting webhook:');
            console.log(error);
            console.log();
        }
    }
    
    async setWebhook(webhook) {
        this.webhook = webhook;
    }
    
    getWebhookSendURL() {
        return this.webhook.url + '?wait=true';
    }
    
    getWebhookEditURL(messageID) {
        return this.webhook.url + '/messages/' + messageID;
    }
    
    getWebhookDeleteURL(messageID) {
        return this.webhook.url + '/messages/' + messageID;
    }
    
    async sendMessage(message, message_to_send) {
        let result = await http_post(this.getWebhookSendURL(), message_to_send);
        
        /*
        console.log('Result:');
        console.log(result);
        console.log();
        */
        
        return result;
    }
    
    async editMessage(messageID, message_to_send) {
        console.log('Edit URL = ' + this.getWebhookEditURL(messageID));
        let result = await http_patch(this.getWebhookEditURL(messageID), message_to_send);
        
        /*
        console.log('Result:');
        console.log(result);
        console.log();
        */
        
        return result;
    }
    
    async deleteMessage(messageID) {
        console.log('Delete URL = ' + this.getWebhookDeleteURL(messageID));
        let result = await http_delete(this.getWebhookDeleteURL(messageID));
        
        /*
        console.log('Result:');
        console.log(result);
        console.log();
        */
        
        return result;
    }
}

module.exports = SyncChannel;
