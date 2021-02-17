
// Load external classes
const Discord = require('discord.js');

class Snowflake {
    static generate() {
        return Discord.SnowflakeUtil.generate();
    }
}

module.exports = Snowflake;
