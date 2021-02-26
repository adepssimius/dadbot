
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
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get activity_id() {
        return this.data.activity_id;
    }
    
    get activity_name() {
        return this.data.activity_name;
    }
    
    get category_id() {
        return this.data.category_id;
    }

    get fireteam_size() {
        return this.data.fireteam_size;
    }

    get est_max_duration() {
        return this.data.est_max_duration;
    }

    get creator_id() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set activity_id(value) {
        this.data.activity_id = value;
    }
    
    set activity_name(value) {
        this.data.activity_name = value;
    }
    
    set category_id(value) {
        this.data.category_id = value;
    }

    set fireteam_size(value) {
        this.data.fireteam_size = value;
    }

    set est_max_duration(value) {
        this.data.est_max_duration = value;
    }

    set creator_id(value) {
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
    
    static async create(data) {
        const activities = await Activity.get(data);
        
        if (activities.length > 0) {
            const activity = activities[0];
            throw new DuplicateError(`Existing activity found with the same name [${activity.activity_abbr}] ${activity.activity_name}`);
        }
        
        data.activity_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Activity(data);
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
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            activity_name: this.activity_name,
            category_id: this.category_id,
            fireteam_size: this.fireteam_size,
            est_max_duration: this.est_max_duration,
            creator_id: this.creator_id,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(Activity.tableName)
            .where('activity_id', this.activity_id)
            .update(data)
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
        const activityAliases = ActivityAlias.get({activity_id: this.activity_id});
        
        for (let x = 0; x < activityAliases.length; x++) {
            await activityAliases[x].delete();
        }
        
        return await Activity._delete({activity_id: this.activity_id});
    }
    
    async getActivityCategory() {
        const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
        const activityCategories = await ActivityCategory.get({category_id: this.category_id});
        
        if (activityCategories.length == 0) {
            throw new Error(`Unexpectedly did not find an activity category for category_id = '${this.category_id}'`);
        } else if (activityCategories.length > 1) {
            throw new Error(`Unexpectedly found multiple activity categories for category_id = '${this.category_id}'`);
        }
        
        return activityCategories[0];
    }
    
    async getActivityAliases() {
        const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
        return await ActivityAlias.get({activity_id: this.activity_id});
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
                context.activity.activity_name = nextMessage.content;
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
                    options += `${emoji} - ${activityCategory.category_name}\n`; 
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
                        
                        context.activity.category_id = activityCategory.category_id;
                        
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
                    category_name: nextMessage.content,
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
                    context.activity.category_id = activityCategory.category_id;
                    
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
                        
                        context.activity.fireteam_size = fireteamSize;
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
                
                context.activity.fireteam_size = nextMessage.content;
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
                context.activity.est_max_duration = nextMessage.content;
                if (context.create) properties.shift();
            }
        });
        
        // Finally return the damn thing
        return properties;
    }
}

module.exports = Activity;
