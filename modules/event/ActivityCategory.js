
// Load our classes
const BaseModel      = require('../BaseModel.js');
const DuplicateError = require('../error/DuplicateError');
const Snowflake      = require('../Snowflake');

// Load singletons
const client = require('../Client.js'); // eslint-disable-line no-unused-vars
const knex   = require('../Database.js');

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
    
    get category_abbr() {
        return this.data.category_abbr;
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
    
    set category_abbr(value) {
        this.data.category_abbr = value;
    }
    
    set creator_id(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new ActivityCategory(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const activityCategories = await ActivityCategory.getByNameOrAbbr(data);
        if (activityCategories.length > 0) {
            const activityCategory = activityCategories[0];
            throw new DuplicateError(`Existing category found with the same name or abbreviation: [${activityCategory.category_abbr}] ${activityCategory.category_name}`);
        }
        
        data.category_id = Snowflake.generate();
        const result = await this._create(data); // eslint-disable-line no-unused-vars
        return new ActivityCategory(data);
    }
    
    // Extra functions for this class
    
    static async getByNameOrAbbr(data) {
        return await ActivityCategory.get( (query) =>
            query.where('category_name', data.category_name).orWhere('category_abbr', data.category_abbr)
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            category_name: this.category_name,
            category_abbr: this.category_abbr,
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
        return await ActivityCategory._delete({category_name: this.category_name});
    }
}

module.exports = ActivityCategory;
