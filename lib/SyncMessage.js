
class SyncMessage {
    constructor(messageID, channelID, content) {
        this.messageID = messageID;
        this.channelID = channelID;
        this.content   = content;
        this.childSyncMessages = [];
	}
	
	addChildMessage(childSyncMessage) {
	   // console.log('addChildMessage : childSyncMessage:');
	   // console.log(childSyncMessage);
	   // console.log();
	    
	    this.childSyncMessages.push(childSyncMessage);
	}
}

module.exports = SyncMessage;
