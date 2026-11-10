// src/scenes/diary.js

function diary_preload(s) {
    // Non carichiamo immagini, useremo le forme (shapes) vettoriali di PoliPhaser
}

function diary_create(s) {
    // 1. Sfondo scuro semi-trasparente per oscurare il gioco in pausa
    PP.shapes.rectangle_add(s, 727.5, 400, 1455, 800, "0x000000", 0.6);

    // 2. Le pagine del diario (un grande rettangolo color panna)
    PP.shapes.rectangle_add(s, 727.5, 400, 800, 500, "0xf5f6fa", 1);
    
    // 3. Titolo del diario
    PP.shapes.text_styled_add(s, 727.5, 200, "DIARIO", 36, "Arial", "bold", "0x2f3640", null, 0.5, 0.5);

    // 4. Lettura delle voci raccolte tramite il game_state condiviso
    let entries = PP.game_state.get_variable("diary_entries");
    let startY = 280;

    if (!entries || entries.length === 0) {
        // Se non abbiamo ancora raccolto nulla
        PP.shapes.text_styled_add(s, 727.5, startY, "(Ancora vuoto...)", 24, "Arial", "italic", "0x7f8fa6", null, 0.5, 0.5);
    } else {
        // Se ci sono oggetti, li stampiamo in lista uno sotto l'altro
        for (let i = 0; i < entries.length; i++) {
            PP.shapes.text_styled_add(s, 400, startY + (i * 40), "- " + entries[i], 24, "Arial", "normal", "0x2f3640", null, 0, 0.5);
        }
    }
    
    // 5. Istruzioni per chiudere
    PP.shapes.text_styled_add(s, 727.5, 600, "Premi A per chiudere", 16, "Arial", "normal", "0x7f8fa6", null, 0.5, 0.5);
}

function diary_update(s) {
    // Se premiamo A di nuovo, chiudiamo l'overlay e il gioco riprende
    if (PP.interactive.kb.is_key_just_down(s, PP.key_codes.A)) {
        PP.scenes.stop_overlay();
    }
}

function diary_destroy(s) {}

// Aggiungiamo la scena al motore di PoliPhaser
PP.scenes.add("DiaryScene", diary_preload, diary_create, diary_update, diary_destroy);