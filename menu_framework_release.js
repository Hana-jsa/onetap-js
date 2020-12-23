/*
* Simple menu framework
* Description: framework for guis in onetap.com js
*/


/* region: consts */
const hotkey_mode_t = {
    HOLD: 0,
    TOGGLE: 1,
    ALWAYS: 2
};

const element_t = {
    CHECKBOX: 0,
    SLIDER: 1,
    DROPDOWN: 2,
    COLOR_PICKER: 3,
    HOTKEY: 4
};

/* region: structs */
const checkbox_t = function( value ) { return { __type: element_t.CHECKBOX, value: value || false } };
const slider_t = function( value ) { return { __type: element_t.SLIDER, value: value || 0 } };
const dropdown_t = function( value ) { return { __type: element_t.DROPDOWN, value: value || 0 } };
const color_picker_t = function( h, s, v, a ) { const rgb = hsv_to_rgb( [ h, s, v, a ] ); const r = rgb[ 0 ], g = rgb[ 1 ], b = rgb[ 2 ]; return { __type: element_t.COLOR_PICKER, value: [ h, s, v, a ], h: h, s: s, v: v, r: r, g: g, b: b, a: a } };
const hotkey_t = function( value, mode, active ) { return { __type: element_t.HOTKEY, value: value, mode: mode, active: active, open: false } };

/* region: locals */
const menu = {
    opened: true,
    color: [ ],
    font: null,

    // current tab index
    curr_tab: 0,

    // current subtab index for each tab
    curr_subtab: {
        "tab 1": 0,
        "tab 2": 0
    },

    // current groupbox data
    // used for automatic spacing
    curr_groupbox: {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        offset: 0
    },
    
    x: 140,
    y: 140,
    w: 400,
    h: 300,

    // whether or not the user was clicking
    // used to fix hotkey input
    clicked: false
};

const cursor = {
    x: 0,
    y: 0,
    delta_x: 0,
    delta_y: 0,
    dragging: false
};

const input_system = {
    pressed_keys: [ ],
    last_pressed_keys: [ ]
};

const container = {
    // [0] = combobox, [1] = multibox, [2] = color_picker, [3] = hotkey
    type: -1, 

    x: 0,
    y: 0,
    w: 0,
    h: 0,

    // combobox/multibox elements
    elements: [ ],

    variable: ""
};

const config_system = { };
const config = {
    menu_color: color_picker_t( 213, 78, 92, 255 ),
    test_bool_disabled: checkbox_t( ),
    test_bool_enabled: checkbox_t( true ),
    test_int: slider_t( 5 ),
    test_float: slider_t( 8 ),
    test_combobox: dropdown_t( ),
    test_combobox2: dropdown_t( ),
    test_hotkey: hotkey_t( 0x24, hotkey_mode_t.TOGGLE, true ) // 0 = Hold, 1 = Toggle, 2 = Always on
};

const hotkeys = [ ];

/* region: callbacks */
function on_cmove( ) {
    input_system.fix_input( );
}

function on_paint( ) {
    menu.render( );
}

/* region: input_system */
input_system.update = function( ) {
    // loop thru all keys
    for ( var i = 1; i < 255; ++i ) {
        // save current pressed keys
        this.last_pressed_keys[ i ] = this.pressed_keys[ i ];

        // update pressed keys
        this.pressed_keys[ i ] = Input.IsKeyPressed( i );
    }

    // handle hotkeys
    input_system.handle_hotkeys( );
}

input_system.is_key_down = function( key ) {
    return this.pressed_keys[ key ];
}

input_system.is_key_pressed = function( key ) {
    return this.pressed_keys[ key ] && !this.last_pressed_keys[ key ];
}

input_system.is_key_released = function( key ) {
    return !this.pressed_keys[ key ] && this.last_pressed_keys[ key ];
}

input_system.handle_hotkeys = function( ) {
    // loop thru all config variables
    for ( var variable in config ) {
        // get current variable
        const hk = config[ variable ];

        // check if variable isn't a hotkey
        if ( hk.__type !== element_t.HOTKEY )
            continue;

        // check if hotkey is being set (waiting for input)
        if ( hk.open )
            continue;
        
        // switch between hotkey mode
        switch ( hk.mode ) {
            // on hold
            case 0:
                hk.active = this.is_key_down( hk.value );
                break;

            // on toggle
            case 1:
                if ( this.is_key_pressed( hk.value ) )
                    hk.active = !hk.active;
                    
                break;

            // always on
            case 2:
                hk.active = true;
                break;
        }
    }
}

input_system.enable_mouse_input = function( active ) { 
    Input.ForceCursor( +active ) 
}

input_system.fix_input = function( ) {
    // check if menu isn't open
    if ( !menu.opened )
        return;

    // override buttons so we don't shoot while in the menu
    UserCMD.SetButtons( UserCMD.GetButtons( ) & ~( 1 << 0 ) );
}

input_system.cursor_in_bounds = function( x, y, w, h ) {
    return cursor.x > x && cursor.y > y && cursor.x < x + w && cursor.y < y + h;
}

/* region: config */
config_system.save = function( ) {
    
    // loop thru all config variables
    for ( var variable in config ) {
        // get current variable
        const object = config[ variable ];

        // convert variable to JSON and save it to file
        DataFile.SetKey( "config.jscfg", variable, JSON.stringify( object ) );
    }

    // save/create file
    DataFile.Save( "config.jscfg" );

    // log
    Cheat.Print( "[framework] Configuration saved.\n" );
}

config_system.load = function( ) {

    // load the file
    DataFile.Load( "config.jscfg" );

    // loop thru all config variables
    for ( var variable in config ) {
        // get the JSON value
        var string = DataFile.GetKey( "config.jscfg", variable );

        // check if JSON isn't valid
        if ( !string ) 
            continue;

        // parse JSON
        var data = JSON.parse( string );

        // check if the parsed data isn't valid
        if ( !data )
            continue;

        // override config value
        config[ variable ] = data;
    }

    // log
    Cheat.Print( "[framework] Configuration loaded.\n" );
}

/* region: menu */
menu.render = function( ) {
    // update variables
    menu.font = Render.AddFont( "Tahoma", 12, 500 );
    menu.open = config.test_hotkey[ 3 ];

    cursor.x = Input.GetCursorPosition( )[ 0 ], cursor.y = Input.GetCursorPosition( )[ 1 ];
    
    // handles input system
    input_system.update( );
    input_system.enable_mouse_input( menu.opened );

    // change the menu's open state
    menu.opened = config.test_hotkey.active;

    // check if menu isn't open
    if ( !menu.opened )
        return;

    // change the menu's color
    menu.color = menu.get_color( config.menu_color );

    // render the menu's body
    menu.body( menu.x, menu.y, menu.w, menu.h, [ 36, 36, 36, 255 ], [ 25, 25, 25, 255 ], [ 36, 36, 36, 255 ], "framework" );

    // tabs groupbox
    menu.groupbox( menu.x + 5, menu.y + 35, 100, 260, "tabs", false ); {
        // render tabs
        menu.tab( "tab 1", 0, false, [ "subtab 1", "subtab 2" ] )
        menu.tab( "tab 2", 1, false, [ "subtab", "subtab 2" ] )

    }

    // switch between tabs
    switch ( menu.curr_tab ) {
        // first tab
        case 0:
            // switch between subtabs in the first tab
            switch ( menu.curr_subtab["tab 1"] ) {
                // first subtab
                case 0:
                    menu.groupbox( menu.x + 110, menu.y + 35, 285, 260, "groupbox", false ); {
                        // adding checkboxes is just the name of it and the variable u wish to attach to it
                        menu.checkbox( "enabled", "test_bool_enabled" )
                        menu.checkbox( "disabled", "test_bool_disabled" )

                        // color pickers are variable and if they are inlined true or false
                        // if its inlined the name argument doesn't matter
                        // only put inlined code after checkboxes its not meant for anything else
                        menu.color_picker( "menu color", "menu_color", false )

                        // slider has more arguments than most so its just name of the slider, the variable, the minimum value of the slider, maximum value,
                        // the step which is what it will increment and decrement by, and float leave this false for an integer value
                        menu.slider( "int", "test_int", 0, 10, 1, false)
                        menu.slider( "float", "test_float", 8, 16, 0.25, true)

                        // comboboxes and multi combos have the same arguments, name, the elements and variable
                        menu.combobox( "test_combobox", [ "a", "b", "c" ], "test_combobox" );
                        menu.multibox( "test_multicombo", [ "1", "2", "3" ], "test_combobox2" );
                        
                    }
                break;

                // second subtab
                case 1:
                    menu.groupbox( menu.x + 110, menu.y + 35, 285, 260, "groupbox 2", false ); {
                        // hotkey is just name and variable
                        menu.hotkey( "menu hotkey", "test_hotkey" );
                    }
                }
                break;

        // second tab
        case 1:
            // switch between subtabs in the second tab
            switch ( menu.curr_subtab["tab 2"] ) {
                // first subtab
                case 0:
                    menu.groupbox( menu.x + 110, menu.y + 35, 285, 260, "groupbox 3", false ); {

                }
                break;

                // second subtab
                case 1:
                    menu.groupbox( menu.x + 110, menu.y + 35, 285, 260, "groupbox 4", false ); {
                        // buttons require a name and a callback function
                        menu.button( "save", config_system.save );
                        menu.button( "load", config_system.load );
                }
                break;
            }
        break;
    }

    // handles the containers, aka, dropdowns, multi dropdowns, color pickers and hotkey mode window.
    menu.render_container( );
}

menu.body = function( x, y, w, h, bg, header_text, header_line, name) {
    // disable dragging if mouse1 isn't pressed
    if ( !input_system.is_key_down( 0x01 ) )
        cursor.dragging = false;

    // check if we're dragging the window
    if ( input_system.is_key_down( 0x01 ) && input_system.cursor_in_bounds( x, y, w, 30 ) || cursor.dragging ) {
        // update dragging state
        cursor.dragging = true;

        // update menu position
        menu.x = cursor.x - cursor.delta_x;
        menu.y = cursor.y - cursor.delta_y;
    }

    else {
        // update cursor-menu delta
        cursor.delta_x = cursor.x - menu.x;
        cursor.delta_y = cursor.y - menu.y;
    }

    // render menu's body
    Render.FilledRect( x, y, w, h, bg )
    Render.FilledRect( x, y, w, 30, header_text )
    Render.FilledRect( x, y + 30, w, 2, header_line )
    Render.String( x + 10, y + 8, 0, name, [ 255, 255, 255, 205 ], menu.font )
}

menu.groupbox = function( x, y, w, h, string, show_name ) {
    // render groupbox
    Render.FilledRect( x, y, w, h, [ 25, 25, 25, 255 ] )
    Render.Rect( x, y, w, h, [ 45, 45, 45, 255 ] )

    // render groupbox's name if show_name is active
    if ( show_name )
        Render.String( x + 2, y - 12, 0, string, [ 255, 255, 255, 205 ], menu.font )

    // update automatic positioning data
    menu.curr_groupbox.x = x;
    menu.curr_groupbox.y = y;
    menu.curr_groupbox.w = w;
    menu.curr_groupbox.h = h;
    menu.curr_groupbox.offset = 0;
}

menu.tab = function ( name, id, show_outline, subtabs ) {
    // when u add a tab it automatically places based on these
    var x = menu.x + 5, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 15
    var w = 100, h = 30

    // is mouse 1 being held in the tabs width and height
    if ( ( cursor.x > x ) && ( cursor.x < x + w ) && ( cursor.y > y ) && ( cursor.y < y + h ) && ( input_system.is_key_pressed(0x01) ) ) {
        // if an active container ( hotkey right click, color picker, dropdown, multi drop down ) is open stop updating it
        if ( container.variable ) {
            menu.update_container( true );
        }

        // set the current tab to this tabs id
        menu.curr_tab = id;
    }

    // show the clickable outline of a tab useful for testing things but looks ugly
    if ( show_outline )
        Render.Rect( x, y, w, h, menu.curr_tab === id ? [ 52, 134, 235, 255 ] : [ 25, 25, 25, 255 ] )

    // render the tabs name
    Render.String( x + 50 , y, 1, name, [ 255, 255, 255, 205 ], menu.font )

    // increment the tabs offset so next tab won't collide
    menu.curr_groupbox.offset += 40

    // return if there isn't any subtabs
    if ( subtabs.length === 0 )
        return;

    // return if this isn't the current tab
    if ( menu.curr_tab !== id )
        return;


    // check if its in bounds again and mouse 2 is being pressed this time
    if ( ( cursor.x > x ) && ( cursor.x < x + w ) && ( cursor.y > y ) && ( cursor.y < y + h ) && ( input_system.is_key_pressed(0x02) ) ) {
        // if an active container ( hotkey right click, color picker, dropdown, multi drop down ) is open stop updating it
        if ( container.variable ) {
            menu.update_container( true );
        }

        // change the subtab by 1
        menu.curr_subtab[ name ] = ( menu.curr_subtab[ name ] + 1 ) % subtabs.length
    }

    // render the subtabs name below the tab
    Render.String( x + 50, y + 12, 1, subtabs[ menu.curr_subtab[ name ] ], [ 200, 200, 200, 205 ], menu.font )
}

menu.checkbox = function ( string, variable ) {
    // when u add a checkbox it automatically places based on these
    var x = menu.curr_groupbox.x + 10, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    var position = menu.curr_groupbox.x + menu.curr_groupbox.w - 20;
    var w = 10, h = 10

    // is mouse 1 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( position, y, w, h ) ) {
        // if an active container ( hotkey right click, color picker, dropdown, multi drop down ) is open stop updating it
        if ( input_system.is_key_pressed( 0x01 ) ) {
            if ( container.variable ) {
                menu.update_container( true );
            }
                
            else {
                // update config if there's no active container
                config[ variable ].value = !config[ variable ].value;
            }
        }
    }

    // render background
    Render.FilledRect( position, y + 2, w, h, config[ variable ].value ? menu.color : [ 36, 36, 36, 255 ] )

    // render name
    Render.String( x, y, 0, string, [ 255, 255, 255, 205 ], menu.font )

    // update offset
    menu.curr_groupbox.offset += 15;
}

menu.slider = function( string, variable, min_value, max_value, step, float) {
    // when u add a slider it automatically places based on these
    var x = menu.curr_groupbox.x + 10, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    var position = menu.curr_groupbox.x + menu.curr_groupbox.w - 135;
    var w = 125, h = 8;

    // is mouse 1 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( position, y + 1, w, h ) && input_system.is_key_down( 0x01 ) ) {
        // if an active container ( hotkey right click, color picker, dropdown, multi drop down ) is open stop updating it
        if ( container.variable ) {
            menu.update_container( true );
        }

        // calculate the fraction between the delta of your mouse with the slider and the width
        const fraction = -( 1 - ( cursor.x - position + w ) / w );

        // update config
        config[ variable ].value = float ? Math.round( ( min_value + ( ( max_value - min_value ) * fraction ) ) / step ) * step :
                            Math.round( Math.round( min_value + ( max_value - min_value ) * fraction / step ) * step );
    }

    // render background and slider
    Render.FilledRect( position, y + 1, w, 8, [ 36, 36, 36, 255 ] )
    Render.FilledRect( x + 140, y + 1, ( config[ variable ].value - min_value ) / ( max_value - min_value ) * w, 8, menu.color )

    // render name
    Render.String( x, y, 0, string + ": " + ( float ? config[ variable ].value.toFixed( 2 ) : config[ variable ].value.toFixed( 0 ) ), [ 255, 255, 255, 205 ], menu.font )

    // update offset
    menu.curr_groupbox.offset += 15;
}

menu.combobox = function( string, elements, variable ) {
    // when u add a combobox it automatically places based on these
    var x = menu.curr_groupbox.x + 10, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    var position = menu.curr_groupbox.x + menu.curr_groupbox.w - 135;
    const w = 125, h = 15;
    const c_h = elements.length * 15;

    // is mouse 1 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( position, y, w, h ) && input_system.is_key_pressed( 0x01 ) ) {
        // check if there's no active container or if the active container is this element
        if ( !container.variable || container.variable === variable ) {
            // update container state
            container.variable ? menu.update_container( true ) : menu.update_container( false, 0, position, y + h, w, c_h, elements, variable );
        }
    }

    // render background
    Render.FilledRect( position, y, w, h, [ 36, 36, 36, 255 ] );

    // render name and active element
    Render.String( x, y, 0, string, [ 255, 255, 255, 205 ], menu.font );
    Render.String( position + 4, y, 0, elements[ config[ variable ].value ], [ 255, 255, 255, 205 ], menu.font );

    // update offset
    menu.curr_groupbox.offset += 20;
}

menu.multibox = function( string, elements, variable ) {
    // when u add a multibox it automatically places based on these
    var x = menu.curr_groupbox.x + 10, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    var position = menu.curr_groupbox.x + menu.curr_groupbox.w - 135;
    const w = 125, h = 15;
    const c_h = elements.length * 15;

    // is mouse 1 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( position, y, w, h ) && input_system.is_key_pressed( 0x01 ) ) {
        // check if there's no active container or if the active container is this element
        if ( !container.variable || container.variable === variable ) {
            // update container state
            container.variable ? menu.update_container( true ) : menu.update_container( false, 1, position, y + h, w, c_h, elements, variable );
        }
    }

    // initialize variables for multidropdown rendered
    var selected = 0;
    var text = "";

    // loop thru our elements
    for ( var i = 0; i < elements.length; ++i ) {
        // check if this current element is active
        if ( config[ variable ].value & ( 1 << i ) ) {
            // check if we are already displaying the first element
            if ( selected > 0 )
                text += ", ";

            // add this element's name to the display text
            text += elements[ i ];

            // increment selected amount
            ++selected;
        }
    }
        
    // get display text width
    const text_w = Render.TextSize( text, menu.font )[ 0 ];

    // render background
    Render.FilledRect( position, y, w, h, [ 36, 36, 36, 255 ] );

    // render name and active element(s)
    Render.String( x, y, 0, string, [ 255, 255, 255, 205 ], menu.font );
    Render.String( position + 4, y, 0, text_w > w ? "..." : text, [ 255, 255, 255, 205 ], menu.font );

    // update offset
    menu.curr_groupbox.offset += 20;
}

menu.color_picker = function( name, variable, inlined ) {
    // when u add a color picker it automatically places based on these
    var x = menu.curr_groupbox.x + 10, y = inlined ? menu.curr_groupbox.y + menu.curr_groupbox.offset - 3 : menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    var position =  inlined ?  menu.curr_groupbox.x + menu.curr_groupbox.w - 35 : menu.curr_groupbox.x + menu.curr_groupbox.w - 20;
    var w = 10, h = 10;

    // is mouse 1 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( position, y, w, h ) ) {
        if ( input_system.is_key_pressed( 0x01 ) ) {
            // check if there's no active container or if the active container is from this element
            if ( !container.variable || container.variable === variable ) {
                // update container state
                container.variable ? menu.update_container( true ) : menu.update_container( false, 2, x + w, y + h, w, h, null, variable );
            }
        }
    }

    // check if the active container is from this element, updating it every frame
    if ( container.variable === variable )
        menu.update_container( false, 2, position + w, y + h, w, h, null, variable );

    // render the color picker
    Render.FilledRect( position, y, w, h, hsv_to_rgb( config[ variable ].value ) );

    // check if this is not inlined
    if ( !inlined ) {
        // render name
        Render.String( x, y, 0, name, [ 255, 255, 255, 205 ], menu.font );

        // update offset
        menu.curr_groupbox.offset += 15;
    }
}

menu.hotkey = function( string, variable ) {
    // when u add a hotkey it automatically places based on these
    const x = menu.curr_groupbox.x + 10, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    const position = menu.curr_groupbox.x + menu.curr_groupbox.w - 10;
    
    // get current config variable, to make it easier
    const data = config[ variable ];

    // get current hotkey label and its width
    const hotkey = "[" + key_names[ config[ variable ].value ] + "]";
    const hotkey_width = Render.TextSize( hotkey, menu.font )[ 0 ];

    // is mouse 1 being held in the tabs width and height
    if ( input_system.is_key_down( 0x01 ) ) {
        if ( input_system.cursor_in_bounds( position - hotkey_width, y, hotkey_width, 10 ) && !data.open ) {
            // check if there's no active container or if the active container is this element
            if ( !container.variable || container.variable === variable ) {
                // disable current container
                menu.update_container( true );

                // update clicked state, fix input
                menu.clicked = true;

                // update hotkey's state to wait for input
                data.open = true;
            }
        }
    }

    else {
        // disable clicked state
        menu.clicked = false;
    }

    // is mouse 2 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( position - hotkey_width, y, hotkey_width, 10 ) && input_system.is_key_pressed( 0x02 ) && !data.open ) {
        // check if there's no active container or if the active container is this element
        if ( !container.variable || container.variable === variable ) {
            // update container state
            container.variable ? menu.update_container( true ) : menu.update_container( false, 3, position, y + 10, 60, 50, null, variable );
        }
    }
    
    // check if we weren't clicking in the last frame and if we're waiting for input
    if ( !menu.clicked && data.open ) {
        // loop through every key
        for ( var i = 1; i < 255; ++i ) {
            // check if we're pressing this key
            if ( input_system.is_key_down( i ) ) {
                // update hotkey value
                data.open = false;
                data.value = i;
                break;
            }
        }          
    }

    // render hotkey
    Render.String( x, y, 0, string, [ 255, 255, 255, 205 ], menu.font );
    Render.String( position - hotkey_width, y, 0, hotkey, data.open ? menu.color : [ 175, 175, 175, 205 ], menu.font );

    // update offset
    menu.curr_groupbox.offset += 15;
}

menu.button = function( variable, callback ) {
    // when u add a button it automatically places based on these
    var x = menu.curr_groupbox.x + 10, y = menu.curr_groupbox.y + menu.curr_groupbox.offset + 10;
    const w = 75, h = 15;

    // is mouse 1 being held in the tabs width and height
    if ( input_system.cursor_in_bounds( x, y, w, h ) && input_system.is_key_pressed( 0x01 ) ) {
        // disable current container
        menu.update_container( true );

        // run callback
        callback( );
    }

    // render background
    Render.FilledRect( x, y, w, h, [ 36, 36, 36, 255 ] );

    // render name
    Render.String( x + w / 2, y + 1, 1, variable, [ 255, 255, 255, 205 ], menu.font );

    // update offset
    menu.curr_groupbox.offset += 20;
}

menu.update_container = function( disable, type, x, y, w, h, elements, variable ) {
    // check if we're disabling the container
    if ( disable ) {
        // reset container variables
        container.type = -1;
        container.x = 0;
        container.y = 0;
        container.w = 0;
        container.h = 0;
        container.elements = elements;
        container.variable = "";
        return;
    }
    
    // update container variables
    container.type = type;
    container.x = x;
    container.y = y;
    container.w = w;
    container.h = h;
    container.elements = elements;
    container.variable = variable;
}

menu.render_container = function( ) {
    // get container and accent
    const self = container;
    const accent = menu.get_color( config.menu_color );

    // check if there's an active container
    if ( !container.variable )
        return;

    // switch between the type of container
    switch ( self.type ) {
        default:
            break;

        // combobox
        case 0:
            // render the container's background
            Render.FilledRect( self.x, self.y, self.w, self.h, [ 32, 32, 32, 255 ] );

            // loop through all elements
            for ( var i = 0; i < self.elements.length; i++ ) {
                // initialize hovered variable
                var hovered = false;

                // check if cursor is in bounds
                if ( input_system.cursor_in_bounds( self.x, self.y + i * 15, self.x, 15 ) ) {
                    // check if we're pressing mouse 1
                    if ( input_system.is_key_pressed( 0x01 ) ) {
                        // update config variable
                        config[ self.variable ].value = i;

                        // disable container
                        menu.update_container( true );
                        break;
                    }

                    // set hovered to true
                    hovered = true;
                }

                else {
                    // check if we're pressing outside of the boundaries
                    if ( !input_system.cursor_in_bounds( self.x, self.y - self.h, self.w, self.h + self.elements.length * 15 ) && input_system.is_key_pressed( 0x01 ) ) {
                        // disable container
                        menu.update_container( true );
                        break;
                    }
                }

                // render element
                Render.String( self.x + 4, self.y + i * 15, 0, self.elements[ i ], config[ self.variable ].value === i ?
                    accent : hovered ? [ 235, 235, 235, 205 ] : [ 100, 100, 100, 205 ], menu.font );
            }

            break;

        // Multi dropdown
        case 1:
            // render the container's background
            Render.FilledRect( self.x, self.y, self.w, self.h, [ 32, 32, 32, 255 ] );

            // loop through all elements
            for ( var i = 0; i < self.elements.length; i++ ) {
                // initialize hovered variable
                var hovered = false;

                // check if cursor is in bounds
                if ( input_system.cursor_in_bounds( self.x, self.y + i * 15, self.x, 15 ) ) {
                    // check if we're pressing mouse 1
                    if ( input_system.is_key_pressed( 0x01 ) ) {
                        // check if this element is active and then disable it
                        if ( config[ self.variable ].value & ( 1 << i ) )
                            config[ self.variable ].value &= ~( 1 << i );

                        else
                            // otherwise enable it
                            config[ self.variable ].value |= ( 1 << i );
                    }

                    // set hovered to true
                    hovered = true;
                }

                else {
                    // check if we're pressing outside of the boundaries
                    if ( !input_system.cursor_in_bounds( self.x, self.y - self.h, self.w, self.h + self.elements.length * 15 ) && input_system.is_key_pressed( 0x01 ) ) {
                        // disable container
                        menu.update_container( true );
                        break;
                    }
                }

                // render element
                Render.String( self.x + 4, self.y + i * 15, 0, self.elements[ i ], config[ self.variable ].value & ( 1 << i ) ?
                    accent : hovered ? [ 235, 235, 235, 205 ] : [ 100, 100, 100, 205 ], menu.font );
            }

            break;

        // Color picker
        case 2:
            // get config variable
            const hsv = config[ self.variable ];

            // check if we're clicking inside the color picker
            if ( input_system.cursor_in_bounds( self.x + 5, self.y + 5, 190, 190 ) && input_system.is_key_down( 0x01 ) ) {
                // get the delta between bottom right corner and mouse position
                const delta_x = self.x + 195 - cursor.x;
                const delta_y = self.y + 195 - cursor.y;

                // calculate saturation and vibrance
                hsv.s = 100 - ( delta_x * 100 / 190 );
                hsv.v = delta_y * 100 / 190;
            }

            // check if we're dragging the hue bar
            if ( input_system.cursor_in_bounds( self.x + 5, self.y + 200, 190, 8 ) && input_system.is_key_down( 0x01 ) ) {
                // get the delta between the right corner and the mouse position
                const delta_x = self.x + 195 - cursor.x;

                // calculate hue
                hsv.h = 360 - ( delta_x * 360 / 190 );
            }

            // check if we're dragging the alpha bar
            if ( input_system.cursor_in_bounds( self.x + 5, self.y + 212, 190, 8 ) && input_system.is_key_down( 0x01 ) ) {
                // get the delta between the right corner and the mouse position
                const delta_x = self.x + 195 - cursor.x;

                // calculate alpha
                hsv.a = 255 - ( delta_x * 255 / 190 );
            }

            // check if we're clicking outside color picker window
            if ( !input_system.cursor_in_bounds( self.x - 10, self.y - 10, 210, 235 ) && input_system.is_key_down( 0x01 ) ) {
                // disable container
                menu.update_container( true );
                break;
            }

            // update config value
            hsv.value = [
                hsv.h,
                hsv.s,
                hsv.v,
                hsv.a
            ];

            // convert the hsv values to rgb
            const color = hsv_to_rgb( hsv.value );

            // update config RGBA value
            hsv.r = color[ 0 ];
            hsv.g = color[ 1 ];
            hsv.b = color[ 2 ];
            hsv.a = color[ 3 ];

            // get the color picker's x and y position
            const color_selector_x = hsv.s * 190 / 100;
            const color_selector_y = (100 - hsv.v) * 190 / 100;

            // get the hue slider's x offset
            const hue_selector_x = hsv.h * 190 / 360;

            // get the alpha slider's x offset
            const alpha_selector_x = hsv.a * 190 / 255;

            // render the window
            Render.Rect( self.x - 1, self.y - 1, 202, 227, [ 10, 10, 10, 225 ] );
            Render.FilledRect( self.x, self.y, 200, 225, [ 32, 32, 32, 255 ] );
            
            // render the color picker
            Render.FilledRect( self.x + 5, self.y + 5, 190, 190, hsv_to_rgb( [ hsv.h, 100, 100, 255 ] ) )
            Render.GradientRect( self.x + 5, self.y + 5, 190, 190, 1, [ 255, 255, 255, 255 ], [ 255, 255, 255, 0 ] );
            Render.GradientRect( self.x + 5, self.y + 5, 190, 190, 0, [ 0, 0, 0, 0 ], [ 0, 0, 0, 255 ] );

            // render the hue and alpha sliders
            Render.HueRect( self.x + 5, self.y + 200, 222 );
            Render.FilledRect( self.x + 5, self.y + 212, 190, 8, color );

            // render the selectors
            Render.Rect( self.x + 5 + color_selector_x - 2, self.y + 5 + color_selector_y - 2, 4, 4, [ 235, 235, 235, 255 ] );
            Render.Rect( self.x + 5 + hue_selector_x - 2, self.y + 200, 4, 8, [ 235, 235, 235, 255 ] );
            Render.Rect( self.x + 5 + alpha_selector_x - 2, self.y + 212, 4, 8, [ 235, 235, 235, 255 ] );

            break;

        // Hotkey
        case 3:
            // declare all possible hotkey modes
            const modes = [ "On hold", "On toggle", "Always on" ];

            // render background
            Render.FilledRect( self.x, self.y, self.w, self.h, [ 32, 32, 32, 255 ] );

            // loop thru all modes
            for ( var i = 0; i < modes.length; i++ ) {
                // initialize hovered variable
                var hovered = false;

                // check if cursor is in bounds
                if ( input_system.cursor_in_bounds( self.x, self.y + i * 15, self.w, 15 ) ) {
                    // check if we're pressing mouse1
                    if ( input_system.is_key_pressed( 0x01 ) ) {
                        // update hotkey mode
                        config[ self.variable ].mode = i;

                        // disable container
                        menu.update_container( true );
                        break;
                    }

                    // set hovered to true
                    hovered = true;
                }
                
                // render the mode labels
                Render.String( self.x + 2, self.y + 2 + i * 15, 0, modes[ i ], config[ self.variable ].mode === i ?
                    accent : hovered ? [ 235, 235, 235, 205 ] : [ 100, 100, 100, 205 ], menu.font );
            }

            break;
    }
}

menu.get_color = function( obj ) {
    // return a packed color array
    return [ obj.r, obj.g, obj.b, obj.a ];
}

Render.ShadowString = function( x, y, a, s, c, f ) {
    // get the shadow's alpha
    const alpha = Math.min(200, c[ 3 ] );

    // render string
    Render.String( x, y + 1, a, s, [ 10, 10, 10, alpha ], f );
    Render.String( x, y, a, s, c, f );
}

Render.HueRect = function( x, y, w ) {
    // declare hue spectrum colors
    const colors =
        [
            [ 255, 0, 0, 255 ],
            [ 255, 255, 0, 255 ],
            [ 0, 255, 0, 255 ],
            [ 0, 255, 255, 255 ],
            [ 0, 0, 255, 255 ],
            [ 255, 0, 255, 255 ],
            [ 255, 0, 0, 255 ]
        ];

    // loop thru the spectrum
    for ( var i = 0; i < colors.length - 1; i++ ) {
        // render each gradient
        Render.GradientRect( x + i * w / 7, y, w / 7 + 1, 8, 1, colors[ i ], colors[ i + 1 ] );
    }
}

function hsv_to_rgb(values) {
    var h = values[ 0 ], s = values[ 1 ], v = values[ 2 ], a = values[ 3 ];
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
            a
        ];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;

        case 1:
            r = q;
            g = v;
            b = p;
            break;

        case 2:
            r = p;
            g = v;
            b = t;
            break;

        case 3:
            r = p;
            g = q;
            b = v;
            break;

        case 4:
            r = t;
            g = p;
            b = v;
            break;

        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        a
    ];
}

var key_names = [ "-", "mouse1", "mouse2", "break", "mouse3", "mouse4", "mouse5",
    "-", "backspace", "tab", "-", "-", "-", "enter", "-", "-", "shift",
    "control", "alt", "pause", "capslock", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "-", "-", "space", "page up", "page down", "end", "home", "left",
    "up", "right", "down", "-", "Print", "-", "print screen", "insert", "delete", "-", "0", "1",
    "2", "3", "4", "5", "6", "7", "8", "9", "-", "-", "-", "-", "-", "-",
    "Error", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u",
    "v", "w", "x", "y", "z", "left windows", "right windows", "-", "-", "-", "insert", "end",
    "down", "page down", "left", "numpad 5", "right", "home", "up", "page up", "*", "+", "_", "-", ".", "/", "f1", "f2", "f3",
    "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "f13", "f14", "f15", "f16", "f17", "f18", "f19", "f20", "f21",
    "f22", "f23", "f24", "-", "-", "-", "-", "-", "-", "-", "-",
    "number lock", "scroll lock", "-", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "-", "-", "-", "-", "shift", "right shift", "control",
    "right control", "menu", "right menu", "-", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "next", "previous", "stop", "toggle", "-", "-",
    "-", "-", "-", "-", ";", "+", ",", "-", ".", "/?", "~", "-", "-",
    "-", "-", "-", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "-", "-", "-", "[{", "\\|", "}]", "'\"", "-",
    "-", "-", "-", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "-", "-", "-", "-", "-", "-",
    "-", "-", "-", "-", "-", "-", "-", "-", "-",
    "-", "-" ];

Cheat.RegisterCallback( "Draw", "on_paint" )
Cheat.RegisterCallback( "CreateMove", "on_cmove" )