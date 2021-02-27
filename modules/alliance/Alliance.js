
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel       = require(`${ROOT}/modules/BaseModel`);
const DuplicateError  = require(`${ROOT}/modules/error/DuplicateError`);
const ForeignKeyError = require(`${ROOT}/modules/error/ForeignKeyError`);
const Snowflake       = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class Alliance extends BaseModel {
    static tableName = 'alliance';
    static orderBy   = 'alliance_name';
    
    constructor(data) {
        super({});
        this.data = data;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get alliance_id() {
        return this.data.alliance_id;
    }
    
    get alliance_name() {
        return this.data.alliance_name;
    }
    
    get alliance_alias() {
        return this.data.alliance_alias;
    }
    
    get creator_id() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set alliance_id(value) {
        this.data.alliance_id = value;
    }
    
    set alliance_name(value) {
        this.data.alliance_name = value;
    }
    
    set alliance_alias(value) {
        this.data.alliance_alias = value.toUpperCase();
    }
    
    set creator_id(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        // Always search alliance_alias in upper case
        if (whereClause != null && whereClause.alliance_alias != null) {
            whereClause.alliance_alias = whereClause.alliance_alias.toUpperCase();
        }
        
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Alliance(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        if (data != null && data.alliance_alias != null) {
            data.alliance_alias = data.alliance_alias.toUpperCase();
        }
        
        const alliances = await Alliance.getByNameOrAlias(data);
        if (alliances.length > 0) {
            const alliance = alliances[0];
            throw new DuplicateError(`Existing alliance found with the same name or alias: ${alliance.alliances_name} [${alliance.alliance_alias}]`);
        }
        
        data.alliance_id = Snowflake.generate();
        const result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Alliance(data);
    }
    
    // Extra functions for this class
    
    static async getByNameOrAlias(data) {
        return await Alliance.get( (query) =>
            query.where('alliance_name', data.alliance_name).orWhere('alliance_alias', data.alliance_alias.toUpperCase())
        );
    }
    
    static async getByGuildID(data) {
        const Guild = require(`${ROOT}/modules/alliance/Guild`);
        
        return await Alliance.get( (query) =>
            query.whereIn('alliance_id', function() {
                this.select('alliance_id').from(Guild.tableName).where('guild_id', data.guild_id);
            })
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            alliance_name: this.alliance_name,
            alliance_alias: this.alliance_alias,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(Alliance.tableName)
            .where('alliance_id', this.alliance_id)
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
        return await Alliance._delete({alliance_id: this.alliance_id});
    }
    
    getTitle() {
        return `${this.alliance_name} [this.alliance_alias]`;
    }
}

module.exports = Alliance;
