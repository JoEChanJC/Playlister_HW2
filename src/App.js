import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';
import jsTPS from './common/jsTPS.js';

// OUR TRANSACTIONS
import MoveSong_Transaction from './transactions/MoveSong_Transaction.js';
import AddSong_Transaction from './transactions/AddSong_Transaction';
import RemoveSong_Transaction from './transactions/RemoveSong_Transaction';

// THESE REACT COMPONENTS ARE MODALS
import DeleteListModal from './components/DeleteListModal.js';
import EditSongModal from './components/EditSongModal';
// THESE REACT COMPONENTS ARE IN OUR UI
import Banner from './components/Banner.js';
import EditToolbar from './components/EditToolbar.js';
import PlaylistCards from './components/PlaylistCards.js';
import SidebarHeading from './components/SidebarHeading.js';
import SidebarList from './components/SidebarList.js';
import Statusbar from './components/Statusbar.js';
import DeleteSongModal from './components/DeleteSongModal';
import EditSong_Transaction from './transactions/EditSong_Transaction';


class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS IS OUR TRANSACTION PROCESSING SYSTEM
        this.tps = new jsTPS();

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            listKeyPairMarkedForDeletion : null,
            currentList : null,
            sessionData : loadedSessionData
        }
        
    }
    
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            songs: []
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            }
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF DELETING A LIST.
    deleteList = (key) => {
        // IF IT IS THE CURRENT LIST, CHANGE THAT
        let newCurrentList = null;
        if (this.state.currentList) {
            if (this.state.currentList.key !== key) {
                // THIS JUST MEANS IT'S NOT THE CURRENT LIST BEING
                // DELETED SO WE'LL KEEP THE CURRENT LIST AS IT IS
                newCurrentList = this.state.currentList;
            }
        }

        let keyIndex = this.state.sessionData.keyNamePairs.findIndex((keyNamePair) => {
            return (keyNamePair.key === key);
        });
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        if (keyIndex >= 0)
            newKeyNamePairs.splice(keyIndex, 1);

        // AND FROM OUR APP STATE
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            currentList: newCurrentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter - 1,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // DELETING THE LIST FROM PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationDeleteList(key);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    deleteMarkedList = () => {
        this.deleteList(this.state.listKeyPairMarkedForDeletion.key);
        this.hideDeleteListModal();
    }
    // THIS FUNCTION SPECIFICALLY DELETES THE CURRENT LIST
    deleteCurrentList = () => {
        if (this.state.currentList) {
            this.deleteList(this.state.currentList.key);
        }
    }
    renameList = (key, newName) => {
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        this.tps.clearAllTransactions();
        let newCurrentList = this.db.queryGetList(key);
        console.log(this.tps.getSize());
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newCurrentList,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });        
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: null,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    setStateWithUpdatedList(list) {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : list,
            sessionData : this.state.sessionData
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
    }
    getPlaylistSize = () => {
        return this.state.currentList.songs.length;
    }
    createNewSong = () => {
        let list = this.state.currentList
        let newSong = {
            title: "Untitled",
            artist: "Untitled",
            youTubeId: "dQw4w9WgXcQ"
        }
        list.songs.push(newSong);  
        this.setStateWithUpdatedList(list);

    };
    // THIS FUNCTION MOVES A SONG IN THE CURRENT LIST FROM
    // start TO end AND ADJUSTS ALL OTHER ITEMS ACCORDINGLY
    moveSong(start, end) {
        let list = this.state.currentList;
        // WE NEED TO UPDATE THE STATE FOR THE APP
        start -= 1;
        end -= 1;
        if (start < end) {
            let temp = list.songs[start];
            for (let i = start; i < end; i++) {
                list.songs[i] = list.songs[i + 1];
            }
            list.songs[end] = temp;
        }
        else if (start > end) {
            let temp = list.songs[start];
            for (let i = start; i > end; i--) {
                list.songs[i] = list.songs[i - 1];
            }
            list.songs[end] = temp;
        }
        this.setStateWithUpdatedList(list);
    }
    // THIS FUNCTION ADDS A MoveSong_Transaction TO THE TRANSACTION STACK
    addMoveSongTransaction = (start, end) => {
        let transaction = new MoveSong_Transaction(this, start, end);
        this.tps.addTransaction(transaction);
        this.db.mutationUpdateList(this.state.currentList);

    }
    addAddSongTransaction = (index) => {
        let transaction = new AddSong_Transaction(this, this.getPlaylistSize());
        this.tps.addTransaction(transaction)
        this.setStateWithUpdatedList(this.state.currentList)
        this.db.mutationUpdateList(this.state.currentList);
    }
    addRemoveSongTransaction = () => {
        
        let index = this.state.currentIndex;
        console.log(index)
        let deletedTitle = this.state.currentTitle;
        let deletedArtist = this.state.currentArtist;
        let deletedYoutubeID = this.state.currentYouTubeID;
        let transaction = new RemoveSong_Transaction(this, index, deletedTitle, deletedArtist, deletedYoutubeID);
        this.tps.addTransaction(transaction)
        this.setStateWithUpdatedList(this.state.currentList)
        this.db.mutationUpdateList(this.state.currentList);
    }
    addEditSongTransaction = (currentIndex) => {
        let otitle = this.state.currentList.songs[currentIndex].title
        let oartist = this.state.currentList.songs[currentIndex].artist
        let oyoutubeID = this.state.currentList.songs[currentIndex].youtubeId
        let transaction = new EditSong_Transaction(this, otitle, oartist, oyoutubeID, currentIndex);
        this.tps.addTransaction(transaction)
        this.setStateWithUpdatedList(this.state.currentList)
        this.db.mutationUpdateList(this.state.currentList);
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING AN UNDO
    handleKeyDown = (event)=>{
        let charCode = String.fromCharCode(event.which).toLowerCase();
        if((event.ctrlKey || event.metaKey)) {
            if((event.ctrlKey || event.metaKey) && charCode === 'z'){
                this.undo();

            }
            else if((event.ctrlKey || event.metaKey) && charCode === 'y') {
                this.redo();
            }
        }
        else{
            event.stopPropagation();
        }
    }
    KeyDownSwith(){
        var saved_keydown = document.onkeydown;
        document.onkeydown = null;

        document.onkeydown = saved_keydown;
    }
    
    undo = () => {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING A REDO
    redo = () => {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    isUndoButtonAllowed(){
        if(this.tps.getUndoSize() <= 0 || this.isPlaylistNotLoaded()){
            return true

        }
        else{
            return false
        }
    }
    checkUndoButton(){
        if(this.tps.getUndoSize() <= 0 || this.isPlaylistNotLoaded()){
            return false

        }
        else{
            return true
        }
    }
    isRedoButtonAllowed(){
        if(this.tps.getRedoSize() <= 0 || this.isPlaylistNotLoaded()){
            return true
        }
        else{
            return false
        }
    }
    checkRedoButton(){
        if(this.tps.getRedoSize() <= 0 || this.isPlaylistNotLoaded()){
            return false
        }
        else{
            return true
        }
    }
    isPlaylistNotLoaded(){
        if(this.state.currentList !== null)
            return false;
        else{
            return true
        }
    }
    isPlaylistLoaded(){
        if(this.state.currentList !== null)
            return true;
        else{
            return false;
        }
    }
    markListForDeletion = (keyPair) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : keyPair,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showDeleteListModal();
        });
    }
    deleteSong = (index) => {
        console.log(index)
        let currentTitle = this.state.currentList.songs[index].title
        let currentArtist = this.state.currentList.songs[index].artist
        let currentYouTubeID = this.state.currentList.songs[index].youtubeId

        this.setState(prevState => ({
            currentList: prevState.currentList,
            // listKeyPairMarkedForDeletion : song,
            sessionData: prevState.sessionData,
            currentTitle: currentTitle,
            currentIndex: index,
            currentTitle: currentTitle,
            currentArtist: currentArtist,
            currentYouTubeID: currentYouTubeID
        }), () => {
            this.showDeleteSongModal();
        });
    }
    deleteMarkedSong = (index) => {
        this.confirmDeleteSong(index);
        console.log("works")
        this.hideDeleteSongModal();
    }
    confirmDeleteSong = (index) =>{
        console.log(index)
        // let oldList = this.state.currentList;
        let list = this.state.currentList;

        if (index >= 0) { 
            list.songs.splice(index,1); 
        }
        
        this.setStateWithUpdatedList(list);
    };
    cancelDeleteSong= () => {        
        this.setState(prevState => ({
            currentList: prevState.currentList,
            // listKeyPairMarkedForDeletion : song,
            sessionData: prevState.sessionData,
            currentTitle: prevState.currentTitle,
            currentIndex: prevState.currentIndex
        }), () => {
            this.hideDeleteSongModal();
        });
    }
    undoDelete(i, deletedTitle, deletedArtist, deletedYoutubeID){
        let newSong = {
            title: deletedTitle,
            artist: deletedArtist,
            youTubeId: deletedYoutubeID
        }
        this.state.currentList.songs.splice(i,0,newSong);
        this.setStateWithUpdatedList(this.state.currentList);

    }
    editSong = (song, index) => {
        
        let currentTitle = this.state.currentList.songs[index].title
        let currentArtist = this.state.currentList.songs[index].artist
        let currentYouTubeID = this.state.currentList.songs[index].youTubeId
        
        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData,
            oldSong: song,
            indexToEdit: index,
            currentTitle: currentTitle,
            currentArtist: currentArtist,
            currentYouTubeID: currentYouTubeID
        }), () => {
            // PROMPT THE USER
            this.showEditSongModal();
        });
    }
    handleNewTitle = (event) => {
        this.setState({
            currentTitle: event.target.value});
    }
    handleNewArtist = (event) => {
        this.setState({currentArtist: event.target.value});
    }
    handleNewYouTubeID = (event) => {
        this.setState({currentYouTubeID: event.target.value});
    }
    confirmEditSong = () =>{
        let index = this.state.indexToEdit;
        let title = this.state.currentTitle;
        let artist = this.state.currentArtist;
        let youtubeID = this.state.currentYouTubeID;
        
        let newCurrentList = this.state.currentList
        newCurrentList.songs[index].title = title
        newCurrentList.songs[index].artist = artist
        newCurrentList.songs[index].youTubeID = youtubeID
        
        this.setState(prevState => ({
            currentList:newCurrentList,
            listKeyPairMarkedForDeletion: prevState.listKeyPairMarkedForDeletion,
            sessionData: prevState.sessionData,
            indexToEdit: index,
            currentTitle: prevState.currentTitle
        }), () => {
            this.hideEditSongModal();
        });
    };
    cancelEditSong = () =>{     
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion: prevState.listKeyPairMarkedForDeletion,
            sessionData: prevState.sessionData,
            indexToEdit: prevState.indexToEdit,
            currentTitle: prevState.currentTitle
        }), () => {
            this.hideEditSongModal();
        });
    };
    reEditSong = (otitle, oartist, oyoutubeID, currentIndex) =>{
        let list = this.state.currentList
        list.songs[currentIndex].title = otitle
        list.songs[currentIndex].artist = oartist
        list.songs[currentIndex].youTubeID = oyoutubeID
        this.setStateWithUpdatedList(list);
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        let addlistbutton  = document.getElementById('add-list-button');
        addlistbutton.disabled = true
        addlistbutton.classList.add("disabled");
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        let addlistbutton  = document.getElementById('add-list-button');
        addlistbutton.disabled = false
        addlistbutton.classList.remove("disabled");
        modal.classList.remove("is-visible");
    }
    showDeleteSongModal() {
        let modal = document.getElementById("delete-song-modal");
        this.disableButtons();
        modal.classList.add("is-visible");
    }
    hideDeleteSongModal() {
        let modal = document.getElementById("delete-song-modal");
        this.enableButtons();
        modal.classList.remove("is-visible");
    }
    showEditSongModal() {
        let modal = document.getElementById("edit-song-modal");
        this.disableButtons();
        modal.classList.add("is-visible");
    }
    hideEditSongModal() {
        let modal = document.getElementById("edit-song-modal");
        this.enableButtons();
        modal.classList.remove("is-visible");
    }
    disableButtons(){
        let addbutton  = document.getElementById('add-song-button');
        let undobutton  = document.getElementById('undo-button');
        let redobutton  = document.getElementById('redo-button');
        let closelistbutton  = document.getElementById('close-button');
        if(!addbutton.disabled){
            addbutton.classList.add("disabled");
            addbutton.disabled = true;
        }
        if(!undobutton.disabled){
            undobutton.classList.add("disabled");
            undobutton.disabled = true;
        }
        if(!redobutton.disabled){
            redobutton.classList.add("disabled");
            redobutton.disabled = true;
        }
        if(!closelistbutton.disabled){
            closelistbutton.classList.add("disabled");
            closelistbutton.disabled = true;
        }
    }
    enableButtons(){
        let addbutton  = document.getElementById('add-song-button');
        let undobutton  = document.getElementById('undo-button');
        let redobutton  = document.getElementById('redo-button');
        let closelistbutton  = document.getElementById('close-button');
        if(addbutton.disabled){
            addbutton.classList.remove("disabled");
            addbutton.disabled = false;
        }
        if(undobutton.disabled && this.checkUndoButton()){
            undobutton.classList.remove("disabled");
            undobutton.disabled = false;
        }
        if(redobutton.disabled && this.checkRedoButton()){
            redobutton.classList.remove("disabled");
            redobutton.disabled = false;
        }
        if(closelistbutton.disabled && this.state.currentList != null){
            closelistbutton.classList.remove("disabled");
            closelistbutton.disabled = false;
        }
    }
    
    render() {
        let canAddSong = this.isPlaylistNotLoaded();
        let canUndo = this.isUndoButtonAllowed();
        let canRedo = this.isRedoButtonAllowed();
        let canClose = this.isPlaylistNotLoaded();
        let canAddList = this.isPlaylistLoaded();
        
        return (
            <div id="root" onKeyDown={this.handleKeyDown}
            >
                <Banner />
                <SidebarHeading
                    createNewListCallback={this.createNewList}
                    canAddList={canAddList}
                />
                <SidebarList
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    deleteListCallback={this.markListForDeletion}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                />
                <EditToolbar
                    canAddSong={canAddSong}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canClose={canClose} 
                    undoCallback={this.undo}
                    redoCallback={this.redo}
                    closeCallback={this.closeCurrentList}
                    createNewSongCallback = {this.addAddSongTransaction}
                />
                <PlaylistCards
                    currentList={this.state.currentList}
                    moveSongCallback={this.addMoveSongTransaction} 
                    editSongCallback = {this.editSong}
                    deleteSongCallback = {this.deleteSong}
                />
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteListModal
                    listKeyPair={this.state.listKeyPairMarkedForDeletion}
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    deleteListCallback={this.deleteMarkedList}
                />
                <EditSongModal
                    hideEditSongModalCallback = {this.cancelEditSong}
                    editSongCallback = {this.addEditSongTransaction}
                    handleNewTitle = {this.handleNewTitle}
                    handleNewArtist = {this.handleNewArtist}
                    handleNewYouTubeID = {this.handleNewYouTubeID}
                    currentTitle = {this.state.currentTitle}
                    currentArtist = {this.state.currentArtist}
                    currentYouTubeID = {this.state.currentYouTubeID}
                    currentIndex = {this.state.indexToEdit}
                />
                <DeleteSongModal
                    currentTitle = {this.state.currentTitle}
                    deleteSongCallback = {this.addRemoveSongTransaction}
                    hideDeleteSongCallback = {this.cancelDeleteSong}
                />
            </div>
        );
    }
}

export default App;
