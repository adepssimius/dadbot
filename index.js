import dotenv from 'dotenv';
import Discord from 'discord.js';
import sqlite3 from 'sqlite3';
import axios from 'axios';

// set up dotenv
dotenv.config();

// get the db going
let db = new sqlite3.Database('./db/dadbot.db', (err) => {
    if (err) {
        console.error(err.message)
    }

    console.log('Connected to the dadabase.')
});

const discordClient = new Discord.Client();
discordClient.login(process.env.BOT_TOKEN);

discordClient.once('ready', () => {
    console.log('ready');
});

//
// Constants
//

const bot_id = '807375870574329907';
const prefix = '%';

//
// Functions
//

async function http_post(url, data) {
    return await axios({
        method: 'post',
        url: url,
        data: data
    });
}

//
// Prototype Classes
//

class SyncGroup {
    constructor(name) {
		this.name = name;
        this.channels = [];
    }
	
	addChannel(channel) {
        let syncChannel = new SyncChannel(channel, this.name);
        this.channels.push(syncChannel);
        return syncChannel;
    }
    
    syncMessage(message) {
        let message_to_send = {
            content: message.content,
            username: message.author.username,
            avatar_url: message.author.displayAvatarURL()
        };
        
        console.log('Outgoing Message:');
        console.log(message_to_send);
        console.log();

        this.channels.forEach(channel => channel.syncMessage(message, message_to_send));
    }
}

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
    
    syncMessage(message, message_to_send) {
        if (message.channel.id != this.channel.id) {
            http_post(this.webhook.url, message_to_send);
        }
    }
}

//
// Manually build the Syncronization Group
//

/*

// Team Hydra #bunzo-testing-1
const channel_1_id = '807451469422919681';
const hook_1_id    = '808011103262081084';
const hook_1_token = 'XAtR40YAiHA4ifP476VzAvIdfF_mByyEO19Ih39uVissr7seJ1RcYn0WtEfa-DIcfDVJ';
const hook_1_url   = 'https://discord.com/api/webhooks/' + hook_1_id + '/' + hook_1_token;

// Team Hydra #bunzo-testing-1
const channel_2_id = '808011371802656770';
const hook_2_id    = '808011390450663475';
const hook_2_token = 'nYgONqbU9HvpFHrGeqHPf4KW1oUz5ryG8FKmNJTIGRCzGKZ5jC8tx6YSMWDzEegnLrqr';
const hook_2_url   = 'https://discord.com/api/webhooks/' + hook_2_id + '/' + hook_2_token;

// Team Hydra #bunzo-testing-1
const channel_3_id = '808038005611692072';
const hook_3_id    = '808038095894085663';
const hook_3_token = 'P0PilqzKWkFelaCXk3wTegW4WiZnfTHINltV0TE32A-I9XCeOu8SRT3YnVohOYQ6KA7A';
const hook_3_url   = 'https://discord.com/api/webhooks/' + hook_3_id + '/' + hook_3_token;

// Unown Guardians #bunzobot-testing
const channel_4_id = '808038709986852884';
const hook_4_id    = '808041197993984041';
const hook_4_token = 'xGxDRf5tR-dhXrKs5JqWbXuUYLYEwlQiq43V7FzPyoLLvdXVa-gGlZF5zWmVB5z8Fc7D';
const hook_4_url   = 'https://discord.com/api/webhooks/' + hook_4_id + '/' + hook_4_token;
*/


let syncGroup = null;

discordClient.on('message', async message => {
    // Ignore messages from the bot
    if (message.author.bot) {
        return
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
		    syncGroup = new SyncGroup(args[0]);
            
			message.channel.send('Created sync group: ' + args[0]);
            
            console.log('Sync Group:');
            console.log(syncGroup);
            console.log();
        
        } else if (command === 'add-channel' || command === 'ac') {
            let syncChannel = syncGroup.addChannel(message.channel);
            syncChannel.createWebhook();
            
            message.channel.send('Added channel to sync group: ' + syncGroup.name);
            
            console.log('Sync Channel:');
            console.log(syncChannel);
            console.log();
        
        }
        
        return;
    }
    
    // Otherwise, attempt to sync the message
    syncGroup.syncMessage(message);

});

/*
discordClient.on('message', message => {
    if (message.content == 'test message') {
        message.channel.send('hello world');
    }
});

discordClient.on('message', message => {
    let query = 'SELECT response FROM jokes WHERE call = ?';
    db.get(query, [message], (err, row) => {
        if (row) {
            message.channel.send(row.response);
        }
    });
});

discordClient.on('message', message => {
    if (message.content == 'dadbot channel id') {
        message.channel.send(message.channel.id);
    }
});

discordClient.on('message', message => {
    if (message.content == 'dadbot guild id') {
        message.channel.send(message.guild.id);
    }
});

discordClient.on('message', message => {
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

discordClient.on('message', message => {
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
                    sendMessageToChannel(discordClient, result.channel_id, message);
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
