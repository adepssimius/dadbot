
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const EmojiMap  = require(`${ROOT}/modules/EmojiMap`);
const Timestamp = require(`${ROOT}/modules/Timestamp`);
const Guild     = require(`${ROOT}/modules/data/Guild`);

// Load external classes
const Discord = require('discord.js');

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['setup','config','edit'],
    permLevel: 'guild-admin',
    purge: {onFail: 10}
};
exports.conf = conf;

const help = {
    command: 'clan',
    name: 'settings',
    category: 'Clan Administration',
    description: 'Modify the configuration settings for this discord clan',
    usage: 'clan settings',
    minArgs: 0,
    maxArgs: null
};
exports.help = help;

const run = async (discordMessage, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, discordMessage, commandName, actionName)) return;
    
    // Let's put things in context
    const context = {create: false};
    
    // Add or create the guild
    context.guild = await Guild.get({
        id: discordMessage.guild.id,
        unique: true
    });
    
    if (!context.guild) {
        context.guild = new Guild({id: discordMessage.guild.id});
        await context.guild.create();
    }
    
    // Add an object for holding updated parameters
    context.parameters = {};
    
    // Get our property array
    context.properties = Guild.getEditableProperties(context);
    
    async function propertySelectLoop() {
        const emojiMap = new Map();

        // Prepare the property selection emoji map
        const options = [];
        
        for (let x = 0; x < context.properties.length; x++) {
            const property = context.properties[x];
            const emoji = EmojiMap.get(x+1);
            emojiMap.set(emoji, property);
            options.push(`${emoji} - ${property.name}`);
        }
        
        const emoji = EmojiMap.get(':x:');
        options.push(`${emoji} - Done changing discord clan settings`);
        emojiMap.set(emoji, {name: 'stop'});
        
        // Show the current state of the object we are editing
        discordMessage.channel.send(await context.guild.getMessageContent());
        
        // Prompt for an property to edit
        await discordMessage.channel.send('What would you like to change?');
        const embed = new Discord.MessageEmbed().addFields({name: 'Select an setting to change', value: options.join('\n')});
        const replyMessage = await discordMessage.channel.send(embed);
        
        for (let emoji of emojiMap.keys()) {
            replyMessage.react(emoji);
        }
        
        // Create the property select message and reaction collectors
        context.propertySelectMessageCollector = discordMessage.channel.createMessageCollector(nextMessage => {
            return nextMessage.author.id == discordMessage.author.id;
        });
        
        context.propertySelectReactionCollector = replyMessage.createReactionCollector(async (reaction, user) => {
            return user.id == discordMessage.author.id && emojiMap.has(reaction.emoji.name);
        });
        
        // Hook onto the collect event for the property select message and reaction collectors
        context.propertySelectMessageCollector.on('collect', async function(nextMessage) {
            // Grab the selected property
            let emoji;
            
            if (nextMessage.content.toLowerCase() == 'x') {
                emoji = EmojiMap.get(':x:');
            } else {
                emoji = EmojiMap.get(nextMessage.content);
            }
            
            // See if we can find the property for this emoji
            context.property = emojiMap.get(emoji);
            
            // Stop both collectors
            context.propertySelectReactionCollector.stop();
            context.propertySelectMessageCollector.stop();
        });
        
        context.propertySelectReactionCollector.on('collect', async (reaction, user) => {
            // Grab the selected property
            context.property = emojiMap.get(reaction.emoji.name);
            
            // Stop both collectors
            context.propertySelectReactionCollector.stop();
            context.propertySelectMessageCollector.stop();
        });
        
        // Hook onto the end event for the property select message collector
        // We do not also need to hook onto the reaction collector as we will stop them at the same time
        
        context.propertySelectMessageCollector.on('end', async function(collected) {
            // Check if the selection was invalid
            if (!context.property) {
                discordMessage.channel.send(`Invalid selection, please try again`);
                context.propertySelectMessageCollector.stop();
                propertySelectLoop();
                return;
            }
            
            // If this is a collectable property then setup a message collector and then prompt
            if (context.property.name != 'stop') {
                context.propertyMessageCollector = discordMessage.channel.createMessageCollector(nextMessage => {
                    return nextMessage.author.id == discordMessage.author.id;
                });
                
                context.propertyMessageCollector.on('collect', async function(nextMessage) {
                    context.propertyMessageCollector.stop();
                    await context.property.collect(discordMessage, nextMessage);
                });
                
                context.propertyMessageCollector.on('end', async function(collected) {
                    propertySelectLoop();
                });
                
                // Prompt for collection of property data
                await context.property.prompt(discordMessage);
            }
            
            if (context.property.name == 'stop') {
                //
                // TODO - Add in check to see if anything was changed
                //
                await context.guild.update();
                //for (let p = 0; p < context.parameters.length; p++) {
                //    const parameter = context.parameters[p];
                //    await parameter.update();
                //}
                
                discordMessage.channel.send(`Discord clan updated`);
                return;
            }
        });
    }
    
    propertySelectLoop();
};
exports.run = run;
