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

const path = [ "Misc.", "Helpers", "General" ]
const enable = UI.AddCheckbox( path, "Enable" )

function on_player_say(  )  {
    me = Entity.GetLocalPlayer()
    text = Event.GetString("text")
    userid = Event.GetInt("userid")
    chatter = Entity.GetEntityFromUserID(userid)
    var split_text = text.split("")
    var str = ""
    
    if ( UI.GetValue( enable ) ) {
        if ( Entity.IsEnemy( chatter ) ) {
            for ( i = 0; i < split_text.length; i++ )
            {
                str += split_text[ i ][ Math.round( Math.random(  ) ) ? 'toUpperCase' : 'toLowerCase' ](  )
            }
            Cheat.ExecuteCommand( "say " + str )
        }
    }
}

Cheat.RegisterCallback("player_say", "on_player_say")