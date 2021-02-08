import dotenv from 'dotenv';
import Discord from 'discord.js';
import sqlite3 from 'sqlite3';
import axios from 'axios';

// set up dotenv
dotenv.config();

// get the db going
let db = new sqlite3.Database('./db/dadbot.db', (err) => {
    if (err) {
        console.error(err.message);
    }

    console.log('Connected to the dadabase.');
});

const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);

//
// Constants
//

const bot_id = '807375870574329907';
const prefix = '%';

//
// Functions
//

async function http_post(url, data) {
    let result =
        await axios({
            method: 'post',
            url: url,
            data: data
        });
    
    /*
    console.log('Result:');
    console.log(result);
    console.log();
    */
    
    return result;
}

async function http_patch(url, data) {
    let result =
        await axios({
            method: 'patch',
            url: url,
            data: data
        });
    
    /*
    console.log('Result:');
    console.log(result);
    console.log();
    */
    
    return result;
}

async function http_delete(url) {
    let result =
        await axios({
            method: 'delete',
            url: url
        });
    
    /*
    console.log('Result:');
    console.log(result);
    console.log();
    */
    
    return result;
}

//
// SyncGroup and SyncChannel classes
//

class SyncGroup {
    constructor(name) {
		this.name = name;
        this.syncChannels = new Map();
        this.syncMessageQueue = new SyncMessageQueue();
    }
	
    static lookup(lookupValue) {
        // Lookup by sync group name
        if (typeof lookupValue == 'string') {
            for (let x = 0; x < allSyncGroups.length; x++) {
                if (allSyncGroups[x].name == lookupValue) {
                    return allSyncGroups[x];
                }
            }
            
            return;
        
        // Lookup by channel within a sync group
        } else {
            console.log('Searching by channel for channel id = ' + lookupValue.id);
            
            for (let x = 0; x < allSyncGroups.length; x++) {
                let syncGroup = allSyncGroups[x];
                let channel = syncGroup.lookup(lookupValue);
                
                if (channel != null) {
                    return syncGroup;
                }
            }
            
            return;
        }
    }
    
    lookup(lookupValue) {
        console.log('Searching sync group: ' + this.name);
        
        // When lookupValue is the channel ID
        if (typeof lookupValue == 'string') {
            return this.syncChannels[lookupValue];
        
        // When lookupValue is a channel
        } else {
            return this.syncChannels[lookupValue.id];
        }
        
        //for (let x = 0; x < this.syncChannels.length; x++) {
        //    console.log('Checking channel with id = ' + this.syncChannels[x].channel.id);
        //    
        //    if (channel.id == this.syncChannels[x].channel.id) {
        //        return this.syncChannels[x];
        //    }
        //}
    }

	addChannel(channel) {
        let syncChannel = new SyncChannel(channel, this.name);
        this.syncChannels[channel.id] = syncChannel;
        return syncChannel;
    }
    
    async sendMessage(message) {
        let message_to_send = {
            content: message.content,
            username: message.author.username,
            avatar_url: message.author.displayAvatarURL()
        };
        
        console.log('Outgoing Message:');
        console.log(message_to_send);
        console.log();
        
        // Create a syncMessage record for this message
        let syncMessage = new SyncMessage(message.id, message.channel.id, message.content);
        
        // console.log('this.syncChannels');
        // console.log(this.syncChannels);
        // console.log();
        
        //for (let syncChannel of this.syncChannels.values()) {
        for (let channelID in this.syncChannels) {
            if (message.channel.id != channelID) {
                let syncChannel = this.syncChannels[channelID];
                let result = await syncChannel.sendMessage(message, message_to_send);
                
                // console.log('Result:');
                // console.log(result);
                // console.log();
                
                // console.log('Data:');
                // console.log(result.data);
                // console.log();
                
                let childSyncMessage = new SyncMessage(result.data.id, result.data.channel_id, result.content);
                syncMessage.addChildMessage(childSyncMessage);
            }
        }
    
        this.syncMessageQueue.add(syncMessage);

        console.log('Queue:');
        console.log(this.syncMessageQueue);
        console.log();
    }
    
    async editMessage(newMessage) {
        let message_to_send = { content: newMessage.content };
        let syncMessage = this.syncMessageQueue.get(newMessage.id);
        
        // console.log('--------------------------------------------------------------------------------');
        // console.log('New Message:');
        // console.log(newMessage);
        // console.log();
        
        // console.log('syncMessage:');
        // console.log(syncMessage);
        // console.log();
        
        for (let x = 0; x < syncMessage.childSyncMessages.length; x++) {
            let childSyncMessage = syncMessage.childSyncMessages[x];
            let syncChannel = this.lookup(childSyncMessage.channelID);
            
            // console.log('childSyncMessage:');
            // console.log(childSyncMessage);
            // console.log();
            
            // console.log('syncChannel:');
            // console.log(syncChannel);
            // console.log();
            
            let result = await syncChannel.editMessage(childSyncMessage.messageID, message_to_send);
            
            /*
            console.log('Result:');
            console.log(result);
            console.log();
            */
        }
    }
    
    async deleteMessage(message) {
        let syncMessage = this.syncMessageQueue.get(message.id);
        
        for (let x = 0; x < syncMessage.childSyncMessages.length; x++) {
            let childSyncMessage = syncMessage.childSyncMessages[x];
            let syncChannel = this.lookup(childSyncMessage.channelID);
            
            let result = await syncChannel.deleteMessage(childSyncMessage.messageID);
        }
        
        this.syncMessageQueue.delete(message.id);
    }
}

let allSyncGroups = [];

class SyncChannel {
    constructor(channel, syncGroupName) {
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

//
// SyncMessageQueue and SyncMessage classes
//

class SyncMessageQueue {
    constructor(maxQueueSize = 50) {
        this.maxQueueSize = maxQueueSize;
        this.queue        = new Map();
    }
    
    add(syncMessage) {
        this.queue.set(syncMessage.messageID, syncMessage);

        console.log('typeof this.queue');
        console.log(typeof this.queue);
        console.log();
        

        while (this.queue.size > this.maxQueueSize) {
            let queueSize          = this.queue.size;
            let firstSyncMessageID = this.queue.keys().next().value;
            let firstSyncMessage   = this.get(firstSyncMessageID);
            
            console.log('queueSize: ' + queueSize);
            console.log('firstSyncMessageID: ' + firstSyncMessageID);
            console.log('firstSyncMessage:');
            console.log(firstSyncMessage);
            console.log();
            
            this.queue.delete(firstSyncMessageID);
            
            break;
        }
        
        console.log();
    }
    
    get(messageID) {
        return this.queue.get(messageID);
    }
    
    delete(messageID) {
        return this.queue.delete(messageID);
    }
}

class SyncMessage {
    constructor(messageID, channelID, content) {
        this.messageID = messageID;
        this.channelID = channelID;
        this.content   = content;
        this.childSyncMessages = [];
	}
	
	addChildMessage(childSyncMessage) {
	   // console.log('addChildMessage : childSyncMessage:');
	   // console.log(childSyncMessage);
	   // console.log();
	    
	    this.childSyncMessages.push(childSyncMessage);
	}
}

//
// Events Handlers
//

client.on('message', async message => {
    // Ignore messages from the bot
    if (message.author.bot) {
        return;
    }
    
    console.log('Incoming Message:');
    console.log(message);
    console.log();
    
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        if (command === 'ping') {
            message.channel.send('pong');
        
        } else if (command === 'create-group' || command === 'cg') {
            let syncGroup = SyncGroup.lookup(args[0]);
            
            if (syncGroup == null) {
                let syncGroup = new SyncGroup(args[0]);
                allSyncGroups.push(syncGroup);
                
			    message.channel.send('Created sync group: ' + args[0]);
                
                console.log('Sync Group:');
                console.log(syncGroup);
                console.log();
            
            } else {
                message.channel.send('Sync group already exists: ' + args[0]);
            
            }
        
        } else if (command === 'add-channel' || command === 'ac') {
            let syncGroup = SyncGroup.lookup(args[0]);
            
            if (syncGroup == null) {
                message.channel.send('Could not find sync group named: ' + args[0]);
            }
            
            let syncChannel = syncGroup.addChannel(message.channel);
            syncChannel.createWebhook();
            
            message.channel.send('Added channel to sync group: ' + syncGroup.name);
            
            console.log('Sync Channel:');
            console.log(syncChannel);
            console.log();
        
        } else if (command === 'show-group' || command == 'sg') {
            let syncGroup = SyncGroup.lookup(args[0]);
            
            if (syncGroup == null) {
                message.channel.send('Could not find sync group named: ' + args[0]);
            
            } else {
                message.channel.send("Sync group '" + syncGroup.name + "' found with " + syncGroup.syncChannels.length + ' channel(s)');
            
            }
        
        } else {
            message.channel.send('Command not recognized: ' + command);
         
        }
        
        return;
    }
    
    //
    // Otherwise, attempt to sync the message
    //

    // See if we can find a sync group for this message's channel
    let syncGroup = SyncGroup.lookup(message.channel);
    
    if (syncGroup != null) {
        console.log('Found sync group:');
        console.log(syncGroup);
        console.log();

        syncGroup.sendMessage(message);
    } else {
        console.log('Could not find sync group for channel');
        console.log();
    }

});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    // Ignore messages from the bot
    if (newMessage.author.bot) {
        return;
    }
    
    // See if we can find a sync group for this message's channel
    let syncGroup = SyncGroup.lookup(newMessage.channel);
    
    if (syncGroup != null) {
        console.log('Found sync group:');
        console.log(syncGroup);
        console.log();
        
        syncGroup.editMessage(newMessage);
    } else {
        console.log('Could not find sync group for channel');
        console.log();
    }
});

client.on('messageDelete', async message => {
    // Ignore messages from the bot
    if (message.author.bot) {
        return;
    }
    
    // See if we can find a sync group for this message's channel
    let syncGroup = SyncGroup.lookup(message.channel);
    
    if (syncGroup != null) {
        console.log('Found sync group:');
        console.log(syncGroup);
        console.log();
        
        syncGroup.deleteMessage(message);
    } else {
        console.log('Could not find sync group for channel');
        console.log();
    }
});

client.once('ready', () => {
    console.log('ready');

    //
    // Load existing sync groups and channels from Disord itself
    //
    
    console.log('Showing all guilds');
    
    client.guilds.cache.forEach(async guild => {
        console.log('Searching discord: ' + guild.nam + ' [' + guild.id + ']');
        
        guild.channels.cache.forEach(async channel => {
            console.log('  -> Searching channel: #' + channel.name + ' [' + channel.id + ']'); 
              
            if (channel.type == 'text') {
                let webhooks = await channel.fetchWebhooks();
                
                if (webhooks != null & webhooks.size > 0) {
                    //console.log('Webhooks: size = ' + webhooks.size);
                    //console.log(webhooks);
                    
                    for (let webhook of webhooks.values()) {
                        //console.log('  -> Webhook Name = ' + webhook.name);
                        //console.log(webhook);
                        
                        if (webhook.name.startsWith('sync - ')) {
                            let syncGroupName = webhook.name.substring(webhook.name.indexOf('-') + 1).trim();
                            console.log('Found sync group: ' + syncGroupName);

                            let syncGroup = SyncGroup.lookup(syncGroupName);
                            
                            if (syncGroup == null) {
                                syncGroup = new SyncGroup(syncGroupName);
                                allSyncGroups.push(syncGroup);
                            }
                            
                            let syncChannel = syncGroup.addChannel(channel);
                            syncChannel.setWebhook(webhook);
                        }
                    }
                    
                    //console.log();
                }
            }
        });
        
        console.log();
    });

});

/*
client.on('message', message => {
    if (message.content == 'test message') {
        message.channel.send('hello world');
    }
});

client.on('message', message => {
    let query = 'SELECT response FROM jokes WHERE call = ?';
    db.get(query, [message], (err, row) => {
        if (row) {
            message.channel.send(row.response);
        }
    });
});

client.on('message', message => {
    if (message.content == 'dadbot channel id') {
        message.channel.send(message.channel.id);
    }
});

client.on('message', message => {
    if (message.content == 'dadbot guild id') {
        message.channel.send(message.guild.id);
    }
});

client.on('message', message => {
    console.log(message.content);
    if (message.content.substring(0,4) == 'sync') {
        let syncType = message.content.substring(5);
        db.run('INSERT INTO guilds_channels_types(guild_id,channel_id,sync_name,guild_name,channel_name) VALUES(?,?,?,?,?)', [message.guild.id, message.channel.id, syncType, message.guild.name, message.channel.name], err => {
            if (err) {
                console.error(err);
            }

            message.channel.send('channel synced!');
        })

    }
});

client.on('message', message => {
    if (!message.author.bot) {
        let query = 'SELECT sync_name, channel_id FROM guilds_channels_types WHERE channel_id = ?';
        db.get(query, [message.channel.id], async (err, result) => {
            if (err) {
                console.log(err);
            }

            if (result) {
                query = 'SELECT guild_id, channel_id from guilds_channels_types where sync_name = ? AND channel_id != ?';
                db.each(query, [result.sync_name, result.channel_id], (err, result) => {
                    if (err) {
                        console.error(err);
                    }
                    console.log(result.channel_id);
                    sendMessageToChannel(client, result.channel_id, message);
                });
            }

        });
    }
});

async function sendMessageToChannel(client, channelId, message) {
    let channel = await client.channels.fetch(channelId)
    
    channel.send(message.content);
}
*/
