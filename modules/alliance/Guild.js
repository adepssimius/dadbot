
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
    
    static async get(objCondition) {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        let condition;
        
        if (objCondition == null) {
            condition = null;
        
        } else if (objCondition.clanNameOrShortName != null) {
            condition = (query) => {
                query.where('clan_name', objCondition.clanName).orWhere('clan_short_name', objCondition.clanShortName.toUpperCase());
            };
        
        } else {
            condition = BaseModel.parseObjCondition(Guild, objCondition);
            
            if (condition.clanShortName != null) {
                condition.clanShortName = condition.clanShortName.toUpperCase();
            }
            condition = {};
        }
        
        return await BaseModel.get(Guild, condition);
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
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        await BaseModel.create(Guild.tableName, this.data);
    }
    
    async update() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        await BaseModel.update(Guild.tableName, this.data);
    }
    
    async delete() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        await BaseModel.delete(Guild.tableName, this.data);
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
