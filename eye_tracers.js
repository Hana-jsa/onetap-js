var traces = [];

function on_create_move() {
    var enemies = Entity.GetEnemies();

    for (var i = 0; i < enemies.length; i++) {
        if (Entity.IsDormant(enemies[i]))
        continue;

        if (!Entity.IsAlive(enemies[i]))  
        continue; 

        enemy_eyepos = Entity.GetHitboxPosition(enemies[i], 0)
        enemy_eye_angles = Entity.GetProp(enemies[i],"CCSPlayer" ,"m_angEyeAngles[0]")
        weapon_info = Entity.GetCCSWeaponInfo(enemies[i]);

        forward = vec_forward(enemy_eye_angles)
        destination = vec_add(vec_mult(forward, [weapon_info.range, weapon_info.range, weapon_info.range]), enemy_eyepos)

        frac = Trace.Line(enemies[i], enemy_eyepos, destination)[1]

        traces[enemies[i]] = frac
    }
}

function on_draw()
{
    enemies = Entity.GetEnemies()
    screen_size = Render.GetScreenSize()

    for ( i = 0; i < enemies.length; i++)
    {
        if (Entity.IsDormant(enemies[i]))
        continue;

        if (!Entity.IsAlive(enemies[i]))  
        continue; 

        if (!Entity.IsAlive(Entity.GetLocalPlayer()))
        continue;

        enemy_eyepos = Entity.GetHitboxPosition(enemies[i], 0)
        enemy_eye_angles = Entity.GetProp(enemies[i],"CCSPlayer" ,"m_angEyeAngles[0]")
        weapon_info = Entity.GetCCSWeaponInfo(enemies[i]);

        forward = vec_forward(enemy_eye_angles)
        destination = vec_add(vec_mult(forward, [weapon_info.range, weapon_info.range, weapon_info.range]), enemy_eyepos)
        
        origin_w2s = Render.WorldToScreen(enemy_eyepos)
        dest_w2s = Render.WorldToScreen(get_best_point(enemy_eyepos, destination, enemies[i]))

        if (!origin_w2s || !dest_w2s)
        continue;

        if (!is_in_screen(origin_w2s))
        continue;

        Render.Line(origin_w2s[0],origin_w2s[1],dest_w2s[0],dest_w2s[1],[235,75,60,150])
    }
}

function get_best_point(origin,destination,id)
{
    frac = traces[id] || 1
    //Cheat.Print(frac+"\n")
    best = []
    for (var i = 0; i <= frac; i+= 0.01)
    {
        current = vec_lerp(origin, destination, i)
        w2s = Render.WorldToScreen(current) 

        if (is_in_screen(w2s))
        {
            best = current
        }
        else 
          return best
    }
    return best
}

function is_in_screen(xy)
{
    return xy[0] >= 0  && xy[1] >= 0 && xy[0] <= screen_size[0] && xy[1] <= screen_size[1]
}

function vec_add(x, y) {
    if (y instanceof Number)
      return [ x[0] + y, x[1] + y, x[2] + y ];
  
    return [ x[0] + y[0], x[1] + y[1], x[2] + y[2] ];
  }
  
  function vec_mult(x, y) {
    if (y instanceof Number)
      return [ x[0] * y, x[1] * y, x[2] * y ];
  
    return [ x[0] * y[0], x[1] * y[1], x[2] * y[2] ];
  }
  
  function vec_forward(x) {
      const deg2rad = function(deg) {
          return deg * Math.PI / 180;
      }
  
      const sp = Math.sin(deg2rad(x[0]));
      const cp = Math.cos(deg2rad(x[0]));
      const sy = Math.sin(deg2rad(x[1]));
      const cy = Math.cos(deg2rad(x[1]));
  
      return [cp * cy, cp * sy, -sp]
  }

  function vec_lerp(x, y, perc) {
    const sub = [y[0] - x[0], y[1] - x[1], y[2] - x[2]];

    return [
        x[0] + perc * sub[0],
        x[1] + perc * sub[1],
        x[2] + perc * sub[2],
    ];
}


Cheat.RegisterCallback("Draw","on_draw" )
Cheat.RegisterCallback("CreateMove","on_create_move" )