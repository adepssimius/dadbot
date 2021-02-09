
const SyncGroup = require('./SyncGroup');

class SyncGroupManager {
    constructor() {
        this.syncGroups = [];
    }
    
    lookup(lookupValue) {
        // Lookup by sync group name
        if (typeof lookupValue == 'string') {
            for (let x = 0; x < this.syncGroups.length; x++) {
                if (this.syncGroups[x].name == lookupValue) {
                    return this.syncGroups[x];
                }
            }
            
            return;
        
        // Lookup by channel within a sync group
        } else {
            console.log('Searching by channel for channel id = ' + lookupValue.id);
            
            for (let x = 0; x < this.syncGroups.length; x++) {
                let syncGroup = this.syncGroups[x];
                let channel = syncGroup.lookup(lookupValue);
                
                if (channel != null) {
                    return syncGroup;
                }
            }
            
            return;
        }
    }
    
    add(syncGroup) {
        if ( !(syncGroup instanceof SyncGroup) ) {
            throw 'Invalid parameter type - syncGroup must be a SyncGroup object';
        }
        
        this.syncGroups.push(syncGroup);
    }
}

const syncGroupManager = new SyncGroupManager();
Object.freeze(syncGroupManager);

module.exports = syncGroupManager;
