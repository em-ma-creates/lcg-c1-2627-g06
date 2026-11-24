// main.js
const config = {
    canvas_width: 1280,
    canvas_height: 720,
    canvas_id: "game_div",
    background_color: 0x1e272e, 
    debug_mode: true,           
    gravity_value: 900,         
    pixel_art: false
};

PP.game.create(config);

document.body.style.margin = "0";
document.body.style.backgroundColor = "#242373";
document.body.style.display = "flex";
document.body.style.justifyContent = "center";
document.body.style.alignItems = "center";
document.body.style.minHeight = "100vh";