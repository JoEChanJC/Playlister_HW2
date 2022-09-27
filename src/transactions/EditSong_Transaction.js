import jsTPS_Transaction from "../common/jsTPS.js"

export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, title, artist, youtubeID, currentIndex) {
        super();
        this.app = initApp; 
        this.otitle = title;
        this.oartist = artist;
        this.oyoutubeid = youtubeID;
        this.oindex = currentIndex
    }

    doTransaction() {
        this.app.confirmEditSong();
    }
    
    undoTransaction() {
        this.app.reEditSong(this.otitle, this.oartist, this.oyoutubeid, this.oindex);
    }
}