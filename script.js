console.log("Welcome to Rythm - your personalized music player");

let play = document.getElementById("play");
const seekbar = document.querySelector(".seekbar");
let previous = document.getElementById("previous");
let next = document.getElementById("next");
let volumeBar = document.querySelector(".volRange");
let volumeButton = document.querySelector(".volume");
let cardContainer = document.querySelector(".cardContainer");
let songs;
let currentFolder;
let currentSong = new Audio(); // defining an audio where current song playing will be stored
let currentSongIndex = 0;
let day = document.querySelector(".day");
let invert = document.getElementsByClassName("invert");

function convertSecondsToMinutes(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Functions that fetch songs and store it in an array songs[]
async function getSongs(folder) {
    currentFolder = folder;
    let response = await fetch(`http://127.0.0.1:5500/${currentFolder}/`);
    let data = await response.text(); // fetching songs data
    let div = document.createElement("div");
    div.innerHTML = data; // storing fetch response in a div
    let link = div.getElementsByTagName("a"); // getting all anchor tags from that div and storing in an array named "link"
    songs = [];
    for (let index = 0; index < link.length; index++) {
        const element = link[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${currentFolder}/`)[1]); // pushing name of songs to an array named "songs"
            // splitting the song link into 2 arrays and choosing the 2nd array (where actual title is stored)
        }
    }
    // displaying all on the screen
    let songUL = document.querySelector(".songContent").getElementsByTagName("ul")[0]; //[0] is used to select the first element in the HTMLCollection. returned by getElementsByTagName
    songUL.innerHTML = "";
    for (let song of songs) {
        let songName = song.split("-")[0];
        let songArtist = song.split("-")[1];
        songArtist = songArtist.slice(0, -4);
        songUL.innerHTML = songUL.innerHTML +
            `
        <li>
            <div class="outerSongInfo">
                <img class="invert" src="./images/music.svg" alt="Music">
                <div class="innerSongInfo">
                    <div class="hidden">${song.replaceAll("%20", " ")}</div>  
                    <div>${songName.replaceAll("%20", " ")}</div>
                    <div class="artist">${songArtist.replaceAll("%20", " ")}</div>
                </div>
            </div> 
            <img src="./images/playSong.svg" alt="Play">
        </li>`; //<div class="hidden">${song.replaceAll("%20", " ")}</div> will be not visible to users but we are selecting first element child content (full music name) to pass into playMusic Function below
    }
    Array.from(document.querySelector(".songContent").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".innerSongInfo").firstElementChild.innerHTML.trim());

        })
    })
}

// playing the selected song
const playMusic = async (track) => {
    currentSong.src = `/${currentFolder}/` + track;
    try {
        await currentSong.play();
        play.src = "./images/pauseSong.svg";
    } catch (error) {
        console.error('Failed to start playback:', error);
    }

    let songDetails = track.slice(0, -4).replaceAll("%20", " ");
    document.querySelector(".songInfo").innerHTML = songDetails;
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";

    currentSongIndex = songs.indexOf(track);
}

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text(); // fetching songs data
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-1)[0];
            // get the metadata of the folder
            let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`)
            let response = await a.json();
            cardContainer.innerHTML = cardContainer.innerHTML +
                `
            <div data-folder="${folder}" class="card m-10 p-10 cursor">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="100">
                        <!-- Circle background -->
                        <circle cx="12" cy="12" r="12" fill="#4CAF50" />
                        
                        <!-- Larger play button path -->
                        <path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" fill="#000" />
                    </svg>                                                                                 
                </div>                       
                <img src="/songs/${folder}/cover.jpg" alt="Thumbnail">
                <h3>${response.title}</h4>
                <p>${response.description}</p>
            </div> 
            `
        }
    }
    addCardEventListeners(); // Add event listeners after cards are created
}

function addCardEventListeners() {
    let cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.addEventListener("click", async item => {
            const folder = item.currentTarget.dataset.folder;
            await getSongs(`songs/${folder}`);
            currentSongIndex = 0; // Reset the current song index
            playMusic(songs[currentSongIndex]); // Load the first song of the new folder
        });
    });
}

async function main() {
    // getting all songs
    await getSongs("songs/Old");

    displayAlbums();

    // Playing and pausing a song from buttons
    play.addEventListener("click", async () => {
        if (currentSong.paused) {
            try {
                await currentSong.play();
                play.src = "./images/pauseSong.svg";
            } catch (error) {
                console.error('Failed to start playback:', error);
            }
        } else {
            currentSong.pause();
            play.src = "./images/playSong.svg";
        }
    });

    // updating duration of time
    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            const currentTime = currentSong.currentTime;
            const duration = currentSong.duration;
            const currentTimeFormatted = convertSecondsToMinutes(Math.floor(currentTime));
            const durationFormatted = convertSecondsToMinutes(Math.floor(duration));
            document.querySelector(".songTime").innerHTML = `${currentTimeFormatted} / ${durationFormatted}`;

            const seekbarValue = (currentTime / duration) * 100; // gives the % of song played
            seekbar.value = seekbarValue; // sets the seekbar at that position
        }
    });

    // Add an event listener to the seekbar to update the current song time
    seekbar.addEventListener("input", () => {
        const seekbarValue = seekbar.value;
        const duration = currentSong.duration;
        const currentTime = (seekbarValue / 100) * duration;
        currentSong.currentTime = currentTime;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%"
    });

    // Add event listener to previous and next buttons
    previous.addEventListener("click", () => {
        currentSong.pause()
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause()
        console.log("Next clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    });

    // add event listener to volume button
    volumeBar.addEventListener("input", () => {
        currentSong.volume = volumeBar.value / 100;  // sets the volume of the song to the value of the seekbar
        volumeButton.src = "./images/volume.svg";
    });

    // Muting and unmuting a song from volume button
    volumeButton.addEventListener("click", () => {
        if (currentSong.volume == 0) {
            currentSong.volume = volumeBar.value / 100;
            volumeButton.src = "./images/volume.svg";
        } else {
            currentSong.volume = 0;
            volumeButton.src = "./images/mute.svg";
        }
    });

    // load the first song when the website runs
    await playMusic(songs[0]);
    currentSong.pause();
    play.src = "./images/playSong.svg";

    //Day and night mode
    // day.onclick = function(){
    //     document.body.classList.toggle("light-theme");
    //     if(document.body.classList.contains("light-theme")){
    //         day.src = "./images/sun.png";
    //         invert.forEach(icon => icon.classList.toggle('invert'));
    //     }
    //     else{
    //         day.src = "./images/moon.png";
    //         invert.forEach(icon => icon.classList.toggle('invert'));
    //     }
    // }

    
}
main();
