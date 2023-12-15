use std::path::Path;
use id3::{Tag, TagLike};
use mp3_duration;
use serde_json::Value;
use base64::{Engine as _, engine::general_purpose};
use crate::components::Song;

pub fn decode_directories(paths_as_json: &str) -> Vec<String> {
    let parsed_json: Result<Value, serde_json::Error> = serde_json::from_str(paths_as_json);

    match parsed_json {
        Ok(parsed_json) => {
            // Ensure the parsed JSON is an array
            if let Value::Array(array) = parsed_json {
                // Convert each element to a String
                let string_vec: Vec<String> = array
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();

                return string_vec;
            } else {
                return Vec::new();
            }
        },
        Err(_) => {return Vec::new()},
    }
}

pub async fn get_songs_in_path(dir_path: &str, song_id: &mut i32) -> Vec<Song>{
    let mut songs: Vec<Song> = Vec::new();

    match tokio::fs::read_dir(dir_path).await {
        Ok(mut paths) => {
            while let Ok(Some(entry)) = paths.next_entry().await {
                match entry.path().to_str(){
                    Some(full_path) => {
                        match read_from_path(full_path, song_id).await {
                            Ok(song_data) => {
                                songs.push(song_data);
                            },
                            Err(_) => {},
                        }
                    }
                    None => {},
                }
            }
        },
        Err(_) => { return songs; },
    }

    songs 
}

async fn read_from_path(path: &str,  song_id: &mut i32) -> Result<Song, Box<dyn std::error::Error>> {
    let tag = Tag::read_from_path(path)?;
    *song_id += 1;

    let mut song_meta_data = Song {
        id: *song_id,
        title: String::from(""),
        artist: String::from(""),
        album: String::from(""),
        genre: String::from(""),
        year: 0,
        duration: String::from(""),
        path: String::from(""),
        cover: None,
        date_recorded: String::from(""),
        date_released: String::from(""),
        file_size: 0,
        file_type: String::from("")
    };

    //TITLE
    if let Some(title) = tag.title() {
        song_meta_data.title = title.to_owned();
    }
    else{
        song_meta_data.title = String::from("Unknown Title");
    }
    
    //ARTIST
    if let Some(artist) = tag.artist() {
        song_meta_data.artist = artist.to_owned();
    }
    else{
        song_meta_data.artist = String::from("Unknown Artist");
    }

    //ALBUM
    if let Some(album) = tag.album() {
        song_meta_data.album = album.to_owned();
    }
    else{
        song_meta_data.album = String::from("album: Unknown Album");
    }

    //GENRE
    if let Some(genre) = tag.genre() {
        song_meta_data.genre = genre.to_owned();
    }
    else{
        song_meta_data.genre = String::from("genre: Unknown Genre");
    }

    //YEAR
    if let Some(year) = tag.year() {
        song_meta_data.year = year.to_owned();
    }
    else{
        song_meta_data.year = 0;
    }

    //DURATION
    match mp3_duration::from_path(&path){
        Ok(duration) => {
            song_meta_data.duration = duration_to_string(duration);
        },
        Err(_) => {
            song_meta_data.duration = String::from("00:00");
        },
    }
    //PATH
    song_meta_data.path = path.clone().to_owned();

    //COVER
    if let Some(cover) = tag.pictures().next() {
        let picture_as_num = cover.data.to_owned();
        let base64str = general_purpose::STANDARD.encode(&picture_as_num);
        song_meta_data.cover = Some(base64str);
    }
    else{
        song_meta_data.cover = None;
    }

    //DATE RECORDED
    //"YYYY-MM-DD-HH-MM-SS"
    if let Some(date_recorded) = tag.date_recorded() {
        song_meta_data.date_recorded = date_recorded.year.to_string() + "-";
    }
    else{
        song_meta_data.date_recorded = String::from("Unknown date recorded");
    }

    //DATE RELEASED
    //"YYYY-MM-DD-HH-MM-SS"
    if let Some(date_released) = tag.date_released() {
        song_meta_data.date_released = date_released.year.to_string() + "-";
    }
    else{
        song_meta_data.date_released = String::from("Unknown date recorded");
    }

    //SIZE
    let real_path = Path::new(&path);
    match std::fs::metadata(&real_path) {
        Ok(metadata) => {
            song_meta_data.file_size = metadata.len();
        },
        Err(_) => {
            song_meta_data.file_size = 0;
        },
    }

    //FILE TYPE
    match real_path.extension(){
        Some(wrapped_extension) => {
            match wrapped_extension.to_str(){
                Some(unwrapped_extension) => {
                    song_meta_data.file_type = unwrapped_extension.to_string();
                },
                None => {
                    song_meta_data.file_type = String::from("Unknown file type");
                },
            }
        },
        None => {
            song_meta_data.file_type = String::from("Unknown file type");
        },
    }

    Ok(song_meta_data)
}

fn duration_to_string(duration: std::time::Duration) -> String {
    let seconds = duration.as_secs();
    let minutes = seconds / 60;
    let seconds = seconds % 60;
    let hours = minutes / 60;
    let minutes = minutes % 60;

    if hours > 0 {
        format!("{}:{:02}:{:02}", hours, minutes, seconds)
    } else {
        format!("{}:{:02}", minutes, seconds)
    }
}