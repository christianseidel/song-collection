import {Link, Song} from './songModels'
import '../styles/common.css'
import '../styles/songDetails.css'
import React, {FormEvent, useEffect, useState} from "react";
import DisplayMessageSongs from "./DisplayMessageSongs";
import EditSongTitle from "./handleTitleLine/EditSongTitle";
import CreateSongTitle from "./handleTitleLine/CreateSongTitle";
import DisplaySongTitle from "./handleTitleLine/DisplaySongTitle";
import {Reference, songCollectionToRealName} from "../References/referenceModels";

interface SongItemProps {
    song: Song;
    onItemDeletion: (message: string) => void;
    onItemCreation: (message: string) => void;
    onItemRevision: (song: Song) => void;
    doReturn: () => void;
    clear: () => void;
}

function SongItemDetailsView(props: SongItemProps) {

    const [songState, setSongState] = useState(props.song.status);
    const [message, setMessage] = useState('');

    useEffect(() => setSongState(props.song.status), [props.song.status]);

    let handelTitleLine;  // controls the first two lines of the Song Details View
    if (songState === 'display') {
        handelTitleLine = <DisplaySongTitle
            song={props.song}
            updateDetailsView={() => setSongState(props.song.status)}
            clear={props.clear}
        />;
    } else if (songState === 'edit') {
        handelTitleLine = <EditSongTitle
            song={props.song}
            updateDetailsView={() => setSongState(props.song.status)}
            onItemRevision={(song) => props.onItemRevision(song)}
        />;
    } else if (songState === 'create') {
        handelTitleLine = <CreateSongTitle
            song={props.song}
            onItemCreation={(song) => props.onItemRevision(song)}
            clear={props.clear}
        />;
    }

    function deleteSong(id: string) {
        unhideAllReferencesAttached(id);
        fetch('/api/songbook/' + id, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    sessionStorage.setItem('messageType', 'green');
                    sessionStorage.setItem('message', 'Your song "' + props.song.title + '" was deleted!');
                } else {
                    sessionStorage.setItem('messageType', 'red');
                    sessionStorage.setItem('message', 'Your song could not be deleted!');
                }
            })
            .then(props.doReturn);
    }

    const unhideAllReferencesAttached = (songId: string) => {
        fetch('api/songbook/unhideReferences/' + songId, {
            method: 'PUT'})
            .then(response => {return response.json();})
            //.then((responseBody: string) => (setMessage(responseBody)));
    }

    function saveSongItem() {
        let responseStatus: number;
        fetch('api/songbook/' + props.song.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: props.song.id,
                title: props.song.title,
                author: props.song.author,
                dateCreated: props.song.dateCreated,
                year: props.song.year,
                description: props.song.description,
                references: props.song.references,
                links: props.song.links,
            })
        })
            .then(response => {
                responseStatus = response.status;
                return response.json();
            })
            .then((responseBody: Song) => {
                if (responseStatus === 200) {
                    responseBody.status = 'display';
                    props.onItemRevision(responseBody);
                } else {
                    sessionStorage.setItem('messageType', 'red');
                    sessionStorage.setItem('message', 'The item Id no. ' + props.song.id + ' could not be saved.');
                }
            });
    }


    // --- DESCRIPTION ELEMENTS --- //

    const [toggleOpenDescription, setToggleOpenDescription] = useState(false);
    useEffect(() => {setToggleOpenDescription(false)}, [props.song.title]);

    const [description, setDescription] = useState(sessionStorage.getItem('description') ?? '');
    useEffect(() => {
        sessionStorage.setItem('description', description)}, [description]);

    const openOrCloseAddDescription = () => {
        setToggleOpenReferences(false);
        setToggleOpenLinks(false);
        if (!toggleOpenDescription) {
            setDescription(props.song.description ?? '')
        } else {
            setDescription('')
        }
        setToggleOpenDescription(!toggleOpenDescription);
    }

    const doAddDescription = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        props.song.description = description;
        saveSongItem();
        setToggleOpenDescription(false);
        setDescription('');
        sessionStorage.removeItem('description');
    }

    const doClearDescription = () => {
        setDescription('');
        props.song.description = '';
        /*
                setToggleOpenDescription(false);
        */
        sessionStorage.removeItem('description');
        saveSongItem();
    }


    // --- REFERENCES ELEMENTS --- //

    const [toggleOpenReferences, setToggleOpenReferences] = useState(false);
    useEffect(() => {setToggleOpenReferences(false)}, [props.song.title]);

    const openOrCloseAddReference = () => {
        setToggleOpenDescription(false);
        setToggleOpenLinks(false);
        if (!toggleOpenReferences) {
            setDescription(props.song.description ?? '')
        } else {
            setDescription('')
        }
        setToggleOpenReferences(!toggleOpenReferences);
    }

    const [collection, setCollection] = useState('');
    const [page, setPage] = useState('');

    const doAddReference = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        let next: number;
        let reference = new Reference(props.song.title, collection, Number(page));
        if (props.song.references !== undefined) {
            next = props.song.references.length;
            props.song.references[next] = reference;
        } else {
            alert("the resources array is undefined!");
            console.log("the resources array is undefined!");
        }
        saveSongItem();
        setToggleOpenReferences(false); setCollection(''); setPage('');
    }

    const editItem = (id: string) => {
      alert("spass muss sein " + id);
    }


    // --- LINK ELEMENTS --- //

    const [toggleOpenLinks, setToggleOpenLinks] = useState(false);
    useEffect(() => {setToggleOpenLinks(false)}, [props.song.title]);

    const [linkText, setLinkText] = useState(sessionStorage.getItem('linkText') ?? '');
    useEffect(() => {
        sessionStorage.setItem('linkText', linkText)}, [linkText]);
    const [linkTarget, setLinkTarget] = useState(sessionStorage.getItem('linkTarget') ?? '');
    useEffect(() => {
        sessionStorage.setItem('linkTarget', linkTarget)}, [linkTarget]);

    const openOrCloseAddLink = () => {
        setToggleOpenDescription(false);
        setToggleOpenReferences(false);
        if (!toggleOpenLinks) {
            setLinkText('')
            setLinkTarget('')
        } else {
            setLinkText('')
            setLinkTarget( '')
        }
        setToggleOpenLinks(!toggleOpenLinks);
    }

    const doAddLink = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        let next: number;
        let finalTarget = linkTarget;
        if (linkTarget.slice(0, 4) != 'http') {
            finalTarget = 'https://' + finalTarget;
        }
        let link = new Link(linkText, finalTarget);
        if (props.song.links !== undefined) {
            next = props.song.links.length;
            props.song.links[next] = link;
        } else {
            alert("the resources array is undefined!");
            console.log("the resources array is undefined!");
        }
        saveSongItem();
        setToggleOpenLinks(false); setLinkText(''); setLinkTarget('');
    }



    return (
        <div>
            <div id={'songHead'}>
            <div>{handelTitleLine}</div>
            </div>

            <div id={'songBody'}>
                <div id={'iconContainer'}>
                        <span className={'icon tooltip'} id={'iconInfo'} onClick={openOrCloseAddDescription}>
                            i
                            <span className="tooltipText">add a description</span>
                        </span>
                        <span className={'icon tooltip'} id={'iconReference'} onClick={openOrCloseAddReference}>
                            R
                            <span className="tooltipText">add a song sheet reference</span>
                        </span>
                        <span className={'icon tooltip'} id={'iconLink'} onClick={openOrCloseAddLink}>
                            &#8734;
                            <span className="tooltipText">add a link</span>
                        </span>
                        <span className={'icon tooltip'} id={'iconFile'} onClick={() => alert("adding song sheets as a file yet to implement")}>
                            &#128195;
                            <span className="tooltipText">add a file</span>
                        </span>
                </div>

                {props.song.description && !toggleOpenDescription &&  // display description if any
                    <div id={'displayDescription'} onClick={openOrCloseAddDescription}>
                    {props.song.description}
                </div>}

                {toggleOpenDescription && <div>
                    <form onSubmit={ev => doAddDescription(ev)}>
                        <label>Add a Comment or Description:</label><br/>
                        <textarea id={'inputDescription'} value={description}
                                rows={3}
                                  cols={60}
                                placeholder={'your description here...'}
                                onChange={ev => setDescription(ev.target.value)} autoFocus required/>
                        <button id={'buttonAddDescription'} type='submit'>
                            &#10004; add</button>
                    </form>
                    <button id={'buttonCancelAddDescription'} onClick={openOrCloseAddDescription}>
                        &#10008; cancel</button>
                    <button id={'buttonClearDescription'} type='submit' onClick={doClearDescription}>
                        ! clear</button>


                </div> }

                {/* the following line is for development purposes only: */}
                {props.song.references !== undefined && props.song.references.length === 0 && !toggleOpenReferences
                    && <span className={'displayReferences'}>0 references</span>}

                {props.song.references !== undefined && props.song.references.length > 0
                    && !toggleOpenReferences &&  // display References
                    <div className={'displayReferences'}>
                        <div id={'listOfReferences'}>
                            {props.song.references.map((item, index) =>
                                <div key={index} className={'retainedReferenceItem'} onClick={() => editItem(item.title)}>
                                    &ndash;&#129174;&nbsp; {(item.addedCollection === null) ? <span>{songCollectionToRealName(item.songCollection)}</span> : <span>{item.addedCollection}</span> },
                                    page {item.page}
                                </div>)}
                        </div>
                    </div>}

                {toggleOpenReferences && <div>
                    <form id={'inputFormRef'} onSubmit={ev => doAddReference(ev)}>
                        <label>Add a Song Sheet Reference</label> (Collection)<label>:</label>
                        <button id={'buttonUpdateReference'} type='submit'> &#10004; update</button><br />
                        <span id={'secondLineRef'}>
                            <label>Coll.:</label>
                            <input id={'inputRefCollection'} type='text' value={collection} placeholder={'Song Collection'}
                                onChange={ev => setCollection(ev.target.value)} required/>
                            <label id={'labelInputRefPage'}>Page:</label>
                            <input id={'inputRefPage'} type='number' value={page} placeholder={'Page'}
                                onChange={ev => setPage(ev.target.value)} required/>
                            <button id={'buttonCancelAddReference'} onClick={
                                () => {
                                    props.song.status = 'display';
                                    setToggleOpenReferences(false);
                                }
                            }> &#10008; cancel
                            </button>
                        </span>
                    </form>
                </div>}


                {props.song.links !== undefined && props.song.links.length > 0
                    && !toggleOpenLinks &&  // display Links
                    <div className={'displayReferences'}>
                        <div id={'listOfReferences'}>
                            {props.song.links.map((item, index) =>
                                <div key={index} className={'link'}>
                                    <span id={'linkDot'}>&#8734;</span>&nbsp;
                                    <a href={item.linkTarget} target={'_blank'}>{item.linkText}</a>
                                </div>)}
                        </div>
                    </div>}


                {toggleOpenLinks && <div>
                    <form id={'inputFormLink'} onSubmit={ev => doAddLink(ev)}>
                        <label>Add a Link:</label>
                        <span id={'secondLineLink'}>
                            <label>Text:</label>
                            <input id={'inputLinkText'} type='text' value={linkText} placeholder={'Link Description'}
                                   onChange={ev => setLinkText(ev.target.value)} required/>
                            <button id={'buttonUpdateLink'} type='submit'> &#10004; update</button><br />
                            <label>Target:</label>
                            <input id={'inputLinkTarget'} type='text' value={linkTarget} placeholder={'Link Target'}
                                   onChange={ev => setLinkTarget(ev.target.value)} required/>
                            <button id={'buttonCancelAddLink'} onClick={
                                () => {
                                    props.song.status = 'display';
                                    setToggleOpenLinks(false);
                                }
                            }> &#10008; cancel
                            </button>
                        </span>
                    </form>
                </div>}

                <div id={'displayDateCreated'}>
                    created: {props.song.dayOfCreation.day}.
                    {props.song.dayOfCreation.month}.
                    {props.song.dayOfCreation.year}

                    <span id={'buttonDeleteSong'}>
                        <button onClick={() => deleteSong(props.song.id)}>
                            &#10008; delete
                        </button>
                    </span>
                </div>
            </div>

            <div>
                {message && <DisplayMessageSongs
                    message={message}
                    onClose={() => {
                        setMessage('');
                        sessionStorage.setItem('message', '');
                        sessionStorage.removeItem('messageType')
                    }}
                />}
            </div>
        </div>
    )
}

export default SongItemDetailsView
