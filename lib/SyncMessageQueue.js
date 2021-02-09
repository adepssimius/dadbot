
const SyncMessage = require('./SyncMessage');

class SyncMessageQueue {
    constructor(maxQueueSize = 50) {
        this.maxQueueSize = maxQueueSize;
        this.queue        = new Map();
    }
    
    add(syncMessage) {
        if ( !(syncMessage instanceof SyncMessage) ) {
            throw 'Invalid parameter type - syncMessage must be a SyncMessage object';
        }
        
        this.queue.set(syncMessage.messageID, syncMessage);

        // console.log('typeof this.queue');
        // console.log(typeof this.queue);
        // console.log();

        while (this.queue.size > this.maxQueueSize) {
            let firstSyncMessageID = this.queue.keys().next().value;
            
            // let firstSyncMessage   = this.get(firstSyncMessageID);
            // let queueSize          = this.queue.size;
            
            // console.log('queueSize: ' + queueSize);
            // console.log('firstSyncMessageID: ' + firstSyncMessageID);
            // console.log('firstSyncMessage:');
            // console.log(firstSyncMessage);
            // console.log();
            
            this.delete(firstSyncMessageID);
        }
        
        // console.log();
    }
    
    get(messageID) {
        if (messageID === null) {
            throw 'Invalid parameter - messageID is null';
        } else if (typeof messageID != 'string') {
            throw 'Invalid parameter - messageID must be a string';
        }
        
        return this.queue.get(messageID);
    }
    
    delete(messageID) {
        if (messageID === null) {
            throw 'Invalid parameter - messageID is null';
        } else if (typeof messageID != 'string') {
            throw 'Invalid parameter - messageID must be a string';
        }
        
        return this.queue.delete(messageID);
    }
}

module.exports = SyncMessageQueue;
