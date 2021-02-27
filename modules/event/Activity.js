
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel        = require(`${ROOT}/modules/BaseModel`);
const EmojiMap         = require(`${ROOT}/modules/EmojiMap`);
const Snowflake        = require(`${ROOT}/modules/Snowflake`);
const ActivityAlias    = require(`${ROOT}/modules/event/ActivityAlias`);
const DuplicateError   = require(`${ROOT}/modules/error/DuplicateError`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class Activity extends BaseModel {
    static tableName = 'activity';
    static orderBy   = 'activity_name';
    
    constructor(data) {
        if (data.activityId == null) data.activityId = Snowflake.generate();
        super(data);
        
        // Populate custom fields with different database and object names
        if      (data.activity_id != null) this.activityId = data.activity_id;
        else if (data.activityId  != null) this.activityId = data.activityId;
        
        if      (data.activity_name != null) this.activityName = data.activity_name;
        else if (data.activityName  != null) this.activityName = data.activityName;
        
        if      (data.category_id != null) this.categoryId  = data.category_id;
        else if (data.categoryId  != null) this.categoryId  = data.categoryId;
        
        if      (data.fireteam_size != null) this.fireteamSize  = data.fireteam_size;
        else if (data.fireteamSize  != null) this.fireteamSize  = data.fireteamSize;
        
        if      (data.est_max_duration != null) this.estMaxDuration  = data.est_max_duration;
        else if (data.estMaxDuration   != null) this.estMaxDuration  = data.estMaxDuration;
        
        if      (data.alliance_id != null) this.allianceId  = data.alliance_id;
        else if (data.allianceId  != null) this.allianceId  = data.allianceId;
        
        if      (data.creator_id != null) this.creatorId  = data.creator_id;
        else if (data.creatorId  != null) this.creatorId  = data.creatorId;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get activityId() {
        return this.data.activity_id;
    }
    
    get activityName() {
        return this.data.activity_name;
    }
    
    get categoryId() {
        return this.data.category_id;
    }
    
    get fireteamSize() {
        return this.data.fireteam_size;
    }
    
    get estMaxDuration() {
        return this.data.est_max_duration;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    get creatorId() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set activityId(value) {
        this.data.activity_id = value;
    }
    
    set activityName(value) {
        this.data.activity_name = value;
    }
    
    set categoryId(value) {
        this.data.category_id = value;
    }
    
    set fireteamSize(value) {
        this.data.fireteam_size = value;
    }
    
    set estMaxDuration(value) {
        this.data.est_max_duration = value;
    }
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    set creatorId(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Activity(rows[x]));
        }
        
        return result;
    }
    
    // Extra functions for this class
    
    static async getByNameOrAlias(data) {
        return await Activity.get( (query) =>
            query.where('activity_name', data.activity_name)
                .orWhereIn('activity_id', function() {
                    this.select('activity_id').from(ActivityAlias.tableName).where('alias', data.alias);
                })
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        
        const activities = await Activity.get({activity_name: this.activityName});
        if (activities.length > 0) {
            const activity = activities[0];
            throw new DuplicateError(`Existing activity found with the same name: ${activity.activityName}`);
        }
        
        await BaseModel.create.call(this, Activity.tableName, this.data);
    }
    
    async update() {
        this.updatedAt = knex.fn.now();
        
        let rowsChanged = await knex(Activity.tableName)
            .where('activity_id', this.activity_id)
            .update(this.data)
            .then(result => {
                return result;
            });
        
        if (rowsChanged == 0) {
            throw new Error('Update did not change any records!');
        } else if (rowsChanged > 1) {
            throw new Error('Update changed more then one record!');
        }
    }
    
    async delete() {
        const activityAliases = ActivityAlias.get({activity_id: this.activityId});
        
        for (let x = 0; x < activityAliases.length; x++) {
            await activityAliases[x].delete();
        }
        
        return await Activity._delete({activity_id: this.activityId});
    }
    
    async getActivityCategory() {
        const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
        const activityCategories = await ActivityCategory.get({category_id: this.categoryId});
        
        if (activityCategories.length == 0) {
            throw new Error(`Unexpectedly did not find an activity category for category_id = '${this.categoryId}'`);
        } else if (activityCategories.length > 1) {
            throw new Error(`Unexpectedly found multiple activity categories for category_id = '${this.categoryId}'`);
        }
        
        return activityCategories[0];
    }
    
    async getActivityAliases() {
        const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
        return await ActivityAlias.get({activity_id: this.activityId});
    }
    
    // ***************************************** //
    // * Properties Array for User Interaction * //
    // ***************************************** //
    
    static getEditableProperties(context) {
        const properties = [];
        
        // Activity Name: varchar(32)
        properties.push({
            name: 'Activity Name',
            
            prompt: async (message, nextMessage) => {
                await message.channel.send(`What is the name of this activity?`);
            },
            
            collect: async (message, nextMessage) => {
                context.activity.activityName = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        // Category: varchar(20) -> Category table
        properties.push({
            name: 'Category',
            
            prompt: async (message, nextMessage) => {
                const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
                
                const emojiMap = new Map();
                let options = '';
                
                // Build the emoji -> activity category map
                const activityCategories = await ActivityCategory.get();
                
                for (let x = 0; x < activityCategories.length; x++) {
                    const activityCategory = activityCategories[x];
                    const emoji = EmojiMap.get(activityCategory.symbol);
                    emojiMap.set(emoji, activityCategory);
                    options += `${emoji} - ${activityCategory.categoryName}\n`; 
                }
                
                // Send the prompt
                await message.channel.send(`In which category does this activity belong? Please choose a reaction or respond via text.`);
                const embed = new Discord.MessageEmbed().addFields({name: 'Activity Categories', value: options.trim()});
                const replyMessage = await message.channel.send(embed);
                
                // Apply the reaction
                for (let emoji of emojiMap.keys()) {
                    replyMessage.react(emoji);
                }
                
                context.reactionCollector = replyMessage.createReactionCollector(async (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                });
                
                context.reactionCollector.on('collect', async (reaction, user) => {
                    const activityCategory = emojiMap.get(reaction.emoji.name);
                    if (activityCategory != null) {
                        await context.reactionCollector.stop();
                        context.reactionCollector = null;
                        
                        context.activity.categoryId = activityCategory.categoryId;
                        
                        if (context.create) {
                            properties.shift();
                            
                            // Since we are in a reaction collector, we need to do this manually
                            await properties[0].prompt(message, nextMessage);
                        }
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
                
                const activityCategories = await ActivityCategory.getByNameOrSymbol({
                    categoryName: nextMessage.content,
                    symbol: nextMessage.content}
                );
                
                if (activityCategories.length == 0) {
                    await message.channel.send(`Activity category not found: ${nextMessage.content}`);
                } else if (activityCategories.length > 1) {
                    await message.channel.send(`Multiple activity categories found: ${nextMessage.content}`);
                } else {
                    context.reactionCollector.stop();
                    context.reactionCollector = null;
                    
                    const activityCategory = activityCategories[0];
                    context.activity.categoryId = activityCategory.categoryId;
                    
                    if (context.create) properties.shift();
                }
            }
        });
        
        // Fireteam Size: integer (1-6)
        properties.push({
            name: 'Fireteam Size',
            
            prompt: async (message, nextMessage) => {
                const emojiMap = new Map();
                
                // Build the emoji -> activity category map
                const fireteamSizes = [1,2,3,4,5,6];
                
                const replyMessage = await message.channel.send(`What maximum fireteam size do you want to set for this activity?`);
                for (let x = 0; x < fireteamSizes.length; x++) {
                    const fireteamSize = fireteamSizes[x];
                    const emoji = EmojiMap.get(fireteamSize);
                    emojiMap.set(emoji, fireteamSize);
                    replyMessage.react(emoji);
                }
                
                const emojiFilter = (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                };
                
                const reactionCollector = await replyMessage.createReactionCollector(emojiFilter);
                context.reactionCollector = reactionCollector;
                
                reactionCollector.on('collect', async (reaction, user) => {
                    const fireteamSize = emojiMap.get(reaction.emoji.name);
                    if (fireteamSize != null) {
                        context.reactionCollector.stop();
                        context.reactionCollector = null;
                        
                        context.activity.fireteamSize = fireteamSize;
                        if (context.create) {
                            properties.shift();
                            
                            // Since we are in a reaction collector, we need to do this manually
                            properties[0].prompt(message, nextMessage);
                        }
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                context.reactionCollector.stop();
                context.reactionCollector = null;
                
                context.activity.fireteamSize = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        // Estimated Maximum Duration: integer
        properties.push({
            name: 'Estimated Maximum Duration',
            
            prompt: async (message, nextMessage) => {
                message.channel.send(`What is the estimated maximum direction (in minutes) of this activity?`);
            },
            
            collect: async (message, nextMessage) => {
                context.activity.estMaxDuration = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        // Finally return the damn thing
        return properties;
    }
}

module.exports = Activity;
