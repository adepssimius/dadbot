
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel = require(`${ROOT}/modules/BaseModel`);
const EmojiMap  = require(`${ROOT}/modules/EmojiMap`);
const Snowflake = require(`${ROOT}/modules/Snowflake`);
const Timestamp = require(`${ROOT}/modules/Timestamp`);
const Guardian  = require(`${ROOT}/modules/data/Guardian`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Event extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'event',
        orderBy: 'start_time',
        fields: [
            { dbFieldName: 'id', type: 'snowflake', nullable: false },
            { dbFieldName: 'activity_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'activity_category_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'guild_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'channel_name', type: 'string', length: 32, nullable: false },
            { dbFieldName: 'description', type: 'string', length: 256, nullable: true },
            { dbFieldName: 'platform', type: 'string', length: 16, nullable: false },
            { dbFieldName: 'start_time', type: 'datetime', nullable: false },
            { dbFieldName: 'est_max_duration', type: 'integer', nullable: false },
            { dbFieldName: 'fireteam_size', type: 'integer', nullable: false },
            { dbFieldName: 'is_private', type: 'boolean', nullable: false },
            { dbFieldName: 'auto_delete', type: 'boolean', nullable: false },
            { dbFieldName: 'creator_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'owner_id', type: 'snowflake', nullable: false }
        ]
    });
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get ts() {
        return this.temp.ts;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set ts(value) {
        this.temp.ts = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    //static parseConditions(conditions) {
    //    return conditions;
    //}
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Make sure the owner is in the database
        if (await this.getOwner() == null) {
            this.owner = new Guardian({id: this.creatorId});
            await this.owner.create();
        }
        
        // Generate the id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
    
    async delete() {
        await BaseModel.prototype.delete.call(this);
    }
    
    async toMessageContent() {
        const activity         = await this.getActivity();
        const activityCategory = await this.getActivityCategory();
        const creator          = await this.getCreator();
        const owner            = await this.getOwner();
        
        const startTs = new Timestamp(this.startTime);
        const startDate = startTs.formatDate();
        const startTime = startTs.formatTime('short');
        
        const participants = [];
        const alternates   = [];
        
        const participantNames = [];
        
        const embed = new Discord.MessageEmbed()
            .setTitle(`${activity.name} [${activityCategory.name}]`)
            .addFields(
                { name: 'Date', value: startDate, inline: true },
                { name: 'Time', value: startTime, inline: true }
            )
            .addFields(
                { name: 'Privacy', value: ( this.isPrivate ? 'Clan' : 'Alliance' ), inline: true },
                { name: 'Auto Remove Event', value: ( this.autoDelete ? `${this.estMaxDuration} minutes after start` : 'No' ), inline: true }
            )
            .addField('Description', ( this.description ? this.description : 'No description given' ))
            .addField(
                `Guardians Joined: ${participants.length}/${this.fireteamSize}`,
                ( participantNames.length == 0 ? 'None Yet' : participantNames.join(', ') )
            )
            .setTimestamp()
            .setFooter(`Creator: ${creator.username} • Owner: ${owner.username}`);
        
        return embed;
    }
    
    async deriveChannelName() {
        const activity = this.getActivity();
        const tsParts = this.ts.formatToParts();
        
        client.logger.debug('activity Aliases:');
        client.logger.dump(activity);
        
        client.logger.debug('Timestamp Parts:');
        client.logger.dump(tsParts);
        
        const weekday      = tsParts.find(element => element.type == 'weekday').value;
        const hour         = tsParts.find(element => element.type == 'hour').value;
        const minute       = tsParts.find(element => element.type == 'minute').value;
        const dayPeriod    = tsParts.find(element => element.type == 'dayPeriod').value;
        const timeZoneName = tsParts.find(element => element.type == 'timeZoneName').value;
        const channelName  = `${activity.shortName}-${weekday}-${hour}${minute == 0 ? '' : minute}${dayPeriod}-${timeZoneName}`;
        
        return channelName.toLowerCase();
    }
    
    async deriveChannelTopic() {
        const startTs  = new Timestamp(this.startTime);
        const Activity = require(`${ROOT}/modules/data/Activity`);
        const activity = await this.getActivity();
        
        return `${activity.name} @ ${startTs.convert()}`;
    }
    
    // ****************************************************** //
    // * Instance Methods - Channel and Reaction Management * //
    // ****************************************************** //
    
    async setupEventChannels(message) {
        const eventMessageContent = await this.toMessageContent();
        const EventChannel = require(`${ROOT}/modules/data/EventChannel`);
        let   eventChannel = await EventChannel.get({eventId: this.id, guildId: this.guildId, unique: true});
        
        if (eventChannel) {
            throw new Error(`There is already event channel in this discord clan for this event`);
        }
        
        // First create the channel for the originating guild
        const channel = await message.guild.channels.create(await this.deriveChannelName(), {
            type: 'text',
            topic: await this.deriveChannelTopic(),
            nsfw: false,
            parent: message.channel.parent
        });
        
        // Save the event channel to the database
        eventChannel = new EventChannel({
            channelId: channel.id,
            eventId: this.id,
            guildId: message.guild.id,
            guildName: message.guild.name
        });
        await eventChannel.create();
        
        // Send the event info to the new channel
        channel.send(eventMessageContent);
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getActivityAliases() {
        const ActivityAlias = require(`${ROOT}/modules/data/ActivityAlias`);
        return await ActivityAlias.get({activityId: this.activityId});
    }
    
    // ***************************************** //
    // * Properties Array for User Interaction * //
    // ***************************************** //
    
    static getEditableProperties(context) {
        const properties = [];
        
        // Category: varchar(20) -> Category table
        properties.push({
            name: 'Category',
            
            prompt: async (message, nextMessage) => {
                const ActivityCategory = require(`${ROOT}/modules/data/ActivityCategory`);
                const activityCategories = await ActivityCategory.get();
                
                // Build the options
                const emojiMap    = new Map();
                const options     = [];
                const menuOptions = [];
                
                // Get the options ready
                for (let x = 0; x < activityCategories.length; x++) {
                    const activityCategory = activityCategories[x];
                    const emoji = EmojiMap.get(activityCategory.symbol);
                    options.push({emoji: emoji, menuOption: activityCategory.title, value: activityCategory});
                }
                
                // Build the emoji map and menu
                for (let x = 0; x < options.length; x++) {
                    const option = options[x];
                    
                    emojiMap.set(option.emoji, option.value);
                    menuOptions.push(`${option.emoji} - ${option.menuOption}`);
                }
                context.emojiMap = emojiMap;
                
                // Send the prompt
                await message.channel.send(
                    `To choose an activity type, first choose an activity category. `
                  + `Please choose a reaction or respond via text. `
                  + `If you know an alias for the activity, you can also enter that and skip ahead.`
                );
                
                const embed = new Discord.MessageEmbed().addFields({
                    name: 'Activity Categories',
                    value: menuOptions.join('\n').trim()
                });
                const replyMessage = await message.channel.send(embed);
                
                // Apply the reactions
                const react = async () => {
                    context.stopReacting = false;
                    for (let emoji of emojiMap.keys()) {
                        replyMessage.react(emoji);
                        if (context.stopReacting) return;
                    }
                }; react();
                
                context.propertyCollector = replyMessage.createReactionCollector(async (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                });
                
                context.propertyCollector.on('collect', async (reaction, user) => {
                    context.stopReacting = false;
                    
                    const activityCategory = context.emojiMap.get(reaction.emoji.name);
                    if (activityCategory) {
                        await context.propertyCollector.stop();
                        context.event.activityCategory = activityCategory;
                        
                        if (context.create) {
                            properties.shift();
                            await properties[0].prompt(message, nextMessage);
                        } else {
                            context.eventEditorMessageCollector.stop();
                        }
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                context.stopReacting = false;
                context.propertyCollector.stop();
                
                const ActivityCategory = require(`${ROOT}/modules/data/ActivityCategory`);
                const Activity         = require(`${ROOT}/modules/data/Activity`);
                let   activity;
                
                // First attempt to get it using the activity category name or symbol
                const activityCategory = await ActivityCategory.get({
                    nameOrSymbol: true,
                    name: nextMessage.content,
                    symbol: nextMessage.content,
                    unique: true
                });
                
                // If we did not get a match, search for an activity
                if (activityCategory) {
                    context.event.activityCategoryId = activityCategory.id;
                
                } else {
                    activity = await Activity.get({
                        nameOrAlias: true,
                        name: nextMessage.content,
                        alias: nextMessage.content,
                        unique: true
                    });
                    
                    if (!activity) {
                        await message.channel.send(`Activity or category not found: ${nextMessage.content}`);
                        return;
                    }
                    
                    message.channel.send(`Event type found: ${activity.title}`);
                    context.event.activity = activity;
                }
                
                if (context.create) {
                    properties.shift();
                    
                    // If we already have an activity, shift properties again since we skipped ahead
                    if (activity) properties.shift();
                }
            }
        });
        
        // Activity: varchar(20) -> Activity table
        properties.push({
            name: 'Activity',
            
            prompt: async (message, nextMessage) => {
                const Activity = require(`${ROOT}/modules/data/Activity`);
                const activities = await Activity.get({activityCategoryId: context.event.activityCategoryId});
                
                // Build the options
                const emojiMap    = new Map();
                const options     = [];
                const menuOptions = [];
                
                // Get the options ready
                let emoji = EmojiMap.get('a');
                for (let x = 0; x < activities.length; x++) {
                    const activity = activities[x];
                    options.push({emoji: emoji, menuOption: activity.title, value: activity});
                    emoji = EmojiMap.next(emoji);
                }
                
                // Build the emoji map and menu
                for (let x = 0; x < options.length; x++) {
                    const option = options[x];
                    
                    emojiMap.set(option.emoji, option.value);
                    menuOptions.push(`${option.emoji} - ${option.menuOption}`);
                }
                context.emojiMap = emojiMap;
                
                // Send the prompt
                await message.channel.send(
                    `Choose an activity. `
                  + `You can select a reaction or respond via text. `
                  + `If you know an alias for the activity, you can also provide that now.`
                );
                
                const embed = new Discord.MessageEmbed().addFields({
                    name: 'Activities',
                    value: menuOptions.join('\n')
                });
                const replyMessage = await message.channel.send(embed);
                
                // Apply the reactions
                const react = async () => {
                    context.stopReacting = false;
                    for (let emoji of emojiMap.keys()) {
                        replyMessage.react(emoji);
                        if (context.stopReacting) return;
                    }
                }; react();
                
                context.propertyCollector = replyMessage.createReactionCollector(async (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                });
                
                context.propertyCollector.on('collect', async (reaction, user) => {
                    context.stopReacting = false;
                    
                    const activity = context.emojiMap.get(reaction.emoji.name);
                    if (!activity) {
                        message.channel.send(`Invalid reaction`);
                        return;
                    }
                    
                    await context.propertyCollector.stop();
                    context.event.activity = activity;
                    
                    if (context.create) {
                        context.properties.shift();
                        await properties[0].prompt(message, nextMessage);
                    } else {
                        context.editorMessageCollector.stop();
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                context.stopReacting = false;
                context.propertyCollector.stop();
                
                const emoji    = EmojiMap.get(nextMessage.content);
                const Activity = require(`${ROOT}/modules/data/Activity`);
                let   activity;
                
                if (emoji) {
                    activity = context.emojiMap.get(emoji);
                }
                
                if (!activity) {
                    activity = await Activity.get({
                        nameOrAlias: true,
                        name: nextMessage.content,
                        alias: nextMessage.content,
                        unique: true
                    });
                    
                    if (!activity) {
                        await message.channel.send(`Activity not found: ${nextMessage.content}`);
                        return;
                    }
                    
                    if (activity.activityCategoryId != context.event.activityCategoryId) {
                        await message.channel.send(`Activity entered is from a different category then was chosen`);
                        return;
                    }
                }
                
                message.channel.send(`Event type found: ${activity.title}`);
                context.event.activity = activity;
                
                if (context.create) properties.shift();
            }
        });
        
        // Start Date: timestamp
        properties.push({
            name: 'Start Date',
            
            prompt: async (message, nextMessage) => {
                const now = new Timestamp();
                
                const emojiMap    = new Map();
                const options     = [];
                const menuOptions = [];
                
                // Build the options
                let emoji = EmojiMap.get('a');
                for (let x = 0; x < 14; x++) {
                    options.push({emoji: emoji, menuOption: now.getMenuOption(x), value: now.addDays(x)});
                    emoji = EmojiMap.next(emoji);
                }
                
                // Build the emoji map and menu
                for (let x = 0; x < options.length; x++) {
                    const option = options[x];
                    emojiMap.set(option.emoji, option.value);
                    menuOptions.push(`${option.emoji} - ${option.menuOption}`);
                }
                context.emojiMap = emojiMap;
                
                // Send the prompt
                await message.channel.send(`On what day will this event take place? Please choose a reaction or enter a letter via text.`);
                const embed = new Discord.MessageEmbed().addFields({
                    name: 'Event Date',
                    value: menuOptions.join('\n')
                });
                const replyMessage = await message.channel.send(embed);
                
                // Apply the reactions
                const react = async () => {
                    context.stopReacting = false;
                    for (let emoji of emojiMap.keys()) {
                        await replyMessage.react(emoji);
                        if (context.stopReacting) return;
                    }
                }; react();
                
                context.propertyCollector = replyMessage.createReactionCollector(async (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                });
                
                context.propertyCollector.on('collect', async (reaction, user) => {
                    context.stopReacting = true;
                    
                    const eventDate = context.emojiMap.get(reaction.emoji.name);
                    if (eventDate) {
                        message.channel.send(`Event date: ${eventDate.formatDate()}`);
                        context.eventDate = eventDate;
                        context.propertyCollector.stop();
                        
                        if (context.create) {
                            properties.shift();
                            await properties[0].prompt(message, nextMessage);
                        } else {
                            context.editorMessageCollector.stop();
                        }
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                context.stopReacting = true;
                
                const emoji = EmojiMap.get(nextMessage.content);
                const eventDate = (emoji ? context.emojiMap.get(emoji) : null);
                
                if (!eventDate) {
                    await message.channel.send(`Event date not found: ${nextMessage.content}`);
                    return;
                }
                
                message.channel.send(`Event date: ${eventDate.formatDate()}`);
                context.eventDate = eventDate;
                context.propertyCollector.stop();
                
                if (context.create) properties.shift();
            }
        });
        
        // Start Time: varchar(32)
        properties.push({
            name: 'Event Time',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(`What time will the event take place?`);
            },
            
            collect: async (message, nextMessage) => {
                context.eventTime = nextMessage.content;
                
                try {
                    var tsString = `${context.eventDate.formatDate('long')} ${context.eventTime}`;
                    var ts       = new Timestamp(new Date(tsString), context.eventDate.tz);
                } catch (error) {
                    message.channel.send(`Invalid time: ${tsString}`);
                    return;
                }
                
                await message.channel.send(`Event date and time: ${ts.convert()}`);
                context.event.startTime = ts.ts;
                context.event.ts = ts;
                
                if (context.create) properties.shift();
            }
        });
        
        // Finally return the damn thing
        return properties;
    }
}

module.exports = Event;
