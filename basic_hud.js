var first = true;

UI.AddSubTab(["Config", "SUBTAB_MGR"], "hud")
UI.AddCheckbox(["Config", "hud", "hud"], "Remove scope")
UI.AddCheckbox(["Config", "hud", "hud"], "intersect middle")
UI.AddSliderInt(["Config", "hud", "hud"], "no-scope thickness", 0 ,5)
UI.AddSliderInt(["Config", "hud", "hud"], "no-scope length", 0 , 940)
UI.AddSliderInt(["Config", "hud", "hud"], "no-scope height", 0 , 520)
UI.AddColorPicker(["Config", "hud", "hud"], "no-scope color 1")
UI.AddColorPicker(["Config", "hud", "hud"], "no-scope color 2")


/* thanks again April */
const weapon_info = {
    // Pistols
    "glock 18": {clip: 20, icon: "d"},
    "p2000": {clip: 13, icon: "o"},
    "dual berettas": {clip: 30, icon: "b"},
    "p250": {clip: 13, icon: "y"},
    "five seven": {clip: 20, icon: "c"},
    "cz75 auto": {clip: 12, icon: "Q"},
    "usp s": {clip: 12, icon: "P"},
    "desert eagle": {clip: 7, icon: "a"},
    "r8 revolver": {clip: 8, icon: "R"},
    "tec 9": {clip: 18, icon: "w"},

    // Heavys
    "nova": {clip: 8, icon: "B"},
    "xm1014": {clip: 7, icon: "r"},
    "mag 7": {clip: 5, icon: "t"},
    "sawed off": {clip: 7, icon: "v"},
    "negev": {clip: 150, icon: "u"},
    "m249": {clip: 100, icon: "i"},

    // SMGs
    "mp9": {clip: 30, icon: "A"},
    "mp7": {clip: 30, icon: "z"},
    "mp5 sd": {clip: 30, icon: "p"},
    "ump 45": {clip: 25, icon: "q"},
    "p90": {clip: 50, icon: "C"},
    "pp bizon": {clip: 64, icon: "s"},
    "mac 10": {clip: 30, icon: "n"},

    // Rifles
    "ak 47": {clip: 30, icon: "e"},
    "m4a4": {clip: 30, icon: "l"},
    "m4a1 s": {clip: 25, icon: "m"},
    "famas": {clip: 25, icon: "h"},
    "galil ar": {clip: 35, icon: "k"},
    "aug": {clip: 30, icon: "f"},
    "ssg 08": {clip: 10, icon: "F"},
    "sg 553": {clip: 30, icon: "E"},
    "awp": {clip: 10, icon: "g"},
    "scar 20": {clip: 20, icon: "D"},
    "g3sg1": {clip: 20, icon: "j"},

    // Equipment
    "high explosive grenade": {clip: -1, icon: "I"},
    "smoke grenade": {clip: -1, icon: "J"},
    "flashbang": {clip: -1, icon: "H"},
    "decoy grenade": {clip: -1, icon: "L"},
    "molotov": {clip: -1, icon: "K"},
    "incendiary grenade": {clip: -1, icon: "M"},
    "zeus x27": {clip: 1, icon: "x"},
    "c4 explosive": {clip: -1, icon: "N"},

    // Knives
    "m9 bayonet": {clip: -1, icon: "Z"},
    "bayonet": {clip: -1, icon: "V"},
    "flip knife": {clip: -1, icon: "W"},
    "gut knife": {clip: -1, icon: "X"},
    "karambit": {clip: -1, icon: "Y"},
    "butterfly knife": {clip: -1, icon: "3"},
    "falchion knife": {clip: -1, icon: "1"},
    "navaja knife": {clip: -1, icon: "6"},
    "shadow daggers": {clip: -1, icon: "4"},
    "stiletto knife": {clip: -1, icon: "7"},
    "bowie knife": {clip: -1, icon: "2"},
    "huntsman knife": {clip: -1, icon: "0"},
    "talon knife": {clip: -1, icon: "8"},
    "ursus knife": {clip: -1, icon: "5"},
    "classic knife": {clip: -1, icon: "G"},
    "paracord knife": {clip: -1, icon: "G"},
    "survival knife": {clip: -1, icon: "G"},
    "nomad knife": {clip: -1, icon: "G"},
    "skeleton knife": {clip: -1, icon: "G"},
    "knife": {clip: -1, icon: "G"}
};

function on_draw()
{
        
    if (first) {
        first = false;

        /* using SetFloat cause SetInt doesn't appear to work */
        Convar.SetFloat("cl_drawhud", 0) 
    }

    main_font = Render.AddFont("Verdana",30 ,400 )
    screen_size = Render.GetScreenSize();

    me = Entity.GetLocalPlayer()
    health = Entity.GetProp(me,"CBasePlayer", "m_iHealth")
    health_bar = Math.min(health,100)
    health_color =  [255 - 255 * health_bar / 100, 255 * health_bar / 100, 0, 125]

    armor = Entity.GetProp(me, "CCSPlayerResource", "m_iArmor")
    armor_bar = Math.min(armor,100)

    scoped = Entity.GetProp(me,"CCSPlayer","m_bIsScoped")

    weapon = Entity.GetWeapon(me)
    weapon_name = Entity.GetName(weapon)
    ammo = Entity.GetProp(weapon,"CBaseCombatWeapon" ,"m_iClip1") /* awoo? */
    ammo_reserve = Entity.GetProp(weapon, "CBaseCombatWeapon", "m_iPrimaryReserveAmmoCount")

    if (Entity.IsValid(me) && Entity.IsAlive(me))
    {
        if (UI.GetValue(["Config", "hud", "hud", "Remove scope"]))
        {
            Render.no_scope()
        }else
        Render.scope_overlay()

        Render.player_health()
        Render.player_armor()
        Render.weapon_ammo_hud()
        Render.death_notices()
    }
}

function on_death()
{
    victimID = Event.GetInt("userid")
    attackerID = Event.GetInt("attacker")
    weapon = Event.GetString("weapon")

    attacker = Entity.GetEntityFromUserID(attackerID)
    victim = Entity.GetEntityFromUserID(victimID)

    victim_name = Entity.GetName(victim)
    attacker_name = Entity.GetName(attacker)

    /* Cheat.Print(attacker_name + " killed " + victim_name + " with " + weapon + "\n") */
    info.push({
        victim : victim_name,
        attacker : attacker_name,
        weapon : weapon,
        time : Globals.Curtime()
    })  
    if (info.length > 12)
    {
        info.shift()
    }

}


Render.no_scope = function()
{
    if (scoped == true && UI.GetValue(["Config", "hud", "hud", "intersect middle"]))
    {
         Render.GradientRect(screen_size[0] / 2 - (UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]) / 2) + 1, screen_size[1] / 2  - 30, UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]),UI.GetValue(["Config", "hud", "hud", "no-scope height"]) + 50 ,0 , UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]))
         Render.GradientRect(screen_size[0] / 2 - (UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]) / 2) + 1, screen_size[1] / 2 - UI.GetValue(["Config", "hud", "hud", "no-scope height"]) - 20 ,UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]),UI.GetValue(["Config", "hud", "hud", "no-scope height"]) + 20,0,UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]))
         Render.GradientRect(screen_size[0] / 2 - UI.GetValue(["Config", "hud", "hud", "no-scope length"]) - 20, screen_size[1] / 2  ,  UI.GetValue(["Config", "hud", "hud", "no-scope length"]) + 20,UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]) ,1 , UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]))
         Render.GradientRect(screen_size[0] / 2  , screen_size[1] / 2  , UI.GetValue(["Config", "hud", "hud", "no-scope length"]) + 20 ,UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]),1, UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]), UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]))
    }
   
    if (scoped == true && !UI.GetValue(["Config", "hud", "hud", "intersect middle"]))
    {
         Render.GradientRect(screen_size[0] / 2, screen_size[1] / 2   + 30 , UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]),UI.GetValue(["Config", "hud", "hud", "no-scope height"])  ,0 , UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]))
         Render.GradientRect(screen_size[0] / 2 , screen_size[1] / 2 - UI.GetValue(["Config", "hud", "hud", "no-scope height"]) - 20 ,UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]),UI.GetValue(["Config", "hud", "hud", "no-scope height"]),0,UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]))
         Render.GradientRect(screen_size[0] / 2 - UI.GetValue(["Config", "hud", "hud", "no-scope length"]) - 30 , screen_size[1] / 2  ,  UI.GetValue(["Config", "hud", "hud", "no-scope length"]) ,UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]) ,1 , UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]))
         Render.GradientRect(screen_size[0] / 2 + 30 , screen_size[1] / 2  , UI.GetValue(["Config", "hud", "hud", "no-scope length"])  ,UI.GetValue(["Config", "hud", "hud", "no-scope thickness"]),1 ,UI.GetColor(["Config", "hud", "hud", "no-scope color 1"]),UI.GetColor(["Config", "hud", "hud", "no-scope color 2"]))
    }
}

Render.scope_overlay = function()
{
    scoped_overlay = Render.AddTexture("ot/scripts/scope_overlay.png")
    if (scoped == true)
    {
        Render.TexturedRect(0, 0 , screen_size[0], screen_size[1], scoped_overlay) 
    }
}

Render.player_health = function()
{

    /* health text */
    Render.String(screen_size[0] - screen_size[0] + 10 , screen_size[1] - 70 , 0 ,  health + "", health_color, main_font) // 
    Render.String(screen_size[0] - screen_size[0] + 80 , screen_size[1] - 70 , 0 ,  "Health", [235, 235, 235,175 ], main_font)
    /* width adjusted by health */
    Render.FilledRect(screen_size[0] - screen_size[0] + 10, screen_size[1] - 30 ,220 * health_bar / 100 , 16 ,health_color)
 
}

Render.player_armor = function()
{
    /* armor text */
    Render.String(screen_size[0] - screen_size[0] + 250 , screen_size[1] - 70 , 0 ,  armor + "", [18, 15, 171, 175], main_font) // 
    Render.String(screen_size[0] - screen_size[0] + 320 , screen_size[1] - 70 , 0 ,  "Armor", [235, 235, 235,175 ], main_font)
    /* width adjusted by armor */
    Render.FilledRect(screen_size[0] - screen_size[0] + 250, screen_size[1] - 30 ,220 * armor_bar / 100 , 16 ,[18, 15, 171,175])
}

Render.weapon_ammo_hud = function()
{
    weap = weapon_name
        /* ammo text */
    if (!weap.includes("grenade") && weap != "flashbang" &&  weap != "molotov")
    {
        Render.String(screen_size[0] - 250 , screen_size[1] - 70 , 0 ,  ammo + "/", [57, 237, 235,175], main_font) 
        Render.String(screen_size[0] - 200 , screen_size[1] - 70 , 0 ,  ammo_reserve + "",[57, 237, 235,175], main_font)
        Render.String(screen_size[0] - 150 , screen_size[1] - 70 , 0 , weap + "",[235, 235, 235,175 ], main_font)
        /* width adjusted by ammo */
        Render.FilledRect(screen_size[0] - 250, screen_size[1] - 30 ,200 * ammo / weapon_info[weapon_name].clip , 16 ,[57, 237, 235,175])
    }

    if (weap.includes("grenade") || weap == "flashbang" ||  weap == "molotov")
    {
        weap = (weap.replace("grenade", " "))
        Render.String(screen_size[0] - 250 , screen_size[1] - 70 , 0 , weap + "",[235, 235, 235,175 ], main_font)
        /* width adjusted by ammo */
        Render.FilledRect(screen_size[0] - 250, screen_size[1] - 30 ,220 * ammo / weapon_info[weapon_name].clip , 16 ,[57, 237, 235,175])
    }

}

info = []
Render.death_notices = function()
{ 
    death_font = Render.AddFont("Verdana",10 ,800)
    var time = Globals.Curtime()
    for (var i = 0; i < info.length; i++)
    {
        uwu_offset = i * 25;
        text = info[i].attacker + " " + info[i].weapon + " " + info[i].victim
        size = Render.TextSize(text,death_font)
        elapsed_time = time - info[i].time
        fraction = 1;
        if (elapsed_time > 25)
        {
            fraction = 1 - (elapsed_time - 25) / 5
        }
        Render.FilledRect(screen_size[0] - size[0] - 15, 50 + uwu_offset, size[0] + 10, 20 ,[235, 235, 235, fraction * 175])
        Render.FilledRect(screen_size[0] - size[0] - 15,  50 + uwu_offset, size[0] + 10, 20 ,[15, 15, 15, fraction * 175])
        Render.Rect(screen_size[0]  - size[0] - 15, 50 + uwu_offset, size[0] + 10, 20 ,[255, 255, 255, fraction * 255])
        Render.String(screen_size[0] - size[0] - 12, 52 + uwu_offset, 0, text, [235, 235, 235, fraction * 175 ], death_font)

        if (elapsed_time >= 30)
        {
            info.splice(i, 1)
        }
    } 


}



function on_unload()
{   
    Convar.SetFloat("cl_drawhud", 1) /* this just re-enables your default hud when you unload the script */
}

Cheat.RegisterCallback("Unload","on_unload")
Cheat.RegisterCallback("Draw","on_draw")
Cheat.RegisterCallback("player_death", "on_death")