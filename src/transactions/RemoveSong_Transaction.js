import jsTPS_Transaction from "../common/jsTPS.js"

export default class RemoveSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, currentIndex, deletedTitle, deletedArtist, deletedYoutubeID) {
        super();
        this.app = initApp;
        this.index = currentIndex;
        this.title = deletedTitle;
        this.artist = deletedArtist;
        this.youTubeID = deletedYoutubeID;
    }

    doTransaction() {
        this.app.deleteMarkedSong(this.index);
    }
    
    undoTransaction() {
        this.app.undoDelete(this.index,this.title, this.artist, this.youtubeID);
    }
}