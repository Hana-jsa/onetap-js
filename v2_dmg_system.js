function fix_ui_behaviour( ) {
    for(var i in UI) {
        if(!~i.indexOf("Add"))
            continue;

        (function(cur) {
            UI[i] = function() {
                cur.apply(this, Array.prototype.slice.call(arguments));
                return arguments[0].concat(arguments[1]);
            }
        }(UI[i]));
    }
}
fix_ui_behaviour(  );


var wep2tab = {"usp s" : "USP","glock 18" : "Glock","dual berettas" : "Dualies","r8 revolver" : "Revolver","desert eagle" : "Deagle","p250" : "P250","tec 9" : "Tec-9",
"mp9": "MP9","mac 10": "Mac10","pp bizon": "PP-Bizon","ump 45" : "UMP45","ak 47" : "AK47","sg 553" : "SG553","aug" : "AUG","m4a1 s": "M4A1-S","m4a4": "M4A4","ssg 08": "SSG08",
"awp" : "AWP","g3sg1" : "G3SG1","scar 20" : "SCAR20","xm1014" : "XM1014","mag 7" : "MAG7","m249" : "M249","negev" : "Negev","p2000" : "General","famas" : "FAMAS","five seven" : "Five Seven","mp7" : "MP7",
"ump 45" : "UMP45","p90" : "P90","cz75 auto" : "CZ-75","mp5 sd" : "MP5","galil ar" : "GALIL","sawed off" : "Sawed off"};
var tab_names = ["General","USP","Glock","Five Seven","Tec-9","Deagle","Revolver","Dualies","P250","CZ-75","Mac10","P90","MP5","MP7","MP9","UMP45","PP-Bizon","M4A1-S","M4A4","AK47","AUG","SG553","FAMAS","GALIL","AWP","SSG08","SCAR20","G3SG1","M249","XM1014","MAG7","Negev","Sawed off"];
function setup_menu() {
    for (k in tab_names) {
        UI.AddSliderInt(["Rage", "Target", tab_names[k]], "Minimum damage override", 0,100);
        UI.AddSliderInt(["Rage", "Target", tab_names[k]], "Autowall damage", 0,100);
        UI.AddSliderInt(["Rage", "Target", tab_names[k]], "Visible damage", 0,100);
    }
}
setup_menu();
const override = UI.AddHotkey(["Rage", "General", "General", "Key assignment"], "Minimum damage override", "override");
const flag = UI.AddCheckbox( [ "Rage", "General", "General" ], "Draw dmg flags" )

function is_entity_visible( me, entity, extrapolate ) { // uwu aprils code cause april best

    /**
     * Extrapolates an vector by an entity's velocity.
     * @param Number entity 
     * @param Number[3] position 
     */
    const extrapolate = function( entity, position ) {
        // Get this entity's velocity.
        const velocity = Entity.GetProp( entity, "CBasePlayer", "m_vecVelocity[0]" );

        // Extrapolate the position by the velocity.
        // In this case, we're 'predicting' where this entity will be in one second.
        position[ 0 ] += velocity[ 0 ];
        position[ 1 ] += velocity[ 1 ];
        position[ 2 ] += velocity[ 2 ];

        // Return the extrapolated position.
        return position;
    };

    // Create an array to store hitbox positions. Doing this just for better performance.
    const hitbox_positions = [  ];

    // Create an array containing the hitboxes we want to loop through. In this case: head,
    // stomach, chest, feet and hands.
    const hitboxes = [ 0, 3, 5, 11, 12, 13, 14 ];

    // Get our local player's eye position.
    const origin = Entity.GetEyePosition( me );

    // Loop through every hitbox.
    for ( var i = 0; i < hitboxes.length; i++ ) {
        // Get our current hitbox.
        const hitbox = hitboxes[ i ];

        // Get this hitbox's position and store it in case we need to use it later.
        hitbox_positions[ hitbox ] = Entity.GetHitboxPosition( entity, hitbox );

        // Calculate the trace fraction from our local player's eye to this hitbox.
        const trace = Trace.Line( me, origin, hitbox_positions[ hitbox ] );

        // If the trace fraction is greater than 0.95, it's safe to assume that it is visible.
        // In this case, return true because entity is partially (or fully) visible.
        if ( !trace )
            continue;

        if ( trace[1] > 0.95 )  
            return true;            
    }

    // If none of the entity's hitboxes is visible then the entity isn't on our screen. However,
    // we still need to predict if it'll be visible in one second.

    // If we don't want to predict, then just return false because entity isn't visible.
    if ( !extrapolate )
        return false;

    // Create an array containing the hitboxes we want to loop through. In this case only head, stomach and chest,
    // because we don't need to be as accurate as before.
    const extrapolate_hitboxes = [ 0, 3, 5 ];

    // Loop through every new hitbox.
    for ( var i = 0; i < extrapolate_hitboxes.length; i++ ) {
        // Get our current hitbox.
        const hitbox = extrapolate_hitboxes[ i ];

        // Calculate the trace fraction from our local player's eye to the predicted hitbox position.
        const trace = Trace.Line( me, origin, extrapolate( entity, hitbox_positions[ hitbox ] ) );

        // If the trace fraction is greater than 0.95, it's safe to assume that it is visible.
        // In this case, return true because entity will be peeking.
        if ( !trace )
            continue;

        if ( trace[1] > 0.95 )
            return true;
    }

    // If none of the checks above went through, it means that this entity is not visible and won't be peeking
    // in the next second, so, return false.
    return false;
}

function pew_pew_dmg(  ) {
    const me = Entity.GetLocalPlayer(  )
    const enemies = Entity.GetEnemies(  )
    const tab = wep2tab[Entity.GetName( Entity.GetWeapon( me ) ) ];

    if (tab == undefined) 
    tab = "General";

    const awall_dmg = UI.GetValue( [ "Rage", "Target", tab, "Autowall damage" ] )
    const visible_dmg = UI.GetValue( [ "Rage", "Target", tab, "Visible damage" ] )
    const override_dmg = UI.GetValue( [ "Rage", "Target", tab, "Minimum damage override" ] )
    const draw_flags = UI.GetValue( flag )
    
    for ( i = 0; i < enemies.length; i++ ) {
        const vis = is_entity_visible( me, enemies[ i ], false )

        if ( UI.GetValue( override ) ) {
            Ragebot.ForceTargetMinimumDamage( enemies[ i ], override_dmg )
            if ( draw_flags )
            Entity.DrawFlag( enemies[ i ], override_dmg.toString(  ), [ 255, 0, 0, 255 ])
        } 
        else { 
            if ( vis ) {
                Ragebot.ForceTargetMinimumDamage( enemies[ i ], visible_dmg )
                if ( draw_flags )
                Entity.DrawFlag( enemies[ i ], visible_dmg.toString(  ), [ 0, 255, 0, 255 ])
            } 
            else {
                Ragebot.ForceTargetMinimumDamage( enemies[ i ], awall_dmg )
                if ( draw_flags )
                Entity.DrawFlag( enemies[ i ], awall_dmg.toString(  ), [ 0, 0, 255, 255 ])
            }
        }   
    }
}

Cheat.RegisterCallback( "CreateMove", "pew_pew_dmg" )
