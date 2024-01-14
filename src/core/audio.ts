export class AudioManager {
    private audioPlayers: Array<Sound>;
    private isAudioEnabled: boolean;

    constructor(){
        this.audioPlayers = [];
        this.isAudioEnabled = true;
    }
    CheckAudioEnabled(){
        return this.isAudioEnabled;
    }
    ToggleAudioEnabled(enabled = this.isAudioEnabled ? false : true){
        this.isAudioEnabled = enabled;
    }
    CreateSound(soundEffect: string, loop: boolean = false){
        const newSound = new Sound(this, soundEffect, loop);
        this.audioPlayers.push(newSound);
        return newSound;
    } 
    CleanUp(soundInstance: { Remove: () => void; }){
        if (soundInstance instanceof Sound) {
            soundInstance.Remove();

            const i = this.audioPlayers.indexOf(soundInstance);
            if (i !== -1) {
                this.audioPlayers.splice(i, 1);
            }
        } else console.log("CleanUp Failed: Not an instanceof Sound.")
    }
}

export class Sound {
    private sound: HTMLAudioElement;
    private audioManager: AudioManager;

    constructor(audioManager: AudioManager, soundEffect: any, loop = false) {
        this.audioManager = audioManager;

        const sfx = {
            asteroidExplode: { soundFile: "./audio/space-explosion-with-reverb-101449.mp3", volPercent: 40},
            gameOver: { soundFile: "./audio/game-fx-9-40197.mp3", volPercent: 50},
            missionComplete: { soundFile: "./audio/game-level-complete-143022.mp3", volPercent: 50},
            shieldDown: { soundFile: "./audio/one_beep-99630.mp3", volPercent: 100},
            shipExplode: { soundFile: "./audio/heavy-cineamtic-hit-166888.mp3", volPercent: 25},
            shipRespawn: { soundFile: "./audio/robot_01-47250.mp3", volPercent: 50},
            shipThrusters: { soundFile: "./audio/thrusters_loopwav-14699.mp3", volPercent: 100},
            shootBullet: { soundFile: "./audio/shoot02wav-14562.mp3", volPercent: 10},
        }

        this.sound = new Audio(sfx[soundEffect as keyof typeof sfx].soundFile);
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.SetVolume(sfx[soundEffect as keyof typeof sfx].volPercent);
        this.sound.loop = loop;
    }
    SetVolume(volPercent: number) {
        if (!(volPercent >= 0 && volPercent <= 100)) return console.error('Invalid volume percentage. Please provide a value between 0 and 100.');
        this.sound.volume = volPercent / 100;
    }
    Play() {
        if(this.audioManager.CheckAudioEnabled()){
            try {
                this.sound.play();
            } catch(error){
                console.error(`Error playing sound: ${error}`);
            }
        }
    }
    Stop() {
        this.sound.pause();
    }
    Remove() {
        try {
            if (this.sound) {
                this.sound.addEventListener('ended', () => {
                    if (this.sound && this.sound.parentNode) {
                        this.sound.parentNode.removeChild(this.sound);
                    }
                });
            }
        } catch (error){
            console.error(`Error removing sound: ${error}`);
        }
    }
}