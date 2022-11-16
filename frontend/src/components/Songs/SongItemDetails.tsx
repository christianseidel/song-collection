import React, {FormEvent, useEffect, useState} from "react";
import '../styles/common.css'
import '../styles/songDetails.css'
import DisplayMessageSongs from "./DisplayMessageSongs";
import EditSongTitle from "./handleTitleLine/EditSongTitle";
import CreateSongTitle from "./handleTitleLine/CreateSongTitle";
import DisplaySongTitle from "./handleTitleLine/DisplaySongTitle";
import {Mood, Song} from './songModels'
import {Reference} from "../References/referenceModels";
import {songCollectionToRealName} from "../literals/collectionNames";
import {keys} from "../literals/keys";
import EditLink from "./EditLink";

interface SongItemProps {
    song: Song;
    onItemCreation: (message: string) => void;
    onItemRevision: (song: Song) => void;
    doReturn: () => void;
    clear: () => void;
}

function SongItemDetails(props: SongItemProps) {

    const [songState, setSongState] = useState(props.song.status);
    const [message, setMessage] = useState('');
    useEffect(() => setSongState(props.song.status), [props.song.status]);
    const [description, setDescription] = useState(sessionStorage.getItem('description') ?? '');
    useEffect(() => {
        sessionStorage.setItem('description', description)
    }, [description]);

    const [displayDescription, setDisplayDescription] = useState(true);
    const [toggleEditDescription, setToggleEditDescription] = useState(false);
    const [toggleEditReference, setToggleEditReference] = useState(false);
    const [toggleEditLink, setToggleEditLink] = useState(false);
    const [toggleEditSongSheet, setToggleEditSongSheet] = useState(false);
    // controls whether a new item will be created or an existing will be updated
    // this value is used both for reference and link items
    const [toggleCreateOrUpdate, setToggleCreateOrUpdate] = useState('create');


    useEffect(() => {
        setToggleEditDescription(false);
        setToggleEditReference(false);
        setToggleEditLink(false);
        setToggleEditSongSheet(false);
        setCollection('');
        setPage('');
        setKey('');
        setMood(0);
        setToggleCreateOrUpdate('create');
    }, [props.song.title]);

    // description will be hidden, whenever the Working Space is used, but visible if it's not
    useEffect(() => {
        if (!toggleEditDescription && !toggleEditReference && !toggleEditLink && !toggleEditSongSheet) {
            setDisplayDescription(true);
        } else {
            setDisplayDescription(false);
        }
    }, [toggleEditDescription, toggleEditReference, toggleEditLink, toggleEditSongSheet]);


    // controls rendering of the first two lines within Song Details View //
    let handelTitleLine;
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

    function deleteSongItem(id: string) {
        unhideAllReferencesAttached(id)
            .then(() => {
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
                        .then(props.doReturn)
                }
            ).catch(() => {
            console.log("Unhiding references did not succeed.")
        })
    }

    // References must be repatriated first before the song item can be deleted.
    // Hence, this Promise //
    const unhideAllReferencesAttached = (songId: string) => {
        return new Promise((resolve, failure) => {
            fetch('api/songbook/unhideReferences/' + songId, {
                method: 'PUT'
            })
                .then((response) => {
                    if (response.ok) {
                        resolve('success');
                    } else {
                        failure('failure');
                    }
                })
        })
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

    const openOrCloseAddDescription = () => {
        setToggleEditDescription(!toggleEditDescription);
        setToggleEditReference(false);
        setToggleEditLink(false);
        setToggleEditSongSheet(false);
        setDescription(props.song.description ?? '');
    }

    const doAddDescription = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        props.song.description = description;
        saveSongItem();
        setToggleEditDescription(false);
        setDescription('');
        sessionStorage.removeItem('description');
    }

    const clearDescription = () => {
        setDescription('');
        props.song.description = '';
        sessionStorage.removeItem('description');
        saveSongItem();
    }


    // --- REFERENCES ELEMENTS --- //

    const openOrCloseAddReference = () => {
        setToggleEditDescription(false);
        setToggleEditLink(false);
        setToggleEditSongSheet(false);
        setToggleEditReference(!toggleEditReference);
        setToggleCreateOrUpdate('create');
    }

    const [collection, setCollection] = useState('');
    const [page, setPage] = useState('');
    const [key, setKey] = useState('');
    const [mood, setMood] = useState(0);
    const [refIndex, setRefIndex] = useState(-1);

    const createReference = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        let next: number;
        let reference = new Reference(props.song.title, collection, Number(page),
            props.song.author, props.song.year, key);
        if (props.song.references !== undefined) {
            next = props.song.references.length;
            props.song.references[next] = reference;
        } else {
            alert("the resources array is undefined!");
            console.log("the resources array is undefined!");
        }
        saveSongItem();
        setToggleEditReference(false);
        setCollection('');
        setPage('');
        setKey('');
    }

    const openUpdateReference = (index: number) => {
        setToggleEditDescription(false);
        setToggleEditLink(false);
        setToggleEditSongSheet(false);
        setToggleEditReference(true);
        setRefIndex(index);
        if (props.song.references !== undefined) {
            let ref: Reference = props.song.references[index];
            if (ref.songCollection === 'MANUALLY_ADDED_COLLECTION') {
                setCollection(ref.addedCollection);
                if (document.getElementById('inputRefCollection') != null) {
                    document.getElementById('inputRefCollection')!.className = '';
                }
            } else {
                setCollection(songCollectionToRealName(ref.songCollection) ?? '');
                if (document.getElementById('inputRefCollection') != null) {
                    document.getElementById('inputRefCollection')!.className = 'readOnly';
                }
            }
            ref.page !== 0 ? setPage(String(ref.page)) : setPage('');
            Mood.checkIfMajorOrEmpty(ref.key) ? setMood(0) : setMood(1);
            ref.key === null || ref.key === undefined
                ? setKey('')
                : setKey(ref.key);
        }
        setToggleCreateOrUpdate('update');
    }

    const doUpdateReference = () => {
        if (props.song.references !== undefined) {
            let ref: Reference = props.song.references[refIndex];
            if (ref.songCollection === 'MANUALLY_ADDED_COLLECTION') {
                ref.addedCollection = collection;
            }
            ref.title = props.song.title
            ref.page = Number(page);
            ref.author = props.song.author;
            ref.year = props.song.year;
            ref.key = key;
        } else {
            console.log("ERROR: props.song.references is \"undefined\"!?")
        }
        saveSongItem();
        setToggleEditReference(false);
        setCollection('');
        setPage('');
        setKey('');
    }

    function deleteReference() {
        props.song.status = 'display';
        setToggleEditReference(false);
        if (refIndex !== -1) {
            props.song.references!.splice(refIndex, 1)
        }
        saveSongItem();
        setRefIndex(-1);
        clearReference();
        setToggleCreateOrUpdate('create');
    }

    function clearReference() {
        setRefIndex(-1);
        setCollection('');
        setPage('');
        setKey('');
        setMood(0);
        if (document.getElementById('inputRefCollection') != null) {
            document.getElementById('inputRefCollection')!.className = '';
        }
        setToggleCreateOrUpdate('create');
    }


// --- LINK ELEMENTS --- //

        const openOrCloseAddLink = () => {
        setToggleEditDescription(false);
        setToggleEditReference(false);
        setToggleEditSongSheet(false);
        setToggleEditLink(!toggleEditLink);
        setToggleCreateOrUpdate('create');
    }

    const [linkIndex, setLinkIndex] = useState(-1)

    const openUpdateLink = (index: number) => {
        setLinkIndex(index);
        setToggleEditDescription(false);
        setToggleEditSongSheet(false);
        setToggleEditReference(false);
        setToggleEditLink(true);
        setToggleCreateOrUpdate('update')
    }


    // --- SONG SHEET FILES --- //

    const openOrCloseAddSongSheet = () => {
        setToggleEditDescription(false);
        setToggleEditReference(false);
        setToggleEditSongSheet(!toggleEditSongSheet);
        setToggleEditLink(false);
    }

    function uploadSongSheet(files: FileList | null) {
        sessionStorage.setItem('messageType', 'red');
        if (files === null) {
            alert('Ops, somehow the FormData Object produced a glitch.')
        } else {
            const formData = new FormData();
            formData.append('file', files[0]);
            let responseStatus = 0;
            fetch('api/songbook/upload/', {
                method: 'POST',
                body: formData,
            })
                .then((response) => {
                    responseStatus = response.status;
                    return response.json();
                })
                .then((responseBody) => {
                    if (responseStatus === 200) {
                        // Todo: Do The Magic
                        // Yet to implement...
                        console.log('File "' + files[0].name + '" successfully transmitted to backend!');
                        console.log(responseBody);
                    } else if (responseStatus === 400) {
                        sessionStorage.setItem('message', 'Sorry, the server does not accept your request (Bad Request).');
                    } else if (responseStatus === 404) {
                        sessionStorage.setItem('message', 'Sorry, the server is unable to respond to your request.');
                    } else if (responseStatus === 405) {
                        console.log("sorry, the entire set of methods has yet to be written...")
                    } else if (responseStatus === 406) {
                        sessionStorage.setItem('message', responseBody.message);
                    } else if (responseStatus === 500) {
                        sessionStorage.setItem('message', responseBody.message);
                    } else if (responseStatus !== 201) {
                        sessionStorage.setItem('message', responseBody.message);
                    } else {
                        alert('Something Unexpected happened.');
                    }
                })
        }
    }

    return (
        <div>
            <div id={'songHead'} className={'songDataSheetElement'}>
                <div>{handelTitleLine}</div>
            </div>

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
                <span className={'icon tooltip'} id={'iconFile'} onClick={openOrCloseAddSongSheet}>
                        &#128195;
                    <span className="tooltipText">add a file</span>
                    </span>
            </div>


            <div id={'workingSpace'} className={'songDataSheetElement'}>

                {props.song.description && !toggleEditDescription && displayDescription &&
                    <div id={'displayDescription'} className={'workingSpaceElement'}
                         onClick={openOrCloseAddDescription}>
                        {props.song.description}
                    </div>
                }

                {toggleEditDescription && <div>
                    <form id={'addADescription'} className={'workingSpaceElement'}
                          onSubmit={ev => doAddDescription(ev)}>
                        <label>{((props.song.description !== null
                            && props.song.description!.length > 0) && true)
                            ? <span>Edit your </span>
                            : <span>Add a </span>} Comment or Description:</label><br/>
                        <textarea id={'inputDescription'} value={description}
                                  rows={3}
                                  cols={60}
                                  placeholder={'your description here...'}
                                  onChange={ev => setDescription(ev.target.value)} autoFocus required/>
                        <button id={'buttonAddDescription'} type='submit'>
                            &#10004; {(props.song.description !== null && props.song.description!.length > 0)
                            ? <span>update</span>
                            : <span>add</span>} </button>
                        <button id={'buttonCancelAddDescription'} type='button' onClick={openOrCloseAddDescription}>
                            cancel
                        </button>
                    </form>

                    <button id={'buttonClearDescription'} type='submit' onClick={clearDescription}>
                        ! clear
                    </button>
                </div>}


                {toggleEditReference && <div>
                    <form id={'inputFormRef'} onSubmit={ev => {
                        toggleCreateOrUpdate === 'create' ? createReference(ev) : doUpdateReference();
                    }}>
                        <label>{toggleCreateOrUpdate === 'create' ? <span>Add a</span> : <span>Edit your</span>} Song
                            Sheet Reference:</label>
                        <div className={'nextLine'}>
                            <label>Coll.:</label>
                            <input id={'inputRefCollection'} type='text' value={collection}
                                   placeholder={'Song Collection'}
                                   onChange={ev => setCollection(ev.target.value)} required autoFocus tabIndex={1}/>
                            <label id={'labelInputRefPage'}>Page:</label>
                            <input id={'inputRefPage'} type='number' value={page} placeholder={'Page'}
                                   onChange={ev => setPage(ev.target.value)} tabIndex={2}/>
                            <button id={'buttonAddReference'} className={'workingSpaceElement'} type='submit'
                                    tabIndex={5}>
                                &#10004; {toggleCreateOrUpdate}
                            </button>
                        </div>
                        <div className={'nextLine'}>
                            <label>Author:</label>
                            <input id={'inputRefAuthor'} type='text'
                                   value={props.song.author !== null ? props.song.author : ''}
                                   placeholder={'(Author)'} className={'readOnly'} disabled/>
                            <label id={'labelInputRefYear'}>Year:</label>
                            <input id={'inputRefYear'} type='text' value={props.song.year !== 0 ? props.song.year : ''}
                                   placeholder={'(Year)'} className={'readOnly'} disabled readOnly/>
                        </div>
                        <span className={'nextLine'}>
                        <label htmlFor={'inputKey'}>Key:</label>
                            <select name={'inputKey'} id={'inputKey'} form={'inputFormRef'}
                                    value={key} onChange={ev => setKey(ev.target.value)}
                                    tabIndex={3}>{keys.map((songKey) => (
                                <option value={songKey.mood[mood].value}
                                        key={songKey.mood[mood].value}>{songKey.mood[mood].label}</option>
                            ))}
                        </select>
                        <input type={'radio'} id={'major'} name={'majorOrMinor'}
                               value={0} className={'inputMajorOrMinor'} checked={mood === 0}
                               onChange={ev => {
                                   setMood(Number(ev.target.value));
                                   setKey('');
                               }} tabIndex={4}/>
                        <label htmlFor={'major'} className={'labelInputMajorOrMinor'}>major</label>
                        <input type={'radio'} id={'minor'} name={'majorOrMinor'}
                               value={1} className={'inputMajorOrMinor'} checked={mood === 1}
                               onChange={ev => {
                                   setMood(Number(ev.target.value));
                                   setKey('');
                               }}/>
                        <label htmlFor={'minor'} className={'labelInputMajorOrMinor'}>minor</label>
                        <button id={'buttonCancelAddReference'} type='button' onClick={() => {
                            props.song.status = 'display';
                            setToggleEditReference(false);
                            setRefIndex(-1)
                        }
                        } tabIndex={6}>
                            cancel
                        </button>
                    </span>
                    </form>
                    <button id={'buttonClearReference'} type='button' onClick={() => {
                        clearReference()
                    }} tabIndex={9}>
                        ! clear
                    </button>
                    {toggleCreateOrUpdate === 'update' &&
                        <button id={'buttonDeleteReference'} type='button' onClick={() => {
                            deleteReference()
                        }}>
                            &#10008; delete
                        </button>
                    }
                </div>}

                {toggleEditLink && <EditLink
                    toggleCreateOrUpdate={toggleCreateOrUpdate}
                    links={props.song.links}
                    linkIndex={linkIndex}
                    returnAndSave={() => {
                        saveSongItem();
                        setToggleEditLink(false);
                        }}
                    onCancel={() => {
                        setToggleEditLink(false);
                        setLinkIndex(-1);
                    }}
                    onClear={() => {
                        setLinkIndex(-1);
                        setToggleCreateOrUpdate('create');
                    }}
                />}

                {toggleEditSongSheet && <div className={'workingSpaceElement'}>
                    <form id={'formAddSongSheet'} className={'workingSpaceElement'} encType={'multipart/form-data'}>
                        <label>Add a Song Sheet File:</label>
                        <div id={'secondLineSongSheet'}>Please, go and fetch a song sheet file:
                            <input type={'file'} id={'inputAddSongSheet'}
                                   onChange={event => uploadSongSheet(event.target.files)}/>
                        </div>
                    </form>
                    <p><i> This feature is yet to be implemented </i></p>
                </div>
                }

            </div>


            <div id={'displaySpace'} className={'songDataSheetElement'}>

                {props.song.references !== undefined && props.song.references.length > 0 && // display References
                    <div className={'displayReferences'}>
                        <div id={'listOfReferences'}>
                            {props.song.references.map((item, index) =>
                                <div key={index} className={'retainedReferenceItem'}
                                     onClick={() => openUpdateReference(index)}>
                                    &ndash;&#129174;&nbsp; {(item.addedCollection === null) ?
                                    <span>{songCollectionToRealName(item.songCollection)}</span> :
                                    <span>{item.addedCollection}</span>}
                                    {item.page !== 0 && <span>, page {item.page} </span>}
                                    {item.key && <span>– </span>}
                                    {item.key && <span className={'displayKey'}>({item.key})</span>}
                                </div>)}
                        </div>
                    </div>}

                <div>
                    {(props.song.links !== undefined && props.song.links?.length > 0)
                        && <div id={'displayLinks'}>
                            {props.song.links.map((item, index) =>
                                <div key={index} className={'link'}>
                                    <span className={'linkDot'} onClick={() => openUpdateLink(index)}>&#8734;</span>&nbsp;
                                    <a href={item.linkTarget} target={'_blank'} rel={'noreferrer'}>
                                        <span className={'linkText'}>{item.linkText}</span></a>
                                    {item.linkKey && <span> – </span>}
                                    {item.linkKey && <span className={'displayKey'}>({item.linkKey})</span>}
                                    {item.linkAuthor && <span id={'displayLinkAuthor'}> – by: {item.linkAuthor}</span>}
                                    {item.linkStrumming && <span id={'displayLinkStrumming'}> – {item.linkStrumming}</span>}
                                </div>)
                            }
                        </div>
                    }
                </div>
            </div>


            <div id={'songFooter'}>
                created: {props.song.dayOfCreation.day}.
                {props.song.dayOfCreation.month}.
                {props.song.dayOfCreation.year}
            </div>
            <span id={'buttonDeleteSong'}>
                <button type='button' onClick={() => deleteSongItem(props.song.id)}>
                    &#10008; delete
                </button>
            </span>

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

export default SongItemDetails