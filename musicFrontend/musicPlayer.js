const API_BASE = "https://gabbys-playlist.vercel.app/api/proxy";

const player = document.getElementById("musicPlayer");
const songTitle = document.getElementById("songCardTitle");
const prevButton = document.getElementById ("prevButton");
const randButton = document.getElementById("randomButton");
const nextButton = document.getElementById('nextButton');
const hideIcon = document.getElementById("hideIcon");
const songCard =  document.getElementById("songCardContainer");
const startButton = document.getElementById("startButton");
const greetOverlayContainer = document.getElementById("greetingOverlayContainer");
const greetOverlay = document.getElementById("greetingOverlay");
const loadingOverlay = document.getElementById("loadingOverlay");
const pauseButton = document.getElementById("pauseButton");
const seekBar = document.getElementById("seekBar");
const timeDisplay = document.getElementById("timeDisplay");
const songs = [];
const greetingHeader = document.getElementById("greetingHeader");
const greetingSubheader = document.getElementById("greetingSubheader");
const greetingHeaders = ["Ready to vibe?", "Gabby’s Playlist", "Let’s Play Something Cool", "Welcome, Friend", ];
const greetingSubheaders = ["Start your session →", "Gabby’s mix is loaded. Let’s go!", "Mostly dito japanese hehe", "Click start and mag auto play agad yan siya"];
const sliders = ["simpson.gif", "fire.gif", "rain.gif", "spooky.gif", "stitch.gif", "pinterest.gif", "car.gif", "scooter.gif", "heart.gif", "crab.gif"];
const sliderGifBasePath = "./assets/icons/";
const min = 0;
let max = 0;
let currentSong = 0;

//loading screen area dito sa taas

player.addEventListener('loadstart', () => loadingOverlay.classList.add("show"));
player.addEventListener('canplay', () => loadingOverlay.classList.remove("show"));
player.addEventListener('waiting', () => loadingOverlay.classList.add("show"));
player.addEventListener('playing', () => loadingOverlay.classList.remove("show"));

function randomizeGreet() {
    const randHeader = Math.floor(Math.random() * greetingHeaders.length);
    const randSubheader = Math.floor(Math.random() * greetingSubheaders.length);
    greetingHeader.innerText = greetingHeaders[randHeader];
    greetingSubheader.innerText = greetingSubheaders[randSubheader];
}

randomizeGreet();

function randomizeSlider(){
    const randSlider = Math.floor(Math.random() * sliders.length);
    seekBar.style.setProperty(`--thumb-image`, `url('${sliderGifBasePath}${sliders[randSlider]}')`);
}

pauseButton.addEventListener("click", () => {
    if(player.paused){
        pauseButton.classList.add("play");
        player.play();    
    } else {
        pauseButton.classList.remove("play");
        player.pause();
    }
});

function reanimateSlider(){
    seekBar.max = player.duration;
    seekBar.value = player.currentTime;

    requestAnimationFrame(reanimateSlider);
}

requestAnimationFrame(reanimateSlider);

player.addEventListener("timeupdate", () => {
    const format = (time) => `${(Math.floor(time / 60))}:${String(Math.floor(time % 60)).padStart(2,'0')}`; 
    seekBar.style.setProperty('--progress-percent', `${((player.currentTime/(isNaN(player.duration) || player.duration == 0 ? 1 : player.duration))) * 100}%`);
    timeDisplay.innerText = `${format(player.currentTime)}/${isNaN(player.duration) ? '0:00' : format(player.duration)}`;
    
});

seekBar.addEventListener("input", () => {
    player.currentTime = seekBar.value;
});

async function loadSongs() {
    loadingOverlay.classList.add("show");
    try {
        const res = await fetch(`${API_BASE}/songs`, {
            method: "GET",
            headers: {
                "Content-Type":"application/json"
            },
        });
        const data = await res.json();
        for (const element of data) {
            songs.push(element);
        }
        max = songs.length -1;
    } catch (error) {
        console.error(error);
    } finally {
        loadingOverlay.classList.remove("show");
    }   
}

function startingSong() {
    currentSong = Math.floor(Math.random() * (max - min + 1)) + min;
    player.src = `${API_BASE}/music/${songs[currentSong]}`;
    songTitle.innerText = songs[currentSong];
    player.play();
    pauseButton.classList.add("play");
    randomizeSlider();
}

function randomNext() {
    currentSong = Math.floor(Math.random() * (max - min + 1)) + min;
    player.src = `${API_BASE}/music/${songs[currentSong]}`;
    songTitle.innerText = songs[currentSong];
    player.play();
    pauseButton.classList.add("play");
    randomizeSlider();
}

function playNext() {
    if(currentSong < max){
        currentSong = currentSong + 1;
    } else {
        currentSong = min;
    }
    player.src = `${API_BASE}/music/${songs[currentSong]}`;
    songTitle.innerText = songs[currentSong];
    player.play();
    pauseButton.classList.add("play");
    randomizeSlider();
}

function playPrev() {
    if(currentSong > min){
        currentSong = currentSong - 1;
    } else {
        currentSong = max;
    }
    player.src = `${API_BASE}/music/${songs[currentSong]}`;
    songTitle.innerText = songs[currentSong];
    player.play();
    pauseButton.classList.add("play");
    randomizeSlider();
}

function playNextRandomSong() {
    randomNext();
}

function playNextSong() {
    playNext();
}

function playPrevSong() {
    playPrev();
}

async function start() {
    await loadSongs();
    startingSong();
}

player.addEventListener("ended", playNext);

hideIcon.addEventListener("click", () => {
    hideIcon.classList.toggle("hide");
    songCard.classList.toggle("hide");
});

prevButton.addEventListener('click', () => 
    playPrevSong());
randButton.addEventListener('click', () =>
    playNextRandomSong());
nextButton.addEventListener('click', () =>
    playNextSong());

startButton.addEventListener("click", () => {
   greetOverlayContainer.style.display = "none";
   start(); 
});