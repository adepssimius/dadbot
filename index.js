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


