// Client
const socket = io();
// Gestione canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// Gestione area gioco
const form = document.getElementById('utenteForm');
const areaGiocoDiv = document.getElementById('areaGioco');

// Variabili
let clientPallina = {};
let idPersonale;

creazioneSpazio();

// Le 4 palline interne del gioco
let pallina1;
let pallina2;
let pallina3;
let pallina4;

// Connessione
socket.on('connect', () => {
    idPersonale = socket.id;
})

socket.on('updateConnessione', giocatore => {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if(clientPallina[giocatore.id] === undefined){
        clientPallina[giocatore.id] = new Pallina(giocatore.x, giocatore.y, 12, 12);
        clientPallina[giocatore.id].maxSpeed = 2;
        clientPallina[giocatore.id].punteggio = 0;
        clientPallina[giocatore.id].num = giocatore.num;
        if(clientPallina[giocatore.id].num === 1){
            clientPallina[giocatore.id].color = "red";
            document.getElementById('rossoPresentazione').innerHTML = 
                    `--->`;
            document.getElementById('rossoPresentazione2').innerHTML = 
                    `--->`;
        } else if(clientPallina[giocatore.id].num === 2){
            clientPallina[giocatore.id].color = "lime";
            document.getElementById('rossoPresentazione').innerHTML = ``;
            document.getElementById('rossoPresentazione2').innerHTML = ``;

            document.getElementById('verdePresentazione').innerHTML = 
                    `<---`;
            document.getElementById('verdePresentazione2').innerHTML = 
                    `<---`;
        }
        if(giocatore.id === idPersonale){
            document.getElementById('stanzaGiocatore').innerHTML =
                `- stanza ${giocatore.stanzaNum} -`
            utenteInput(clientPallina[giocatore.id]);
        }
    }
})

// Nome giocatore
socket.on('nomeGiocatore', info => {
    clientPallina[info.id].name = info.name;
})

// Eliminazione giocatore e rimozione immediata delle 4 Palline piccole
socket.on('eliminaGiocatore', giocatore => {
    if(clientPallina[giocatore.id]){
        clientPallina[giocatore.id].remove();
        delete clientPallina[giocatore.id];
        pallina1.remove();
        pallina2.remove();
        pallina3.remove();
        pallina4.remove();
        delete pallina1;
        delete pallina2;
        delete pallina3;
        delete pallina4;
    }
})

// Aggiornamento posizione Palline -> 1,2,3,4
socket.on('updatePallina1', pallinaPos => {
    if(pallina1 === undefined){
        pallina1 = new Pallina(pallinaPos.x, pallinaPos.y, 8, 20);
        pallina1.color = "magenta";
    } else {
        pallina1.fissarePosizione(pallinaPos.x, pallinaPos.y);
    }
})

socket.on('updatePallina2', pallinaPos => {
    if(pallina2 === undefined){
        pallina2 = new Pallina(pallinaPos.x, pallinaPos.y, 8, 20);
        pallina2.color = "tomato";
    } else {
        pallina2.fissarePosizione(pallinaPos.x, pallinaPos.y);
    }
})

socket.on('updatePallina3', pallinaPos => {
    if(pallina3 === undefined){
        pallina3 = new Pallina(pallinaPos.x, pallinaPos.y, 8, 20);
        pallina3.color = "navajowhite";
    } else {
        pallina3.fissarePosizione(pallinaPos.x, pallinaPos.y);
    }
})

socket.on('updatePallina4', pallinaPos => {
    if(pallina4 === undefined){
        pallina4 = new Pallina(pallinaPos.x, pallinaPos.y, 8, 20);
        pallina4.color = "royalblue";
    } else {
        pallina4.fissarePosizione(pallinaPos.x, pallinaPos.y);
    }
})

// Aggiornamento posizione giocatore
socket.on('updatePosizione', giocatorePos => {
    for(let id in clientPallina){
        if(clientPallina[id] !== undefined && id === giocatorePos.id){
            clientPallina[id].fissarePosizione(giocatorePos.x, giocatorePos.y);
        }
    }
})

// Aggiornamento punteggio giocatore
socket.on('updatePunteggio', punteggioId => {
    if (punteggioId === null){
        for (let id in clientPallina){
            // Azzera il punteggio dei giocatori
            clientPallina[id].punteggio = 0;
        } 
    } else {
        document.getElementById('vittoriaNome').innerHTML = ``;
        document.getElementById('vittoriaPresentazione').innerHTML = ``;
        for (let id in clientPallina){
            if (id === punteggioId){
                if(clientPallina[id].num === 1){
                    clientPallina[id].punteggio++;
                } else if(clientPallina[id].num === 2){
                    clientPallina[id].punteggio++;
                }
                if(clientPallina[id].punteggio === 4){
                    document.getElementById('vittoriaNome').innerHTML = 
                    `${clientPallina[id].name}!`

                    document.getElementById('vittoriaPresentazione').innerHTML = 
                    `IL VINCITORE È:`
                }
            }
        }
    }
})

// Convalidare il form prima di inviarlo al server
form.onsubmit = function(e) {
    e.preventDefault();
    form.style.display = 'none';
    areaGiocoDiv.style.display = 'block';
    // Impostare movimento immediato della Pallina utente, post apertura schermata.
    canvas.focus();
    clientPallina[idPersonale].name = document.getElementById('nomeUtente').value;
    socket.emit('nomeClient', clientPallina[idPersonale].name);
    return false;
}

// Animazione collegato a baseForme
requestAnimationFrame(trasmettereUnicamente);

// Costruzione spazio in cui il gioco avrà luogo
function creazioneSpazio(){

    // ------------------------------------------------
    // Sopra e sotto

    // Linea orizzontale in alto
    new Barriera(60,60,520, 60);
    // Linea orizzontale in basso
    new Barriera(60,440,520, 440);

    // ------------------------------------------------
    // Lato sinistro

    // 1 Rettangolo vincolo sotto a sx
    // Linee orizzontali
    new Barriera(100,318,160, 318);
    new Barriera(100,374,220, 374);
    // Linee verticali
    new Barriera(100,318,100, 374);
    new Barriera(220,346,220, 374);

    // Costruzione rombo
    // Prima "C" del rombo (vincolo)
    new Barriera(100,154,160,118);
    new Barriera(100,154,160,190);
    // Seconda "C" al contrario del rombo (vincolo)
    new Barriera(160,118,220,154);
    
    // Aperture sinistra (zona dove si segna il punto)
    // Linea verticale sx, sopra
    new Barriera(60,60,60, 118);
    // Linea verticale sx tra le due aperture
    new Barriera(60,190,60, 318);
    // Linea verticale sx, sotto
    new Barriera(60,374,60, 440);

    // Linea verticale apertura sx (invisibile)
    new Barriera(0,318,0, 374);

    // 1 Linea orizzontale sx 
    new Barriera(0,154,60,118);
    // 2 Linea orizzontale sx 
    new Barriera(0,154,60,190);
    // 3 Linea orizzontale sx
    new Barriera(0,318,60,318);
    // 4 Linea orizzontale sx
    new Barriera(0,374,60,374);
    
    // ------------------------------------------------
    // Lato destro

    // Linea verticale dx, sopra 1 apertura
    new Barriera(520,60,520, 126);
    // Linea verticale dx, tra le due aperture
    new Barriera(520,182,520, 310);
    // Linea verticale dx sotto 2 apertura
    new Barriera(520,382,520, 440);

    // Linea verticale apertura dx (invisibile)
    new Barriera(580,126,580, 182);

    // 1 Linea orizzontale dx
    new Barriera(520,126,580, 126);
    // 2 Linea orizzontale dx
    new Barriera(580,182,520, 182);
    // 3 Linea orizzontale dx
    new Barriera(580,346,520, 310);
    // 4 Linea orizzontale dx
    new Barriera(580,346,520, 382);


    // Vincoli destra
    // Costruzione del 2 rettangolo in alto a dx
    // Linee orizzontali
    new Barriera(360,126,480, 126);
    new Barriera(420,182,480, 182);
    // Linee verticali
    new Barriera(360,126,360, 154);
    new Barriera(480,126,480, 182);

    // Costruzione "C" invertita dx rombo 
    new Barriera(480,346,420, 310);
    new Barriera(480,346,420, 382);
    // Costruzione "C" normale dx rombo
    new Barriera(360,346,420, 382);

    // Linee orizzontali che va dal rombo sx al rettangolo dx
    new Barriera(260,346,220, 346);
    new Barriera(360,346,320, 346);

    // Linea verticale che collega rombo sx al rettangolo sx
    new Barriera(420,182,420, 310);

    // Linea verticale rombo sx a rettangolo sx
    new Barriera(160,190,160, 318);

    // Linea orizzontale che collega rombo sx a rettangolo dx
    new Barriera(220,154,260, 154);
    new Barriera(320,154,360, 154);
}

// Interfaccia utente -> posizione punteggio e nome / colori 
function interfacciaUtente(){
    ctx.font = "23px monospace";
    for (let id in clientPallina){
        if(clientPallina[id].num === 1){
            ctx.fillStyle = "red";
            ctx.textAlign = "left";
            ctx.fillText(clientPallina[id].punteggio, 20, 254);

            if(clientPallina[id].name){
                ctx.fillText(clientPallina[id].name, 60, 480);
            }
        } else if(clientPallina[id].num === 2){
            ctx.fillStyle = "lime";
            ctx.textAlign = "right";
            ctx.fillText(clientPallina[id].punteggio, 560, 254);

            if(clientPallina[id].name){
                ctx.fillText(clientPallina[id].name, 520, 480);
            }
        }
    }
}