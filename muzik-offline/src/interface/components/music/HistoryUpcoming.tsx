import { FunctionComponent, useEffect, useReducer } from "react";
import { motion } from 'framer-motion';
import "@styles/components/music/HistoryUpcoming.scss";
import { Song, contextMenuButtons, contextMenuEnum } from "types";
import { GeneralContextMenu, SongCardResizable } from "@components/index";
import { useNavigate } from "react-router-dom";
import { local_albums_db, local_songs_db } from "@database/database";
import { useUpcomingSongs, useHistorySongs, useSavedObjectStore, reducerType } from "store";
import { UpcomingHistoryState, upcomingHistoryReducer } from "store/reducerStore";
import { closeContextMenu } from "utils/reducerUtils";

type HistoryUpcomingProps = { closePlayer: () => void;}

const HistoryUpcoming: FunctionComponent<HistoryUpcomingProps> = (props: HistoryUpcomingProps) => {
  const [state , dispatch] = useReducer(upcomingHistoryReducer, UpcomingHistoryState); 
  const {SongQueueKeys} = useUpcomingSongs((state) => { return { SongQueueKeys: state.queue}; });
  const {SongHistoryKeys} = useHistorySongs((state) => { return { SongHistoryKeys: state.queue}; });
  const {local_store} = useSavedObjectStore((state) => { return { local_store: state.local_store}; });
  
  const navigate = useNavigate();

  function setMenuOpenData__SongQueue(key: number, n_co_ords: {xPos: number; yPos: number;}){
    dispatch({ type: reducerType.SET_COORDS, payload: n_co_ords });
    const matching_song = state.SongQueue.find(song => { return song.id === key; })
    dispatch({ type: reducerType.SET_SONG_MENU, payload: matching_song ? matching_song : null });
}

function setMenuOpenData_SongHistory(key: number, n_co_ords: {xPos: number; yPos: number;}){
    dispatch({ type: reducerType.SET_COORDS, payload: n_co_ords });
    const matching_song = state.SongHistory.find(song => { return song.id === key; })
    dispatch({ type: reducerType.SET_SONG_MENU, payload: matching_song ? matching_song : null });
}

  function chooseOption(arg: contextMenuButtons){
      if(arg === contextMenuButtons.AddToPlaylist){ console.log("Add to playlist"); }
        else if(arg === contextMenuButtons.PlayNext && state.songMenuToOpen){ console.log("Play next"); }
        else if(arg === contextMenuButtons.PlayLater && state.songMenuToOpen){ console.log("Play later"); }
        else if(arg === contextMenuButtons.Play && state.songMenuToOpen){ console.log("Play"); }
  }

  async function navigateToSH(key: number, type: "artist" | "song"){
    props.closePlayer();
    const relatedSong = state.SongHistory.find((value) => value.id === key);
    if(!relatedSong)return;
    if(type === "song"){
        const albumres = await local_albums_db.albums.where("title").equals(relatedSong.album).toArray();
        navigate(`/AlbumDetails/${albumres[0].key}/undefined`);
    }
    else if(type === "artist"){
        navigate(`/ArtistCatalogue/${relatedSong.artist}`); 
    }
  }

  async function navigateToSQ(key: number, type: "artist" | "song"){
      props.closePlayer();
      const relatedSong = state.SongQueue.find((value) => value.id === key);
      if(!relatedSong)return;
      if(type === "song"){
          const albumres = await local_albums_db.albums.where("title").equals(relatedSong.album).toArray();
          navigate(`/AlbumDetails/${albumres[0].key}/undefined`);
      }
      else if(type === "artist"){
          navigate(`/ArtistCatalogue/${relatedSong.artist}`); 
      }
  }

  async function setLists(){
    const limit = Number.parseInt(local_store.UpcomingHistoryLimit);
    const sqkeys = SongQueueKeys.slice(0, limit);
    const hskeys = SongHistoryKeys.slice(SongHistoryKeys.length - limit, SongHistoryKeys.length);

    const USsongs = await local_songs_db.songs.where("id").anyOf(sqkeys).toArray();
    const HSsongs = await local_songs_db.songs.where("id").anyOf(hskeys).toArray();

    const USsongsOrdered = sqkeys.map(key => USsongs.find(item => item.id === key));
    const HSsongsOrdered = hskeys.map(key => HSsongs.find(item => item.id === key));

    dispatch({ type: reducerType.SET_SONG_QUEUE, payload: USsongsOrdered as Song[] });
    dispatch({ type: reducerType.SET_SONG_HISTORY, payload: HSsongsOrdered as Song[] });
  }

  useEffect(() => {setLists()}, [SongQueueKeys, SongHistoryKeys])

  return (
    <div className="HistoryUpcoming">
      {
        state.selectedView === "Upcoming_tab" ?
          <div className="Upcoming_view">
            {
                state.SongQueue.map((song, index) => 
                    <SongCardResizable 
                        key={song.id * index}
                        cover={song.cover} 
                        songName={song.name}
                        artist={song.artist}
                        keyV={song.id}
                        setMenuOpenData={setMenuOpenData__SongQueue}
                        navigateTo={navigateToSQ}/>
                )
            }
          </div>
        :
          <div className="History_view">
            {
                state.SongHistory.map((song, index) => 
                    <SongCardResizable 
                        key={song.id * index}
                        cover={song.cover} 
                        songName={song.name}
                        artist={song.artist}
                        keyV={song.id}
                        setMenuOpenData={setMenuOpenData_SongHistory}
                        navigateTo={navigateToSH}/>
                )
            }
          </div>
      }
      <div className="HistoryUpcoming_tabs">
        <motion.div className="Upcoming_tab" whileTap={{scale: 0.98}}
          onClick={() => dispatch({ type: reducerType.SET_SELECTED_VIEW, payload: "Upcoming_tab" })}>
            {state.selectedView === "Upcoming_tab" && <div className="selected"/>}
            <h3>Upcoming songs</h3>
        </motion.div>
        <motion.div className="History_tab" whileTap={{scale: 0.98}}
          onClick={() => dispatch({ type: reducerType.SET_SELECTED_VIEW, payload: "History_tab" })}>
            {state.selectedView === "History_tab" && <div className="selected"/>}
            <h3>History</h3>
        </motion.div>
      </div>

      {
          state.songMenuToOpen && (
              <div className="HistoryUpcoming-ContextMenu-container" 
                onClick={(e) => closeContextMenu(dispatch, e)} onContextMenu={(e) => closeContextMenu(dispatch, e)}>
                  <GeneralContextMenu 
                      xPos={state.co_ords.xPos} 
                      yPos={state.co_ords.yPos} 
                      title={state.songMenuToOpen.name}
                      CMtype={contextMenuEnum.SongCM}
                      chooseOption={chooseOption}/>
              </div>
          )
      }
    </div>
  )
}

export default HistoryUpcoming