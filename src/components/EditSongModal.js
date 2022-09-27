import React, { Component } from 'react';

export default class EditSongModal extends Component {
    constructor(props){
        super(props);
        this.state = {
            title: this.props.currentTitle,
            artist: this.props.currentArtist,
            youtubeID: this.props.currentYouTubeID,
            currentIndex: this.props.currentIndex
        };
    }
    handleEditSong = (e) =>{
        const { editSongCallback} = this.props;
        editSongCallback(this.props.currentIndex)
    };
    render() {
        const { currentTitle,
            currentArtist,
            currentYouTubeID, 
            hideEditSongModalCallback, 
            handleNewTitle, handleNewArtist, 
            handleNewYouTubeID} = this.props;
            
        return (
            <div 
                class="modal" 
                id="edit-song-modal" 
                data-animation="slideInOutLeft">
                    <div class="modal-root" id='verify-delete-list-root'>
                        <div class="modal-north">
                            Edit Song
                        </div>
                        <div class="modal-left">
                            <div class="modal-left-content">
                                Title: <input type="text"  value = {currentTitle} class="edit-song-input" id="editTitle" onChange={handleNewTitle}></input>
                            </div>
                        </div>
                        <div class="modal-left">
                            <div class="modal-left-content">
                                Artist: <input type="text" value = {currentArtist} class="edit-song-input" id="editArtist" onChange={handleNewArtist}></input>
                            </div>
                        </div>
                        <div class="modal-left">
                            <div class="modal-left-content">
                                YouTube ID: <input type="text" value = {currentYouTubeID} class="edit-song-input" id="editYouTubeID" onChange={handleNewYouTubeID}></input>
                            </div>
                        </div>
                        <div class="modal-south">
                            <input type="button" 
                                id="delete-list-confirm-button" 
                                class="modal-button" 
                                onClick={this.handleEditSong}
                                value='Confirm' />
                            <input type="button" 
                                id="delete-list-cancel-button" 
                                class="modal-button" 
                                onClick={hideEditSongModalCallback}
                                value='Cancel' />
                        </div>
                    </div>
            </div>
        );
    }
}