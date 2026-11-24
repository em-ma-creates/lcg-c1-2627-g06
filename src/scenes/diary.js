// src/scenes/diary.js

function diary_preload(s) {
}

// creazione scena diario
function diary_create(s) {
    PP.shapes.rectangle_add(s, 727.5, 400, 1455, 800, "0x000000", 0.6);
    PP.shapes.rectangle_add(s, 727.5, 400, 800, 500, "0xf5f6fa", 1);
    PP.shapes.text_styled_add(s, 727.5, 200, "DIARIO", 36, "Arial", "bold", "0x2f3640", null, 0.5, 0.5);

    // 4. lettura degli oggetti raccolti
    let entries = PP.game_state.get_variable("diary_entries");
    let startY = 280;

    if (!entries || entries.length === 0) {
        // se non abbiamo ancora raccolto nulla
        PP.shapes.text_styled_add(s, 727.5, startY, "(Ancora vuoto...)", 24, "Arial", "italic", "0x7f8fa6", null, 0.5, 0.5);
    } else {
        // se ci sono oggetti, li stampiamo in lista uno sotto l'altro
        for (let i = 0; i < entries.length; i++) {
            PP.shapes.text_styled_add(s, 400, startY + (i * 40), "- " + entries[i], 24, "Papyrus", "normal", "0x2f3640", null, 0, 0.5);
        }
    }
    
    PP.shapes.text_styled_add(s, 727.5, 600, "Premi A per chiudere", 16, "Arial", "normal", "0x7f8fa6", null, 0.5, 0.5);
}

function diary_update(s) {
    // se premiamo A, chiudiamo l'overlay e il gioco riprende
    if (PP.interactive.kb.is_key_just_down(s, PP.key_codes.A)) {
        PP.scenes.stop_overlay();
    }
}

function diary_destroy(s) {}

PP.scenes.add("DiaryScene", diary_preload, diary_create, diary_update, diary_destroy);