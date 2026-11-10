// main.js

const config = {
    canvas_width: 1455,
    canvas_height: 800,
    canvas_id: "game_div",      // L'id del div che abbiamo aggiunto nell'HTML
    background_color: 0x1e272e, // Colore sfondo di default (inserito come HEX puro)
    debug_mode: true,           // Attiva le hitbox
    gravity_value: 1000,         // Gravità
    pixel_art: false
};

// PoliPhaser si aspetta che la scena sia già stata creata (lo facciamo in game.js)
// quindi possiamo avviare direttamente il motore.
PP.game.create(config);