
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Alliance extends BaseModel {
    static tableName = 'alliance';
    static orderBy   = 'name';
    static fields    = ['id', 'name', 'short_name', 'creator_id'];
    static fieldMap  = BaseModel.getFieldMap(Alliance.fields);
    
    constructor(data) {
        super(Alliance, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return Alliance.tableName;
    }
    
    get name() {
        return this.data.name;
    }
    
    get shortName() {
        return this.data.short_name;
    }
    
    get creatorId() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set name(value) {
        this.data.name = value;
    }
    
    set shortName(value) {
        if (value == null) {
            this.data.short_name = null;
        } else {
            this.data.short_name = value.toUpperCase();
        }
    }
    
    set creatorId(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        // Check for a name or short name search
        if (conditions.nameOrShortName != null) {
            return (query) => {
                query.where('name', conditions.nameOrShortName.name)
                    .orWhere('short_name', conditions.nameOrShortName.shortName.toUpperCase());
            };
        }
        
        // Check for a guild id search
        if (conditions.guildId != null) {
            const Guild = require(`${ROOT}/modules/alliance/Guild`);
            return (query) => {
                query.whereIn('id', function() {
                    this.select('alliance_id').from(Guild.tableName).where('id', conditions.guildId);
                });
            };
        }
        
        // Handle any special fields
        let parsedConditions = conditions;
        
        if (parsedConditions.shortName != null) {
            parsedConditions.shortName = parsedConditions.shortName.toUpperCase();
        }
        
        return parsedConditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const alliances = await Alliance.get({
            'nameOrShortName': {
                name: this.name,
                shortName: this.shortName
            }
        });
        
        // Check if this is a duplicate alliance
        if (alliances.length > 0) {
            throw new DuplicateError(`Existing alliance found with the same name or short name: ${this.name} [${this.shortName}]`);
        }
        
        // Create the ID for this alliance
        this.id = Snowflake.generate();
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
    
    getTitle() {
        return `${this.name} [${this.shortName}]`;
    }
}

module.exports = Alliance;
