import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default class DatabaseService {
    constructor() {}

    async connect() {
        this.db = await open({
            filename: './db/dadbot.db',
            driver: sqlite3.cached.Database
        });
        console.log('Successfully connected to the Dadabase.');
    }

    async insertChannelSync(guild, channel, syncType) {
        const query = 'INSERT INTO guilds_channels_types(guild_id,channel_id,sync_name,guild_name,channel_name) VALUES(?,?,?,?,?)';
        const bindings = [guild.id, channel.id, syncType, guild.name, channel.name];

        return await this.db.run(query, bindings);
    }

    

}