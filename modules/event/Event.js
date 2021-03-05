
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel = require(`${ROOT}/modules/BaseModel`);
const EmojiMap  = require(`${ROOT}/modules/EmojiMap`);
const Snowflake = require(`${ROOT}/modules/Snowflake`);
const Timestamp = require(`${ROOT}/modules/Timestamp`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Event extends BaseModel {
    static tableName = 'event';
    static orderBy   = 'start_time';
    static fields    = [ 'id'
                       , 'activity_id'
                       , 'activity_category_id'
                       , 'alliance_id'
                       , 'guild_id'
                       , 'channel_name'
                       , 'platform'
                       , 'description'
                       , 'start_time'
                       , 'fireteam_size'
                       , 'est_max_duration'
                       , 'is_private'
                       , 'auto_delete'
                       , 'creator_id'
                       , 'owner_id' ];
    
    static fieldMap  = BaseModel.getFieldMap(Event.fields);
	temp = {};
    
    constructor(data) {
        super(Event, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return Event.tableName;
    }
    
    get activityId() {
        return this.data.activity_id;
    }
    
    get activityCategoryId() {
        return this.data.activity_category_id;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    get guildId() {
        return this.data.guild_id;
    }
    
    get channelName() {
        return this.data.channel_name;
    }
    
    get platform() {
        return this.data.platform;
    }
    
    get description() {
        return this.data.description;
    }
    
    get startTime() {
        return this.data.start_time;
    }
    
    get fireteamSize() {
        return this.data.fireteam_size;
    }
    
    get estMaxDuration() {
        return this.data.est_max_duration;
    }
    
    get isPrivate() {
        return this.data.is_private;
    }
    
    get autoDelete() {
        return this.data.auto_delete;
    }
    
    get creator_id() {
        return this.data.creator_id;
    }
    
    get owner_id() {
        return this.data.owner_id;
    }
    
    get activity() {
        return this.temp.activity;
    }
    
    get activityCategory() {
        return this.temp.activityCategory;
    }
    
    get ts() {
        return this.temp.ts;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set activityId(value) {
        this.data.activity_id = value;
    }
    
    set activityCategoryId(value) {
        this.data.activity_category_id = value;
    }
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    set guildId(value) {
        this.data.guild_id = value;
    }
    
    set channelName(value) {
        this.data.channel_name = value;
    }
    
    set platform(value) {
        this.data.platform = value;
    }
    
    set description(value) {
        this.data.description = value;
    }
    
    set startTime(value) {
        this.data.start_time = value;
    }
    
    set fireteamSize(value) {
        this.data.fireteam_size = value;
    }
    
    set estMaxDuration(value) {
        this.data.est_max_duration = value;
    }
    
    set isPrivate(value) {
        this.data.is_private = value;
    }
    
    set autoDelete(value) {
        this.data.auto_delete = value;
    }
    
    set creatorId(value) {
        this.data.creator_id = value;
    }
    
    set ownerId(value) {
        this.data.owner_id = value;
    }
    
    set activity(value) {
        this.temp.activity      = value;
        this.activityId         = value.id;
        this.activityCategoryId = value.activityCategoryId;
        this.fireteamSize       = value.fireteamSize;
        this.estMaxDuration     = value.estMaxDuration;
    }
    
    set activityCategory(value) {
        this.temp.activityCategory = value;
        this.activityCategoryId    = value.id;
    }
    
    set ts(value) {
        this.temp.ts = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        return conditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Create the ID for this event
        this.id = Snowflake.generate();
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
    
    async delete() {
        await BaseModel.prototype.delete.call(this);
    }
    
    async toMessageContent() {
        /*
        const activityCategory = await this.getActivityCategory();
        const activityAliases  = await this.getActivityAliases();
        
        //
        // TODO - Make this prettier
        //
        
        const aliases = await this.getActivityAliasStrings();
        const aliasList = ( activityAliases.length > 0 ? aliases.join(', ') : 'No aliases for this activity' );
        
        const embed = new Discord.MessageEmbed()
            .setTitle('Scheduled Event')
            .addFields(
                { name: 'Name', value: this.name },
                { name: 'Aliases', value: aliasList },
                { name: 'Category', value: `${activityCategory.title}` },
                { name: 'Maximum Fireteam Size', value: this.fireteamSize },
                { name: 'Estimated Maximum Duration', value: `${this.estMaxDuration} minutes` }
            );
        
        return embed;
        */
        
        return `TBD`;
    }
    
    async deriveChannelName() {
        const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
        const activityAliases = await ActivityAlias.get({activityId: this.activityId});
        const alias = activityAliases[0].alias;
        const tsParts = this.ts.formatToParts();
        
        client.logger.debug('Activity Aliases:');
        client.logger.dump(activityAliases);
        
        client.logger.debug('Timestamp Parts:');
        client.logger.dump(tsParts);
        
        const weekday      = tsParts.find(element => element.type == 'weekday').value;
        const hour         = tsParts.find(element => element.type == 'hour').value;
        const minute       = tsParts.find(element => element.type == 'minute').value;
        const dayPeriod    = tsParts.find(element => element.type == 'dayPeriod').value;
        const timeZoneName = tsParts.find(element => element.type == 'timeZoneName').value;
        const channelName  = `${alias}-${weekday}-${hour}${minute == 0 ? '' : minute}${dayPeriod}-${timeZoneName}`;
        
        return channelName.toLowerCase();
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getActivity() {
        const Activity = require(`${ROOT}/modules/event/Activity`);
        const activity = await Activity.get({id: this.id, unique: true});
        
        if (!activity) {
            throw new Error(`Unexpectedly did not find an activity for activity_id = '${this.activityId}'`);
        }
        
        return activity;
    }
    
    async getActivityCategory() {
        const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
        const activityCategory = await ActivityCategory.get({id: this.activityCategoryId, unique: true});
        
        if (!activityCategory) {
            throw new Error(`Unexpectedly did not find an activity category for id = '${this.activityId}'`);
        }
        
        return activityCategory;
    }
    
    async getActivityAliases() {
        const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
        return await ActivityAlias.get({activityId: this.activityId});
    }
    
    async getAlliance() {
        const Alliance = require(`${ROOT}/modules/alliance/Alliance`);
        const alliance = await Alliance.get({id: this.allianceId, unique: true});
        
        if (!alliance) {
            throw new Error(`Unexpectedly did not find an alliance for id = '${this.allianceId}'`);
        }
        
        return alliance;
    }
    
    async getGuild() {
        const Guild = require(`${ROOT}/modules/alliance/Guild`);
        const guild = await Guild.get({id: this.guildId, unique: true});
        
        if (!guild) {
            throw new Error(`Unexpectedly did not find an guild for id = '${this.guildId}'`);
        }
        
        return guild;
    }
    
    async getCreator() {
        const Guardian = require(`${ROOT}/modules/alliance/Guardian`);
        const guardian = await Guardian.get({id: this.creatorId, unique: true});
        
        if (!guardian) {
            throw new Error(`Unexpectedly did not find a guardian for id = '${this.creatorId}'`);
        }
        
        return guardian;
    }
    
    async getOwner() {
        const Guardian = require(`${ROOT}/modules/alliance/Guardian`);
        const guardian = await Guardian.get({id: this.ownerId, unique: true});
        
        if (!guardian) {
            throw new Error(`Unexpectedly did not find a guardian for id = '${this.ownerId}'`);
        }
        
        return guardian;
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
                const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
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
                
                const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
                const Activity         = require(`${ROOT}/modules/event/Activity`);
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
                const Activity = require(`${ROOT}/modules/event/Activity`);
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
                const Activity = require(`${ROOT}/modules/event/Activity`);
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
