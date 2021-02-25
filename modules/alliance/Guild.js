
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
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get guild_id() {
        return this.data.guild_id;
    }
    
    get alliance_id() {
        return this.data.alliance_id;
    }
    
    get clan_name() {
        return this.data.clan_name;
    }
    
    get clan_alias() {
        return this.data.clan_alias;
    }
    
    get clan_id() {
        return this.data.clan_id;
    }
    
    get timezone() {
        return this.data.timezone;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set guild_id(value) {
        this.data.guild_id = value;
    }
    
    set alliance_id(value) {
        this.data.alliance_id = value;
    }
    
    set clan_name(value) {
        this.data.clan_name = value;
    }
    
    set clan_alias(value) {
        this.data.clan_alias = value.toUpperCase();
    }
    
    set clan_id(value) {
        this.data.clan_id = value;
    }
    
    set timezone(value) {
        this.data.timezone = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        // Always search clan_alias in upper case
        if (whereClause != null && whereClause.clan_alias != null) {
            whereClause.clan_alias = whereClause.clan_alias.toUpperCase();
        }
        
        const result = [];
        const rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Guild(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        // Always store the clan_alias
        if (data != null && data.clan_alias != null) {
            data.clan_alias = data.clan_alias.toUpperCase();
        }
        
        const guilds = await Guild.get({guild_id: data.guild_id});
        if (guilds.length > 0) {
            throw new DuplicateError(`Guild already exists`);
        }
        
        const result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Guild(data);
    }
    
    // Extra functions for this class
    
    static async getByNameOrAlias(data) {
        const Guild = require(`${ROOT}/modules/alliance/Guild`);
        
        return await Guild.get( (query) =>
            query.whereIn('alliance_id', function() {
                this.select('alliance_id').from(Guild.tableName).where('guild_id', data.guild_id);
            }).andWhere('clan_name', data.clan_name).orWhere('clan_alias', data.clan_alias)
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            alliance_id: this.alliance_id,
            clan_name: this.clan_name,
            clan_alias: this.clan_alias,
            clan_id: this.clan_id,
            timezone: this.timezone,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(Guild.tableName)
            .where('guild_id', this.guild_id)
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
        return await Guild._delete({guild_id: this.guild_id});
    }
    
    async getTitle() {
        const suffix = (this.clan_alias != null ? ` [${this.clan_alias}]` : '');
        
        if (this.clan_name != null) {
            return this.clan_name + suffix;
        } else {
            const discordGuild = await client.guilds.fetch(this.guild_id);
            return discordGuild.name + suffix;
        }
    }
    
    getClanURL() {
        if (this.clan_id == null) {
            return null;
        }
        
        return `https://www.bungie.net/en/ClanV2?groupid=${this.clan_id}`;
    }
}

module.exports = Guild;
