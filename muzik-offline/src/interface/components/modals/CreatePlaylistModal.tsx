import { EditImage, NullCoverNull } from "@assets/icons";
import { playlist } from "types";
import { motion } from "framer-motion";
import { FunctionComponent, useEffect, useState } from "react";
import { local_playlists_db } from "@database/database";
import "@styles/components/modals/CreatePlaylistModal.scss";
import { compressImage } from "utils";

type CreatePlaylistModalProps = {
    isOpen: boolean;
    closeModal: () => void;
}

const CreatePlaylistModal : FunctionComponent<CreatePlaylistModalProps> = (props: CreatePlaylistModalProps) => {
    const [playlistObj, setPlaylistObj] = useState<playlist>({key: 0,cover: null,title: "",dateCreated: "",dateEdited: "",tracksPaths: []});

    function uploadImg(e: React.ChangeEvent<HTMLInputElement>){
        if(e.target.files === null)return;
        const image = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            if (e.target?.result) {
                const originalDataUrl = e.target.result as string;
        
              // Compress the image to a maximum size of 250x250
                const compressedDataUrl = await compressImage(originalDataUrl, 250, 250);
                setPlaylistObj({ ... playlistObj, cover : compressedDataUrl});
            }
        };

        reader.readAsDataURL(image);
    }

    async function createPlaylistAndCloseModal(){
        const PLobj = playlistObj;
        PLobj.dateCreated = new Date().toLocaleDateString();
        PLobj.dateEdited = new Date().toLocaleDateString();
        //set key of PLobj as the last key in the database + 1
        const last_key = await local_playlists_db.playlists.orderBy("key").last();
        PLobj.key = last_key ? last_key.key + 1 : 0;
        await local_playlists_db.playlists.add(PLobj);
        props.closeModal();
    }
    
    useEffect(() => {   
        setPlaylistObj({key: 0,cover: null,title: "",dateCreated: "",dateEdited: "",tracksPaths: []});
    }, [props.isOpen])

    return (
        <div className={"CreatePlaylistModal" + (props.isOpen ? " CreatePlaylistModal-visible" : "")} onClick={
            (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => 
                {if(e.target === e.currentTarget)props.closeModal()}}>
            <div className="modal">
                <h1>Create a playlist</h1>
                <div className="playlist_image">
                    <div className="playlist_img">
                        {
                            playlistObj.cover === null ? <NullCoverNull /> :
                            <img src={playlistObj.cover} alt="playlist_img"/>
                        }
                    </div>
                    <motion.label className="EditImageicon" whileTap={{scale: 0.97}}>
                        <input name="EditImageicon-img" type="file" accept="image/png, image/jpeg" onChange={uploadImg}/>
                        <EditImage />
                    </motion.label>
                </div>
                <h3>Playlist name</h3>
                <input type="text" value={playlistObj.title} onChange={(e) => setPlaylistObj({ ... playlistObj, title : e.target.value})}/>
                <motion.div className="create_playlist" whileTap={{scale: 0.98}} onClick={createPlaylistAndCloseModal}>create playlist</motion.div>
            </div>
        </div>
    )
}

export default CreatePlaylistModal