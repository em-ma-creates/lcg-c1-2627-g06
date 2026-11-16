// --- IMMAGINI PLACEHOLDER ---
let img_player, img_diary_icon;
let img_terreno_iniziale, img_terreno_lungo, img_terreno_medio, img_terreno_pilastro, img_piattaforma_media, img_piattaforma_piccola;
let img_solaio_primo_piano, img_tetto_casa, img_parete_piano, img_cancello;
let img_scala, img_neve, img_lampione, img_nuvola, img_oggetto, img_spuntoni, img_spuntoni_piccoli;

// --- OGGETTI DI SCENA ---
let player, cancello;
let diary_icon, diary_key_text;
let lista_piattaforme = [];
let lista_scale = [];
let lista_neve = [];
let lista_lampioni = [];
let lista_nuvole = [];
let lista_oggetti = [];
let lista_pericoli = [];
let pianoro_cancello = [];

// --- STATO DEL GIOCO ---
let spawn_x = 180;
let spawn_y = 1270;
let is_slowed = false;
let is_climbing = false;
let effetto_colore_bloccato = false;
let token_effetto_colore = 0;

function preload(s) {
    // Protagonista (64x180)
    img_player = PP.assets.image.load_color(s, "0xff7675", 64, 180);
    img_diary_icon = PP.assets.image.load_color(s, "0xf5f6fa", 40, 50);

    // Terreni e strutture
    img_terreno_iniziale = PP.assets.image.load_color(s, "0x6c5ce7", 2000, 160);
    img_terreno_lungo = PP.assets.image.load_color(s, "0x6c5ce7", 1700, 160);
    img_terreno_medio = PP.assets.image.load_color(s, "0x6c5ce7", 1100, 160);
    img_terreno_pilastro = PP.assets.image.load_color(s, "0x6c5ce7", 340, 420);
    img_piattaforma_media = PP.assets.image.load_color(s, "0x6c5ce7", 340, 36);
    img_piattaforma_piccola = PP.assets.image.load_color(s, "0x6c5ce7", 180, 32);
    img_pianoro_cancello = PP.assets.image.load_color(s, "0x6c5ce7", 1000, 36);

    // Struttura casa (Solaio 1° piano, Tetto con apertura a destra, Muri perimetrali)
    img_solaio_primo_piano = PP.assets.image.load_color(s, "0xa29bfe", 1196, 32);
    img_tetto_casa = PP.assets.image.load_color(s, "0xa29bfe", 1196, 32);
    img_parete_piano = PP.assets.image.load_color(s, "0x576574", 32, 310);
    img_cancello = PP.assets.image.load_color(s, "0xee5253", 32, 260);

    // Elementi interattivi
    img_scala = PP.assets.image.load_color(s, "0xcd84f1", 60, 340);
    img_neve = PP.assets.image.load_color(s, "0x81ecec", 520, 32);
    img_lampione = PP.assets.image.load_color(s, "0x95afc0", 24, 240);
    img_nuvola = PP.assets.image.load_color(s, "0xdfe6e9", 240, 36);
    img_oggetto = PP.assets.image.load_color(s, "0xf1c40f", 36, 36);
    img_spuntoni = PP.assets.image.load_color(s, "0xff4757", 750, 40);
    img_spuntoni_piccoli = PP.assets.image.load_color(s, "0xff4757", 260, 32); // Spuntoni sul 1° pilastro
}

function create(s) {
    s.cameras.main.setBackgroundColor('#1e272e');

    lista_piattaforme = [];
    lista_scale = [];
    lista_neve = [];
    lista_lampioni = [];
    lista_nuvole = [];
    lista_oggetti = [];
    lista_pericoli = [];

    spawn_x = 180;
    spawn_y = 1270;
    is_slowed = false;
    is_climbing = false;
    effetto_colore_bloccato = false;

    if (PP.game_state.get_variable("diary_entries") == undefined) {
        PP.game_state.set_variable("diary_entries", []);
    }

    s.notification_text = PP.shapes.text_styled_add(
        s, 640, 110, "", 22, "Arial", "bold", "0xffffff", "0x2f3640", 0.5, 0.5
    );
    s.notification_text.visibility.hidden = true;
    s.notification_text.ph_obj.setScrollFactor(0);

    // Confini mondo (11400x1700) e telecamera
    PP.physics.set_world_bounds(s, 0, 0, 11400, 1900);
    PP.camera.set_bounds(s, 0, 0, 11400, 1700);

    // =========================================================================
    // 1. INIZIO: CASA CON SCALE INVERTITE (Terra -> Destra -> 1° Piano -> Sinistra -> Tetto)
    // =========================================================================
    // Pavimento piano terra (superficie calpestabile a Y = 1360)
    crea_piattaforma(s, img_terreno_iniziale, 1000, 1440);

    // Muro sinistro del 1° piano (Y: 740 -> 1050): lascia aperto l'ingresso al piano terra sotto
    crea_piattaforma(s, img_parete_piano, 480, 895);

    // Solaio 1° piano (superficie Y = 1050, va da X = 496 a X = 1692):
    // Ora il varco per la prima scala è a DESTRA (X: 1692..1812)!
    crea_piattaforma(s, img_solaio_primo_piano, 1094, 1066);

    // Tetto della casa (superficie Y = 740, va da X = 616 a X = 1812):
    // Ora il varco per salire sul tetto dalla seconda scala è a SINISTRA (X: 496..616)!
    crea_piattaforma(s, img_tetto_casa, 1214, 756);

    // Muro destro chiuso su entrambi i piani (da Y = 740 a Y = 1360)
    crea_piattaforma(s, img_parete_piano, 1828, 895);
    crea_piattaforma(s, img_parete_piano, 1828, 1205);

    // Scala 1 (a DESTRA: porta dal piano terra Y=1360 al 1° piano Y=1050)
    crea_scala(s, 1752, 1190);

    // Scala 2 (a SINISTRA: porta dal 1° piano Y=1050 fino sopra al tetto Y=740)
    crea_scala(s, 556, 880);

    // Oggetto 1: Unguento (sul 1° piano)
    crea_oggetto(s, 1150, 1015, "Unguento", "#d63031");

    // =========================================================================
    // 2. PARTE 2: PILASTRI PIÙ DISTANZIATI + SPUNTONI SUL 1° PILASTRO + NEVE
    // =========================================================================
    // Pilastro 1 (superficie Y = 920) con spuntoni sopra
    crea_piattaforma(s, img_terreno_pilastro, 2180, 1130);
    crea_spuntoni_custom(s, img_spuntoni_piccoli, 2180, 904);

    // Pilastro 2 (più lontano, superficie Y = 960)
    crea_piattaforma(s, img_terreno_pilastro, 2720, 1170);

    // Piattaforma intermedia in discesa
    crea_piattaforma(s, img_piattaforma_piccola, 3160, 1140);

    // Pianoro con Neve e Lampione 1 (superficie Y = 1360, termina a X = 4420)
    crea_piattaforma(s, img_terreno_medio, 3870, 1440);
    crea_neve(s, 3740, 1344);
    crea_lampione(s, 4180, 1240, 4180, 1270);

    // =========================================================================
    // 3. PARTE 3: DOPPIO SALTO CON PLANATA (Trappola denti raggiungibile solo planando)
    // =========================================================================
    // Gap 1: 420px tra fine pianoro (X=4420) e bordo sinistro piattaforma (X=4840) -> richiede planata!
    crea_piattaforma(s, img_piattaforma_piccola, 4930, 1356);
    crea_oggetto(s, 4930, 1305, "Trappola denti", "#0984e3");

    // Gap 2: altri 420px tra bordo destro piattaforma (X=5020) e inizio pianoro casetta (X=5440) -> seconda planata!
    crea_piattaforma(s, img_terreno_lungo, 6290, 1440);

    // =========================================================================
    // 4. PARTE 4: CASETTA + SPUNTONI + CANCELLO + PARKOUR CHIAVE (allineata a +590px)
    // =========================================================================
    crea_oggetto(s, 6690, 1320, "Insetto", "#6ab04c");
    crea_lampione(s, 6930, 1240, 6930, 1270);

    crea_spuntoni(s, 7590, 1520);

    crea_piattaforma(s, img_piattaforma_media, 7410, 1210);
    crea_piattaforma(s, img_piattaforma_piccola, 7840, 1080);

    // Pianoro superiore con Cancello e Lampione 3 (superficie Y = 1040)
    crea_piattaforma(s, img_pianoro_cancello, 8690, 1058);

    crea_piattaforma(s, img_parete_piano, 9240, 1213);
    crea_piattaforma(s, img_parete_piano, 9240, 1523);

    cancello = PP.assets.image.add(s, img_cancello, 8440, 910, 0.5, 0.5);
    PP.physics.add(s, cancello, PP.physics.type.STATIC);
    cancello.aperto = false;

    crea_lampione(s, 8770, 920, 8770, 950);

    crea_piattaforma(s, img_piattaforma_piccola, 8310, 1330);
    crea_piattaforma(s, img_piattaforma_media, 8740, 1490);
    crea_piattaforma(s, img_piattaforma_piccola, 9134, 1350);

    crea_oggetto(s, 9134, 1300, "Chiave", "#be2edd");

    // =========================================================================
    // 5. FINALE: NUVOLE RAGGIUNGIBILI AL LIMITE DEL SALTO + VETTA
    // =========================================================================
    // Salto massimo = 187px -> ogni gradino è alto 170px (raggiungibile calcolando bene il salto!)
    // Pianoro superficie Y=1040 -> Nuvola 1 superficie Y=870 (centro 888)
    crea_nuvola(s, 9540, 888);
    // Nuvola 1 sup Y=870 -> Nuvola 2 superficie Y=700 (centro 718)
    crea_nuvola(s, 9940, 718);

    // Nuvola 2 sup Y=700 -> Vetta finale superficie Y=530 (centro 548)
    crea_piattaforma(s, img_piattaforma_media, 10420, 548);
    crea_oggetto(s, 10420, 495, "Oggetto Finale", "#f0932b");

    // =========================================================================
    // GIOCATORE E COLLISIONI
    // =========================================================================
    player = PP.assets.image.add(s, img_player, spawn_x, spawn_y, 0.5, 0.5);
    PP.physics.add(s, player, PP.physics.type.DYNAMIC);
    PP.physics.set_collide_world_bounds(player, true);
    PP.physics.set_bounce_y(player, 0.1);

    PP.camera.start_follow(s, player, 0, 60);
    PP.camera.set_deadzone(s, 180, 100);

    for (let i = 0; i < lista_piattaforme.length; i++) {
        PP.physics.add_collider(s, player, lista_piattaforme[i]);
    }

    PP.physics.add_collider(s, player, cancello);

    for (let i = 0; i < lista_nuvole.length; i++) {
        PP.physics.add_collider_f(s, player, lista_nuvole[i], tocca_nuvola);
    }

    for (let i = 0; i < lista_lampioni.length; i++) {
        PP.physics.add_overlap_f(s, player, lista_lampioni[i], attiva_checkpoint);
    }

    for (let i = 0; i < lista_oggetti.length; i++) {
        PP.physics.add_overlap_f(s, player, lista_oggetti[i], raccogli_oggetto);
    }

    for (let i = 0; i < lista_pericoli.length; i++) {
        PP.physics.add_overlap_f(s, player, lista_pericoli[i], function(sc) {
            respawn_player(sc);
        });
    }

    // --- HUD DIARIO ---
    diary_icon = PP.assets.image.add(s, img_diary_icon, 50, 50, 0.5, 0.5);
    diary_icon.ph_obj.setScrollFactor(0);

    diary_key_text = PP.shapes.text_styled_add(
        s, 70, 70, " A ", 16, "Arial", "bold", "0xffffff", "0x2f3640", 0.5, 0.5
    );
    diary_key_text.ph_obj.setScrollFactor(0);
}

function update(s) {
    if (PP.interactive.kb.is_key_just_down(s, PP.key_codes.A)) {
        PP.scenes.start_overlay("DiaryScene");
    }

    if (player.geometry.y > 1750) {
        respawn_player(s);
    }

    // --- 1. SCALE A PIOLI ---
    let vicino_scala = false;
    for (let i = 0; i < lista_scale.length; i++) {
        let scala = lista_scale[i];
        if (Math.abs(player.geometry.x - scala.geometry.x) < 42 &&
            Math.abs(player.geometry.y - scala.geometry.y) < 260) {
            vicino_scala = true;
            break;
        }
    }

    if (vicino_scala && (PP.interactive.kb.is_key_down(s, PP.key_codes.UP) || PP.interactive.kb.is_key_down(s, PP.key_codes.DOWN))) {
        is_climbing = true;
    } else if (!vicino_scala) {
        is_climbing = false;
    }

    // --- 2. NEVE ---
    let tocca_neve = false;
    for (let i = 0; i < lista_neve.length; i++) {
        let n = lista_neve[i];
        if (player.geometry.x + 32 > n.geometry.x - 260 &&
            player.geometry.x - 32 < n.geometry.x + 260 &&
            player.geometry.y + 90 > n.geometry.y - 16 &&
            player.geometry.y - 90 < n.geometry.y + 16) {
            tocca_neve = true;
            break;
        }
    }

    if (tocca_neve) {
        is_slowed = true;
    }
    if (PP.physics.is_on_ground(player) && !tocca_neve) {
        is_slowed = false;
    }

    // --- 3. MOVIMENTO ORIZZONTALE ---
    let currentSpeed = is_slowed ? 95 : 280;
    let jumpPower = is_slowed ? -360 : -580;

    if (PP.interactive.kb.is_key_down(s, PP.key_codes.LEFT)) {
        PP.physics.set_velocity_x(player, -currentSpeed);
    } else if (PP.interactive.kb.is_key_down(s, PP.key_codes.RIGHT)) {
        PP.physics.set_velocity_x(player, currentSpeed);
    } else {
        PP.physics.set_velocity_x(player, 0);
    }

    // --- 4. MOVIMENTO VERTICALE ---
    if (is_climbing) {
        PP.physics.set_allow_gravity(player, false);
        if (PP.interactive.kb.is_key_down(s, PP.key_codes.UP)) {
            PP.physics.set_velocity_y(player, -230);
        } else if (PP.interactive.kb.is_key_down(s, PP.key_codes.DOWN)) {
            PP.physics.set_velocity_y(player, 230);
        } else {
            PP.physics.set_velocity_y(player, 0);
        }
    } else {
        PP.physics.set_allow_gravity(player, true);

        if (PP.interactive.kb.is_key_down(s, PP.key_codes.UP) && PP.physics.is_on_ground(player)) {
            PP.physics.set_velocity_y(player, jumpPower);
        }

        let currentVelY = PP.physics.get_velocity_y(player);
        if (currentVelY > 0 && PP.interactive.kb.is_key_down(s, PP.key_codes.UP)) {
            if (currentVelY > 120) {
                PP.physics.set_velocity_y(player, 120);
            }
        }
    }

    // --- 5. PROSSIMITÀ OGGETTI ---
    const triggerRadius = 110;
    if (!effetto_colore_bloccato) {
        let colore_trovato = null;
        for (let i = 0; i < lista_oggetti.length; i++) {
            let obj = lista_oggetti[i];
            if (!obj.is_collected) {
                let dist = Phaser.Math.Distance.Between(player.geometry.x, player.geometry.y, obj.geometry.x, obj.geometry.y);
                if (dist < triggerRadius) {
                    colore_trovato = obj.colore_sfondo;
                    break;
                }
            }
        }
        s.cameras.main.setBackgroundColor(colore_trovato ? colore_trovato : '#1e272e');
    }
}

function destroy(s) {}

// =========================================================================
// FUNZIONI DI CREAZIONE ELEMENTI
// =========================================================================
function crea_piattaforma(s, img, x, y) {
    let p = PP.assets.image.add(s, img, x, y, 0.5, 0.5);
    PP.physics.add(s, p, PP.physics.type.STATIC);
    lista_piattaforme.push(p);
    return p;
}

function crea_scala(s, x, y) {
    let sc = PP.assets.image.add(s, img_scala, x, y, 0.5, 0.5);
    lista_scale.push(sc);
    return sc;
}

function crea_neve(s, x, y) {
    let n = PP.assets.image.add(s, img_neve, x, y, 0.5, 0.5);
    lista_neve.push(n);
    return n;
}

function crea_spuntoni(s, x, y) {
    let sp = PP.assets.image.add(s, img_spuntoni, x, y, 0.5, 0.5);
    PP.physics.add(s, sp, PP.physics.type.STATIC);
    lista_pericoli.push(sp);
    return sp;
}

function crea_lampione(s, x, y, resp_x, resp_y) {
    let l = PP.assets.image.add(s, img_lampione, x, y, 0.5, 0.5);
    PP.physics.add(s, l, PP.physics.type.STATIC);
    l.respawn_x = resp_x;
    l.respawn_y = resp_y;
    l.attivato = false;
    lista_lampioni.push(l);
    return l;
}

function crea_nuvola(s, x, y) {
    let nuv = PP.assets.image.add(s, img_nuvola, x, y, 0.5, 0.5);
    PP.physics.add(s, nuv, PP.physics.type.STATIC);
    nuv.sta_scomparendo = false;
    lista_nuvole.push(nuv);
    return nuv;
}

function crea_oggetto(s, x, y, nome_diario, colore_sfondo) {
    let aura = PP.shapes.rectangle_add(s, x, y, 56, 56, "0xf1c40f", 0.45);
    s.tweens.add({ targets: aura.ph_obj, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });

    let obj = PP.assets.image.add(s, img_oggetto, x, y, 0.5, 0.5);
    PP.physics.add(s, obj, PP.physics.type.STATIC);
    obj.is_collected = false;
    obj.aura = aura;
    obj.nome_diario = nome_diario;
    obj.colore_sfondo = colore_sfondo;
    lista_oggetti.push(obj);
    return obj;
}

// =========================================================================
// EVENTI DI GIOCO
// =========================================================================
function attiva_checkpoint(scene, p, lampione) {
    if (lampione.attivato) return;
    lampione.attivato = true;
    spawn_x = lampione.respawn_x;
    spawn_y = lampione.respawn_y;

    lampione.ph_obj.setTint(0x2ecc71);
}

function tocca_nuvola(scene, p, nuvola) {
    if (nuvola.sta_scomparendo || !PP.physics.is_on_ground(p)) return;
    nuvola.sta_scomparendo = true;

    scene.tweens.add({
        targets: nuvola.ph_obj,
        alpha: 0.25,
        duration: 150,
        yoyo: true,
        repeat: 4
    });

    PP.timers.add_timer(scene, 1200, function(sc) {
        nuvola.visibility.hidden = true;
        nuvola.ph_obj.body.enable = false;

        PP.timers.add_timer(sc, 3000, function() {
            nuvola.visibility.hidden = false;
            nuvola.visibility.alpha = 1;
            nuvola.ph_obj.body.enable = true;
            nuvola.sta_scomparendo = false;
        }, false);
    }, false);
}

function raccogli_oggetto(scene, p, obj) {
    if (obj.is_collected) return;
    obj.is_collected = true;

    PP.shapes.destroy(obj.aura);
    PP.assets.destroy(obj);

    let entries = PP.game_state.get_variable("diary_entries") || [];
    PP.game_state.set_variable("diary_entries", [...entries, obj.nome_diario]);

    if (obj.nome_diario === "Chiave" && !cancello.aperto) {
        cancello.aperto = true;
        cancello.visibility.hidden = true;
        cancello.ph_obj.body.enable = false;
        mostra_notifica(scene, "Hai trovato la chiave! Il cancello si è aperto.");
    } else {
        mostra_notifica(scene, "Forse dovrei scrivere qualcosa sul mio diario...");
    }

    applica_colore_temporaneo(scene, obj.colore_sfondo, 2500);
}

function respawn_player(scene) {
    player.ph_obj.body.reset(spawn_x, spawn_y);
    is_slowed = false;
    is_climbing = false;
    PP.physics.set_allow_gravity(player, true);
}

function mostra_notifica(scene, messaggio) {
    PP.shapes.text_change(scene.notification_text, messaggio);
    scene.notification_text.visibility.hidden = false;

    PP.timers.add_timer(scene, 3000, function(sc) {
        sc.notification_text.visibility.hidden = true;
    }, false);
}

function applica_colore_temporaneo(scene, colore, durata) {
    effetto_colore_bloccato = true;
    scene.cameras.main.setBackgroundColor(colore);

    token_effetto_colore++;
    let mio_token = token_effetto_colore;

    PP.timers.add_timer(scene, durata, function(sc) {
        if (mio_token === token_effetto_colore) {
            effetto_colore_bloccato = false;
            sc.cameras.main.setBackgroundColor('#1e272e');
        }
    }, false);
}

function crea_spuntoni_custom(s, img, x, y) {
    let sp = PP.assets.image.add(s, img, x, y, 0.5, 0.5);
    PP.physics.add(s, sp, PP.physics.type.STATIC);
    lista_pericoli.push(sp);
    return sp;
}

PP.scenes.add("GameScene", preload, create, update, destroy);