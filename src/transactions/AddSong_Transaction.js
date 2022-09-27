import jsTPS_Transaction from "../common/jsTPS.js"

export default class AddSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, index) {
        super();
        this.app = initApp;        
        this.oldIndex = index;
    }

    doTransaction() {
        this.app.createNewSong();
    }
    
    undoTransaction() {
        this.app.confirmDeleteSong(this.oldIndex);
    }
}