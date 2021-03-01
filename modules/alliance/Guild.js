
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class Guild extends BaseModel {
    static tableName = 'guild';
    static orderBy   = 'created_at';
    static fields    = ['id', 'alliance_id', 'clan_name', 'clan_short_name', 'clan_bungie_num', 'timezone', 'creator_id'];
    static fieldMap  = BaseModel.getFieldMap(Guild.fields);
    
    constructor(data) {
        super(Guild, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return Guild.tableName;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    get clanName() {
        return this.data.clan_name;
    }
    
    get clanShortName() {
        return this.data.clan_short_name;
    }
    
    get clanBungieNum() {
        return this.data.clan_bungie_num;
    }
    
    get timezone() {
        return this.data.timezone;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    set clanName(value) {
        this.data.clan_name = value;
    }
    
    set clanShortName(value) {
        if (value == null) {
            this.data.clan_short_name = null;
        } else {
            this.data.clan_short_name = value.toUpperCase();
        }
    }
    
    set clanBungieNum(value) {
        this.data.clan_bungie_num = value;
    }
    
    set timezone(value) {
        this.data.timezone = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        // Check for a clan name or clan short name search
        if (conditions.clanNameOrShortName != null) {
            return (query) => {
                query.where('clan_name', conditions.clanName).orWhere('clan_short_name', conditions.clanShortName.toUpperCase());
            };
        }
        
        // Handle any special fields
        const parsedConditions = conditions;
        
        if (parsedConditions.clanShortName != null) {
            parsedConditions.clanShortName = parsedConditions.clanShortName.toUpperCase();
        }
        
        return parsedConditions;
    }
        
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const guilds = await Guild.get({'id': this.id});
        
        // Check if this is a duplicate alliance
        if (guilds.length > 0) {
            throw new DuplicateError(`Guild already exists`);
        }
        
        // And attempt to create the damn thing
        await BaseModel.prototype.create.call(this);
    }
    
    async getTitle() {
        const suffix = (this.clanShortName != null ? ` [${this.clanShortName}]` : '');
        
        if (this.clanName != null) {
            return this.clanName + suffix;
        } else {
            const discordGuild = await client.guilds.fetch(this.id);
            return discordGuild.name + suffix;
        }
    }
    
    getClanURL() {
        if (this.clanBungieNum == null) {
            return null;
        }
        
        return `https://www.bungie.net/en/ClanV2?groupid=${this.clanBungieNum}`;
    }
}

module.exports = Guild;
