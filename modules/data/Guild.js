
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel       = require(`${ROOT}/modules/BaseModel`);
const Timestamp       = require(`${ROOT}/modules/Timestamp`);
const Parameter       = require(`${ROOT}/modules/data/Parameter`);
const DuplicateError  = require(`${ROOT}/modules/error/DuplicateError`);
const PermissionError = require(`${ROOT}/modules/error/PermissionError`);

// Load external modules
const MessageMentions = require('discord.js').MessageMentions;
const Permissions     = require('discord.js').Permissions;

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Guild extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'guild',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'id',              type: 'snowflake', nullable: false },
            { dbFieldName: 'alliance_id',     type: 'snowflake', nullable: true, refTableName: 'alliance' },
            { dbFieldName: 'clan_name',       type: 'string',    nullable: true, length: 32 },
            { dbFieldName: 'clan_short_name', type: 'string',    nullable: true, length: 32 },
            { dbFieldName: 'clan_bungie_num', type: 'integer',   nullable: true },
            { dbFieldName: 'timezone',        type: 'string',    nullable: true, length: 32 }
        ]
    });
    
    static PARAMETER_NAME_ADMIN_CHANNEL = 'admin-channel';
    static PARAMETER_NAME_ADMIN_ROLE    = 'admin-role';
    
    constructor(data) {
        super(data);
        
        for (let f = 0; f < this.schema.fields.length; f++) {
            const field = this.schema.fields[f];
            console.log(field);
        }
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    // No custom getters required
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static checkPermLevel(message, permLevel, permRole) {
        switch (permRole) {
            case 'owner': return message.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR);
            case 'admin': return message.member.hasPermission(Permissions.FLAGS.ADMINISTRATOR);
        }
        
        throw new PermissionError(`Invalid permission level: ${permLevel}`);
    }
    
    static parseConditions(conditions) {
        // Check for a clan name or clan short name search
        if (conditions.clanNameOrShortName) {
            return (query) => {
                query.where('clan_name', conditions.clanName)
                    .orWhere('clan_short_name', conditions.clanShortName.toUpperCase());
            };
        }
        
        // Handle any special fields
        const parsedConditions = conditions;
        
        if (parsedConditions.clanShortName) {
            parsedConditions.clanShortName = parsedConditions.clanShortName.toUpperCase();
        }
        
        return parsedConditions;
    }
        
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const guild = await Guild.get({'id': this.id, unique: true});
        
        // Check if this is a duplicate alliance
        if (guild) {
            throw new DuplicateError(`Guild already exists`);
        }
        
        // And attempt to create the damn thing
        await BaseModel.prototype.create.call(this);
    }
    
    async getMessageContent() {
        const lines = [];
        const parameterQuery = {
            type: 'guild',
            guildId: this.id
        };
        const parameters = await Parameter.get(parameterQuery);
        
        lines.push(`Alliance ID: ${this.allianceId ? this.allianceId : 'None'}`);
        lines.push(`Clan Name: ${this.clanName ? this.clanName : 'None'}`);
        lines.push(`Clan Short Nume: ${this.clanShortName ? this.clanShortName : 'None'}`);
        lines.push(`Clan Group ID: ${this.clanBungieNum ? this.clanShortName : 'None'}`);
        lines.push(`Time Zone: ${this.timezone ? this.timezone : 'None'}`);
        
        for (let p = 0; p < parameters.length; p++) {
            const parameter = parameters[p];
            lines.push(`Parameter[${parameter.name}]: ${parameter.value ? parameter.value : 'None'}`);
        }
        
        return '**__Discord Clan__**\n```' + lines.join('\n') + '```';
    }
    
    async getTitle() {
        const suffix = ( this.clanShortName ? ` [${this.clanShortName}]` : '' );
        
        if (this.clanName) {
            return this.clanName + suffix;
        } else {
            const discordGuild = await client.guilds.fetch(this.id);
            return discordGuild.name + suffix;
        }
    }
    
    getClanURL() {
        if (!this.clanBungieNum) {
            return null;
        }
        
        return `https://www.bungie.net/en/ClanV2?groupid=${this.clanBungieNum}`;
    }
    
    // ***************************************** //
    // * Properties Array for User Interaction * //
    // ***************************************** //
    
    static getEditableProperties(context) {
        const properties = [];
        
        properties.push({
            name: 'Name',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(
                    `What is the name of this clan? `
                  + `Enter 'None' to remove the current value.`
                );
            },
            
            collect: async (message, nextMessage) => {
                context.guild.clanName = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        properties.push({
            name: 'Short Name',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(
                    `What is the short name of this clan? `
                  + `This is the four character code that is assigned to it. `
                  + `Enter 'None' to remove the current value.`
                );
            },
            
            collect: async (message, nextMessage) => {
                context.guild.clanShortName = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        properties.push({
            name: 'Group ID',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(
                    `What is the group ID of this clan? `
                  + `This is the number at the end of the clan invite URL. `
                  + `For example, 1234567 for <https://www.bungie.net/en/ClanV2?groupid=1234567>. `
                  + `Enter 'None' to remove the current value.`
                );
            },
            
            collect: async (message, nextMessage) => {
                context.guild.clanBungieNum = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        properties.push({
            name: 'Time Zone',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(
                    `What is the primary time zone of this clan? `
                  + `Enter 'None' to remove the current value.`
                );
            },
            
            collect: async (message, nextMessage) => {
                const timezone = nextMessage.content;
                
                if (!Timestamp.timeZoneIsValid(timezone)) {
                    message.channel.send(`Invalid time zone: ${timezone}`);
                    return;
                }
                
                context.guild.timezone = timezone;
                if (context.create) properties.shift();
            }
        });
        
        properties.push({
            name: 'Admin Channel',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(
                    `In what channel would you like to administrate Ninkasi? `
                  + `Please provide a reference to the channel name using #<channel-name>.`
                );
            },
            
            collect: async (message, nextMessage) => {
                const parameterName = Guild.PARAMETER_NAME_ADMIN_CHANNEL;
                
                let parameter = context.parameters[parameterName];
                let parameterData = {
                    type: 'guild',
                    guildId: message.guild.id,
                    name: parameterName,
                    unique: true
                };
                
                if (!parameter) {
                    parameter = await Parameter.get(parameterData);
                }
                
                if (!parameter) {
                    delete parameterData.unique;
                    parameterData.creatorId = message.author.id;
                    parameterData.updaterId = message.author.id;
                    
                    parameter = new Parameter(parameterData);
                }
                
                if (!parameter) {
                    throw new Error(`Unable to retrieve or create parameter: ${parameterName} [guild id = ${message.guild.id}]`);
                }
                
                // Queue the update
                let adminChannelMention = nextMessage.content;
                let adminChannelId;
                
                if (adminChannelMention.toLowerCase() == 'none') {
                    adminChannelMention = null;
                } else {
                    const SNOWFLAKE_REGEX = /[\d]{18,20}/;
                    const isChannelMention = MessageMentions.CHANNELS_PATTERN.test(adminChannelMention);
                    
                    if (!isChannelMention) {
                        client.sendAndDelete(`Invalid channel: ${adminChannelMention}`, message.channel);
                        return;
                    }
                    
                    adminChannelId = adminChannelMention.match(SNOWFLAKE_REGEX)[0];
                    const discordChannel = await client.channels.fetch(adminChannelId);
                    
                    if (!discordChannel) {
                        client.sendAndDelete(`${adminChannelMention} is not a discord channel`, message.channel);
                        return;
                    }
                }
                parameter.value     = adminChannelId;
                parameter.updaterId = message.author.id;
                await parameter.update();
                context.parameters[parameterName] = parameter;
                
                if (context.create) properties.shift();
            }
        });
        
        properties.push({
            name: 'Admin Role',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(
                    `What role do you want to allow to manage Ninkasi for this Discord clan? `
                  + `Please provide a reference to the role name using <@role-name>`
                );
            },
            
            collect: async (message, nextMessage) => {
                const parameterName = Guild.PARAMETER_NAME_ADMIN_ROLE;
                
                let parameter = context.parameters[parameterName];
                let parameterData = {
                    type: 'guild',
                    guildId: message.guild.id,
                    name: parameterName,
                    unique: true
                };
                
                if (!parameter) {
                    parameter = await Parameter.get(parameterData);
                }
                
                if (!parameter) {
                    delete parameterData.unique;
                    parameterData.creatorId = message.author.id;
                    parameterData.updaterId = message.author.id;
                    
                    parameter = new Parameter(parameterData);
                }
                
                if (!parameter) {
                    throw new Error(`Unable to retrieve or create parameter: ${parameterName} [guild id = ${message.guild.id}]`);
                }
                
                // Queue the update
                let adminRoleMention = nextMessage.content;
                let adminRoleId;
                
                if (adminRoleMention.toLowerCase() == 'none') {
                    adminRoleMention = null;
                } else {
                    const SNOWFLAKE_REGEX = /[\d]{18,20}/;
                    const isRoleMention = MessageMentions.ROLES_PATTERN.test(adminRoleMention);
                    
                    if (!isRoleMention) {
                        client.sendAndDelete(`Invalid role: ${adminRoleMention}`, message.channel);
                        return;
                    }
                    
                    adminRoleId = adminRoleMention.match(SNOWFLAKE_REGEX)[0];
                    const discordRole = await message.guild.roles.fetch(adminRoleId);
                    
                    if (!discordRole) {
                        client.sendAndDelete(`${adminRoleMention} is not a discord role`, message.channel);
                        return;
                    }
                }
                parameter.value     = adminRoleId;
                parameter.updaterId = message.author.id;
                await parameter.update();
                context.parameters[parameterName] = parameter;
                
                if (context.create) properties.shift();
            }
        });
        
        //properties.push({
        //    name: 'Admin Role',
        //    
        //    prompt: async (message, nextMessage) => {
        //        await message.channel.send(
        //            `What role do you want to allow to manage Ninkasi for this Discord clan? `
        //          + `Please provide a reference to the role name using <@role-name>`
        //        );
        //    },
        //    
        //    collect: async (message, nextMessage) => {
        //        context.guild.clanBungieNum = nextMessage.content;
        //        if (context.create) properties.shift();
        //    }
        //});
        
        // Finally return the damn thing
        return properties;
    }
}

module.exports = Guild;
