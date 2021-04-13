// Definizione tasto premuto sulla tastiera a False.
let tastoPremuto = false;

// Funzione in attesa della pressione dei tasti ← ↑ → ↓ oppure AWDS
function utenteInput(tasto){
    canvas.addEventListener('keydown', function(e){
        // ← A
        if(e.keyCode === 37 || e.keyCode === 65){
            if(tasto.left === false){
                tastoPremuto = true;
            }
            tasto.left = true;
        }
        // ↑ W
        if(e.keyCode === 38 || e.keyCode === 87){
            if(tasto.up === false){
                tastoPremuto = true;
            }
            tasto.up = true;
        }
        // → D
        if(e.keyCode === 39 || e.keyCode === 68 ){
            if(tasto.right === false){
                tastoPremuto = true;
            }
            tasto.right = true;
        }
        // ↓ S
        if(e.keyCode === 40 || e.keyCode === 83){
            if(tasto.down === false){
                tastoPremuto = true;
            }
            tasto.down = true;
        }
        if (tastoPremuto === true){
            emitUtenteTasti(tasto);
            tastoPremuto = false;
        }
    });
    
    canvas.addEventListener('keyup', function(e){
        // ← A
        if(e.keyCode === 37 || e.keyCode === 65){
            tasto.left = false;
        }
        // ↑ W
        if(e.keyCode === 38 || e.keyCode === 87){
            tasto.up = false;
        }
        // → D
        if(e.keyCode === 39 || e.keyCode === 68){
            tasto.right = false;
        }
        // ↓ S
        if(e.keyCode === 40 || e.keyCode === 83){
            tasto.down = false; 
        }
        emitUtenteTasti(tasto);
    });    
}

function emitUtenteTasti(tasto){
    let utenteTasti = {
        left: tasto.left,
        up: tasto.up,
        right: tasto.right,
        down: tasto.down,
    }
    socket.emit('utenteTasti', utenteTasti);
}