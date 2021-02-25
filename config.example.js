const config = {
    // Your Bot's token. Available on https://discord.com/developers/applications/me
    token: '',
    
    // Your Bot's prefix
    prefix: '!',
    
    // Your database configuration. This can be anything supported by knex.
    // See http://knexjs.org/#Installation-client for examples.
    database: {},
    
    // Bot Owner ID string array
    botOwnerIDs: [],
    
    // Bot Admins role ID string array
    botAdminRoleIDs: ['813924095879938118'],
    
    // Bot User role ID string
    botUserRoleIDs: ['813924141770080296'],
    
    // Intents the bot needs.
    // By default GuideBot needs Guilds, Guild Messages and Direct Messages to work.
    // For join messages to work you need Guild Members, which is privileged and requires extra setup.
    // For more info about intents see the README.
    //intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'],
    
    // PERMISSION LEVEL DEFINITIONS.
    
    permLevels: [
        // This is the lowest permisison level, this is for non-roled users.
        {
            level: 0,
            name: 'viewer',
            check: () => true // No check required for read only users
        },
        
        // LFG commnds
        {
            level: 3,
            name: 'user',
            check: (message) => {
                const botUserRoleIDs = message.client.config.botUserRoleIDs;
                const member = ( message.member != null ? message.member : message.guild.members.cache.get(message.author.id) );
                
                for (let x = 0; x < botUserRoleIDs.length; x++) {
                    if (member.roles.cache.has(botUserRoleIDs[x])) {
                        return true;
                    }
                }
                
                return true;
            }
        },
        
        // Configuration commands
        {
            level: 6,
            name: 'admin',
            check: (message) => {
                const botAdminRoleIDs = message.client.config.botAdminRoleIDs;
                const member = ( message.member != null ? message.member : message.guild.members.cache.get(message.author.id) );
                
                for (let x = 0; x < botAdminRoleIDs.length; x++) {
                    if (member.roles.cache.has(botAdminRoleIDs[x])) {
                        return true;
                    }
                }
                
                return true;
            }
        },
        
        // Restart or reload commands
        {
            level: 10,
            name: 'owner',
            
            // Another simple check, compares the message author id to a list of owners found in the bot application.
            check: (message) => {
                const botOwnerIDs = message.client.config.botOwnerIDs;
                
                for (let x = 0; x < botOwnerIDs.length; x++) {
                    if (botOwnerIDs[x] == message.author.id) {
                        return true;
                    }
                }
                
                return false;
            }
        }
    ]
};

module.exports = config;
