const yaw = [ "Rage", "Anti Aim", "Directions", "Yaw offset" ];
const dt = [ "Rage", "Exploits", "Keys", "Key assignment", "Double tap" ];

const hotkey = UI.AddHotkey( [ "Config", "Scripts", "Keys", "JS Keybinds" ], "Flicker", "Flicker" );
const inverter = UI.AddHotkey( [ "Config", "Scripts", "Keys", "JS Keybinds" ], "Flicker inverter", "Flick invert" );

var active = false;
var old_yaw = 0;
var old_dt = 0;

function onCreateMove( ) {
    if ( !UI.GetValue( hotkey ) ) {
        if ( active ) {
            active = false;

            UI.SetValue( yaw, old_yaw );

            if ( UI.GetValue( dt ) != old_dt )
                UI.ToggleHotkey( dt );
        }

        Exploit.OverrideMaxProcessTicks( 16 );
        return;
    }

    if ( !active ) {
        active = true;
        old_yaw = UI.GetValue( yaw );
        old_dt = UI.GetValue( dt );

        Cheat.Print( ( Exploit.GetNetworkedTickbase( ) - Exploit.GetPredictedTickbase( ) ) + '\n' )
    }

    if ( !UI.GetValue( dt ) )
        UI.ToggleHotkey( dt );

    const flip = Globals.Tickcount( ) % 8 > 4;

    if ( flip ) {
        Exploit.OverrideMaxProcessTicks( 16 );
        Exploit.OverrideShift( 14 );
    }

    else {
        Exploit.OverrideMaxProcessTicks( 21 );
        Exploit.OverrideShift( 19 );
    }

    if ( UI.GetValue( inverter ) ) {
        UI.SetValue( yaw, flip ? 90 : -90 );
    }

    else {
        UI.SetValue( yaw, flip ? -90 : 90 );
    }
}

function onDraw( ) {
    const font = Render.AddFont( "Verdana", 24, 0 );

    const x = Render.GetScreenSize( )[ 0 ], y = Render.GetScreenSize( )[ 1 ];
    const inverted = UI.GetValue( inverter );

    Render.String( x / 2 - 35, y / 2 - 15, 1, "<", inverted ? [ 235, 100, 155, 255 ] : [ 100, 100, 100, 100 ], font );
    Render.String( x / 2 + 35, y / 2 - 15, 1, ">", !inverted ? [ 235, 100, 155, 255 ] : [ 100, 100, 100, 100 ], font );
}

Cheat.RegisterCallback( "CreateMove", "onCreateMove" );
Cheat.RegisterCallback( "Draw", "onDraw" );