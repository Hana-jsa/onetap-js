UI.AddCheckbox( [ "Rage", "General", "General" ], "Adaptive silent aim")

function on_cmove(  ) {

    if ( UI.GetValue( [ "Rage", "General", "General" , "Adaptive silent aim" ] ) )
    Ragebot.adaptive_aim(  )
}

target = -1;
function get_best_target(  ) {
    const me = Entity.GetLocalPlayer(  );
    const enemies = Entity.GetEnemies(  );
    const origin = Entity.GetEyePosition( me );

    var data = [  ];
    
    const compare = function( a, b ) {
        if ( a.health < b.health )
            return -2;
        if ( a.health > b.health )
            return 1;

        if ( a.damage > b.damage )
            return -2;
        if ( a.damage < b.damage )
            return 1;

        if ( a.distance + 10 < b.distance )
            return -1;
        if ( a.distance > b.distance + 10 )
            return 1;        
            
        if ( a.fov < b.fov )
            return -1;
        if ( a.fov > b.fov )
            return 1;

        return 0;
    }

    for ( var i = 0; i < enemies.length; i++ ) {
        const current = enemies[ i ]; 

        if ( !Entity.IsAlive( current ) || Entity.IsDormant( current ) )
            continue;

        const head_pos = Entity.GetHitboxPosition( current, 0 );
        const stomach_pos = Entity.GetHitboxPosition( current, 3 );
        const chest_pos = Entity.GetHitboxPosition( current, 5 );

        const health = Entity.GetProp( current, "CBasePlayer", "m_iHealth" );

        const dst = Distance3D( origin, head_pos );

        const sub = vec_substract( head_pos, origin );

        const yaw = Math.atan2(sub[1], sub[0]) * 180 / Math.PI;
        const pitch = -Math.atan2( sub[ 2 ], Math.sqrt( sub[ 0 ] ** 2 + sub[ 1 ] ** 2 ) ) * 180 / Math.PI;
        const viewangles = Local.GetViewAngles();
        const yaw_delta = ( ( viewangles[1] % 360 - yaw % 360 ) % 360);

        yaw_delta = Normalize( yaw_delta ); 

        const pitch_delta = viewangles[0] - pitch
        const fov = Math.sqrt(yaw_delta ** 2 + pitch_delta ** 2)
        
        const head_dmg = Trace.Bullet( me, current, origin, head_pos );
        const stomach_dmg = Trace.Bullet(me, current, origin, stomach_pos );
        const chest_dmg = Trace.Bullet( me, current, origin, chest_pos );

        var best_dmg = 0;

        if ( head_dmg != null && stomach_dmg != null && chest_dmg != null ) {
            best_dmg = Math.max(head_dmg[1], stomach_dmg[1], chest_dmg[1]);
        }

        if (!best_dmg)
            continue;

        data[i] = {
            eid: current,
            distance: dst,
            fov: fov,
            damage: best_dmg,
            health: health
        };

        //Cheat.Print("Target: " + Entity.GetName(current) + ", DST: " + Math.round(dst) + ", FOV: " + Math.round(fov) + ", DMG: " + best_dmg + "\n");
    }

    if (!data || data.length == 0) {
        target = null;
        return;
    }
        
    data.sort( compare );

    //_SDK.Cheat.Print("\n"+Entity.GetName(data[0].eid)+"\n\n");

    target = data[0].eid;

    if (target)
        Entity.DrawFlag(target, "TARGET", [235, 145, 145, 255]);
}

Ragebot.adaptive_aim = function( )
{
    var entity = Ragebot.GetTarget(  ) || target;

    if ( !entity )
        return;

    if ( Entity.IsAlive( entity ) && Entity.IsValid( entity ) )
    {
        pos = Entity.GetRenderOrigin( entity )
        eye_pos = Entity.GetEyePosition( Entity.GetLocalPlayer(  ) )

        const sub = vec_substract( pos, eye_pos );

        const yaw = Math.atan2(sub[ 1 ], sub[ 0 ] ) * 180 / Math.PI;
        const pitch = -Math.atan2( sub[ 2 ], Math.sqrt( sub[ 0 ] ** 2 + sub[ 1 ] ** 2 ) ) * 180 / Math.PI;
        const viewangles = Local.GetViewAngles();
        const yaw_delta = ( ( viewangles[ 1 ] % 360 - yaw % 360 ) % 360 );

        
        yaw_delta = Normalize( yaw_delta ) 

        const rad = ( yaw_delta - 90 ) * Math.PI / 180;
        const pitch_delta = viewangles[0] - pitch
        const fov = Math.sqrt( yaw_delta ** 2 + pitch_delta ** 2 )

        if ( Math.abs( fov ) > 60 )
        {
            UI.SetValue( [ "Rage", "General", "General", "Silent aim" ], 1 )
        } else {
            UI.SetValue( [ "Rage", "General", "General", "Silent aim"], 0 )  
        }
    }
}

const vec_substract = function(vec, vec2)
{
    return [
        vec[0] - vec2[0],
        vec[1] - vec2[1],
        vec[2] - vec2[2]
    ];
};

function Normalize(angle) {
    if (angle < -180)
        angle += 360;

    if (angle > 180)
        angle -= 360;

    return angle;
}

Cheat.RegisterCallback( "CreateMove", "on_cmove" )
