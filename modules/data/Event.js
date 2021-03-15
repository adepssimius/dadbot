
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const EmojiMap       = require(`${ROOT}/modules/EmojiMap`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const Timestamp      = require(`${ROOT}/modules/Timestamp`);
const Guardian       = require(`${ROOT}/modules/data/Guardian`);
const Participant    = require(`${ROOT}/modules/data/Participant`);
const UserFriendlyId = require(`${ROOT}/modules/data/UserFriendlyId`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Event extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'event',
        orderBy: 'start_time',
        fields: [
            { dbFieldName: 'id',                   type: 'snowflake', nullable: false },
            { dbFieldName: 'ufid',                 type: 'string',    nullable: false, length: 8 },
            { dbFieldName: 'activity_id',          type: 'snowflake', nullable: false, refTableName: 'activity' },
            { dbFieldName: 'activity_category_id', type: 'snowflake', nullable: false, refTableName: 'activity_category' },
            { dbFieldName: 'guild_id',             type: 'snowflake', nullable: false, refTableName: 'guild' },
            { dbFieldName: 'alliance_id',          type: 'snowflake', nullable: true,  refTableName: 'alliance' },
            { dbFieldName: 'channel_name',         type: 'string',    nullable: false, length: 32 },
            { dbFieldName: 'description',          type: 'string',    nullable: true,  length: 256 },
            { dbFieldName: 'status',               type: 'string',    nullable: true,  length: 16 },
            { dbFieldName: 'platform',             type: 'string',    nullable: false, length: 16 },
            { dbFieldName: 'start_time',           type: 'datetime',  nullable: false },
            { dbFieldName: 'est_max_duration',     type: 'integer',   nullable: false },
            { dbFieldName: 'fireteam_size',        type: 'integer',   nullable: false },
            { dbFieldName: 'is_private',           type: 'boolean',   nullable: false },
            { dbFieldName: 'auto_delete',          type: 'boolean',   nullable: false },
            { dbFieldName: 'creator_id',           type: 'snowflake', nullable: false, refTableName: 'guardian' },
            { dbFieldName: 'owner_ids',            type: 'string',    nullable: false, length: 256 }
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
    
    static parseConditions(conditions) {
        const parsedConditions = conditions;
        
        if (conditions.channelId) {
            const Channel = require(`${ROOT}/modules/data/Channel`);
            return (query) => {
                query.whereIn('id', function() {
                    this.select('event_id').from(Channel.getTableName()).where('id', conditions.channelId);
                });
            };
        }
        
        return parsedConditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Make sure the owners are the database
        const ownerIds = this.ownerIds;
        const owners   = await this.getOwners();
        
        for (let o = 0; o < ownerIds.length; o++) {
            let owner = owners.find(element => element.id == ownerIds[o]);
            if (!owner) {
                owner = new Guardian({id: ownerIds[o]});
                await owner.create();
            }
        }
        
        // Generate a user friendly id for this event
        const activityCategory = await this.getActivityCategory(true);
        const userFriendlyIdData = {
            type: 'event',
            objectId: this.id,
            prefix: activityCategory.symbol,
            digits: 3,
            status: 'Scheduled',
            isActive: true,
            creatorId: this.creatorId
        };
        const userFriendlyId = new UserFriendlyId(userFriendlyIdData);
        await userFriendlyId.create();
        this.userFriendlyId = userFriendlyId;
        
        // Generate id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
    
    async update() {
        // Make sure the owners are the database
        const ownerIds = this.ownerIds;
        const owners   = await this.getOwners();
        
        for (let o = 0; o < ownerIds.length; o++) {
            let owner = owners.find(element => element.id == ownerIds[o]);
            if (!owner) {
                owner = new Guardian({id: ownerIds[o]});
                await owner.create();
            }
        }
        
        // Finally, update the actual event
        await BaseModel.prototype.update.call(this);
    }
    
    async delete() {
        // Delete any participants
        await Participant.delete({eventId: this.id});
        
        // Delete any messages
        const Message = require(`${ROOT}/modules/data/Message`);
        await Message.delete({eventId: this.id, isCloneMessage: true});
        await Message.delete({eventId: this.id, isCloneMessage: false});
        
        // Delete any channels - do so individually be grabbing the objects so that we will delete the discord channels as well
        const Channel = require(`${ROOT}/modules/data/Channel`);
        const channels = await Channel.get({eventId: this.id});
        
        for (let c = 0; c < channels.length; c++) {
            await channels[c].delete();
        }
        
        // Delete channel group
        const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);
        await ChannelGroup.delete({eventId: this.id});
        
        // Finally, delete the actual event
        await BaseModel.prototype.delete.call(this);
    }
    
    async getMessageContent() {
        const activity         = await this.getActivity();
        const activityCategory = await this.getActivityCategory();
        const creator          = await this.getCreator();
        
        const owners   = await this.getOwners();
        const ownerUsernames = [];
        
        for (let o = 0; o < owners.length; o++) {
            const owner = owners[o];
            
            if (owner) {
                const discordUser = await owner.getDiscordUser();
                if (discordUser) {
                    ownerUsernames.push(discordUser.username);
                }
            }
        }
        
        const startTs = new Timestamp(this.startTime);
        const startDate = startTs.formatDate();
        const startTime = startTs.formatTime('short');
        
        const participantDetails = await this.getParticipantDetails();
        const primaries  = participantDetails.primaries;
        const alternates = participantDetails.alternates;
        
        const primaryNames = [];
        for (let p = 0; p < primaries.length; p++) {
            const participant = primaries[p];
            const discordUser = await participant.getDiscordUser();
            primaryNames.push(discordUser.username);
        }
        primaryNames.sort();
        
        const alternateNames = [];
        for (let p = 0; p < alternates.length; p++) {
            const participant = alternates[p];
            const discordUser = await participant.getDiscordUser();
            alternateNames.push(discordUser.username);
        }
        alternateNames.sort();
        
        const embed = new Discord.MessageEmbed()
            .setTitle(`${activity.name} [${activityCategory.name}]`)
            .addFields(
                { name: 'Date', value: startDate, inline: true },
                { name: 'Time', value: startTime, inline: true },
                { name: 'ID', value: this.ufid }
            )
            .addFields(
                { name: 'Privacy', value: ( this.isPrivate ? 'Clan' : 'Alliance' ), inline: true },
                { name: 'Auto Remove Event', value: ( this.autoDelete ? `${this.estMaxDuration} minutes after start` : 'No' ), inline: true }
            )
            .addField('Description', ( this.description ? this.description : 'No description given' ))
            .addField(
                `Guardians Joined: ${primaries.length}/${this.fireteamSize}`,
                ( primaryNames.length == 0 ? 'None Yet' : primaryNames.join(', ') )
            )
            .addField(
                `Alternates: ${alternates.length}`,
                ( alternateNames.length == 0 ? 'None Yet' : alternateNames.join(', ') )
            )
            .setTimestamp()
            .setFooter(`Creator: ${creator.username} • Owner${ownerUsernames.length > 1 ? 's' : ''}: ${ownerUsernames.join(', ')}`);
        
        return embed;
    }
    
    async deriveChannelName() {
        const activity = await this.getActivity();
        const ts = new Timestamp(this.startTime);
        const tsParts = ts.formatToParts();
        
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
        const activity = await this.getActivity();
        
        return `${activity.name} @ ${startTs.convert()}`;
    }
    
    async updateEventMessages() {
        const Message  = require(`${ROOT}/modules/data/Message`);
        const messages = await Message.get({type: 'event', eventId: this.id});
        const content  = await this.getMessageContent();
        
        for (let m = 0; m < messages.length; m++) {
            const message = messages[m];
            const discordMessage = await message.getDiscordMessage({required: true});
            discordMessage.edit(content);
        }
    }
    
    async getParticipantDetails(guardianId) {
        const participants = await Participant.get({eventId: this.id}); 
        const primaries    = [];
        const alternates   = [];
        let   participant;
        
        for (let p = 0; p < participants.length; p++) {
            const nextParticipant = participants[p];
            
            if (nextParticipant.isPrimary) {
                primaries.push(nextParticipant);
            } else {
                alternates.push(nextParticipant);
            }
            
            if (guardianId && nextParticipant.guardianId == guardianId) {
                participant = nextParticipant;
            }
        }
        
        return {
            primaries: primaries,
            alternates: alternates,
            participant: participant
        };
    }
    
    async join(user, discordChannel, isPrimary = true) {
        let guardian = await Guardian.get({id: user.id, unique: true});
        
        // Make sure the discord user is in the database
        if (!guardian) {
            guardian = new Guardian({id: user.id});
            await guardian.create();
        }
        
        // Collect the participants for this event
        const details      = await this.getParticipantDetails(user.id);
        const primaries    = details.primaries;
        let   participant  = details.participant;
        let   eventChanged = false;
        let   participantData;
        let   message = `<@${user.id}>, `;
        
        if (!participant) {
            participantData = {
                guardianId: user.id,
                eventId: this.id,
                joinedFromChannelId: discordChannel.id,
                joinedFromGuildId: discordChannel.guild.id,
                isPrimary: isPrimary
            };
        }
        
        // Primary participants
        if (isPrimary) {
            if (participant && participant.isPrimary) {
                message += `you are already participating in this event`;
            
            } else if ( (this.fireteamSize == primaries.length) && (!participant || !participant.isPrimary) ) {
                message += `the fireteam for this event is already full`;
            
            } else if (!participant) {
                eventChanged = true;
                participantData.isPrimary = true;
                participant = new Participant(participantData);
                
                await participant.create();
                message += `you have been added to this event`;
                
            } else {
                eventChanged = true;
                participant.isPrimary = true;
                
                await participant.update();
                message += `you have been changed to a primary for this event`;
            }
        
        // Alternate participants
        } else {
            if (!participant) {
                eventChanged = true;
                participantData.isPrimary = false;
                participant = new Participant(participantData);
                
                await participant.create();
                message += `you have been added as an alternate for this event`;
            
            } else if (participant.isPrimary) {
                eventChanged = true;
                participant.isPrimary = false;
                
                await participant.update();
                message += `you have been changed to an alternate for this event`;
            
            }  else {
                message += `you are already an alternate for this event`;
            }
        }
        
        client.sendAndDelete(message, discordChannel, 5);
        if (eventChanged) this.updateEventMessages();
    }
    
    async leave(user, discordChannel) {
        const participantQuery = {
            guardianId: user.id,
            eventId: this.id,
            unique: true
        };
        
        const participant = await Participant.get(participantQuery); 
        let message = `<@${user.id}>, `;
        let eventChanged = false;
        
        if (!participant) {
            message += `you are not participating in this event`;
        } else {
            eventChanged = true;
            await participant.delete();
            message += `you have been removed from this event`;
        }
        
        client.sendAndDelete(message, discordChannel, 5);
        if (eventChanged) {
            this.updateEventMessages();
        }
    }
    
    // ****************************************************** //
    // * Instance Methods - Channel and Reaction Management * //
    // ****************************************************** //
    
    async setupEventChannels(discordMessage) {
        const Alliance     = require(`${ROOT}/modules/data/Alliance`);
        const Channel      = require(`${ROOT}/modules/data/Channel`);
        const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);
        
        // Put together the event details
        const eventDetails = {
            channelName: await this.deriveChannelName(),
            channelTopic: await this.deriveChannelTopic(),
            messageContent: await this.getMessageContent(),
            emojis: [
                await EmojiMap.getNinkasiEmoji('join'),
                await EmojiMap.getNinkasiEmoji('leave'),
                await EmojiMap.getNinkasiEmoji('alternate')
            ]
        };
        
        // Get the alliance for this guild
        let alliance;
        let eventConfigChannelGroup;
        let eventChannelGroup;
        let linkedEventConfigChannels = [];
        
        // if this is not a private event, grab the alliance
        if (!this.isPrivate) {
            alliance = await Alliance.get({guildId: discordMessage.guild.id, unique: true});
        }
        
        if (alliance) {
            // Get the event-config channel group for the message channel
            const eventConfigChannelGroupQuery = {
                channelId: discordMessage.channel.id,
                type: 'event-config',
                allianceId: alliance.id,
                unique: true
            };
            eventConfigChannelGroup = await ChannelGroup.get(eventConfigChannelGroupQuery);
            
            if (eventConfigChannelGroup) {
                const linkedEventConfigChannelsQuery = {
                    getLinkedChannels: true,
                    id: discordMessage.channel.id,
                    channelGroupId: eventConfigChannelGroup.id
                };
                linkedEventConfigChannels = await Channel.get(linkedEventConfigChannelsQuery);
                
                // If we have at least one linked channel, create a sync channel group for this event
                if (linkedEventConfigChannels.length > 0) {
                    const eventChannelGroupQuery = {
                        allianceId: alliance.id,
                        eventId: this.id,
                        unique: true
                    };
                    eventChannelGroup = await ChannelGroup.get(eventChannelGroupQuery);
                    
                    if (!eventChannelGroup) {
                        const eventChannelGroupData = {
                            type: 'sync',
                            name: `${this.ufid}-${eventDetails.channelName}`,
                            allianceId: alliance.id,
                            eventId: this.id,
                            creatorId: discordMessage.author.id
                        };
                        eventChannelGroup = new ChannelGroup(eventChannelGroupData);
                        await eventChannelGroup.create();
                    }
                }
            }
        }
        
        //
        // TODO - Have a think about whether we want to run both
        //        createEventChannel calls asynchronously or not
        //
        
        // First create the channel for the originating guild
        Channel.createEventChannel(
            this,
            eventDetails,
            discordMessage.channel, // eventConfigDiscordChannel
            eventChannelGroup
        );
        
        // If we have an eventChannelGroup, loop through the channels that are
        // part of the eventConfigChannelGroup and create a channel for each one
        if (eventChannelGroup && linkedEventConfigChannels.length > 0) {
            for (let c = 0; c < linkedEventConfigChannels.length; c++) {
                const linkedEventConfigChannel = linkedEventConfigChannels[c];
                const linkedEventConfigDiscordChannel = await linkedEventConfigChannel.getDiscordChannel();
                
                // Create the channel for the linked guild
                Channel.createEventChannel(
                    this,
                    eventDetails,
                    linkedEventConfigDiscordChannel,
                    eventChannelGroup
                );
            }
        }
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
                        nameOrAliasOrShortName: true,
                        name: nextMessage.content,
                        alias: nextMessage.content,
                        shortName: nextMessage.content,
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
