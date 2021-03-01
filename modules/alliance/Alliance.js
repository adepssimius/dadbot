
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
    
    static async get(objCondition) {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        let condition;
        
        if (objCondition == null) {
            condition = null;
        
        } else if (objCondition.nameOrShortName != null) {
            condition = (query) => {
                query.where('name', objCondition.nameOrShortName.name)
                    .orWhere('short_name', objCondition.nameOrShortName.shortName.toUpperCase());
            };
        
        } else if (objCondition.guildId != null) {
            const Guild = require(`${ROOT}/modules/alliance/Guild`);
            condition = (query) => {
                query.whereIn('id', function() {
                    this.select('alliance_id').from(Guild.tableName).where('id', objCondition.guildId);
                });
            };
        
        } else {
            condition = BaseModel.parseObjCondition(Alliance, objCondition);
            
            if (condition.shortName != null) {
                condition.shortName = condition.shortName.toUpperCase();
            }
        }
        
        return await BaseModel.get(Alliance, condition);
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
        
        // And attempt to create the damn thing
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        await BaseModel.create(Alliance.tableName, this.data);
    }
    
    async update() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        await BaseModel.update(Alliance.tableName, this.data);
    }
    
    async delete() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        await BaseModel.delete(Alliance.tableName, this.data);
    }
    
    getTitle() {
        return `${this.name} [${this.shortName}]`;
    }
}

module.exports = Alliance;
