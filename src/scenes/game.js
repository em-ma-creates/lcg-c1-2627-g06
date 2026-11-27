// --- ASSET ---
let ss_player, img_diary_icon, img_grotta;
let img_bg_3, img_bg_4, img_bg_3_evil, img_bg_4_evil, img_bg_5_evil;
let img_npc_normale, img_npc_visione;
let img_terreno_2, img_terreno_3, img_terreno_iniziale, img_terreno_lungo, img_terreno_medio, img_terreno_pilastro;
let img_piattaforma_media, img_piattaforma_piccola, img_piano_cancello;
let img_solaio_primo_piano, img_tetto_casa, img_parete_piano, img_cancello;
let img_scala, img_neve, img_lampione_off, img_lampione_on, img_nuvola, img_oggetto, img_spuntoni, img_spuntoni_piccoli;

// --- OGGETTI E LISTE DI SCENA ---
let player, cancello;
let diary_icon, diary_key_text;
let lista_bg_normale = [], lista_bg_evil = [];
let lista_npc = [], lista_piattaforme = [], lista_scale = [], lista_neve = [];
let lista_lampioni = [], lista_nuvole = [], lista_oggetti = [], lista_pericoli = [];

// --- STATI DI GIOCO ---
let spawn_x = 180, spawn_y = 1270;
let stato_animazione = "idle";
let is_slowed = false, is_climbing = false;
let visione_attuale = null, effetto_visione_bloccato = false, token_visione = 0;

function preload(s) {
    // Sfondo parallasse normale
    img_bg_3 = PP.assets.image.load(s, "assets/3.png");
    img_bg_4 = PP.assets.image.load(s, "assets/4.png");

    // Sfondo parallasse "evil" (visioni)
    img_bg_3_evil = PP.assets.image.load(s, "assets/3evil.png");
    img_bg_4_evil = PP.assets.image.load(s, "assets/4evil.png");
    img_bg_5_evil = PP.assets.image.load(s, "assets/5evil.png");

    // Grotta
    img_grotta = PP.assets.image.load(s, "assets/grotta.png");

    // Pattern terreno alternati (300x558)
    img_terreno_2 = PP.assets.image.load(s, "assets/terreno22.png");
    img_terreno_3 = PP.assets.image.load(s, "assets/terreno33.png");

    // NPC placeholder
    img_npc_normale = PP.assets.image.load_color(s, "0x3498db", 80, 160);
    img_npc_visione = PP.assets.image.load_color(s, "0xe84393", 80, 160);

    // Protagonista e HUD
    ss_player = PP.assets.sprite.load_spritesheet(s, "assets/spritesheet2.png", 180, 180);
    img_diary_icon = PP.assets.image.load_color(s, "0xf5f6fa", 40, 50);

    // Hitbox terreni (larghezze multipli esatti di 300px) e strutture
    img_terreno_iniziale = PP.assets.image.load_color(s, "0x6c5ce7", 2100, 160); // 7 tile da 300
    img_terreno_medio = PP.assets.image.load_color(s, "0x6c5ce7", 1200, 160);    // 4 tile da 300
    img_terreno_lungo = PP.assets.image.load_color(s, "0x6c5ce7", 1800, 160);    // 6 tile da 300
    img_terreno_pilastro = PP.assets.image.load_color(s, "0x6c5ce7", 340, 420);
    img_piattaforma_media = PP.assets.image.load_color(s, "0x6c5ce7", 340, 36);
    img_piattaforma_piccola = PP.assets.image.load_color(s, "0x6c5ce7", 180, 32);
    img_piano_cancello = PP.assets.image.load_color(s, "0x6c5ce7", 1000, 36);

    img_solaio_primo_piano = PP.assets.image.load_color(s, "0xa29bfe", 1196, 32);
    img_tetto_casa = PP.assets.image.load_color(s, "0xa29bfe", 1196, 32);
    img_parete_piano = PP.assets.image.load_color(s, "0x576574", 32, 310);
    img_cancello = PP.assets.image.load_color(s, "0xee5253", 32, 260);

    // Elementi interattivi
    img_scala = PP.assets.image.load_color(s, "0xcd84f1", 60, 340);
    img_neve = PP.assets.image.load(s, "assets/neve.png");
    img_lampione_off = PP.assets.image.load(s, "assets/lanternaoff.png");
    img_lampione_on = PP.assets.image.load(s, "assets/lanternaon.png");
    img_nuvola = PP.assets.image.load_color(s, "0xdfe6e9", 240, 36);
    img_oggetto = PP.assets.image.load_color(s, "0xf1c40f", 36, 36);
    img_spuntoni = PP.assets.image.load_color(s, "0xff4757", 750, 40);
    img_spuntoni_piccoli = PP.assets.image.load_color(s, "0xff4757", 160, 32);
}

function create(s) {
    // Reset liste e stati
    lista_bg_normale = []; lista_bg_evil = [];
    lista_npc = []; lista_piattaforme = []; lista_scale = []; lista_neve = [];
    lista_lampioni = []; lista_nuvole = []; lista_oggetti = []; lista_pericoli = [];
    spawn_x = 180; spawn_y = 1270;
    stato_animazione = "idle";
    is_slowed = false; is_climbing = false;
    visione_attuale = null; effetto_visione_bloccato = false;

    // Sfondo parallasse normale (visibile di default)
    s.cameras.main.setBackgroundColor('#c2c2c2');
    crea_fascia_parallasse(s, img_bg_4, 1345, 0.25, -4, lista_bg_normale, false); // Montagne
    crea_fascia_parallasse(s, img_bg_3, 1365, 0.45, -3, lista_bg_normale, false); // Alberi lontani

    // Sfondo parallasse "evil" (nascosto di default, si attiva nelle visioni)
    crea_fascia_parallasse(s, img_bg_5_evil, 1180, 0.10, -5, lista_bg_evil, true); // Cielo evil
    crea_fascia_parallasse(s, img_bg_4_evil, 1345, 0.25, -4, lista_bg_evil, true); // Montagne evil
    crea_fascia_parallasse(s, img_bg_3_evil, 1365, 0.45, -3, lista_bg_evil, true); // Alberi evil

    if (PP.game_state.get_variable("diary_entries") == undefined) {
        PP.game_state.set_variable("diary_entries", []);
    }

    s.notification_text = PP.shapes.text_styled_add(s, 640, 110, "", 22, "Arial", "bold", "0xffffff", "0x2f3640", 0.5, 0.5);
    s.notification_text.visibility.hidden = true;
    s.notification_text.ph_obj.setScrollFactor(0);
    s.notification_text.ph_obj.setDepth(100);

    PP.physics.set_world_bounds(s, 0, 0, 11400, 1900);
    PP.camera.set_bounds(s, 0, 0, 11400, 1700);

    const textures_terreno = [img_terreno_2, img_terreno_3];

    // 1. Casa iniziale (7 tile da 300px -> da X=0 a X=2100)
    crea_terreno_pattern(s, textures_terreno, img_terreno_iniziale, 1050, 7);
    crea_piattaforma(s, img_parete_piano, 480, 895);
    crea_piattaforma(s, img_solaio_primo_piano, 1094, 1066);
    crea_piattaforma(s, img_tetto_casa, 1214, 756);
    crea_piattaforma(s, img_parete_piano, 1828, 895);
    crea_piattaforma(s, img_parete_piano, 1828, 1205);

    crea_scala(s, 1752, 1190);
    crea_scala(s, 556, 880);

    crea_oggetto(s, 1150, 1015, "Unguento", 1000);
    crea_npc(s, 1350, 1050, img_npc_normale, img_npc_visione, "Unguento");

    // 2. Pilastri e neve (4 tile da 300px = 1200px)
    crea_piattaforma(s, img_terreno_pilastro, 2180, 1130);
    crea_piattaforma(s, img_terreno_pilastro, 2720, 1270);
    crea_spuntoni(s, img_spuntoni_piccoli, 2720, 1044);
    crea_piattaforma(s, img_piattaforma_piccola, 3160, 1200);

    crea_terreno_pattern(s, textures_terreno, img_terreno_medio, 3870, 4);
    crea_neve(s, 3740, 1360);
    crea_lampione(s, 4180, 1240, 4180, 1270);

    // 3. Ponte (6 tile da 300px = 1800px)
    crea_piattaforma(s, img_piattaforma_piccola, 4930, 1356);
    crea_oggetto(s, 4930, 1305, "Trappola denti", 1500);
    crea_terreno_pattern(s, textures_terreno, img_terreno_lungo, 6290, 6);

    // 4. Cancello e parkour chiave (con sfondo grotta 1070x603)
    crea_decorazione(s, img_grotta, 8725, 1076, 1);

    crea_oggetto(s, 6690, 1320, "Insetto", 2000);
    crea_lampione(s, 6930, 1240, 6930, 1270);
    crea_spuntoni(s, img_spuntoni, 7590, 1520);

    crea_piattaforma(s, img_piattaforma_media, 7410, 1250);
    crea_piattaforma(s, img_piattaforma_piccola, 7840, 1080);
    crea_piattaforma(s, img_piano_cancello, 8690, 1058);
    crea_piattaforma(s, img_parete_piano, 9240, 1213);
    crea_piattaforma(s, img_parete_piano, 9240, 1523);

    cancello = PP.assets.image.add(s, img_cancello, 8440, 910, 0.5, 0.5);
    cancello.ph_obj.setDepth(2);
    PP.physics.add(s, cancello, PP.physics.type.STATIC);
    cancello.aperto = false;

    crea_lampione(s, 8770, 920, 8770, 950);

    crea_piattaforma(s, img_piattaforma_piccola, 7840, 1400);
    crea_piattaforma(s, img_piattaforma_piccola, 8220, 1360);
    crea_piattaforma(s, img_piattaforma_media, 8740, 1490);
    crea_piattaforma(s, img_piattaforma_piccola, 9134, 1350);
    crea_oggetto(s, 9134, 1300, "Chiave", 2500);

    // 5. Nuvole e vetta
    crea_nuvola(s, 9540, 888);
    crea_nuvola(s, 9940, 718);
    crea_piattaforma(s, img_piattaforma_media, 10420, 548);
    crea_oggetto(s, 10420, 495, "Oggetto Finale", 3000);

    // Giocatore e telecamera (depth 5, terreno davanti a depth 10 così i piedi entrano nella terra)
    player = PP.assets.sprite.add(s, ss_player, spawn_x, spawn_y, 0.5, 0.5);
    player.ph_obj.setDepth(5);
    PP.physics.add(s, player, PP.physics.type.DYNAMIC);
    PP.physics.set_collision_rectangle(player, 64, 180, 58, 0);
    PP.physics.set_collide_world_bounds(player, true);
    PP.physics.set_bounce_y(player, 0.1);

    PP.assets.sprite.animation_add(player, "walk", 0, 11, 14, -1);
    PP.assets.sprite.animation_add(player, "idle", 0, 0, 1, 0);
    PP.assets.sprite.animation_play(player, "idle");

    PP.camera.start_follow(s, player, 0, 60);
    PP.camera.set_deadzone(s, 10, 10);
    s.cameras.main.setLerp(0.12, 0.12);
    s.cameras.main.roundPixels = true;

    // Collisioni
    for (let p of lista_piattaforme) PP.physics.add_collider(s, player, p);
    PP.physics.add_collider(s, player, cancello);
    for (let nuv of lista_nuvole) PP.physics.add_collider_f(s, player, nuv, tocca_nuvola);
    for (let lamp of lista_lampioni) PP.physics.add_overlap_f(s, player, lamp, attiva_checkpoint);
    for (let obj of lista_oggetti) PP.physics.add_overlap_f(s, player, obj, raccogli_oggetto);
    for (let sp of lista_pericoli) PP.physics.add_overlap_f(s, player, sp, respawn_player);

    // HUD Diario
    diary_icon = PP.assets.image.add(s, img_diary_icon, 50, 50, 0.5, 0.5);
    diary_icon.ph_obj.setScrollFactor(0);
    diary_icon.ph_obj.setDepth(100);
    diary_key_text = PP.shapes.text_styled_add(s, 70, 70, " A ", 16, "Arial", "bold", "0xffffff", "0x2f3640", 0.5, 0.5);
    diary_key_text.ph_obj.setScrollFactor(0);
    diary_key_text.ph_obj.setDepth(100);
}

function update(s) {
    if (PP.interactive.kb.is_key_just_down(s, PP.key_codes.A)) PP.scenes.start_overlay("DiaryScene");
    if (player.geometry.y > 1750) respawn_player(s);

    const px = player.geometry.x, py = player.geometry.y;
    const up = PP.interactive.kb.is_key_down(s, PP.key_codes.UP);
    const down = PP.interactive.kb.is_key_down(s, PP.key_codes.DOWN);
    const left = PP.interactive.kb.is_key_down(s, PP.key_codes.LEFT);
    const right = PP.interactive.kb.is_key_down(s, PP.key_codes.RIGHT);

    // 1. Scale
    let vicino_scala = lista_scale.some(sc => Math.abs(px - sc.geometry.x) < 42 && Math.abs(py - sc.geometry.y) < 260);
    if (vicino_scala && (up || down)) is_climbing = true;
    else if (!vicino_scala) is_climbing = false;

    // 2. Neve
    let tocca_neve = lista_neve.some(n =>
        px + 32 > n.geometry.x - 260 && px - 32 < n.geometry.x + 260 &&
        py + 90 > n.geometry.y - 16 && py - 90 < n.geometry.y + 16
    );
    if (tocca_neve) is_slowed = true;
    else if (PP.physics.is_on_ground(player)) is_slowed = false;

    // 3. Movimento orizzontale
    let speed = is_slowed ? 95 : 280;
    let jumpPower = is_slowed ? -360 : -580;

    if (left || right) {
        PP.physics.set_velocity_x(player, left ? -speed : speed);
        player.geometry.flip_x = left;
        if (stato_animazione !== "walk") {
            PP.assets.sprite.animation_play(player, "walk");
            stato_animazione = "walk";
        }
    } else {
        PP.physics.set_velocity_x(player, 0);
        if (stato_animazione !== "idle") {
            PP.assets.sprite.animation_play(player, "idle");
            stato_animazione = "idle";
        }
    }

    // 4. Movimento verticale (scale, salto e planata)
    if (is_climbing) {
        PP.physics.set_allow_gravity(player, false);
        PP.physics.set_velocity_y(player, up ? -230 : (down ? 230 : 0));
    } else {
        PP.physics.set_allow_gravity(player, true);
        if (up && PP.physics.is_on_ground(player)) PP.physics.set_velocity_y(player, jumpPower);
        if (up && PP.physics.get_velocity_y(player) > 120) PP.physics.set_velocity_y(player, 120);
    }

    // 5. Visione vicino agli oggetti
    if (!effetto_visione_bloccato) {
        let obj_vicino = lista_oggetti.find(obj => !obj.is_collected && Phaser.Math.Distance.Between(px, py, obj.geometry.x, obj.geometry.y) < 150);
        imposta_visione(s, obj_vicino ? obj_vicino.nome_diario : null);
    }
}

// --- FUNZIONI DI CREAZIONE ---
function crea_fascia_parallasse(s, img, y_base, scroll_x, depth, lista_destinazione, nascosto) {
    let larghezza_tile = 1152;
    let num_tiles = Math.ceil(11400 / larghezza_tile) + 2;

    for (let i = -1; i < num_tiles; i++) {
        let tile = PP.assets.image.add(s, img, i * larghezza_tile, y_base, 0, 1);
        tile.ph_obj.setScrollFactor(scroll_x, 1);
        tile.ph_obj.setDepth(depth);
        tile.visibility.hidden = nascosto;
        lista_destinazione.push(tile);
    }
}

function crea_decorazione(s, img, x, y, depth = 1) {
    let dec = PP.assets.image.add(s, img, x, y, 0.5, 0);
    dec.ph_obj.setDepth(depth);
    return dec;
}

function crea_terreno_pattern(s, lista_img, img_hitbox, x, num_tiles) {
    let p = PP.assets.image.add(s, img_hitbox, x, 1440, 0.5, 0.5);
    p.visibility.hidden = true;
    PP.physics.add(s, p, PP.physics.type.STATIC);
    lista_piattaforme.push(p);

    let larghezza_tile = 300;
    let start_x = x - (num_tiles * larghezza_tile) / 2 + larghezza_tile / 2;

    for (let i = 0; i < num_tiles; i++) {
        let img_scelta = lista_img[i % lista_img.length];
        let tile = PP.assets.image.add(s, img_scelta, start_x + i * larghezza_tile, 1353, 0.5, 0);
        tile.ph_obj.setDepth(10);
    }

    return p;
}

function crea_piattaforma(s, img, x, y) {
    let p = PP.assets.image.add(s, img, x, y, 0.5, 0.5);
    p.ph_obj.setDepth(2);
    PP.physics.add(s, p, PP.physics.type.STATIC);
    lista_piattaforme.push(p);
    return p;
}

function crea_scala(s, x, y) {
    let sc = PP.assets.image.add(s, img_scala, x, y, 0.5, 0.5);
    sc.ph_obj.setDepth(2);
    lista_scale.push(sc);
    return sc;
}

function crea_neve(s, x, y) {
    let n = PP.assets.image.add(s, img_neve, x, y, 0.5, 1);
    n.ph_obj.setDepth(11);
    lista_neve.push(n);
    return n;
}

function crea_spuntoni(s, img, x, y) {
    let sp = PP.assets.image.add(s, img, x, y, 0.5, 0.5);
    sp.ph_obj.setDepth(2);
    PP.physics.add(s, sp, PP.physics.type.STATIC);
    lista_pericoli.push(sp);
    return sp;
}

function crea_lampione(s, x, y, resp_x, resp_y) {
    let l = PP.assets.image.add(s, img_lampione_off, x, y, 0.5, 0.5);
    l.ph_obj.setDepth(2);
    PP.physics.add(s, l, PP.physics.type.STATIC);

    let l_on = PP.assets.image.add(s, img_lampione_on, x, y, 0.5, 0.5);
    l_on.ph_obj.setDepth(2);
    l_on.visibility.hidden = true;

    l.lampione_acceso = l_on;
    l.respawn_x = resp_x;
    l.respawn_y = resp_y;
    l.attivato = false;
    lista_lampioni.push(l);
    return l;
}

function crea_nuvola(s, x, y) {
    let nuv = PP.assets.image.add(s, img_nuvola, x, y, 0.5, 0.5);
    nuv.ph_obj.setDepth(2);
    PP.physics.add(s, nuv, PP.physics.type.STATIC);
    nuv.sta_scomparendo = false;
    lista_nuvole.push(nuv);
    return nuv;
}

function crea_oggetto(s, x, y, nome_diario, durata_visione = 1500) {
    let aura = PP.shapes.rectangle_add(s, x, y, 56, 56, "0xf1c40f", 0.45);
    aura.ph_obj.setDepth(2);
    s.tweens.add({ targets: aura.ph_obj, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });

    let obj = PP.assets.image.add(s, img_oggetto, x, y, 0.5, 0.5);
    obj.ph_obj.setDepth(3);
    PP.physics.add(s, obj, PP.physics.type.STATIC);
    obj.is_collected = false;
    obj.aura = aura;
    obj.nome_diario = nome_diario;
    obj.durata_visione = durata_visione;
    lista_oggetti.push(obj);
    return obj;
}

function crea_npc(s, x, y, img_normale, img_alterata, id_oggetto_collegato) {
    let npc_norm = PP.assets.image.add(s, img_normale, x, y, 0.5, 1);
    npc_norm.ph_obj.setDepth(4);
    let npc_alt = PP.assets.image.add(s, img_alterata, x, y, 0.5, 1);
    npc_alt.ph_obj.setDepth(4);
    npc_alt.visibility.hidden = true;

    let npc = { normale: npc_norm, alterato: npc_alt, oggetto_collegato: id_oggetto_collegato };
    lista_npc.push(npc);
    return npc;
}

// --- EVENTI DI GIOCO ---
function imposta_visione(scene, nome_oggetto) {
    if (visione_attuale === nome_oggetto) return;
    visione_attuale = nome_oggetto;

    let is_evil = (nome_oggetto !== null);

    // Scambia il parallasse normale con quello evil
    for (let tile of lista_bg_normale) tile.visibility.hidden = is_evil;
    for (let tile of lista_bg_evil) tile.visibility.hidden = !is_evil;

    // Aggiorna anche il colore di sfondo dietro al cielo (opzionale, per evitare stacchi in alto)
    scene.cameras.main.setBackgroundColor(is_evil ? '#2b1d2e' : '#c2c2c2');

    // Trasforma gli NPC collegati
    for (let npc of lista_npc) {
        let trasformato = is_evil && (npc.oggetto_collegato === nome_oggetto || npc.oggetto_collegato === "TUTTI");
        npc.normale.visibility.hidden = trasformato;
        npc.alterato.visibility.hidden = !trasformato;
    }
}

function attiva_checkpoint(scene, p, lampione) {
    if (lampione.attivato) return;
    lampione.attivato = true;
    spawn_x = lampione.respawn_x;
    spawn_y = lampione.respawn_y;
    lampione.visibility.hidden = true;
    lampione.lampione_acceso.visibility.hidden = false;
}

function tocca_nuvola(scene, p, nuvola) {
    if (nuvola.sta_scomparendo || !PP.physics.is_on_ground(p)) return;
    nuvola.sta_scomparendo = true;

    scene.tweens.add({ targets: nuvola.ph_obj, alpha: 0.25, duration: 150, yoyo: true, repeat: 4 });

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
        mostra_notifica(scene, "Hai trovato la chiave! Ora puoi aprire il cancello.");
    } else {
        mostra_notifica(scene, "Forse dovrei scrivere qualcosa sul mio diario...");
    }

    effetto_visione_bloccato = true;
    imposta_visione(scene, obj.nome_diario);
    let mio_token = ++token_visione;

    PP.timers.add_timer(scene, obj.durata_visione, function() {
        if (mio_token === token_visione) {
            effetto_visione_bloccato = false;
            imposta_visione(scene, null);
        }
    }, false);
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

function destroy(s) {}

PP.scenes.add("GameScene", preload, create, update, destroy);