import dotenv from 'dotenv';
import Discord from 'discord.js';
import sqlite3 from 'sqlite3';

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

const bot_id = '807375870574329907';

// Team Hydra #bunzo-testing-1
const channel_1_id = '807451469422919681';
const hook_1_id    = '808011103262081084';
const hook_1_token = 'XAtR40YAiHA4ifP476VzAvIdfF_mByyEO19Ih39uVissr7seJ1RcYn0WtEfa-DIcfDVJ';

// Team Hydra #bunzo-testing-1
const channel_2_id = '808011371802656770';
const hook_2_id    = '808011390450663475';
const hook_2_token = 'nYgONqbU9HvpFHrGeqHPf4KW1oUz5ryG8FKmNJTIGRCzGKZ5jC8tx6YSMWDzEegnLrqr';

// Team Hydra #bunzo-testing-1
const channel_3_id = '808038005611692072';
const hook_3_id    = '808038095894085663';
const hook_3_token = 'P0PilqzKWkFelaCXk3wTegW4WiZnfTHINltV0TE32A-I9XCeOu8SRT3YnVohOYQ6KA7A';

// Unown Guardians #bunzobot-testing
const channel_4_id = '808038709986852884';
const hook_4_id    = '808041197993984041';
const hook_4_token = 'xGxDRf5tR-dhXrKs5JqWbXuUYLYEwlQiq43V7FzPyoLLvdXVa-gGlZF5zWmVB5z8Fc7D';

const hook_1 = new Discord.WebhookClient(hook_1_id, hook_1_token);
const hook_2 = new Discord.WebhookClient(hook_2_id, hook_2_token);
const hook_3 = new Discord.WebhookClient(hook_3_id, hook_3_token);
const hook_4 = new Discord.WebhookClient(hook_4_id, hook_4_token);

discordClient.on('message', message => {
    //if (message.author.id == bot_id) {
    if (message.author.bot) {
        return
    }
    
    console.log('Incoming Message:');
    console.log(message);
    console.log();
    
    /*
    let message_to_send = {
        content: message.content,
        username: message.author.username,
        avatar_url: message.author.displayAvatarURL()
    };
    */

    let message_to_send = {
        content: message.content
    };
    
    let options = {
        username: message.author.username,
        avatarURL: message.author.displayAvatarURL()
    }
    
    console.log('Outgoing Message:');
    console.log(message_to_send);
    console.log();
    
    console.log('Webhook Message Options:');
    console.log(options);
    console.log();
    
    switch (message.channel.id) {
        case channel_1_id: 
            hook_2.send(message_to_send.content, options);
            hook_3.send(message_to_send.content, options);
            hook_4.send(message_to_send.content, options);
            break;
        
        case channel_2_id: 
            hook_1.send(message_to_send.content, options);
            hook_3.send(message_to_send.content, options);
            hook_4.send(message_to_send.content, options);
            break;
        
        case channel_3_id: 
            hook_1.send(message_to_send.content, options);
            hook_2.send(message_to_send.content, options);
            hook_4.send(message_to_send.content, options);
            break;
        
        case channel_4_id: 
            hook_1.send(message_to_send.content, options);
            hook_2.send(message_to_send.content, options);
            hook_3.send(message_to_send.content, options);
            break;
    }
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
