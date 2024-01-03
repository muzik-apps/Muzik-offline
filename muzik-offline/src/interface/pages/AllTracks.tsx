import { contextMenuButtons, contextMenuEnum } from "types";
import { motion } from "framer-motion";
import { useRef, useEffect, useReducer } from "react";
import { ChevronDown, Shuffle } from "@assets/icons";
import { AddSongToPlaylistModal, DropDownMenuSmall, GeneralContextMenu, LoaderAnimated, PropertiesModal, RectangleSongBox } from "@components/index";
import { ViewportList } from 'react-viewport-list';
import { local_albums_db, local_songs_db } from "@database/database";
import { useNavigate } from "react-router-dom";
import { AllTracksState, alltracksReducer, reducerType } from "store";
import { addThisSongToPlayLater, addThisSongToPlayNext, playThisListNow, startPlayingNewSong } from "utils/playerControl";
import "@styles/pages/AllTracks.scss";
import { closeContextMenu, closePlaylistModal, closePropertiesModal, selectSortOption, selectThisSong, setOpenedDDM, setSongList } from "utils/reducerUtils";

const AllTracks = () => {
    const [state , dispatch] = useReducer(alltracksReducer, AllTracksState);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement | null>(null);

    function setMenuOpenData(key: number, n_co_ords: {xPos: number; yPos: number;}){
        const matching_song = state.SongList.find(song => { return song.id === key; });
        dispatch({ type: reducerType.SET_COORDS, payload: n_co_ords});
        dispatch({ type: reducerType.SET_SONG_MENU, payload: matching_song ? matching_song : null});
    }

    function chooseOption(arg: contextMenuButtons){
        if(arg === contextMenuButtons.ShowInfo){ dispatch({ type: reducerType.SET_PROPERTIES_MODAL, payload: true}); }
        else if(arg === contextMenuButtons.AddToPlaylist){ dispatch({ type: reducerType.SET_PLAYLIST_MODAL, payload: true}); }
        else if(arg === contextMenuButtons.PlayNext && state.songMenuToOpen){ 
            addThisSongToPlayNext(state.songMenuToOpen.id);
            closeContextMenu(dispatch); 
        }
        else if(arg === contextMenuButtons.PlayLater && state.songMenuToOpen){ 
            addThisSongToPlayLater(state.songMenuToOpen.id);
            closeContextMenu(dispatch); 
        }
        else if(arg === contextMenuButtons.Play && state.songMenuToOpen){
            playThisSong(state.songMenuToOpen.id);
            closeContextMenu(dispatch); 
        }
    }

    async function playThisSong(key: number, shuffle_list: boolean = false){
        if(state.SongList.length === 0)return;
        let songkey = key;
        if(songkey === -1)songkey = state.SongList[0].id;
        const index = state.SongList.findIndex(song => song.id === songkey);
        if(index === -1)return;
        //get ids of songs from index of matching song to last song in list
        await startPlayingNewSong(state.SongList[index]);
        const ids: number[] = state.SongList.slice(index + 1).map(song => song.id);
        await playThisListNow(ids, shuffle_list);
    }

    async function navigateTo(key: number, type: "artist" | "song"){
        const relatedSong = state.SongList.find((value) => value.id === key);
        if(!relatedSong)return;
        if(type === "song"){
            const albumres = await local_albums_db.albums.where("title").equals(relatedSong.album).toArray();
            navigate(`/AlbumDetails/${albumres[0].key}/undefined`);
        }
        else if(type === "artist")navigate(`/ArtistCatalogue/${relatedSong.artist}`);
    }

    function setList(){
        dispatch({ type: reducerType.SET_LOADING, payload: true});
        local_songs_db.songs.orderBy(state.sort.by).toArray().then((list) =>{
            dispatch({ type: reducerType.SET_LOADING, payload: false});
            if(state.sort.aToz === "Descending")list = list.reverse();//sort in descending order
            setSongList(list, dispatch);
        });
    }

    useEffect(() => { setList(); }, [state.sort])
    
    return (
        <motion.div className="AllTracks"
        initial={{scale: 0.9, opacity: 0}}
        animate={{scale: 1, opacity: 1}}
        exit={{scale: 0.9, opacity: 0}}>
            <div className="AllTracks_title">
                <h1>All tracks</h1>
                <div className="sort_selector">
                    <h2>Sort by: </h2>
                    <div className="sort_dropdown_container">
                        <motion.div className="sort_dropdown" whileTap={{scale: 0.98}} whileHover={{scale: 1.03}} onClick={() => setOpenedDDM(state.openedDDM === "by" ? null : "by", dispatch)}>
                            <h4>{state.sort.by}</h4>
                            <motion.div className="chevron_icon" animate={{rotate: state.openedDDM === "by" ? 180 : 0}}>
                                <ChevronDown />
                            </motion.div>
                        </motion.div>
                        <div className="DropDownMenu_container">
                            <DropDownMenuSmall
                                options={["name", "title", "artist", "album", "year"]} 
                                isOpen={(state.openedDDM === "by")}
                                selectOption={(arg) => selectSortOption(state.sort, state.openedDDM, arg, dispatch)}
                            />
                        </div>
                    </div>
                </div>
                <div className="sort_selector">
                    <h2>Sort A-Z: </h2>
                    <div className="sort_dropdown_container">
                        <motion.div className="sort_dropdown" whileTap={{scale: 0.98}} whileHover={{scale: 1.03}} onClick={() => setOpenedDDM(state.openedDDM === "aToz" ? null : "aToz", dispatch)}>
                            <h4>{state.sort.aToz}</h4>
                            <motion.div className="chevron_icon" animate={{rotate: state.openedDDM === "aToz" ? 180 : 0}}>
                                <ChevronDown />
                            </motion.div>
                        </motion.div>
                        <div className="DropDownMenu_container">
                            <DropDownMenuSmall
                                options={["Ascending", "Descending"]} 
                                isOpen={(state.openedDDM === "aToz")}
                                selectOption={(arg) => selectSortOption(state.sort, state.openedDDM, arg, dispatch)}
                            />
                        </div>
                    </div>
                </div>
                <motion.div className="shuffle-btn" whileTap={{scale: 0.98}} whileHover={{scale: 1.03}} onClick={() => playThisSong(-1, true)}>
                    <h4>shuffle & play</h4>
                    <Shuffle />
                </motion.div>
            </div>
            <div className="AllTracks_container" ref={ref}>
                {state.SongList.length === 0 && state.isloading === false && (
                    <h1>
                        it seems like you may not have added any songs yet.<br/>
                        To add songs, click on the settings button above, scroll down <br/>
                        and click on "click here to change directories". <br/>
                    </h1>
                )}
                { state.isloading && <LoaderAnimated /> }
                <ViewportList viewportRef={ref} items={state.SongList}>
                    {(song, index) => (
                        <RectangleSongBox 
                            key={song.id}
                            keyV={song.id}
                            index={index + 1} 
                            cover={song.cover} 
                            songName={song.name} 
                            artist={song.artist}
                            length={song.duration} 
                            year={song.year}
                            selected={state.selected === index + 1 ? true : false}
                            navigateTo={navigateTo}
                            selectThisSong={(index) => selectThisSong(index, dispatch)}
                            setMenuOpenData={setMenuOpenData}
                            playThisSong={playThisSong}/>
                    )}
                </ViewportList>
                <div className="AllTracks_container_bottom_margin"/>
            </div>
            {
                state.songMenuToOpen && (
                    <div className="AllTracks-ContextMenu-container" onClick={(e) => closeContextMenu(dispatch, e)} onContextMenu={(e) => closeContextMenu(dispatch, e)}>
                        <GeneralContextMenu 
                            xPos={state.co_ords.xPos} 
                            yPos={state.co_ords.yPos} 
                            title={state.songMenuToOpen.name}
                            CMtype={contextMenuEnum.SongCM}
                            chooseOption={chooseOption}/>
                    </div>
                )
            }
            <div className="bottom_margin"/>
            <PropertiesModal isOpen={state.isPropertiesModalOpen} song={state.songMenuToOpen!} closeModal={() => closePropertiesModal(dispatch)} />
            <AddSongToPlaylistModal isOpen={state.isPlaylistModalOpen} songPath={state.songMenuToOpen ? state.songMenuToOpen.path : ""} closeModal={() => closePlaylistModal(dispatch)} />
        </motion.div>
    )
}

export default AllTracks