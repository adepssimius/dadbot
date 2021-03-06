
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const EmojiMap       = require(`${ROOT}/modules/EmojiMap`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const Guardian       = require(`${ROOT}/modules/alliance/Guardian`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Activity extends BaseModel {
    static tableName = 'activity';
    static orderBy   = 'name';
    static fields    = ['id', 'name', 'activity_category_id', 'fireteam_size', 'est_max_duration', 'alliance_id', 'creator_id'];
    static fieldMap  = BaseModel.getFieldMap(Activity.fields);
    
    constructor(data) {
        super(Activity, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return Activity.tableName;
    }
    
    get name() {
        return this.data.name;
    }
    
    get activityCategoryId() {
        return this.data.activity_category_id;
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
    
    get title() {
        return `${this.name}`;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set name(value) {
        this.data.name = value;
    }
    
    set activityCategoryId(value) {
        this.data.activity_category_id = value;
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
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        if (conditions.nameOrAlias) {
            const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
            return (query) => {
                query.where('name', conditions.name)
                    .orWhereIn('id', function() {
                        this.select('activity_id').from(ActivityAlias.tableName).where('alias', conditions.alias.toUpperCase());
                    });
            };
        }
        
        if (conditions.alias) {
            const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
            return (query) => {
                query.whereIn('id', function() {
                    this.select('activity_id').from(ActivityAlias.tableName).where('alias', conditions.alias.toUpperCase());
                });
            };
        }
        
        if (conditions.categoryNameOrSymbol) {
            const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
            return (query) => {
                query.whereIn('activity_category_id', function() {
                    this.select('id').from(ActivityCategory.tableName)
                        .where('name', conditions.name)
                        .orWhere('symbol', conditions.symbol.toUpperCase());
                });
            };
        }
        
        return conditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const activity = await Activity.get({name: this.name, unique: true});
        if (activity) {
            throw new DuplicateError(`Existing activity found with the same name: ${this.name}`);
        }
        
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Generate the id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
    
    async delete() {
        const ActivityAlias   = require(`${ROOT}/modules/event/ActivityAlias`);
        const activityAliases = await ActivityAlias.get({activityId: this.id});
        
        for (let x = 0; x < activityAliases.length; x++) {
            await activityAliases[x].delete();
        }
        
        // And attempt to delete it
        await BaseModel.prototype.delete.call(this);
    }
    
    async toMessageContent() {
        const activityCategory = await this.getActivityCategory();
        const activityAliases  = await this.getActivityAliases();
        
        //
        // TODO - Make this prettier
        //
        
        const aliases = await this.getActivityAliasStrings();
        const aliasList = ( activityAliases.length > 0 ? aliases.join(', ') : 'No aliases for this activity' );
        
        const embed = new Discord.MessageEmbed()
            .setTitle('Activity')
            .addFields(
                { name: 'Name', value: this.name },
                { name: 'Aliases', value: aliasList },
                { name: 'Category', value: `${activityCategory.title}` },
                { name: 'Maximum Fireteam Size', value: this.fireteamSize },
                { name: 'Estimated Maximum Duration', value: `${this.estMaxDuration} minutes` }
            );
        
        return embed;
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getActivityCategory() {
        const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
        const activityCategory = await ActivityCategory.get({id: this.activityCategoryId, unique: true});
        
        if (!activityCategory) {
            throw new Error(`Unexpectedly did not find an activity category for activity_category_id = '${this.activityCategoryId}'`);
        }
        
        return activityCategory;
    }
    
    // * 
    async getActivityAliases() {
        const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
        return await ActivityAlias.get({activityId: this.id});
    }
    
    async getActivityAliasStrings() {
        const activityAliases = await this.getActivityAliases();
        
        const aliases = [];
        for (let x = 0; x < activityAliases.length; x++) {
            aliases.push(activityAliases[x].alias);
        }
        
        return aliases;
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
                context.activity.name = nextMessage.content;
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
                    options += `${emoji} - ${activityCategory.name}\n`; 
                }
                
                // Send the prompt
                await message.channel.send(`In which category does this activity belong? Please choose a reaction or respond via text.`);
                const embed = new Discord.MessageEmbed().addFields({name: 'Activity Categories', value: options.trim()});
                const replyMessage = await message.channel.send(embed);
                
                // Apply the reaction
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
                    
                    const activityCategory = emojiMap.get(reaction.emoji.name);
                    if (activityCategory) {
                        await context.propertyCollector.stop();
                        context.activity.activityCategoryId = activityCategory.id;
                        
                        if (context.create) {
                            properties.shift();
                            await properties[0].prompt(message, nextMessage);
                        } else {
                            context.activityEditorMessageCollector.stop();
                        }
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                context.stopReacting = false;
                context.propertyCollector.stop();
                
                const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
                const activityCategory = await ActivityCategory.get({
                    nameOrSymbol: true,
                    name: nextMessage.content,
                    symbol: nextMessage.content
                }, true);
                
                if (!activityCategory) {
                    await message.channel.send(`Activity category not found: ${nextMessage.content}`);
                    return;
                }
                context.activity.activityCategoryId = activityCategory.id;
                
                if (context.create) properties.shift();
            }
        });
        
        // Fireteam Size: integer (1-6)
        properties.push({
            name: 'Fireteam Size',
            
            prompt: async (message, nextMessage) => {
                // Build the options
                const emojiMap    = new Map();
                const options     = [];
                const menuOptions = [];
                
                // Get the options ready
                for (let fireteamSize = 1; fireteamSize <= 6; fireteamSize++) {
                    const emoji = EmojiMap.get(fireteamSize);
                    options.push({emoji: emoji, value: fireteamSize});
                }
                
                // Build the emoji map and menu
                for (let x = 0; x < options.length; x++) {
                    const option = options[x];
                    
                    emojiMap.set(option.emoji, option.value);
                    if (option.menuOption) {
                        menuOptions.push(`${option.emoji} - ${option.menuOption}`);
                    }
                }
                context.emojiMap = emojiMap;
                
                // Send the prompt
                const replyMessage = await message.channel.send(`What maximum fireteam size do you want to set for this activity?`);
                
                // Apply the reactions
                const react = async () => {
                    context.stopReacting = false;
                    for (let emoji of emojiMap.keys()) {
                        replyMessage.react(emoji);
                        if (context.stopReacting) return;
                    }
                }; react();
                
                const emojiFilter = (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                };
                
                context.propertyCollector = await replyMessage.createReactionCollector(emojiFilter);
                
                context.propertyCollector.on('collect', async (reaction, user) => {
                    context.stopReacting = false;
                    context.propertyCollector.stop();
                    
                    const fireteamSize = emojiMap.get(reaction.emoji.name);
                    if (!fireteamSize) {
                        message.channel.send(`Invalid reaction`);
                        return;
                    }
                    
                    // Set the value and move on
                    context.activity.fireteamSize = fireteamSize;
                    
                    if (context.create) {
                        properties.shift();
                        properties[0].prompt(message, nextMessage);
                    } else {
                        context.activityEditorMessageCollector.stop();
                    }
                });
            },
            
            collect: async (message, nextMessage) => {
                context.stopReacting = false;
                context.propertyCollector.stop();
                
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
