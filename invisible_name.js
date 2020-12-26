
function on_round_start( ) {
    const tag = "\n"
    Local.SetClanTag( "⁣" + tag )
}

function unload( ) {
    Local.SetClanTag( " " )
}

Cheat.RegisterCallback("round_start", "on_round_start");
Cheat.RegisterCallback( "Unload", "unload" );