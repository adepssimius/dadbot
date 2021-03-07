
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Guild extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'guild',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'id', type: 'snowflake', nullable: false },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'clan_name', type: 'string', length: 32, nullable: true },
            { dbFieldName: 'clan_short_name', type: 'string', length: 32, nullable: true },
            { dbFieldName: 'clan_bungie_num', type: 'integer', nullable: true },
            { dbFieldName: 'timezone', type: 'string', length: 32, nullable: true },
            { dbFieldName: 'creator_id', type: 'snowflake', nullable: false }
        ]
    });
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    //get tableName() {
    //    return Guild.tableName;
    //}
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
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
}

module.exports = Guild;
