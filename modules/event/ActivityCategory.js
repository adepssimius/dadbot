
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

class ActivityCategory extends BaseModel {
    static tableName = 'activity_category';
    static orderBy   = 'category_name';
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get category_id() {
        return this.data.category_id;
    }
    
    get category_name() {
        return this.data.category_name;
    }
    
    get symbol() {
        return this.data.symbol;
    }
    
    get creator_id() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set category_id(value) {
        this.data.category_id = value;
    }
    
    set category_name(value) {
        this.data.category_name = value;
    }
    
    set symbol(value) {
        this.data.symbol = value.toUpperCase();
    }
    
    set creator_id(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        // Always search symbol in upper case
        if (whereClause != null && whereClause.symbol != null) {
            whereClause.symbol = whereClause.symbol.toUpperCase();
        }
        
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new ActivityCategory(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        // Always store the symbol in uppercase
        if (data != null && data.symbol != null) {
            data.symbol = data.symbol.toUpperCase();
        }
        
        const activityCategories = await ActivityCategory.getByNameOrSymbol(data);
        if (activityCategories.length > 0) {
            const activityCategory = activityCategories[0];
            throw new DuplicateError(`Existing category found with the same name or symbol: ${activityCategory.category_name} [${activityCategory.symbol}]`);
        }
        
        data.category_id = Snowflake.generate();
        const result = await this._create(data); // eslint-disable-line no-unused-vars
        return new ActivityCategory(data);
    }
    
    // Extra functions for this class
    
    static async getByNameOrSymbol(data) {
        return await ActivityCategory.get( (query) =>
            query.where('category_name', data.category_name).orWhere('symbol', data.symbol.toUpperCase())
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            category_name: this.category_name,
            symbol: this.symbol,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(ActivityCategory.tableName)
            .where('category_id', this.category_id)
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
        const Activity = require(`${ROOT}/modules/event/Activity`);
        const activities = await Activity.get({category_id: this.category_id});
        
        if (activities.length > 0) {
            throw new ForeignKeyError('Cannot delete category while activities still exist');
        }
        return await ActivityCategory._delete({category_id: this.category_id});
    }
}

module.exports = ActivityCategory;
