
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class BaseModel {
    static tableName = null;
    static orderBy   = 'created_at';
    static fields    = [];
    static fieldMap  = null;
    
    data = {};
    
    constructor(ChildClass, data) {
        // Iterate over the incoming field data
        for (const field in data) {
            const objField = ChildClass.fieldMap.allFields.get(field);
            
            if (objField == null) {
                throw new Error(`Unrecognized field - ${field}`);
            }
            
            this[objField] = data[field];
        }
        
        // Check if this is a new object
        if ( (this.createdAt == null) && (this.updatedAt == null)) {
            const timestamp = knex.fn.now();
            this.createdAt = timestamp;
            this.updatedAt = timestamp;
        }
    }
    
    // ************ //
    // * Getters  * //
    // ************ //
    
    get tableName() {
        return BaseModel.tableName;
    }
    
    get id() {
        return this.data.id;
    }
    
    get createdAt() {
        return this.data.created_at;
    }
    
    get updatedAt() {
        return this.data.updated_at;
    }
    
    // *********** //
    // * Setters * //
    // ********** //
    
    set id(value) {
        this.data.id = value;
    }
    
    set createdAt(value) {
        if (this.data.created_at != null) {
            throw new Error('Cowardly refusing to change createdAt!');
        }
        this.data.created_at = value;
    }
    
    set updatedAt(value) {
        this.data.updated_at = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(conditions = {}) {
        let parsedConditions = conditions;
        
        if (typeof conditions == 'object') {
            parsedConditions = this.parseConditions(conditions);
            parsedConditions = this.parseFieldConditions(parsedConditions);
        }
        
        const rows = await knex(this.tableName)
            .where(parsedConditions)
            .orderBy(this.orderBy)
            .then(function(rows) {
                return rows;
            });

        const result = [];
        for (let x = 0; x < rows.length; x++) {
            result.push(new this(rows[x]));
        }
        return result;
    }
    
    static parseConditions(conditions) {
        return conditions;
    }
    
    static parseFieldConditions(conditions) {
        if (typeof conditions != 'object') {
            return conditions;
        }
        
        const parsedConditions = {};
        
        for (const objField in conditions) {
            const dbField = this.fieldMap.objFields.get(objField);
            
            if (dbField == null) {
                throw new Error(`Unrecognized field - ${objField}`);
            }
            
            parsedConditions[dbField] = conditions[objField];
        }
        
        return parsedConditions;
    }
    
    static snakeToCamel(str) {
        return str.replace( /([-_][a-z])/g, (group) => group.toUpperCase().replace('_', '') );
    }
    
    static getFieldMap(fields) {
        const allFieldMap = new Map();
        const objFieldMap = new Map();
        
        fields.push('created_at', 'updated_at');
        
        for (let x = 0; x < fields.length; x++) {
            const dbField = fields[x];
            const objField = BaseModel.snakeToCamel(dbField);
            
            objFieldMap.set(objField, dbField);
            allFieldMap.set(objField, objField);
            
            if (dbField != objField) {
                allFieldMap.set(dbField, objField);
            }
        }
        
        return {allFields: allFieldMap, objFields: objFieldMap};
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const tableName = this.tableName;
        return await knex(tableName)
            .insert(this.data)
            .then(function(result) {
                return result;
            });
    }
    
    async update(condition = {id: this.id}) {
        const tableName = this.tableName;
        
        // Update the timestamp
        this.updatedAt = knex.fn.now();
        
        const rowsChanged = await knex(tableName)
            .where(condition)
            .update(this.data)
            .then(result => {
                return result;
            });
        
        if (rowsChanged == 0) {
            throw new Error('Update did not change any records!');
        } else if (rowsChanged > 1) {
            throw new Error('Update changed more then one record!');
        }
        
        return rowsChanged;
    }
    
    async delete(condition = {id: this.id}) {
        const tableName = this.tableName;
        
        return await knex(tableName)
            .where(condition)
            .delete()
            .then(result => {
                return result;
            });
    }
}

module.exports = BaseModel;
