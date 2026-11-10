let img_player, img_floor, img_snow, img_obj1, img_obj2;
let player, floor, snow, obj1, obj2;

let isEffectLocked = false;
let currentEffectToken = 0; 

function preload(s) {
    img_player = PP.assets.image.load_color(s, "0xff7675", 32, 48); 
    img_floor = PP.assets.image.load_color(s, "0x6c5ce7", 1455, 32); 
    img_snow = PP.assets.image.load_color(s, "0x81ecec", 300, 32);  
    img_obj1 = PP.assets.image.load_color(s, "0xf1c40f", 32, 32); 
    img_obj2 = PP.assets.image.load_color(s, "0xe37e22", 32, 32); 
}

function create(s) {
    s.cameras.main.setBackgroundColor('#1e272e');
    isEffectLocked = false;

    // Inizializzazione della variabile di stato globale se non esiste
    if (PP.game_state.get_variable("diary_entries") == undefined) {
        PP.game_state.set_variable("diary_entries", []);
    }

    // --- TESTO DI NOTIFICA A SCHERMO ---
    // Creiamo un testo nascosto al centro dello schermo che useremo come avviso
    s.notification_text = PP.shapes.text_styled_add(
        s, 727.5, 120, "", 22, "Arial", "bold", "0xffffff", "0x2f3640", 0.5, 0.5
    );
    s.notification_text.visibility.hidden = true; // Nascondiamo inizialmente

    // --- MONDO (Pavimento e Neve) ---
    floor = PP.assets.image.add(s, img_floor, 727.5, 784, 0.5, 0.5);
    PP.physics.add(s, floor, PP.physics.type.STATIC);

    snow = PP.assets.image.add(s, img_snow, 350, 752, 0.5, 0.5);
    PP.physics.add(s, snow, PP.physics.type.STATIC); 

    // --- OGGETTI RACCOGLIBILI ---
    obj1 = PP.assets.image.add(s, img_obj1, 750, 752, 0.5, 0.5);
    PP.physics.add(s, obj1, PP.physics.type.STATIC);
    obj1.is_collected = false;

    obj2 = PP.assets.image.add(s, img_obj2, 1150, 752, 0.5, 0.5);
    PP.physics.add(s, obj2, PP.physics.type.STATIC);
    obj2.is_collected = false;

    // --- GIOCATORE ---
    player = PP.assets.image.add(s, img_player, 100, 600, 0.5, 0.5);
    PP.physics.add(s, player, PP.physics.type.DYNAMIC);
    PP.physics.set_collide_world_bounds(player, true);
    PP.physics.set_bounce_y(player, 0.2);

    // --- COLLISIONI ED EVENTI ---
    PP.physics.add_collider(s, player, floor);

    s.is_in_snow = false;
    PP.physics.add_overlap_f(s, player, snow, function(scene, p, sn) {
        scene.is_in_snow = true;
    });

    PP.physics.add_overlap_f(s, player, obj1, collectObj1);
    PP.physics.add_overlap_f(s, player, obj2, collectObj2);
}

function update(s) {
    if (PP.interactive.kb.is_key_just_down(s, PP.key_codes.A)) {
        PP.scenes.start_overlay("DiaryScene");
    }

    let currentSpeed = 260;
    let jumpPower = -550;

    if (s.is_in_snow) {
        currentSpeed = 90;
        jumpPower = -400;
    }
    s.is_in_snow = false; 

    if (PP.interactive.kb.is_key_down(s, PP.key_codes.LEFT)) {
        PP.physics.set_velocity_x(player, -currentSpeed);
    } else if (PP.interactive.kb.is_key_down(s, PP.key_codes.RIGHT)) {
        PP.physics.set_velocity_x(player, currentSpeed);
    } else {
        PP.physics.set_velocity_x(player, 0);
    }

    if (PP.interactive.kb.is_key_down(s, PP.key_codes.UP) && PP.physics.is_on_ground(player)) {
        PP.physics.set_velocity_y(player, jumpPower);
    }

    let currentVelY = PP.physics.get_velocity_y(player);
    if (currentVelY > 0 && PP.interactive.kb.is_key_down(s, PP.key_codes.UP)) {
        if (currentVelY > 120) {
            PP.physics.set_velocity_y(player, 120);
        }
    }

    const triggerRadius = 80;

    if (!isEffectLocked) {
        let dist1 = 9999;
        let dist2 = 9999;

        if (!obj1.is_collected) dist1 = Phaser.Math.Distance.Between(player.geometry.x, player.geometry.y, obj1.geometry.x, obj1.geometry.y);
        if (!obj2.is_collected) dist2 = Phaser.Math.Distance.Between(player.geometry.x, player.geometry.y, obj2.geometry.x, obj2.geometry.y);

        if (dist1 < triggerRadius) s.cameras.main.setBackgroundColor('#d63031');
        else if (dist2 < triggerRadius) s.cameras.main.setBackgroundColor('#0984e3');
        else s.cameras.main.setBackgroundColor('#1e272e');
    }
}

function destroy(s) {}

// --- FUNZIONI DI RACCOLTA ---

function collectObj1(scene, p, o) {
    if (o.is_collected) return;
    o.is_collected = true;
    PP.assets.destroy(o); 
    
    // Aggiorniamo l'array ricreandolo per forzare il salvataggio pulito nello stato
    let entries = PP.game_state.get_variable("diary_entries") || [];
    let newEntries = [...entries, "Oggetto 1"];
    PP.game_state.set_variable("diary_entries", newEntries);

    showNotification(scene, "Forse dovrei scrivere qualcosa sul mio diario...");
    applyTimedEffect(scene, '#d63031', 2000);
}

function collectObj2(scene, p, o) {
    if (o.is_collected) return;
    o.is_collected = true;
    PP.assets.destroy(o);

    let entries = PP.game_state.get_variable("diary_entries") || [];
    let newEntries = [...entries, "Oggetto 2"];
    PP.game_state.set_variable("diary_entries", newEntries);

    showNotification(scene, "Forse dovrei scrivere qualcosa sul mio diario...");
    applyTimedEffect(scene, '#0984e3', 3000);
}

// Funzione per mostrare l'avviso temporaneo a schermo
function showNotification(scene, message) {
    PP.shapes.text_change(scene.notification_text, message);
    scene.notification_text.visibility.hidden = false;

    // Spegne la notifica dopo 3 secondi
    PP.timers.add_timer(scene, 3000, function(sc) {
        sc.notification_text.visibility.hidden = true;
    }, false);
}

function applyTimedEffect(scene, color, duration) {
    isEffectLocked = true;
    scene.cameras.main.setBackgroundColor(color);

    currentEffectToken++; 
    let myToken = currentEffectToken;

    PP.timers.add_timer(scene, duration, function(sc) {
        if (myToken === currentEffectToken) {
            isEffectLocked = false;
            sc.cameras.main.setBackgroundColor('#1e272e');
        }
    }, false);
}

PP.scenes.add("GameScene", preload, create, update, destroy);