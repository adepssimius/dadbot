
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
    
    get id() {
        return this.data.id;
    }
    
    get createdAt() {
        return this.data.created_at;
    }
    
    get updatedAt() {
        return this.data.updated_at;
    }
    
    // Remove these when all data classes have been converted
    get created_at() {
        return this.createdAt;
    }
    
    get updated_at() {
        return this.updatedAt;
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
    
    // Remove these when all data classes have been converted
    set created_at(value) {
        this.createdAt = value;
    }
    
    set updated_at(value) {
        this.updatedAt = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    //static get(conditions) {
    //    return null;
    //}
    
    static async get(ChildClass, condition) {
        let rows;
        
        if (condition != null) {
            rows = await knex(ChildClass.tableName)
                .where(condition)
                .orderBy(this.orderBy)
                .then(function(rows) {
                    return rows;
                });
        } else {
            rows = await knex(ChildClass.tableName)
                .orderBy(this.orderBy)
                .then(function(rows) {
                    return rows;
                });
        }
        
        const result = [];
        for (let x = 0; x < rows.length; x++) {
            result.push(new ChildClass(rows[x]));
        }
        return result;
    }
    
    //static async _create(data) {
    //    const timestamp = knex.fn.now();
    //    data.created_at = timestamp;
    //    data.updated_at = timestamp;
    //    
    //    return await knex(this.tableName)
    //        .insert(data)
    //        .then(function(result) {
    //            return result;
    //        });
    //}
    
    //static async _delete(condition) {
    //    return await knex(this.tableName)
    //        .where(condition)
    //        .delete()
    //        .then(result => {
    //            return result;
    //        });
    //}
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    static async create(tableName, data) {
        return await knex(tableName)
            .insert(data)
            .then(function(result) {
                return result;
            });
    }
    
    static async update(tableName, data, condition) {
        if (condition == null) {
            condition = {id: data.id};
        }
        
        // Update the timestamp
        this.updatedAt = knex.fn.now();
        
        const rowsChanged = await knex(tableName)
            .where(condition)
            .update(data)
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
    
    static async delete(tableName, data, condition) {
        if (condition == null) {
            condition = {id: data.id};
        }
        
        return await knex(tableName)
            .where(condition)
            .delete()
            .then(result => {
                return result;
            });
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
    
    static snakeToCamel(str) {
        return str.replace( /([-_][a-z])/g, (group) => group.toUpperCase().replace('_', '') );
    }
    
    static parseObjCondition(ChildClass, objCondition) {
        const condition = {};
        
        for (const objField in objCondition) {
            const dbField = ChildClass.fieldMap.objFields.get(objField);
            
            if (dbField == null) {
                throw new Error(`Unrecognized field - ${objField}`);
            }
            
            condition[dbField] = objCondition[objField];
        }
        
        return condition;
    }
}

module.exports = BaseModel;
