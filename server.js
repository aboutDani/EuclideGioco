// Server
const express = require('express')
const path = require('path') 
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Settare una cartella statica -> public
app.use(express.static(path.join(__dirname, "public")))

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// *************** Inizio parte baseForme (fino a riga codice 484) ***************

// Definizione costanti FORME e URTI
const FORME = [];
const URTI = [];

// Classe Vettore contenente metodi algebrici
class Vettore{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }  
   
    set(x, y){
        this.x = x;
        this.y = y;
    }

    add(v){
        return new Vettore(this.x+v.x, this.y+v.y);
    }

    subtr(v){
        return new Vettore(this.x-v.x, this.y-v.y);
    }

    mag(){
        return Math.sqrt(this.x**2 + this.y**2);
    }

    mult(n){
        return new Vettore(this.x*n, this.y*n);
    }

    normal(){
        return new Vettore(-this.y, this.x).unit();
    }

    unit(){
        if(this.mag() === 0){
            return new Vettore(0,0);
        } else {
            return new Vettore(this.x/this.mag(), this.y/this.mag());
        }
    }

    static punto(v1, v2){
        return v1.x*v2.x + v1.y*v2.y;
    }

    static croce(v1, v2){
        return v1.x*v2.y - v1.y*v2.x;
    }
}

// Classe che racchiude la forma base -> Linea
class Linea{
    constructor(x0, y0, x1, y1){
        this.vertice = [];
        this.vertice[0] = new Vettore(x0, y0);
        this.vertice[1] = new Vettore(x1, y1);
        this.dir = this.vertice[1].subtr(this.vertice[0]).unit();
        this.mag = this.vertice[1].subtr(this.vertice[0]).mag();
        this.pos = new Vettore((this.vertice[0].x+this.vertice[1].x)/2, (this.vertice[0].y+this.vertice[1].y)/2);
    }

    disegna(color){
        ctx.beginPath();
        ctx.moveTo(this.vertice[0].x, this.vertice[0].y);
        ctx.lineTo(this.vertice[1].x, this.vertice[1].y);
        if (color === ""){
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.strokeStyle = color;
            ctx.stroke();
        }
        ctx.strokeStyle = "";
        ctx.closePath();
    }
}

// Classe che racchiude la forma base -> Cerchio
class Cerchio{
    constructor(x, y, r){
        this.vertice = [];
        this.pos = new Vettore(x, y);
        this.r = r;
    }

    disegna(color){
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2*Math.PI);
        if (color === ""){
            ctx.strokeStyle = "black";
            ctx.stroke();
        } else {
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.fillStyle = "";
        ctx.closePath();
    }
}

// Classe padre Figura, delle forme -> Pallina e Barriera
class Figura{
    constructor(x, y){
        this.comp = [];
        this.pos = new Vettore(x, y);
        this.m = 0;
        this.inv_m = 0;
        this.inertia = 0;
        this.inv_inertia = 0;
        this.elasticity = 1;

        this.friction = 0;
        this.angFriction = 0;
        this.maxSpeed = 0;
        this.color = "";
        this.layer = 0;

        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;

        this.vel = new Vettore(0, 0);
        this.acc = new Vettore(0, 0);
        this.keyForce = 1;
        this.angKeyForce = 0.1;
        this.angVel = 0;
        this.player = false;
        FORME.push(this);
    }

    trasmettere(){
        for (let i in this.comp){
            this.comp[i].disegna(this.color);
        }
    }
    ridisporre(){
        this.acc = this.acc.unit().mult(this.keyForce);
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.mult(1-this.friction);
        if (this.vel.mag() > this.maxSpeed && this.maxSpeed !== 0){
            this.vel = this.vel.unit().mult(this.maxSpeed);
        }
        this.angVel *= (1-this.angFriction);
    }
    tastiControllo(){}
    remove(){
        if (FORME.indexOf(this) !== -1){
            FORME.splice(FORME.indexOf(this), 1);
        }
    }
}

// Classe Pallina: classe che estende il concetto di Figura,
// la quale sarà utilizzata per realizzare sia gli utenti che le 
// varie palline da inserire e spingere all'interno di determinate
// sezioni.
class Pallina extends Figura{
    constructor(x, y, r, m){
        super();
        this.pos = new Vettore(x, y);
        this.comp = [new Cerchio(x, y, r)];
        this.m = m;
        if (this.m === 0){
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m;
        }
    }

    setPosition(x, y){
        this.pos.set(x, y);
        this.comp[0].pos = this.pos;
    }

    ridisporre(){
        super.ridisporre();
        this.setPosition(this.pos.add(this.vel).x, this.pos.add(this.vel).y);
    }

    tastiControllo(){
        if(this.left){
            this.acc.x = -this.keyForce;
        }
        if(this.up){
            this.acc.y = -this.keyForce;
        }
        if(this.right){
            this.acc.x = this.keyForce;
        }
        if(this.down){
            this.acc.y = this.keyForce;
        }
        if(!this.left && !this.right){
            this.acc.x = 0;
        }
        if(!this.up && !this.down){
            this.acc.y = 0;
        }
    }
}

// Classe Barriera: classe anch'essa che estende il concetto
// di Figura e rappresenta lo spazio nel quale il tutto
// sarà strutturato, utilizzando appunto delle Linee.
// Classe utilizzata anche per lo sviluppo di ostacoli interni.
class Barriera extends Figura{
    constructor(x1, y1, x2, y2){
        super();
        this.comp = [new Linea(x1, y1, x2, y2)];
        this.pos = new Vettore((x1+x2)/2, (y1+y2)/2);
    }
}

/* Classe per la gestione dei molteplici urti,
   raccolti in un array*/
class UrtiData{
    constructor(o1, o2, normal, pen, cp){
        this.o1 = o1;
        this.o2 = o2;
        this.normal = normal;
        this.pen = pen;
        this.cp = cp;
    }

    penRisol(){
        let penRisoluzione = this.normal.mult(this.pen / (this.o1.inv_m + this.o2.inv_m));
        this.o1.pos = this.o1.pos.add(penRisoluzione.mult(this.o1.inv_m));
        this.o2.pos = this.o2.pos.add(penRisoluzione.mult(-this.o2.inv_m));
    }

    urtiRisol(){
        // Velocità finale
        let urtoArm1 = this.cp.subtr(this.o1.comp[0].pos);
        let rotVel1 = new Vettore(-this.o1.angVel * urtoArm1.y, this.o1.angVel * urtoArm1.x);
        let closVel1 = this.o1.vel.add(rotVel1);
        let urtoArm2 = this.cp.subtr(this.o2.comp[0].pos);
        let rotVel2= new Vettore(-this.o2.angVel * urtoArm2.y, this.o2.angVel * urtoArm2.x);
        let closVel2 = this.o2.vel.add(rotVel2);

        // Aumento impulso
        let impAug1 = Vettore.croce(urtoArm1, this.normal);
        impAug1 = impAug1 * this.o1.inv_inertia * impAug1;
        let impAug2 = Vettore.croce(urtoArm2, this.normal);
        impAug2 = impAug2 * this.o2.inv_inertia * impAug2;

        let relVel = closVel1.subtr(closVel2);
        let sepVel = Vettore.punto(relVel, this.normal);
        let new_sepVel = -sepVel * Math.min(this.o1.elasticity, this.o2.elasticity);
        let vsep_diff = new_sepVel - sepVel;

        let impulso = vsep_diff / (this.o1.inv_m + this.o2.inv_m + impAug1 + impAug2);
        let impulsoVec = this.normal.mult(impulso);

        // Cambio di velocità
        this.o1.vel = this.o1.vel.add(impulsoVec.mult(this.o1.inv_m));
        this.o2.vel = this.o2.vel.add(impulsoVec.mult(-this.o2.inv_m));

        this.o1.angVel += this.o1.inv_inertia * Vettore.croce(urtoArm1, impulsoVec);
        this.o2.angVel -= this.o2.inv_inertia * Vettore.croce(urtoArm2, impulsoVec); 
    }
}

// Teorema dell'asse di separazione
// Restituendo il Minimum Translation Vector, o false se non ci sono urti.
function sepAsseTeorema(o1, o2){
    let minOverlap = null;
    let asseMinore;
    let verticeObj;

    let assi = trovaProiezioneAssi(o1, o2);
    let proj1, proj2 = 0;
    let primaFormaAssi = ottieniFormaAssi(o1);

    for(let i=0; i<assi.length; i++){
        proj1 = proiezioneFormaSuAssi(assi[i], o1);
        proj2 = proiezioneFormaSuAssi(assi[i], o2);
        let overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
        if (overlap < 0){
            return false;
        }

        if((proj1.max > proj2.max && proj1.min < proj2.min) ||
          (proj1.max < proj2.max && proj1.min > proj2.min)){
              let mins = Math.abs(proj1.min - proj2.min);
              let maxs = Math.abs(proj1.max - proj2.max);
              if (mins < maxs){
                  overlap += mins;
              } else {
                  overlap += maxs;
                  assi[i] = assi[i].mult(-1);
              }
          }

        if (overlap < minOverlap || minOverlap === null){
            minOverlap = overlap;
            asseMinore = assi[i];
            if (i<primaFormaAssi){
                verticeObj = o2;
                if(proj1.max > proj2.max){
                    asseMinore = assi[i].mult(-1);
                }
            } else {
                verticeObj = o1;
                if(proj1.max < proj2.max){
                    asseMinore = assi[i].mult(-1);
                }
            }
        }  
    };

    let verticeContatto = proiezioneFormaSuAssi(asseMinore, verticeObj).urtoVertice;

    if(verticeObj === o2){
        asseMinore = asseMinore.mult(-1);
    }

    return {
        pen: minOverlap,
        axis: asseMinore,
        vertice: verticeContatto
    }
}

// Funzione che restituisce il valore min e max delle proiezioni della figura
// in relazione agli assi.
function proiezioneFormaSuAssi(axis, obj){
    stabilireVerticeAssiPallina(obj, axis);
    let min = Vettore.punto(axis, obj.vertice[0]);
    let max = min;
    let urtoVertice = obj.vertice[0];
    for(let i=0; i<obj.vertice.length; i++){
        let p = Vettore.punto(axis, obj.vertice[i]);
        if(p<min){
            min = p;
            urtoVertice = obj.vertice[i];
        } 
        if(p>max){
            max = p;
        }
    }
    return {
        min: min,
        max: max, 
        urtoVertice: urtoVertice
    }
}

// Funzione per trovare le proiezioni degli assi per due oggetti o1 e o2
function trovaProiezioneAssi(o1, o2){
    let assi = [];
    if(o1 instanceof Cerchio && o2 instanceof Cerchio){
        if(o2.pos.subtr(o1.pos).mag() > 0){
            assi.push(o2.pos.subtr(o1.pos).unit());
        } else {
            assi.push(new Vettore(Math.random(), Math.random()).unit());
        }        
        return assi;
    }
    if(o1 instanceof Cerchio){
        assi.push(vicinanzaVerticePunto(o2, o1.pos).subtr(o1.pos).unit());
    }
    if(o1 instanceof Linea){
        assi.push(o1.dir.normal());
    }   
    if (o2 instanceof Cerchio){
        assi.push(vicinanzaVerticePunto(o1, o2.pos).subtr(o2.pos).unit());
    }
    if (o2 instanceof Linea){
        assi.push(o2.dir.normal());
    }   
    return assi;
}

// Funzione che itera attraverso i vertici degli oggetti e restituisce quello più vicino ad un dato punto.
function vicinanzaVerticePunto(obj, p){
    let verticeVicino;
    let minDist = null;
    for(let i=0; i<obj.vertice.length; i++){
        if(p.subtr(obj.vertice[i]).mag() < minDist || minDist === null){
            verticeVicino = obj.vertice[i];
            minDist = p.subtr(obj.vertice[i]).mag();
        }
    }
    return verticeVicino;
}

// Funzione che restituisce il numero di assi che appartengono ad un oggetto
function ottieniFormaAssi(obj){
    if(obj instanceof Cerchio || obj instanceof Linea){
        return 1;
    }
}

// Funzione relativa alla Pallina e al suo continuo ricalcolo relativo alla direzione 
// della proiezione degli assi.
function stabilireVerticeAssiPallina(obj, axis){
    if(obj instanceof Cerchio){
        obj.vertice[0] = obj.pos.add(axis.unit().mult(-obj.r));
        obj.vertice[1] = obj.pos.add(axis.unit().mult(obj.r));
    }
}

// Funzione scontro che prende in causa i 2 oggetti (o1, o2)
function scontro(o1, o2){
    let bestSat = {
        pen: null,
        axis: null,
        vertice: null
    }
    for(let o1comp=0; o1comp<o1.comp.length; o1comp++){
        for(let o2comp=0; o2comp<o2.comp.length; o2comp++){
            if(sepAsseTeorema(o1.comp[o1comp], o2.comp[o2comp]).pen > bestSat.pen){
                bestSat = sepAsseTeorema(o1.comp[o1comp], o2.comp[o2comp]);
            }
        }
    }
    if (bestSat.pen !== null){
        return bestSat;
    } else {
        return false;
    }
}

// Funzione essenziale per l'interazione con l'utente
function interazioneUtente(){
    FORME.forEach((b) => {
        b.tastiControllo();
    })
}

// Funzione del Server, relativa alla realizzazione di un punto
// e del termine partita.
function logicaGioco(){}

// Funzione da applicare all'interno del serverLoop
function fisicaLoop() {
    URTI.length = 0;
    
    FORME.forEach((b) => {
        b.ridisporre();
    })
    
    FORME.forEach((b, index) => {
        for(let bodyPair = index+1; bodyPair < FORME.length; bodyPair++){
           if((FORME[index].layer === FORME[bodyPair].layer ||
            FORME[index].layer === 0 || FORME[bodyPair].layer === 0) && 
            scontro(FORME[index], FORME[bodyPair])){
                    let bestSat = scontro(FORME[index], FORME[bodyPair]);
                    URTI.push(new UrtiData(FORME[index], FORME[bodyPair], bestSat.axis, bestSat.pen, bestSat.vertice));
           }
        }
    });

    URTI.forEach((c) => {
        c.penRisol();
        c.urtiRisol();
    });
}

// *************** Fine parte baseForme ***************

// Creazione spazio dove avrà luogo il gioco
creazioneSpazio();

// Variabili delle 4 palline interne del gioco e del giocatore
let pallina1 = {};
let pallina2 = {};
let pallina3 = {};
let pallina4 = {};

// Posizione del giocatore con coordinate x, y
let giocatorePos = {};

// Pallina lato server
let serverPallina = {};

// Numero utente
let clientNum = 0;

// Numero stanza 
let stanzaNum;

// Variabile per capire se vi è una sfida in corso
let sfidaInCorso = {};

/* Loop con un intervallo prestabilito che 
   verrà eseguito 60 volte al secondo */
setInterval(serverLoop, 1000/60);

io.on('connection', connected);

// Connessione 
function connected(socket){
    clientNum++;
    stanzaNum = Math.round(clientNum / 2);
    socket.join(stanzaNum);
    if (clientNum % 2 === 1){
        // Creazione primo giocatore
        serverPallina[socket.id] = new Pallina(100, 250, 12, 12);
        serverPallina[socket.id].maxSpeed = 2;
        serverPallina[socket.id].punteggio = 0;
        serverPallina[socket.id].num = 1;
        serverPallina[socket.id].layer = stanzaNum;
        giocatorePos[socket.id] = {id: socket.id, x: 100, y: 250, stanzaNum: stanzaNum, num: 1};

        // Inserimento palline all'interno dello spazio
        // 1 pallina
        pallina1[stanzaNum] = new Pallina(160, 154, 8, 20);
        pallina1[stanzaNum].layer = stanzaNum;

        // 2 pallina
        pallina2[stanzaNum] = new Pallina(420, 346, 8, 20);
        pallina2[stanzaNum].layer = stanzaNum;

        // 3 pallina
        pallina3[stanzaNum] = new Pallina(420, 154, 8, 20);
        pallina3[stanzaNum].layer = stanzaNum;

        // 4 pallina
        pallina4[stanzaNum] = new Pallina(160, 346, 8, 20);
        pallina4[stanzaNum].layer = stanzaNum;

        io.emit('updatePallina1', {x: pallina1[stanzaNum].pos.x, y: pallina1[stanzaNum].pos.y});
        io.emit('updatePallina2', {x: pallina2[stanzaNum].pos.x, y: pallina2[stanzaNum].pos.y});
        io.emit('updatePallina3', {x: pallina3[stanzaNum].pos.x, y: pallina3[stanzaNum].pos.y});
        io.emit('updatePallina4', {x: pallina4[stanzaNum].pos.x, y: pallina4[stanzaNum].pos.y});

    }
    else if (clientNum % 2 === 0){
        // Creazione secondo giocatore 
        serverPallina[socket.id] = new Pallina(480, 250, 12, 12);
        serverPallina[socket.id].maxSpeed = 2;
        serverPallina[socket.id].punteggio = 0;
        serverPallina[socket.id].num = 2;
        serverPallina[socket.id].layer = stanzaNum;
        giocatorePos[socket.id] = {id: socket.id, x: 480, y: 570, stanzaNum: stanzaNum, num: 2};
        
    }

    for (let id in serverPallina){
        io.to(serverPallina[id].layer).emit('updateConnessione', giocatorePos[id]);
    }

    // Disconnessione palline e utente
    socket.on('disconnect', function(){
        // 1 pallina
        if(pallina1[serverPallina[socket.id].layer]){
            pallina1[serverPallina[socket.id].layer].remove();
            delete pallina1[pallina1[serverPallina[socket.id].layer]];
        }
        // 2 pallina
        if(pallina2[serverPallina[socket.id].layer]){
            pallina2[serverPallina[socket.id].layer].remove();
            delete pallina2[pallina2[serverPallina[socket.id].layer]];
        }
        // 3 pallina
        if(pallina3[serverPallina[socket.id].layer]){
            pallina3[serverPallina[socket.id].layer].remove();
            delete pallina3[pallina3[serverPallina[socket.id].layer]];
        }
        // 4 pallina
        if(pallina4[serverPallina[socket.id].layer]){
            pallina4[serverPallina[socket.id].layer].remove();
            delete pallina4[pallina4[serverPallina[socket.id].layer]];
        }
        serverPallina[socket.id].remove();
        io.to(serverPallina[socket.id].layer).emit('eliminaGiocatore', giocatorePos[socket.id]);
        delete serverPallina[socket.id];
      
        io.emit('updateConnessione', giocatorePos);
    })

    // Comunicazione tasti premuti
    socket.on('utenteTasti', info => {
        serverPallina[socket.id].left = info.left;
        serverPallina[socket.id].up = info.up;
        serverPallina[socket.id].right = info.right;
        serverPallina[socket.id].down = info.down;
    })

    // Nome giocatore
    socket.on('nomeClient', info => {
        serverPallina[socket.id].name = info;
        // 2 giocatori nell'area gioco, la stanza si chiude e inizia il gioco
        if(giocatoriProntiInStanza(serverPallina[socket.id].layer) === 2){
            for(let id in serverPallina){
                if(serverPallina[id].layer === serverPallina[socket.id].layer){
                    io.to(serverPallina[id].layer).emit('nomeGiocatore', {id: id, name: serverPallina[id].name})
                }
            }
            sfidaInCorso[serverPallina[socket.id].layer] = true;
        } else {
            sfidaInCorso[serverPallina[socket.id].layer] = false;
        }
    })
}

// Riproduzione ciclo server
function serverLoop(){
    interazioneUtente();
    fisicaLoop();
    for (let stanza = 1; stanza <= stanzaNum; stanza++){
        if (sfidaInCorso[stanza] === true){
            logicaGioco(stanza);
            for (let id in serverPallina){
                if (serverPallina[id].layer === stanza){
                    io.to(stanza).emit('updatePosizione', {
                        id: id,
                        x: serverPallina[id].pos.x,
                        y: serverPallina[id].pos.y,
                    });
                }
            }
            io.to(stanza).emit('updatePallina1', {
                x: pallina1[stanza].pos.x,
                y: pallina1[stanza].pos.y
            });
            io.to(stanza).emit('updatePallina2', {
                x: pallina2[stanza].pos.x,
                y: pallina2[stanza].pos.y
            });
            io.to(stanza).emit('updatePallina3', {
                x: pallina3[stanza].pos.x,
                y: pallina3[stanza].pos.y
            });
            io.to(stanza).emit('updatePallina4', {
                x: pallina4[stanza].pos.x,
                y: pallina4[stanza].pos.y
            });
        } else {
            // nulla
        }
    }
}

// Riposizionamento Palline
function riposizionarePalline(stanza){    
    // Riposizionare pallina 1
    if((pallina1[stanza].pos.x < 60) || (pallina1[stanza].pos.x > 520)){
        pallina1[stanza].pos.set(160, 154);
        pallina1[stanza].vel.set(0, 0);
    }

    // Riposizionare pallina 2
    if((pallina2[stanza].pos.x < 60) || (pallina2[stanza].pos.x > 520)){
        pallina2[stanza].pos.set(420, 346);
        pallina2[stanza].vel.set(0, 0);
    }

    // Riposizionare pallina 3
    if((pallina3[stanza].pos.x < 60) || (pallina3[stanza].pos.x > 520)){
        pallina3[stanza].pos.set(420, 154);
        pallina3[stanza].vel.set(0, 0);
    }

    // Riposizionare pallina 4
    if((pallina4[stanza].pos.x < 60) || (pallina4[stanza].pos.x > 520)){
        pallina4[stanza].pos.set(160, 346);
        pallina4[stanza].vel.set(0, 0);
    }

    /* Riposizionare le 4 palline contemporaneamente se 
       si è raggiunto il punteggio di 4 */
    for(let id in serverPallina){
        if(serverPallina[id].punteggio === 4 && serverPallina[id].layer === stanza){
            pallina1[stanza].pos.set(160, 154);
            pallina1[stanza].vel.set(0, 0);
            pallina2[stanza].pos.set(420, 346);
            pallina2[stanza].vel.set(0, 0);
            pallina3[stanza].pos.set(420, 154);
            pallina3[stanza].vel.set(0, 0);
            pallina4[stanza].pos.set(160, 346);
            pallina4[stanza].vel.set(0, 0);
        }        
    }
}

// Riposizionamento pezzi a partita conclusa + gestione Timeout
function partitaFinita(stanza){
    riposizionarePalline(stanza);
    io.to(stanza).emit('updatePunteggio', null);
    setTimeout(() => {
        for(let id in serverPallina){
            if(serverPallina[id].layer === stanza){
                serverPallina[id].punteggio = 0;
            }
        }
    }, 2000);
}

// Logica assegnazione punti lato destro e sinistro
function realizzareUnPunto(stanza){
    let punteggioId;
    if((pallina1[stanza].pos.x < 60) || (pallina2[stanza].pos.x < 60) 
        || (pallina3[stanza].pos.x < 60) || (pallina4[stanza].pos.x < 60)){
        for(let id in serverPallina){
            if (serverPallina[id].num === 2 && serverPallina[id].layer  === stanza){
                serverPallina[id].punteggio++;
                punteggioId = id;
            }
        }
    }
    if((pallina1[stanza].pos.x > 520) || (pallina2[stanza].pos.x > 520) 
        || (pallina3[stanza].pos.x > 520 ) || (pallina4[stanza].pos.x > 520 )){
        for(let id in serverPallina){
            if (serverPallina[id].num === 1 && serverPallina[id].layer === stanza){
                serverPallina[id].punteggio++;
                punteggioId = id;
            }
        }
    }
    riposizionarePalline(stanza);
    io.to(stanza).emit('updatePunteggio', punteggioId);
}

// Logica del gioco -> assegnazione punti e fine partita
function logicaGioco(stanza){
    if(pallina1[stanza].pos.x < 60 || pallina2[stanza].pos.x < 60 || pallina3[stanza].pos.x < 60 
        || pallina4[stanza].pos.x < 60 || pallina1[stanza].pos.x > 520 
        || pallina2[stanza].pos.x > 520 || pallina3[stanza].pos.x > 520 || pallina4[stanza].pos.x > 520){
            realizzareUnPunto(stanza);
    }
    for(let id in serverPallina){
        if(serverPallina[id].punteggio === 4 && serverPallina[id].layer === stanza ){
            partitaFinita(stanza);
        }
    }
}

// Gestione attesa giocatori pronti in stanza
function giocatoriProntiInStanza(stanza){
    let giocatoreNum = 0;
    for (let id in serverPallina){
        if(serverPallina[id].layer === stanza && serverPallina[id].name){
            giocatoreNum++;
        }
    }
    return giocatoreNum;
}

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