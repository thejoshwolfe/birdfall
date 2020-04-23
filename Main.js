function unreachable() { return new Error("unreachable"); }
if (typeof VERSION !== "undefined") {
    document.getElementById("versionSpan").innerHTML =
        '<a href="https://github.com/thejoshwolfe/snakefall/blob/' + VERSION.sha1 + '/README.md">' + VERSION.tag + '</a>';
}

// $(document).ready(function () {
//     var fruits = getObjectsOfType(FRUIT);

// });

var sv = false;
var didResize = false;
var canvas1 = document.getElementById("canvas1");
var canvas2 = document.getElementById("canvas2");
var canvas3 = document.getElementById("canvas3");
var canvas4 = document.getElementById("canvas4");
var canvas5 = document.getElementById("canvas5");
var canvas6 = document.getElementById("canvas6");
var canvas7 = document.getElementById("canvas7");

var SPACE = "0".charCodeAt(0);
var WALL = "1".charCodeAt(0);
var SPIKE = "2".charCodeAt(0);
var FRUIT_v0 = "3".charCodeAt(0); //legacy
var EXIT = "4".charCodeAt(0);
var PORTAL = "5".charCodeAt(0);
var RAINBOW = "P".charCodeAt(0);
var TRELLIS = "p".charCodeAt(0);
var ONEWAYWALLU = "u".charCodeAt(0);
var ONEWAYWALLD = "d".charCodeAt(0);
var ONEWAYWALLL = "l".charCodeAt(0);
var ONEWAYWALLR = "r".charCodeAt(0);
var CLOSEDLIFT = "c".charCodeAt(0);
var OPENLIFT = "o".charCodeAt(0);
var CLOUD = "C".charCodeAt(0);
var BUBBLE = "b".charCodeAt(0);
var LAVA = "v".charCodeAt(0);
var WATER = "w".charCodeAt(0);
var validTileCodes = [SPACE, WALL, SPIKE, EXIT, PORTAL, RAINBOW, TRELLIS, ONEWAYWALLU, ONEWAYWALLD, ONEWAYWALLL, ONEWAYWALLR, CLOSEDLIFT, OPENLIFT, CLOUD, BUBBLE, LAVA, WATER];
var OWWCounter = 0;

// object types
var SNAKE = "s";
var BLOCK = "b";
var MIKE = "x";
var FRUIT = "f";
var POISONFRUIT = "p";

var spike2Death = [];
var lowDeath = false;
var dieOnSplock = false;
var rngCorrection = [];

function correctRng() {

}

var checkResult = false;
var cr = false;
var cs = false;
var cs2 = false;
var dont = false;

var postPortalSnakeOutline = [];
var portalConflicts = [];
var portalFailure = false;
var portalOutOfBounds = false;
var cycle = false;
var cycleId = -1;
var multiDiagrams = false;

var tileSize = 34;
var borderRadiusFactor = 3.4;
var borderRadius = tileSize / borderRadiusFactor;
var blockRadiusFactor = 5;
var blockRadius = tileSize / blockRadiusFactor;

var level;
var unmoveStuff = { undoStack: [], redoStack: [], spanId: "movesSpan", undoButtonId: "unmoveButton", redoButtonId: "removeButton" };
var uneditStuff = { undoStack: [], redoStack: [], spanId: "editsSpan", undoButtonId: "uneditButton", redoButtonId: "reeditButton" };
var paradoxes = [];
var enhanced = false;

var oldRowcols = [];
var animationsOn = true;    //defaults
var defaultOn = true;
var replayAnimationsOn = false;

function updateSwitches() {
    var fitDefault = "";
    if ((fitDefault = localStorage.getItem("cachedFitDefault")) !== null) {
        if (fitDefault === "fitCanvas") document.getElementById("fitCanvasDefault").checked = true;
        else if (fitDefault === "fitControls") document.getElementById("fitControlsDefault").checked = true;
    }

    if (localStorage.getItem("cachedAO") !== null) animationsOn = JSON.parse(localStorage.getItem("cachedAO"));
    if (localStorage.getItem("cachedDO") !== null) {
        defaultOn = JSON.parse(localStorage.getItem("cachedDO"));
        document.getElementById("defaultSlider").checked = defaultOn;
    }
    if (localStorage.getItem("cachedRAO") !== null) {
        replayAnimationsOn = JSON.parse(localStorage.getItem("cachedRAO"));
        document.getElementById("replayAnimationSlider").checked = replayAnimationsOn;
    }
    if (defaultOn && persistentState.showEditor) animationsOn = false;
}

var cursor = 0;
var cursorOffset = 0;
var replayString = false;
var replayLength = 0;
var switchSnakesArray = [];

function loadLevel(newLevel) {
    level = newLevel;
    currentSerializedLevel = compressSerialization(stringifyLevel(newLevel));
    var string = stringifyLevel(newLevel);
    var levelString = string.substring(string.indexOf("?") + 1, string.indexOf("/")); //everything before objects
    if (levelString.match(/[a-z]/i)) enhanced = true;

    activateAnySnakePlease();
    unmoveStuff.undoStack = [];
    unmoveStuff.redoStack = [];
    undoStuffChanged(unmoveStuff);
    uneditStuff.undoStack = [];
    uneditStuff.redoStack = [];
    undoStuffChanged(uneditStuff);
    blockSupportRenderCache = {};
    mikeSupportRenderCache = {};

    // alert(document.getElementById("editorPane").style.offsetHeight);
    if (!persistentState.showEditor) document.getElementById("ghostEditorPane").style.display = "none";
    // else toggleEditorLocation(false, localStorage.getItem("editorLocation"));
    // document.getElementById("ghostEditorPane").style.height = document.getElementById("editorPane").style.offsetHeight;
    // document.getElementById("ghostEditorPane").style.height = tileSize * level.height;  // doesn't add up

    recalculateBorderRadius();
    recalculateBlockRadius();
    updateSwitches();
    drawStaticCanvases(level);
    render();
    if (sv) {
        fitCanvas(2);
        toggleTheme(0);
        render();
    }
    else {
        var fitDefault = localStorage.getItem("cachedFitDefault") !== null ? localStorage.getItem("cachedFitDefault") : fitDefault = "";
        if (fitDefault == "" || fitDefault === "fitControls") { fitCanvas(1); fitDefault = "fitControls" }
        else { fitCanvas(0); fitDefault === "fitCanvas" }
        localStorage.setItem("cachedFitDefault", fitDefault);
    }
}

function drawStaticCanvases(level) {
    resizeCanvasContainer();
    [canvas1, canvas3, canvas5, canvas7].forEach(function (canvas) {
        canvas.width = tileSize * level.width;
        canvas.height = tileSize * level.height;
    });
    var context = canvas1.getContext("2d");
    populateThemeVars();
    context.fillStyle = "white";
    drawBackground(context, canvas1);

    context = canvas3.getContext("2d");
    var rng = new Math.seedrandom("b");
    for (var r = 0; r < level.height; r++) {
        for (var c = 0; c < level.width; c++) {
            var location = getLocation(level, r, c);
            var tileCode = level.map[location];
            if (tileCode === SPIKE || tileCode === RAINBOW || tileCode === ONEWAYWALLU || tileCode === ONEWAYWALLD) drawTile(context, tileCode, r, c, level, location, rng, true, true);
        }
    }
    context = canvas5.getContext("2d");
    for (var r = 0; r < level.height; r++) {
        for (var c = 0; c < level.width; c++) {
            var location = getLocation(level, r, c);
            var tileCode = level.map[location];
            if (tileCode === WATER || tileCode === LAVA) drawTile(context, tileCode, r, c, level, rng, location, false);
        }
    }
    for (var r = 0; r < level.height; r++) {
        for (var c = 0; c < level.width; c++) {
            var location = getLocation(level, r, c);
            var tileCode = level.map[location];
            if (tileCode === WALL) drawTile(context, tileCode, r, c, level, location, rng, true, true);
        }
    }
    for (var r = 0; r < level.height; r++) {
        for (var c = 0; c < level.width; c++) {
            var location = getLocation(level, r, c);
            var tileCode = level.map[location];
            if (tileCode === WALL) drawTile(context, tileCode, r, c, level, location, rng, false, true);
        }
    }
    for (var r = 0; r < level.height; r++) {
        for (var c = 0; c < level.width; c++) {
            var location = getLocation(level, r, c);
            var tileCode = level.map[location];
            if (tileCode === TRELLIS) drawTile(context, tileCode, r, c, level, location, rng, false, true);
        }
    }

}

var magicNumber_v0 = "3tFRIoTU";
var magicNumber = "HyRr4JK1";
var exampleLevel = magicNumber_v0 + "&" +
    "17&31" +
    "?" +
    "0000000000000000000000000000000" +
    "0000000000000000000000000000000" +
    "0000000000000000000000000000000" +
    "0000000000000000000000000000000" +
    "0000000000000000000000000000000" +
    "0000000000000000000000000000000" +
    "0000000000000000000040000000000" +
    "0000000000000110000000000000000" +
    "0000000000000111100000000000000" +
    "0000000000000011000000000000000" +
    "0000000000000010000010000000000" +
    "0000000000000010100011000000000" +
    "0000001111111000110000000110000" +
    "0000011111111111111111111110000" +
    "0000011111111101111111111100000" +
    "0000001111111100111111111100000" +
    "0000001111111000111111111100000" +
    "/" +
    "s0 ?351&350&349/" +
    "f0 ?328/" +
    "f1 ?366/";

var testLevel_v0 = "3tFRIoTU&5&5?0005*00300024005*001000/b0?7&6&15&23/s3?18/s0?1&0&5/s1?2/s4?10/s2?17/b2?9/b3?14/b4?19/b1?4&20/b5?24/";
var testLevel_v0_converted = "HyRr4JK1&5&5?0005*4024005*001000/b0?7&6&15&23/s3?18/s0?1&0&5/s1?2/s4?10/s2?17/b2?9/b3?14/b4?19/b1?4&20/b5?24/f0?8/";

function parseLevel(string) {
    // magic number
    var plCursor = 0;
    skipWhitespace();
    var versionTag = string.substr(plCursor, magicNumber.length);
    switch (versionTag) {
        case magicNumber_v0:
        case magicNumber: break;
        default: throw new Error("not a snakefall level");
    }
    plCursor += magicNumber.length;
    consumeKeyword("&");

    var level = {
        height: -1,
        width: -1,
        map: [],
        objects: [],
    };

    // height, width
    level.height = readInt();
    consumeKeyword("&");
    level.width = readInt();

    // map
    var mapData = readRun();
    mapData = decompressSerialization(mapData);
    if (level.height * level.width !== mapData.length) throw parserError("height, width, and map.length do not jive");
    var upconvertedObjects = [];
    var fruitCount = 0;
    var tileCounter = 0;
    for (var i = 0; i < mapData.length; i++) {
        var tileCode = mapData[i].charCodeAt(0);
        if (tileCode === FRUIT_v0 && versionTag === magicNumber_v0) {
            // fruit used to be a tile code. now it's an object.
            upconvertedObjects.push({
                type: FRUIT,
                id: fruitCount++,
                dead: false, // unused
                locations: [i],
                splocks: []
            });
            tileCode = SPACE;
        }
        if (validTileCodes.indexOf(tileCode) === -1) throw parserError("invalid tilecode: " + JSON.stringify(mapData[i]));
        if (tileCode === RAINBOW || tileCode === TRELLIS || tileCode === ONEWAYWALLU || tileCode === ONEWAYWALLD || tileCode === ONEWAYWALLL || tileCode === ONEWAYWALLR || tileCode === CLOSEDLIFT || tileCode === OPENLIFT || tileCode === CLOUD || tileCode === BUBBLE || tileCode === LAVA || tileCode === WATER) tileCounter++;
        level.map.push(tileCode);
    }

    // objects
    skipWhitespace();
    while (plCursor < string.length) {
        var object = {
            type: "?",
            id: -1,
            dead: false,
            locations: [],
            splocks: []
        };

        // type
        object.type = string[plCursor];
        var locationsLimit;
        if (object.type === SNAKE || object.type === BLOCK || object.type === MIKE) locationsLimit = -1;
        else if (object.type === FRUIT || object.type === POISONFRUIT) locationsLimit = 1;
        else throw parserError("expected object type code");
        plCursor += 1;

        // id
        object.id = readInt();

        // locations
        var locationsData = readRun();
        var locationStrings = locationsData.split("&");
        if (locationStrings.length === 0) throw parserError("locations must be non-empty");
        if (locationsLimit !== -1 && locationStrings.length > locationsLimit) throw parserError("too many locations");

        locationStrings.forEach(function (locationString) {
            var location = parseInt(locationString);
            if (!(0 <= location && location < level.map.length)) throw parserError("location out of bounds: " + JSON.stringify(locationString));
            object.locations.push(location);
        });

        // splocks
        if (object.type === BLOCK && string.substring(plCursor, plCursor + 1) === "?") {
            var splockData = readRun();
            var splockStrings = splockData.split("&");

            splockStrings.forEach(function (splockString) {
                var location = parseInt(splockString);
                if (!(0 <= location && location < level.map.length)) throw parserError("splock out of bounds: " + JSON.stringify(splockString));
                object.splocks.push(location);
            });
        }

        level.objects.push(object);
        skipWhitespace();
    }

    //describe level type
    if (enhanced) {
        document.getElementById("levelType").innerHTML = "Enhanced Level";
        document.getElementById("levelTypeSpan").innerHTML = "contains new user-created elements";
        document.getElementById("additions").style.display = "none";
        if (persistentState.showEditor && tileCounter === 0) {
            document.getElementById("additions").innerHTML = "all initial enhanced elements have been removed but the level is not saved";
            document.getElementById("additions").style.display = "block";
        }
    }
    else {
        document.getElementById("levelType").innerHTML = "Standard Level";
        document.getElementById("levelTypeSpan").innerHTML = "contains only original Snakebird elements";
        if (persistentState.showEditor && tileCounter > 0) {
            document.getElementById("additions").innerHTML = "enhanced elements have been added to this level but the level is not saved";
            document.getElementById("additions").style.display = "block";
        }
        else document.getElementById("additions").style.display = "none";
    }

    for (var i = 0; i < upconvertedObjects.length; i++) {
        level.objects.push(upconvertedObjects[i]);
    }

    return level;

    function skipWhitespace() {
        while (" \n\t\r".indexOf(string[plCursor]) !== -1) {
            plCursor += 1;
        }
    }
    function consumeKeyword(keyword) {
        skipWhitespace();
        if (string.indexOf(keyword, plCursor) !== plCursor) throw parserError("expected " + JSON.stringify(keyword));
        plCursor += 1;
    }
    function readInt() {
        skipWhitespace();
        for (var i = plCursor; i < string.length; i++) {
            if ("0123456789".indexOf(string[i]) === -1) break;
        }
        var substring = string.substring(plCursor, i);
        if (substring.length === 0) throw parserError("expected int");
        plCursor = i;
        return parseInt(substring, 10);
    }
    function readRun() {
        consumeKeyword("?");
        var endIndex = string.indexOf("/", plCursor);
        var substring = string.substring(plCursor, endIndex);
        plCursor = endIndex + 1;
        return substring;
    }
    function parserError(message) {
        return new Error("parse error at position " + plCursor + ": " + message);
    }
}

function serializeTileCode(tileCode) {
    return String.fromCharCode(tileCode);
}

function stringifyLevel(level) {
    var output = magicNumber + "&";
    output += level.height + "&" + level.width + "\n";

    output += "?\n";
    for (var r = 0; r < level.height; r++) {
        output += "  " + level.map.slice(r * level.width, (r + 1) * level.width).map(serializeTileCode).join("") + "\n";
    }
    output += "/\n";

    output += serializeObjects(level.objects);

    // sanity check
    // var shouldBeTheSame = parseLevel(output);
    // if (!deepEquals(level, shouldBeTheSame)) throw asdf; // serialization/deserialization is broken

    return output;
}
function serializeObjects(objects) {
    var output = "";
    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        output += object.type + object.id + " ";
        output += "?" + object.locations.join("&");
        if (object.splocks.length != 0) output += "/?" + object.splocks.join("&");
        output += "/\n";
    }
    return output;
}
function serializeObjectState(object) {
    if (object == null) return [0, []];
    return [object.dead, copyArray(object.locations), copyArray(object.splocks)];
}

var base66 = "----0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function compressSerialization(string) {
    string = string.replace(/\s+/g, "");
    // run-length encode several 0's in a row, etc.
    // 2000000000000003 -> 2*A03 ("A" is 14 in base66 defined above)
    var result = "";
    var runStart = 0;
    for (var i = 1; i < string.length + 1; i++) {
        var runLength = i - runStart;
        if (string[i] === string[runStart] && runLength < base66.length - 1) continue;
        // end of run
        if (runLength >= 4) {
            // compress
            result += "*" + base66[runLength] + string[runStart];
        } else {
            // literal
            result += string.substring(runStart, i);
        }
        runStart = i;
    }
    return result;
}
function decompressSerialization(string) {
    string = string.replace(/\s+/g, "");
    var result = "";
    for (var i = 0; i < string.length; i++) {
        if (string[i] === "*") {
            i += 1;
            var runLength = base66.indexOf(string[i]);
            i += 1;
            var char = string[i];
            for (var j = 0; j < runLength; j++) {
                result += char;
            }
        } else {
            result += string[i];
        }
    }
    return result;
}

var replayMagicNumber = "nmGTi8PB";
function stringifyReplay() {
    var output = replayMagicNumber + "&";
    // only specify the snake id in an input if it's different from the previous.
    // the first snake index is 0 to optimize for the single-snake case.
    var currentSnakeId = 0;
    for (var i = 0; i < unmoveStuff.undoStack.length; i++) {
        var firstChange = unmoveStuff.undoStack[i][0];
        if (firstChange[0] !== "i") throw unreachable();
        var snakeId = firstChange[1];
        var dr = firstChange[2];
        var dc = firstChange[3];
        var directionCode;
        if (dr === -1 && dc === 0) directionCode = "u";
        else if (dr === 0 && dc === -1) directionCode = "l";
        else if (dr === 1 && dc === 0) directionCode = "d";
        else if (dr === 0 && dc === 1) directionCode = "r";
        else throw unreachable();
        if (snakeId !== currentSnakeId) {
            output += snakeId; // int to string
            currentSnakeId = snakeId;
        }
        output += directionCode;
    }
    return output;
}
function advance() {
    var expectedPrefix = replayMagicNumber + "&";
    if (cursor <= expectedPrefix.length) {
        cursor = expectedPrefix.length;
        activeSnakeId = 0;
    }
    var snakeIdStr = "";
    var c = replayString.charAt(cursor);
    cursor++;

    if ('0' <= c && c <= '9') {
        //check if number has up to 3 digits (999)
        var d = replayString.charAt(cursor);
        var e = replayString.charAt(cursor + 1);
        if ('0' <= d && d <= '9') {
            c = c + d;
            cursor++;
            cursorOffset++;
            if ('0' <= e && e <= '9') {
                c = c + e;
                cursor++;
                cursorOffset++;
            }
        }

        //add cursor location of snake switch (location of last digit in multi-digit numbers)
        if (!switchSnakesArray.includes(cursor)) switchSnakesArray.push(cursor);
        snakeIdStr += c;
        if (cursor >= replayString.length) throw new Error("replay string has unexpected end of input");
        c = replayString.charAt(cursor);
        cursor++;
    }
    if (snakeIdStr.length > 0) {
        activeSnakeId = parseInt(snakeIdStr);
        cursorOffset++;
        // don't just validate when switching snakes, but on every move.
    }

    // doing a move.
    if (!getSnakes().some(function (snake) {
        return snake.id === activeSnakeId;
    })) {
        throw new Error("invalid snake id: " + activeSnakeId);
    }
    switch (c) {
        case 'l': move(0, -1, replayAnimationsOn); break;
        case 'u': move(-1, 0, replayAnimationsOn); break;
        case 'r': move(0, 1, replayAnimationsOn); break;
        case 'd': move(1, 0, replayAnimationsOn); break;
        default: throw new Error("replay string has invalid direction: " + c);
    }
    var pre = cursor - expectedPrefix.length - cursorOffset;
    var post = replayLength - cursor + expectedPrefix.length + cursorOffset;
    var movesText = pre + "\xa0\xa0✾\xa0\xa0" + post;
    document.getElementById("movesSpan").textContent = movesText;
}
function parseAndLoadReplay(string) {
    replayString = decompressSerialization(string);
    var expectedPrefix = replayMagicNumber + "&";
    if (replayString.substring(0, expectedPrefix.length) !== expectedPrefix) throw new Error("unrecognized replay string");
    cursor = expectedPrefix.length;
    if (!switchSnakesArray.includes(cursor)) switchSnakesArray.push(cursor);
    replayLength = 0;

    while (cursor < replayString.length) {
        var c = replayString.charAt(cursor);
        switch (c) {
            case 'l':
            case 'u':
            case 'r':
            case 'd': replayLength++; break;
        }
        cursor++;
    }

    var movesText = "0\xa0\xa0✾\xa0\xa0" + replayLength;
    document.getElementById("movesSpan").textContent = movesText;

    cursor = expectedPrefix.length;

    // the starting snakeid is 0, which may not exist, but we only validate it when doing a move.

    // now that the replay was executed successfully, undo it all so that it's available in the redo buffer.
    // reset(unmoveStuff);
    // document.getElementById("removeButton").classList.add("click-me");
}

var currentSerializedLevel;
function saveLevel() {
    if (isDead()) return alert("Can't save while a snake is dead");
    var serializedLevel = compressSerialization(stringifyLevel(level));
    currentSerializedLevel = serializedLevel;
    var hash = "#level=" + serializedLevel;
    expectHash = hash;
    location.hash = hash;

    // This marks a starting point for solving the level.
    unmoveStuff.undoStack = [];
    unmoveStuff.redoStack = [];
    editorHasBeenTouched = false;
    undoStuffChanged(unmoveStuff);
    location.reload();
}

function saveReplay() {
    if (dirtyState === EDITOR_DIRTY) return alert("Can't save a replay with unsaved editor changes.");
    // preserve the level in the url bar.
    var hash = "#level=" + currentSerializedLevel;
    if (dirtyState === REPLAY_DIRTY) {
        // there is a replay to save
        hash += "#replay=" + compressSerialization(stringifyReplay());
    }
    expectHash = hash;
    location.hash = hash;
}

function deepEquals(a, b) {
    if (a == null) return b == null;
    if (typeof a === "string" || typeof a === "number" || typeof a === "boolean") return a === b;
    if (Array.isArray(a)) {
        if (!Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
            if (!deepEquals(a[i], b[i])) return false;
        }
        return true;
    }
    // must be objects
    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    aKeys.sort();
    bKeys.sort();
    if (!deepEquals(aKeys, bKeys)) return false;
    for (var i = 0; i < aKeys.length; i++) {
        if (!deepEquals(a[aKeys[i]], b[bKeys[i]])) return false;
    }
    return true;
}

function getLocation(level, r, c) {
    if (!isInBounds(level, r, c)) throw unreachable();
    return r * level.width + c;
}
function getRowcol(level, location) {
    if (location < 0 || location >= level.width * level.height) throw unreachable();
    var r = Math.floor(location / level.width);
    var c = location % level.width;
    return { r: r, c: c };
}
function isInBounds(level, r, c) {
    if (c < 0 || c >= level.width) return false;;
    if (r < 0 || r >= level.height) return false;;
    return true;
}
function offsetLocation(location, dr, dc) {
    var rowcol = getRowcol(level, location);
    return getLocation(level, rowcol.r + dr, rowcol.c + dc);
}

var SHIFT = 1;
var CTRL = 2;
var CMD = 3;
var ALT = 4;
document.addEventListener("keydown", function (event) {
    var modifierMask = (
        (event.shiftKey ? SHIFT : 0) |
        (event.ctrlKey ? CTRL : 0) |
        (event.metaKey ? CMD : 0) |
        (event.altKey ? ALT : 0)
    );
    if (!sv) {
        switch (event.keyCode) {
            case 37: // left
                if (modifierMask === 0) { replayString = false; move(0, -1); break; }
                return;
            case 38: // up
                if (modifierMask === 0) { replayString = false; move(-1, 0); break; }
                return;
            case 39: // right
                if (modifierMask === 0) { replayString = false; move(0, 1); break; }
                return;
            case 40: // down
                if (modifierMask === 0) { replayString = false; move(1, 0); break; }
                return;
            case 8:  // backspace
                if (modifierMask === 0) { undo(unmoveStuff); break; }
                if (modifierMask === SHIFT) { redo(unmoveStuff); break; }
                return;
            case 48:   //zero
                fitCanvas(1);
                return;
            case 187:   //equals and plus
                changeCanvasSize(2);
                return;
            case 189:   //minus
                changeCanvasSize(-2);
                return;
            case "Q".charCodeAt(0):
                if (modifierMask === 0) { undo(unmoveStuff); break; }
                if (modifierMask === SHIFT) { redo(unmoveStuff); break; }
                return;
            case "Z".charCodeAt(0):
                if (modifierMask === 0) { undo(unmoveStuff); break; }
                if (modifierMask === SHIFT && !replayString) { redo(unmoveStuff); break; }
                if (modifierMask === SHIFT && replayString) { advance(); break; }
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { undo(uneditStuff); break; }
                if (persistentState.showEditor && modifierMask === (CTRL | CMD | SHIFT)) { redo(uneditStuff); break; }
                return;
            case "Y".charCodeAt(0):
                if (modifierMask === 0 && !replayString) { redo(unmoveStuff); break; }
                if (modifierMask === 0 && replayString) { advance(); break; }
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { redo(uneditStuff); break; }
                return;
            case "R".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(RAINBOW); break; }
                if (persistentState.showEditor && modifierMask === CTRL) { setPaintBrushTileCode("resize"); break; }
                if (modifierMask === 0) { reset(unmoveStuff); break; }
                if (modifierMask === SHIFT) { unreset(unmoveStuff); break; }
                return;
            case 220: // backslash
                if (modifierMask === 0) {
                    if (dirtyState != EDITOR_DIRTY) { toggleShowEditor(); break; }
                    else { alert("Can't hide editor with unsaved changes"); break; }
                }
                return;
            case "A".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(0, -1); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode("select"); break; }
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { selectAll(); break; }
                return;
            case "E".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(SPACE); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(EXIT); break; }
                return;
            case 46: // delete
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(SPACE); break; }
                return;
            case "W".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(-1, 0); break; }
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(WALL); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(WATER); break; }
                return;
            case "S".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(1, 0); break; }
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(SPIKE); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(SNAKE); break; }
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { saveLevel(); break; }
                if (!persistentState.showEditor && modifierMask === (CTRL | CMD)) { saveReplay(); break; }
                if (modifierMask === (CTRL | SHIFT)) { saveReplay(); break; }
                return;
            case "X".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { cutSelection(); break; }
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(CLOSEDLIFT); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(OPENLIFT); break; }
                return;
            case "F".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(FRUIT); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(POISONFRUIT); break; }
                return;
            case "D".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(0, 1); break; }
                return;
            case "B".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0 && !splockIsActive) { setPaintBrushTileCode(BLOCK); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(BUBBLE); break; }
                if (persistentState.showEditor && modifierMask === 0 && paintBrushTileCode === BLOCK && blockIsInFocus && splockIsActive) { splockIsActive = false; changeSpike2ButtonColor(); break; }
                return;
            case "P".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(-1, 0); break; }
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(PORTAL); break; }
                return;
            case "U".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(-1, 0); break; }
                return;
            case "L".charCodeAt(0):
                if (!persistentState.showEditor && modifierMask === 0) { replayString = false; move(-1, 0); break; }
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(LAVA); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(WATER); break; }
                return;
            case "G".charCodeAt(0):
                if (modifierMask === 0) { toggleGrid(); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { toggleGravity(); break; }
                return;
            case "C".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(CLOUD); break; }
                if (persistentState.showEditor && modifierMask === SHIFT) { toggleCollision(); break; }
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { copySelection(); break; }
                return;
            case "V".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === (CTRL | CMD)) { setPaintBrushTileCode("paste"); break; }
                return;
            case "H".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0) { toggleHotkeys(); break; }
                return;
            case "T".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(TRELLIS); break; }
                if ((!persistentState.showEditor) || (persistentState.showEditor && modifierMask === SHIFT)) { toggleTheme(); break; }
                return;
            case "O".charCodeAt(0):
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode([ONEWAYWALLU, ONEWAYWALLD, ONEWAYWALLL, ONEWAYWALLR]); break; }
                return;
            case "M".charCodeAt(0):
                // if (persistentState.showEditor && modifierMask === 0 && !blockIsInFocus) { setPaintBrushTileCode(MIKE); break; }
                return;
            case 190:
                toggleEditorLocation(true);
                break;
                return;
            case 57: // 9
                if (modifierMask === 0) { fitCanvas(0); break; }
            case 191:
                if (modifierMask === 0) { if (multiDiagrams) { cycle = true; cycleId++; render(); } break; }
            case 13:
                if (modifierMask === 0 && !replayString) { redo(unmoveStuff); break; }
                if (modifierMask === 0 && replayString) { advance(); break; }
            case 32: // spacebar
                // if (persistentState.showEditor && modifierMask === 0 && paintBrushTileCode === BLOCK && blockIsInFocus && !splockIsActive) { splockIsActive = true; changeSpike2ButtonColor(); break; }
                // if (persistentState.showEditor && modifierMask === 0 && paintBrushTileCode === BLOCK && blockIsInFocus && splockIsActive) { splockIsActive = false; changeSpike2ButtonColor(); break; }
                if (modifierMask === 0) { switchSnakes(1); break; }
                if (modifierMask === SHIFT) { switchSnakes(-1); break; }
                return;
            case 9: // tab
                if (modifierMask === 0) { switchSnakes(1); break; }
                if (modifierMask === SHIFT) { switchSnakes(-1); break; }
                return;
            case "1".charCodeAt(0):
            case "2".charCodeAt(0):
            case "3".charCodeAt(0):
            case "4".charCodeAt(0):
                var index = event.keyCode - "1".charCodeAt(0);
                var delta;
                if (modifierMask === 0) {
                    delta = 1;
                } else if (modifierMask === SHIFT) {
                    delta = -1;
                } else return;
                if (isAlive()) {
                    (function () {
                        var snakes = findSnakesOfColor(index);
                        if (snakes.length === 0) return;
                        for (var i = 0; i < snakes.length; i++) {
                            if (snakes[i].id === activeSnakeId) {
                                activeSnakeId = snakes[(i + delta + snakes.length) % snakes.length].id;
                                return;
                            }
                        }
                        activeSnakeId = snakes[0].id;
                    })();
                }
                break;
            case 27: // escape
                if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(null); break; }
                return;
            default: return;
        }
    }
    else if (!cs2) advanceAll();

    event.preventDefault();
    render();
});
function changeCanvasSize(delta) {
    if (delta !== 34) tileSize += delta;
    else tileSize = 34;
    recalculateBorderRadius();
    recalculateBlockRadius();
    textStyle.fontSize = tileSize * 5;
    blockSupportRenderCache = {};
    mikeSupportRenderCache = {};

    drawStaticCanvases(getLevel());
    resizeCanvasContainer();
    render();
}

document.getElementById("switchSnakesButton").addEventListener("click", function () {
    switchSnakes(1);
    render();
});
function switchSnakes(delta) {
    if (!isAlive()) return;
    var snakes = getSnakes();
    snakes.sort(compareId);
    for (var i = 0; i < snakes.length; i++) {
        if (snakes[i].id === activeSnakeId) {
            activeSnakeId = snakes[(i + delta + snakes.length) % snakes.length].id;
            return;
        }
    }
    activeSnakeId = snakes[0].id;
}
document.getElementById("arrowUp").addEventListener("click", function () {
    replayString = false;
    move(-1, 0);
    return;
});
document.getElementById("arrowDown").addEventListener("click", function () {
    replayString = false;
    move(1, 0);
    return;
});
document.getElementById("arrowLeft").addEventListener("click", function () {
    replayString = false;
    move(0, -1);
    return;
});
document.getElementById("arrowRight").addEventListener("click", function () {
    replayString = false;
    move(0, 1);
    return;
});
document.getElementById("minus").addEventListener("click", function () {
    changeCanvasSize(-2);
    return;
});
document.getElementById("plus").addEventListener("click", function () {
    changeCanvasSize(2);
    return;
});
document.getElementById("fitControls").addEventListener("click", function () {
    fitCanvas(1);
    return;
});
document.getElementById("fitCanvas").addEventListener("click", function () {
    fitCanvas(0);
    return;
});
document.getElementById("fitControlsDefault").addEventListener("click", function () {
    document.getElementById("fitCanvasDefault").checked = false;
    localStorage.setItem("cachedFitDefault", "fitControls");
});
document.getElementById("fitCanvasDefault").addEventListener("click", function () {
    document.getElementById("fitControlsDefault").checked = false;
    localStorage.setItem("cachedFitDefault", "fitCanvas");
});
document.getElementById("showGridButton").addEventListener("click", function () {
    toggleGrid();
});
document.getElementById("hideHotkeyButton").addEventListener("click", function () {
    toggleHotkeys();
});
document.getElementById("saveProgressButton").addEventListener("click", function () {
    saveReplay();
});
document.getElementById("copySVButton").addEventListener("click", function () {
    redoAll(unmoveStuff);
});
document.getElementById("restartButton").addEventListener("click", function () {
    reset(unmoveStuff);
    render();
});
document.getElementById("unmoveButton").addEventListener("click", function () {
    undo(unmoveStuff);
    render();
});
document.getElementById("removeButton").addEventListener("click", function () {
    redo(unmoveStuff);
    render();
});
document.getElementById("showHideEditor").addEventListener("click", function () {
    toggleShowEditor();
});
document.getElementById("animationSlider").addEventListener("click", function () {
    animationsOn = document.getElementById("animationSlider").checked;
    localStorage.setItem("cachedAO", animationsOn);
});
document.getElementById("defaultSlider").addEventListener("click", function () {
    defaultOn = document.getElementById("defaultSlider").checked;
    localStorage.setItem("cachedDO", defaultOn);
    if (defaultOn && persistentState.showEditor) document.getElementById("animationSlider").checked = false;
    animationsOn = false;
});
document.getElementById("replayAnimationSlider").addEventListener("click", function () {
    replayAnimationsOn = document.getElementById("replayAnimationSlider").checked;
    localStorage.setItem("cachedRAO", replayAnimationsOn);
});
$(document).ready(function () {
    $("body").on("click", "#ghostEditorPane", function () {
        toggleEditorLocation(true);
    });
});
function resizeCanvasContainer(cc) {
    cc = document.getElementById("canvasContainer");
    cc.style.width = tileSize * level.width;
    cc.style.height = tileSize * level.height;
}
function resetCanvases() {
    ["canvas1", "canvas2", "canvas3", "canvas4", "canvas5", "canvas6"].forEach(function (id) {
        var canvas = document.getElementById(id);
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    });
    if (!loadFromLocationHash()) {
        loadLevel(parseLevel(exampleLevel));
    }
    loadFromLocationHash();
    return;
}
function fitCanvas(type) {
    var offset = 0;
    switch (type) {
        case 0: offset = persistentState.showEditor ? 6 : 0; break;
        case 1: offset = document.getElementById("bottomBlock").offsetHeight + 10; break;
        case 2: offset = document.getElementById("csText").offsetHeight + 50; break;
    }
    var maxW = window.innerWidth / level.width;
    var maxH = (window.innerHeight - offset) / level.height;
    tileSize = Math.round(Math.min(maxW, maxH) * .97);
    recalculateBorderRadius();
    recalculateBlockRadius();
    textStyle.fontSize = tileSize * 5;
    blockSupportRenderCache = {};
    mikeSupportRenderCache = {};
    drawStaticCanvases(getLevel());
    render();
    // location.reload();  //without this, tiles appear to have borders (comment added before static canvases added)
}
function recalculateBorderRadius() {
    borderRadius = tileSize / borderRadiusFactor;
}
function recalculateBlockRadius() {
    blockRadius = tileSize / blockRadiusFactor;
}
function toggleShowEditor() {
    persistentState.showEditor = !persistentState.showEditor;
    savePersistentState();
    showEditorChanged();
    // resetCanvases();
    // resizeCanvasContainer();
}
function toggleEditorLocation(clicked, cached) {
    cached = JSON.parse(cached);
    if (clicked) {
        persistentState.editorLeft = !persistentState.editorLeft;
        localStorage.setItem("editorLocation", persistentState.editorLeft);
    } else {
        if (cached == undefined) cached = false;
        else persistentState.editorLeft = cached ? true : false;
    }
    savePersistentState();

    // get row, editor, and ghost editor
    var levelRow = document.getElementById("levelRow");
    var ghostEditorPane = document.getElementById("ghostEditorPane");
    var editorPane = document.getElementById("editorPane");

    // clone editor and ghost editor
    var ghostEditorPaneClone = ghostEditorPane.cloneNode(true);
    var editorPaneClone = editorPane.cloneNode(true);

    // remove original editor and ghost editor
    document.getElementById("ghostEditorPane").remove();
    document.getElementById("editorPane").remove();

    // determine the order to rearrange them in
    var td1 = persistentState.editorLeft ? editorPaneClone : ghostEditorPaneClone;
    var td2 = persistentState.editorLeft ? ghostEditorPaneClone : editorPaneClone;

    // insert
    levelRow.insertBefore(td1, levelRow.childNodes[0]);
    levelRow.appendChild(td2);
}
function toggleGrid() {
    persistentState.showGrid = !persistentState.showGrid;
    savePersistentState();
    render();
}
function toggleHotkeys() {
    persistentState.hideHotkeys = !persistentState.hideHotkeys;
    savePersistentState();
    var hotkeys = document.getElementsByClassName("hotkey");
    var spacers = document.getElementsByClassName("hotkeySpacer");
    var spacers2 = document.getElementsByClassName("hotkeySpacer2");
    for (var i = 0; i < hotkeys.length; i++) {
        if (persistentState.hideHotkeys) hotkeys[i].style.display = "none";
        else hotkeys[i].style.display = "block";
    }
    for (var i = 0; i < spacers.length; i++) {
        if (persistentState.hideHotkeys) spacers[i].style.height = "10px";
        else spacers[i].style.height = "1px";
    }
    for (var i = 0; i < spacers2.length; i++) {
        if (persistentState.hideHotkeys) spacers2[i].style.height = "0";
        else spacers2[i].style.height = "3px";
    }
    render();
}

["serializationTextarea", "shareLinkTextbox", "link2Textbox"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (event) {
        // let things work normally
        event.stopPropagation();
    });
});
document.getElementById("submitSerializationButton").addEventListener("click", function () {
    var newLevel = getLevel();
    loadLevel(newLevel);
});
function getLevel() {
    var string = document.getElementById("serializationTextarea").value;
    try {
        var level = parseLevel(string);
    } catch (e) {
        alert(e);
        return;
    }
    return level;
}
document.getElementById("shareLinkTextbox").addEventListener("focus", function () {
    setTimeout(function () {
        document.getElementById("shareLinkTextbox").select();
    }, 0);
});
document.getElementById("link2Textbox").addEventListener("focus", function () {
    setTimeout(function () {
        document.getElementById("link2Textbox").select();
    }, 0);
});

var paintBrushTileCode = null;
var splockIsActive = false;
var blockIsInFocus = false;
var paintBrushSnakeColorIndex = 0;
var paintBrushBlockId = 0;
var paintBrushMikeId = 0;
var paintBrushObject = null;
var selectionStart = null;
var selectionEnd = null;
var resizeDragAnchorRowcol = null;
var clipboardData = null;
var clipboardOffsetRowcol = null;
var paintButtonIdAndTileCodes = [
    ["resizeButton", "resize"],
    ["selectButton", "select"],
    ["pasteButton", "paste"],
    ["paintSpaceButton", SPACE],
    ["paintWallButton", WALL],
    ["paintSpikeButton", SPIKE],
    ["paintExitButton", EXIT],
    ["paintPortalButton", PORTAL],
    ["paintRainbowButton", RAINBOW],
    ["paintTrellisButton", TRELLIS],
    ["paintOneWayWallButton", [ONEWAYWALLU, ONEWAYWALLD, ONEWAYWALLL, ONEWAYWALLR]],
    ["paintClosedLiftButton", CLOSEDLIFT],
    ["paintOpenLiftButton", OPENLIFT],
    ["paintCloudButton", CLOUD],
    ["paintBubbleButton", BUBBLE],
    ["paintLavaButton", LAVA],
    ["paintWaterButton", WATER],
    ["paintSnakeButton", SNAKE],
    ["paintBlockButton", BLOCK],
    ["paintMikeButton", MIKE],
    ["paintFruitButton", FRUIT],
    ["paintPoisonFruitButton", POISONFRUIT],
];
paintButtonIdAndTileCodes.forEach(function (pair) {
    var id = pair[0];
    var tileCode = pair[1];
    document.getElementById(id).addEventListener("click", function () {
        setPaintBrushTileCode(tileCode);
    });
});
document.getElementById("uneditButton").addEventListener("click", function () {
    undo(uneditStuff);
    render();
});
document.getElementById("reeditButton").addEventListener("click", function () {
    redo(uneditStuff);
    render();
});
document.getElementById("saveLevelButton").addEventListener("click", function () {
    saveLevel();
});
document.getElementById("copyButton").addEventListener("click", function () {
    copySelection();
});
document.getElementById("cutButton").addEventListener("click", function () {
    cutSelection();
});
document.getElementById("cheatGravityButton").addEventListener("click", function () {
    toggleGravity();
});
document.getElementById("cheatCollisionButton").addEventListener("click", function () {
    toggleCollision();
});
document.getElementById("themeButton").addEventListener("click", function () {
    toggleTheme();
});
function toggleTheme(theme) {
    (themeCounter < themes.length - 1) ? themeCounter++ : themeCounter = 0;
    localStorage.setItem("cachedTheme", themeCounter);
    if (theme != undefined) themeCounter = theme;
    blockSupportRenderCache = [];
    mikeSupportRenderCache = [];
    document.getElementById("themeButton").innerHTML = "Theme: <b>" + themes[themeCounter][0] + "</b>";
    drawStaticCanvases(getLevel());
}
function toggleGravity() {
    isGravityEnabled = !isGravityEnabled;
    isCollisionEnabled = true;
    refreshCheatButtonText();
}
function toggleCollision() {
    isCollisionEnabled = !isCollisionEnabled;
    isGravityEnabled = false;
    refreshCheatButtonText();
}
function refreshCheatButtonText() {
    document.getElementById("cheatGravityButton").textContent = isGravityEnabled ? "Gravity: ON" : "Gravity: OFF";
    document.getElementById("cheatGravityButton").style.background = isGravityEnabled ? "" : "red";

    document.getElementById("cheatCollisionButton").textContent = isCollisionEnabled ? "Collision: ON" : "Collision: OFF";
    document.getElementById("cheatCollisionButton").style.background = isCollisionEnabled ? "" : "red";
}

// be careful with location vs rowcol, because this variable is used when resizing
var lastDraggingRowcol = null;
var hoverLocation = null;
var draggingChangeLog = null;
canvas4.addEventListener("mousedown", function (event) {
    if (event.altKey) return;
    if (event.button !== 0) return;
    event.preventDefault();
    var location = getLocationFromEvent(event);
    if (persistentState.showEditor && paintBrushTileCode != null) {
        // editor tool
        lastDraggingRowcol = getRowcol(level, location);
        if (paintBrushTileCode === "select") selectionStart = location;
        if (paintBrushTileCode === "resize") resizeDragAnchorRowcol = lastDraggingRowcol;
        draggingChangeLog = [];
        paintAtLocation(location, draggingChangeLog);
    } else {
        // playtime
        var object = findObjectAtLocation(location);
        if (object == null) return;
        if (object.type !== SNAKE) return;
        // active snake
        activeSnakeId = object.id;
        render();
    }
});
canvas4.addEventListener("dblclick", function (event) {
    if (event.altKey) return;
    if (event.button !== 0) return;
    event.preventDefault();
    if (persistentState.showEditor && paintBrushTileCode === "select") {
        // double click with select tool
        var location = getLocationFromEvent(event);
        var object = findObjectAtLocation(location);
        if (object == null) return;
        stopDragging();
        if (object.type === SNAKE) {
            // edit snakes of this color
            paintBrushTileCode = SNAKE;
            paintBrushSnakeColorIndex = object.id % snakeColors.length;
        } else if (object.type === BLOCK) {
            // edit this particular block
            paintBrushTileCode = BLOCK;
            paintBrushBlockId = object.id;
        } else if (object.type === MIKE) {
            // edit this particular mike
            paintBrushTileCode = MIKE;
            paintBrushMikeId = object.id;
        } else if (object.type === FRUIT) {
            // edit fruits, i guess
            paintBrushTileCode = FRUIT;
        } else if (object.type === POISONFRUIT) {
            // edit poison fruits, i guess
            paintBrushTileCode = POISONFRUIT;
        }
        else throw unreachable();
        paintBrushTileCodeChanged();
    }
});
document.addEventListener("mouseup", function (event) {
    stopDragging();
});
function stopDragging() {
    if (lastDraggingRowcol != null) {
        // release the draggin'
        lastDraggingRowcol = null;
        paintBrushObject = null;
        resizeDragAnchorRowcol = null;
        pushUndo(uneditStuff, draggingChangeLog);
        draggingChangeLog = null;
    }
}
canvas4.addEventListener("mousemove", function (event) {
    if (!persistentState.showEditor) return;
    var location = getLocationFromEvent(event);
    var mouseRowcol = getRowcol(level, location);
    if (lastDraggingRowcol != null) {
        // Dragging Force - Through the Fruit and Flames
        var lastDraggingLocation = getLocation(level, lastDraggingRowcol.r, lastDraggingRowcol.c);
        // we need to get rowcols for everything before we start dragging, because dragging might resize the world.
        var path = getNaiveOrthogonalPath(lastDraggingLocation, location).map(function (location) {
            return getRowcol(level, location);
        });
        path.forEach(function (rowcol) {
            // convert to location at the last minute in case each of these steps is changing the coordinate system.
            paintAtLocation(getLocation(level, rowcol.r, rowcol.c), draggingChangeLog);
        });
        lastDraggingRowcol = mouseRowcol;
        hoverLocation = null;
    } else {
        // hovering
        if (hoverLocation !== location) {
            hoverLocation = location;
            render();
        }
    }
});
canvas4.addEventListener("mouseout", function () {
    if (hoverLocation !== location) {
        // turn off the hover when the mouse leaves
        hoverLocation = null;
        render();
    }
});
function getLocationFromEvent(event) {
    var r = Math.floor(eventToMouseY(event, canvas4) / tileSize);
    var c = Math.floor(eventToMouseX(event, canvas4) / tileSize);
    // since the canvas4 is centered, the bounding client rect can be half-pixel aligned,
    // resulting in slightly out-of-bounds mouse events.
    r = clamp(r, 0, level.height);
    c = clamp(c, 0, level.width);
    return getLocation(level, r, c);
}
function eventToMouseX(event, canvas4) { return event.clientX - canvas4.getBoundingClientRect().left; }
function eventToMouseY(event, canvas4) { return event.clientY - canvas4.getBoundingClientRect().top; }

function selectAll() {
    selectionStart = 0;
    selectionEnd = level.map.length - 1;
    setPaintBrushTileCode("select");
}

function setPaintBrushTileCode(tileCode) {
    var spike2 = document.getElementById("paintSplockButton");
    if (tileCode !== MIKE && tileCode !== BLOCK) {
        blockIsInFocus = false;
        splockIsActive = false;
    }

    if (tileCode === "paste" && clipboardData == null) return;
    if (paintBrushTileCode === "select" && tileCode !== "select" && selectionStart != null && selectionEnd != null) {
        // usually this means to fill in the selection
        if (tileCode == null) {
            // cancel selection
            selectionStart = null;
            selectionEnd = null;
            return;
        }
        if (typeof tileCode === "number" && tileCode !== PORTAL) {
            // fill in the selection
            fillSelection(tileCode);
            selectionStart = null;
            selectionEnd = null;
            return;
        }
        // ok, just select something else then.
        selectionStart = null;
        selectionEnd = null;
    }
    if (tileCode === SNAKE) {
        if (paintBrushTileCode === SNAKE) {
            // next snake color
            paintBrushSnakeColorIndex = (paintBrushSnakeColorIndex + 1) % snakeColors.length;
        }
    } else if (tileCode === BLOCK) {
        if (!splockIsActive) {
            var blocks = getBlocks();
            if (paintBrushTileCode === BLOCK && blocks.length > 0) {
                spike2.textContent = "Splock";
                // cycle through block ids
                blocks.sort(compareId);
                if (paintBrushBlockId != null) {
                    blockIsInFocus = true;
                    spike2.textContent = "Splock";
                    (function () {
                        for (var i = 0; i < blocks.length; i++) {
                            if (blocks[i].id === paintBrushBlockId) {
                                i += 1;
                                if (i < blocks.length) {
                                    // next block id
                                    paintBrushBlockId = blocks[i].id;
                                } else {
                                    // new block id
                                    paintBrushBlockId = null;
                                }
                                return;
                            }
                        }
                        throw unreachable()
                    })();
                } else {
                    // first one
                    blockIsInFocus = true;
                    spike2.textContent = "Splock";
                    paintBrushBlockId = blocks[0].id;
                }
            } else {
                // new block id
                paintBrushBlockId = null;
            }
        }
        else {
            splockIsActive = false;
            changeSpike2ButtonColor();
        }
    } else if (tileCode === MIKE) {
        if (!blockIsInFocus) {
            var mikes = getMikes();
            if (paintBrushTileCode === MIKE && mikes.length > 0) {
                // cycle through mikes ids
                mikes.sort(compareId);
                if (paintBrushMikeId != null) {
                    (function () {
                        for (var i = 0; i < mikes.length; i++) {
                            if (mikes[i].id === paintBrushMikeId) {
                                i += 1;
                                if (i < mikes.length) {
                                    // next mikes id
                                    paintBrushMikeId = mikes[i].id;
                                } else {
                                    // new mikes id
                                    paintBrushMikeId = null;
                                }
                                return;
                            }
                        }
                        throw unreachable()
                    })();
                } else {
                    // first one
                    paintBrushMikeId = mikes[0].id;
                }
            } else {
                // new mikes id
                paintBrushMikeId = null;
            }
        }
        else {
            if (paintBrushTileCode === BLOCK && !splockIsActive) { splockIsActive = true; changeSpike2ButtonColor(); }
            else if (paintBrushTileCode === BLOCK && splockIsActive) { splockIsActive = false; changeSpike2ButtonColor(); }
        }
    } else if (Array.isArray(tileCode)) {
        if (paintBrushTileCode === tileCode[OWWCounter]) {
            OWWCounter++;
            if (OWWCounter > 3) OWWCounter = 0;
        }
    } else if (tileCode == null) {
        // escape
        if (paintBrushTileCode === BLOCK && paintBrushBlockId != null) {
            // stop editing this block, but keep the block brush selected
            tileCode = BLOCK;
            paintBrushBlockId = null;
        }
        if (paintBrushTileCode === MIKE && paintBrushMikeId != null) {
            // stop editing this mike, but keep the mike brush selected
            tileCode = MIKE;
            paintBrushMikeId = null;
        }
    }
    if (!(tileCode === MIKE && blockIsInFocus)) {
        paintBrushTileCode = Array.isArray(tileCode) ? tileCode[OWWCounter] : tileCode;
        paintBrushTileCodeChanged();
    }
}
function paintBrushTileCodeChanged() {
    paintButtonIdAndTileCodes.forEach(function (pair) {
        var id = pair[0];
        var tileCode = pair[1];
        var backgroundStyle = "";
        var textColor = "";
        if (Array.isArray(tileCode)) {
            var direction = tileCode[OWWCounter];
            switch (direction) {
                case 117: direction = "Up"; break;
                case 100: direction = "Down"; break;
                case 108: direction = "Left"; break;
                case 114: direction = "Right"; break;
            }
            document.getElementById("paintOneWayWallButton").textContent = "One-Way " + direction;
        }
        if (tileCode === paintBrushTileCode || tileCode[OWWCounter] === paintBrushTileCode) {
            if (tileCode === SNAKE) {
                // show the color of the active snake in the color of the button
                backgroundStyle = snakeColors[paintBrushSnakeColorIndex];
            } else {
                backgroundStyle = "linear-gradient(#4b91ff, #055ce4)";
                textColor = "white";
            }
        }
        document.getElementById(id).style.background = backgroundStyle;
        document.getElementById(id).style.color = textColor;
    });

    var isSelectionMode = paintBrushTileCode === "select";
    ["cutButton", "copyButton"].forEach(function (id) {
        document.getElementById(id).disabled = !isSelectionMode;
    });
    document.getElementById("pasteButton").disabled = clipboardData == null;

    render();
}
function changeSpike2ButtonColor() {
    var button = document.getElementById("paintSplockButton");
    // if (splockIsActive) {
    //     button.style.background = "linear-gradient(#4b91ff, #055ce4)";
    //     button.style.color = "white";
    // }
    // else {
    //     button.style.background = "";
    //     button.style.color = "";
    // }
}

function cutSelection() {
    copySelection();
    fillSelection(SPACE);
    render();
}
function copySelection() {
    var selectedLocations = getSelectedLocations();
    if (selectedLocations.length === 0) return;
    var selectedObjects = [];
    selectedLocations.forEach(function (location) {
        var object = findObjectAtLocation(location);
        if (object != null) addIfAbsent(selectedObjects, object);
    });
    setClipboardData({
        level: JSON.parse(JSON.stringify(level)),
        selectedLocations: selectedLocations,
        selectedObjects: JSON.parse(JSON.stringify(selectedObjects)),
    });
}
function setClipboardData(data) {
    // find the center
    var minR = Infinity;
    var maxR = -Infinity;
    var minC = Infinity;
    var maxC = -Infinity;
    data.selectedLocations.forEach(function (location) {
        var rowcol = getRowcol(data.level, location);
        if (rowcol.r < minR) minR = rowcol.r;
        if (rowcol.r > maxR) maxR = rowcol.r;
        if (rowcol.c < minC) minC = rowcol.c;
        if (rowcol.c > maxC) maxC = rowcol.c;
    });
    var offsetR = Math.floor((minR + maxR) / 2);
    var offsetC = Math.floor((minC + maxC) / 2);

    clipboardData = data;
    clipboardOffsetRowcol = { r: offsetR, c: offsetC };
    paintBrushTileCodeChanged();
}
function fillSelection(tileCode) {
    var changeLog = [];
    var locations = getSelectedLocations();
    locations.forEach(function (location) {
        if (level.map[location] !== tileCode) {
            changeLog.push(["m", location, level.map[location], tileCode]);
            level.map[location] = tileCode;
        }
        removeAnyObjectAtLocation(location, changeLog);
    });
    pushUndo(uneditStuff, changeLog);
}
function getSelectedLocations() {
    if (selectionStart == null || selectionEnd == null) return [];
    var rowcol1 = getRowcol(level, selectionStart);
    var rowcol2 = getRowcol(level, selectionEnd);
    var r1 = rowcol1.r;
    var c1 = rowcol1.c;
    var r2 = rowcol2.r;
    var c2 = rowcol2.c;
    if (r2 < r1) {
        var tmp = r1;
        r1 = r2;
        r2 = tmp;
    }
    if (c2 < c1) {
        var tmp = c1;
        c1 = c2;
        c2 = tmp;
    }
    var objects = [];
    var locations = [];
    for (var r = r1; r <= r2; r++) {
        for (var c = c1; c <= c2; c++) {
            var location = getLocation(level, r, c);
            locations.push(location);
            var object = findObjectAtLocation(location);
            if (object != null) addIfAbsent(objects, object);
        }
    }
    // select the rest of any partially-selected objects
    objects.forEach(function (object) {
        object.locations.forEach(function (location) {
            addIfAbsent(locations, location);
        });
    });
    return locations;
}

function setHeight(newHeight, changeLog) {
    if (newHeight < level.height) {
        // crop
        for (var r = newHeight; r < level.height; r++) {
            for (var c = 0; c < level.width; c++) {
                var location = getLocation(level, r, c);
                removeAnyObjectAtLocation(location, changeLog);
                // also delete non-space tiles
                paintTileAtLocation(location, SPACE, changeLog);
            }
        }
        level.map.splice(newHeight * level.width);
    } else {
        // expand
        for (var r = level.height; r < newHeight; r++) {
            for (var c = 0; c < level.width; c++) {
                level.map.push(SPACE);
            }
        }
    }
    changeLog.push(["h", level.height, newHeight]);
    level.height = newHeight;
}
function setWidth(newWidth, changeLog) {
    if (newWidth < level.width) {
        // crop
        for (var r = level.height - 1; r >= 0; r--) {
            for (var c = level.width - 1; c >= newWidth; c--) {
                var location = getLocation(level, r, c);
                removeAnyObjectAtLocation(location, changeLog);
                paintTileAtLocation(location, SPACE, changeLog);
                level.map.splice(location, 1);
            }
        }
    } else {
        // expand
        for (var r = level.height - 1; r >= 0; r--) {
            var insertionPoint = level.width * (r + 1);
            for (var c = level.width; c < newWidth; c++) {
                // boy is this inefficient. ... YOLO!
                level.map.splice(insertionPoint, 0, SPACE);
            }
        }
    }

    var transformLocation = makeScaleCoordinatesFunction(level.width, newWidth);
    level.objects.forEach(function (object) {
        object.locations = object.locations.map(transformLocation);
    });

    changeLog.push(["w", level.width, newWidth]);
    level.width = newWidth;
}

function newSnake(color, location) {
    var snakes = findSnakesOfColor(color);
    snakes.sort(compareId);
    for (var i = 0; i < snakes.length; i++) {
        if (snakes[i].id !== i * snakeColors.length + color) break;
    }
    return {
        type: SNAKE,
        id: i * snakeColors.length + color,
        dead: false,
        locations: [location],
        splocks: [] //unused
    };
}
function newBlock(location) {
    var blocks = getBlocks();
    blocks.sort(compareId);
    for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].id !== i) break;
    }
    return {
        type: BLOCK,
        id: i,
        dead: false, // unused
        locations: [location],
        splocks: []
    };
}
function newMike(location) {
    var mikes = getMikes();
    mikes.sort(compareId);
    for (var i = 0; i < mikes.length; i++) {
        if (mikes[i].id !== i) break;
    }
    return {
        type: MIKE,
        id: i,
        dead: false, // unused
        locations: [location],
        splocks: [] //unused
    };
}
function newFruit(location) {
    var fruits = getObjectsOfType(FRUIT);
    fruits.sort(compareId);
    for (var i = 0; i < fruits.length; i++) {
        if (fruits[i].id !== i) break;
    }
    return {
        type: FRUIT,
        id: i,
        dead: false, // unused
        locations: [location],
        splocks: [] //unused
    };
}
function newPoisonFruit(location) {
    var fruits = getObjectsOfType(POISONFRUIT);
    fruits.sort(compareId);
    for (var i = 0; i < fruits.length; i++) {
        if (fruits[i].id !== i) break;
    }
    return {
        type: POISONFRUIT,
        id: i,
        dead: false, // unused
        locations: [location],
        splocks: [] //unused
    };
}
function paintAtLocation(location, changeLog) {
    if (typeof paintBrushTileCode === "number") {
        removeAnyObjectAtLocation(location, changeLog);
        paintTileAtLocation(location, paintBrushTileCode, changeLog);
    } else if (paintBrushTileCode === "resize") {
        var toRowcol = getRowcol(level, location);
        var dr = toRowcol.r - resizeDragAnchorRowcol.r;
        var dc = toRowcol.c - resizeDragAnchorRowcol.c;
        resizeDragAnchorRowcol = toRowcol;
        if (dr !== 0) setHeight(level.height + dr, changeLog);
        if (dc !== 0) setWidth(level.width + dc, changeLog);
        if (dr !== 0 || dc !== 0) didResize = true;
    } else if (paintBrushTileCode === "select") {
        selectionEnd = location;
    } else if (paintBrushTileCode === "paste") {
        var hoverRowcol = getRowcol(level, location);
        var pastedData = previewPaste(hoverRowcol.r, hoverRowcol.c);
        pastedData.selectedLocations.forEach(function (location) {
            var tileCode = pastedData.level.map[location];
            removeAnyObjectAtLocation(location, changeLog);
            paintTileAtLocation(location, tileCode, changeLog);
        });
        pastedData.selectedObjects.forEach(function (object) {
            // refresh the ids so there are no collisions.
            if (object.type === SNAKE) {
                object.id = newSnake(object.id % snakeColors.length).id;
            } else if (object.type === BLOCK) {
                object.id = newBlock().id;
            } else if (object.type === MIKE) {
                object.id = newMike().id;
            } else if (object.type === FRUIT) {
                object.id = newFruit().id;
            } else if (object.type === POISONFRUIT) {
                object.id = newPoisonFruit().id;
            } else throw unreachable();
            level.objects.push(object);
            changeLog.push([object.type, object.id, [0, []], serializeObjectState(object)]);
        });
    } else if (paintBrushTileCode === SNAKE) {
        var oldSnakeSerialization = serializeObjectState(paintBrushObject);
        if (paintBrushObject != null) {
            // keep dragging
            if (paintBrushObject.locations[0] === location) return; // we just did that
            // watch out for self-intersection
            var selfIntersectionIndex = paintBrushObject.locations.indexOf(location);
            if (selfIntersectionIndex !== -1) {
                // truncate from here back
                paintBrushObject.locations.splice(selfIntersectionIndex);
            }
        }

        // make sure there's space behind us
        paintTileAtLocation(location, SPACE, changeLog);
        removeAnyObjectAtLocation(location, changeLog);
        if (paintBrushObject == null) {
            var thereWereNoSnakes = countSnakes() === 0;
            paintBrushObject = newSnake(paintBrushSnakeColorIndex, location);
            level.objects.push(paintBrushObject);
            if (thereWereNoSnakes) activateAnySnakePlease();
        } else {
            // extend le snake
            paintBrushObject.locations.unshift(location);
        }
        changeLog.push([paintBrushObject.type, paintBrushObject.id, oldSnakeSerialization, serializeObjectState(paintBrushObject)]);
    } else if (paintBrushTileCode === BLOCK) {
        blockIsInFocus = true;
        var objectHere = findObjectAtLocation(location);
        if (paintBrushBlockId == null && objectHere != null && objectHere.type === BLOCK) {
            // just start editing this block
            paintBrushBlockId = objectHere.id;
        } else {
            // make a change
            // make sure there's space behind us
            paintTileAtLocation(location, SPACE, changeLog);
            var thisBlock = null;
            if (paintBrushBlockId != null) {
                thisBlock = findBlockById(paintBrushBlockId);
            }
            var oldBlockSerialization = serializeObjectState(thisBlock);
            if (thisBlock == null) {
                // create new block
                removeAnyObjectAtLocation(location, changeLog);
                thisBlock = newBlock(location);
                level.objects.push(thisBlock);
                paintBrushBlockId = thisBlock.id;
            } else {
                var existingIndex = thisBlock.locations.indexOf(location);
                var existingSplockIndex = thisBlock.splocks.indexOf(location);
                if (existingIndex !== -1) {
                    // reclicking part of this object means to delete just part of it.
                    if (thisBlock.locations.length === 1) {
                        // goodbye
                        removeObject(thisBlock, changeLog);
                        paintBrushBlockId = null;
                    } else {
                        thisBlock.locations.splice(existingIndex, 1);
                        if (splockIsActive) thisBlock.splocks.push(location);
                    }
                } else if (existingSplockIndex !== -1) {
                    thisBlock.splocks.splice(existingSplockIndex, 1);
                    if (!splockIsActive) thisBlock.locations.push(location);
                }
                else {
                    if (!splockIsActive) {
                        // add a tile to the block
                        removeAnyObjectAtLocation(location, changeLog);
                        thisBlock.locations.push(location);
                    }
                    else {
                        //add a spike to the block
                        removeAnyObjectAtLocation(location, changeLog);
                        thisBlock.splocks.push(location);
                    }
                }
            }
            changeLog.push([thisBlock.type, thisBlock.id, oldBlockSerialization, serializeObjectState(thisBlock)]);
            delete blockSupportRenderCache[thisBlock.id];
        }
    } else if (paintBrushTileCode === MIKE) {
        var objectHere = findObjectAtLocation(location);
        if (paintBrushMikeId == null && objectHere != null && objectHere.type === MIKE) {
            // just start editing this mike
            paintBrushMikeId = objectHere.id;
        } else {
            // make a change
            // make sure there's space behind us
            paintTileAtLocation(location, SPACE, changeLog);
            var thisMike = null;
            if (paintBrushMikeId != null) {
                thisMike = findMikeById(paintBrushMikeId);
            }
            var oldMikeSerialization = serializeObjectState(thisMike);
            if (thisMike == null) {
                // create new mike
                removeAnyObjectAtLocation(location, changeLog);
                thisMike = newMike(location);
                level.objects.push(thisMike);
                paintBrushMikeId = thisMike.id;
            } else {
                var existingIndex = thisMike.locations.indexOf(location);
                if (existingIndex !== -1) {
                    // reclicking part of this object means to delete just part of it.
                    if (thisMike.locations.length === 1) {
                        // goodbye
                        removeObject(thisMike, changeLog);
                        paintBrushMikeId = null;
                    } else {
                        thisMike.locations.splice(existingIndex, 1);
                    }
                } else {
                    // add a tile to the mike
                    removeAnyObjectAtLocation(location, changeLog);
                    thisMike.locations.push(location);
                }
            }
            changeLog.push([thisMike.type, thisMike.id, oldMikeSerialization, serializeObjectState(thisMike)]);
            delete mikeSupportRenderCache[thisMike.id];
        }
    } else if (paintBrushTileCode === FRUIT || paintBrushTileCode === POISONFRUIT) {
        paintTileAtLocation(location, SPACE, changeLog);
        removeAnyObjectAtLocation(location, changeLog);
        var object = paintBrushTileCode == FRUIT ? newFruit(location) : newPoisonFruit(location);
        level.objects.push(object);
        changeLog.push([object.type, object.id, serializeObjectState(null), serializeObjectState(object)]);
    } else throw unreachable();
    render();
}

function paintTileAtLocation(location, tileCode, changeLog) {
    if (level.map[location] === tileCode) return;
    changeLog.push(["m", location, level.map[location], tileCode]);
    level.map[location] = tileCode;
}

function pushUndo(undoStuff, changeLog) {
    // changeLog = [
    //   ["i", 0, -1, 0, animationQueue, freshlyRemovedAnimatedObjects],
    //                                                 // player input for snake 0, dr:-1, dc:0. has no effect on state.
    //                                                 //   "i" is always the first change in normal player movement.
    //                                                 //   if a changeLog does not start with "i", then it is an editor action.
    //                                                 //   animationQueue and freshlyRemovedAnimatedObjects
    //                                                 //   are used for animating re-move.
    //   ["m", 21, 0, 1],                              // map at location 23 changed from 0 to 1
    //   ["s", 0, [false, [1,2]], [false, [2,3]]],     // snake id 0 moved from alive at [1, 2] to alive at [2, 3]
    //   ["s", 1, [false, [11,12]], [true, [12,13]]],  // snake id 1 moved from alive at [11, 12] to dead at [12, 13]
    //   ["b", 1, [false, [20,30]], [false, []]],      // block id 1 was deleted from location [20, 30]
    //   ["f", 0, [false, [40]], [false, []]],         // fruit id 0 was deleted from location [40]
    //   ["h", 25, 10],                                // height changed from 25 to 10. all cropped tiles are guaranteed to be SPACE.
    //   ["w", 8, 10],                                 // width changed from 8 to 10. a change in the coordinate system.
    //   ["m", 23, 2, 0],                              // map at location 23 changed from 2 to 0 in the new coordinate system.
    //   10,                                           // the last change is always a declaration of the final width of the map.
    // ];
    reduceChangeLog(changeLog);
    if (changeLog.length === 0) return;
    changeLog.push(level.width);
    undoStuff.undoStack.push(changeLog);
    undoStuff.redoStack = [];
    paradoxes = [];

    if (undoStuff === uneditStuff) editorHasBeenTouched = true;

    undoStuffChanged(undoStuff);
}
function reduceChangeLog(changeLog) {
    for (var i = 0; i < changeLog.length - 1; i++) {
        var change = changeLog[i];
        if (change[0] === "i") {
            continue; // don't reduce player input
        } else if (change[0] === "h") {
            for (var j = i + 1; j < changeLog.length; j++) {
                var otherChange = changeLog[j];
                if (otherChange[0] === "h") {
                    // combine
                    change[2] = otherChange[2];
                    changeLog.splice(j, 1);
                    j--;
                    continue;
                } else if (otherChange[0] === "w") {
                    continue; // no interaction between height and width
                } else break; // no more reduction possible
            }
            if (change[1] === change[2]) {
                // no change
                changeLog.splice(i, 1);
                i--;
            }
        } else if (change[0] === "w") {
            for (var j = i + 1; j < changeLog.length; j++) {
                var otherChange = changeLog[j];
                if (otherChange[0] === "w") {
                    // combine
                    change[2] = otherChange[2];
                    changeLog.splice(j, 1);
                    j--;
                    continue;
                } else if (otherChange[0] === "h") {
                    continue; // no interaction between height and width
                } else break; // no more reduction possible
            }
            if (change[1] === change[2]) {
                // no change
                changeLog.splice(i, 1);
                i--;
            }
        } else if (change[0] === "m") {
            for (var j = i + 1; j < changeLog.length; j++) {
                var otherChange = changeLog[j];
                if (otherChange[0] === "m" && otherChange[1] === change[1]) {
                    // combine
                    change[3] = otherChange[3];
                    changeLog.splice(j, 1);
                    j--;
                } else if (otherChange[0] === "w" || otherChange[0] === "h") {
                    break; // can't reduce accros resizes
                }
            }
            if (change[2] === change[3]) {
                // no change
                changeLog.splice(i, 1);
                i--;
            }
        } else if (change[0] === SNAKE || change[0] === BLOCK || change[0] === MIKE || change[0] === FRUIT || change[0] === POISONFRUIT) {
            for (var j = i + 1; j < changeLog.length; j++) {
                var otherChange = changeLog[j];
                if (otherChange[0] === change[0] && otherChange[1] === change[1]) {
                    // combine
                    change[3] = otherChange[3];
                    changeLog.splice(j, 1);
                    j--;
                } else if (otherChange[0] === "w" || otherChange[0] === "h") {
                    break; // can't reduce accros resizes
                }
            }
            if (deepEquals(change[2], change[3])) {
                // no change
                changeLog.splice(i, 1);
                i--;
            }
        } else throw unreachable();
    }
}
function undo(undoStuff) {
    canvas7.style.display = "none";
    if (replayString) {
        var expectedPrefix = replayMagicNumber + "&";
        if (cursor > expectedPrefix.length) cursor--;
        if (cursor == expectedPrefix.length) activeSnakeId = 0;
        var c = replayString.charAt(cursor);

        if ('0' <= c && c <= '9') {
            var d = replayString.charAt(cursor - 1);
            var e = replayString.charAt(cursor - 2);
            if ('0' <= d && d <= '9') {
                c = d + c;
                cursor--;
                cursorOffset--;
                if ('0' <= e && e <= '9') {
                    c = e + c;
                    cursor--;
                    cursorOffset--;
                }
            }

            // var previousSnakeChanges = switchSnakesArray.slice(0,);
            var previousSnake = Math.max.apply(Math, switchSnakesArray.filter(function (x) { return x < cursor }));
            if (previousSnake == expectedPrefix.length) activeSnakeId = 0;
            else {
                var snakeIdStr = replayString.charAt(previousSnake - 1);
                activeSnakeId = parseInt(snakeIdStr);
            }
            cursor--;
            cursorOffset--;
        }
    }

    postPortalSnakeOutline = [];
    portalConflicts = [];
    portalOutOfBounds = false;
    if (undoStuff.undoStack.length === 0) return; // already at the beginning
    animationQueue = [];
    animationQueueCursor = 0;
    paradoxes = [];
    undoOneFrame(undoStuff);
    undoStuffChanged(undoStuff);
}
function reset(undoStuff) {
    canvas7.style.display = "none";
    cursor = 0;
    portalFailure = false;
    animationQueue = [];
    animationQueueCursor = 0;
    paradoxes = [];
    while (undoStuff.undoStack.length > 0) {
        undoOneFrame(undoStuff);
    }
    undoStuffChanged(undoStuff);
}
function undoOneFrame(undoStuff) {
    var doThis = undoStuff.undoStack.pop();
    var redoChangeLog = [];
    undoChanges(doThis, redoChangeLog);
    if (redoChangeLog.length > 0) {
        redoChangeLog.push(level.width);
        undoStuff.redoStack.push(redoChangeLog);
    }

    if (undoStuff === uneditStuff) editorHasBeenTouched = true;
}
function redo(undoStuff) {
    if (undoStuff.redoStack.length === 0) return; // already at the beginning
    animationQueue = [];
    animationQueueCursor = 0;
    paradoxes = [];
    redoOneFrame(undoStuff);
    undoStuffChanged(undoStuff);
}
function redoAll(undoStuff) {
    if (dirtyState === EDITOR_DIRTY) return alert("Can't save a replay with unsaved editor changes.");
    // preserve the level in the url bar.
    var hash = "#sv=" + currentSerializedLevel;
    if (dirtyState === REPLAY_DIRTY) {
        // there is a replay to save
        hash += "#replay=" + compressSerialization(stringifyReplay());
    }

    var svURL = "https://jmdiamond3.github.io/Snakefall-Redesign/Framework.html" + hash;
    copyToClipboard(svURL);
}
function advanceAll() {
    cs2 = true;
    context = canvas7.getContext("2d");
    context.fillStyle = "rgba(0,0,0,.5)";
    context.fillRect(0, 0, level.width * tileSize, level.height * tileSize);

    context.fillStyle = "orange";
    context.font = "100px Impact";
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.shadowColor = "rgba(0,0,0,0.5)";
    context.shadowBlur = 4;
    var textString = "Loading";
    context.textBaseline = "middle";
    var textWidth = context.measureText(textString).width;
    context.fillText(textString, (canvas7.width / 2) - (textWidth / 2), canvas7.height / 2);

    setTimeout(function () {
        cs = true;
        while (cursor < replayString.length) advance();
        context.clearRect(0, 0, canvas7.width, canvas7.height);
        if (checkResult) {
            cr = true;
            dont = true;
            render();
        }
        else {
            dont = true;
            render();
        }
    }, 2000);

}
function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    // to avoid breaking orgain page when copying more words
    // cant copy when adding below this code
    // dummy.style.display = 'none'
    document.body.appendChild(dummy);
    //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}
function unreset(undoStuff) {
    animationQueue = [];
    animationQueueCursor = 0;
    paradoxes = [];
    while (undoStuff.redoStack.length > 0) {
        redoOneFrame(undoStuff);
    }
    undoStuffChanged(undoStuff);

    // don't animate the last frame
    animationQueue = [];
    animationQueueCursor = 0;
    freshlyRemovedAnimatedObjects = [];
}
function redoOneFrame(undoStuff) {
    var doThis = undoStuff.redoStack.pop();
    var undoChangeLog = [];
    undoChanges(doThis, undoChangeLog);
    if (undoChangeLog.length > 0) {
        undoChangeLog.push(level.width);
        undoStuff.undoStack.push(undoChangeLog);
    }
    if (undoStuff === uneditStuff) editorHasBeenTouched = true;
}
function undoChanges(changes, changeLog) {
    var widthContext = changes.pop();
    var transformLocation = widthContext === level.width ? identityFunction : makeScaleCoordinatesFunction(widthContext, level.width);
    for (var i = changes.length - 1; i >= 0; i--) {
        var paradoxDescription = undoChange(changes[i]);
        if (paradoxDescription != null) paradoxes.push(paradoxDescription);
    }

    var lastChange = changes[changes.length - 1];
    if (lastChange[0] === "i") {
        // replay animation
        animationQueue = lastChange[4];
        animationQueueCursor = 0;
        freshlyRemovedAnimatedObjects = lastChange[5];
        animationStart = new Date().getTime();
    }

    function undoChange(change) {
        // note: everything here is going backwards: to -> from
        if (change[0] === "i") {
            // no state change, but preserve the intention.
            changeLog.push(change);
            return null;
        } else if (change[0] === "h") {
            // change height
            var fromHeight = change[1];
            var toHeight = change[2];
            if (level.height !== toHeight) return "Impossible";
            setHeight(fromHeight, changeLog);
        } else if (change[0] === "w") {
            // change width
            var fromWidth = change[1];
            var toWidth = change[2];
            if (level.width !== toWidth) return "Impossible";
            setWidth(fromWidth, changeLog);
        } else if (change[0] === "m") {
            // change map tile
            var location = transformLocation(change[1]);
            var fromTileCode = change[2];
            var toTileCode = change[3];
            if (location >= level.map.length) return "Can't turn " + describe(toTileCode) + " into " + describe(fromTileCode) + " out of bounds";
            if (level.map[location] !== toTileCode) return "Can't turn " + describe(toTileCode) + " into " + describe(fromTileCode) + " because there's " + describe(level.map[location]) + " there now";
            paintTileAtLocation(location, fromTileCode, changeLog);
        } else if (change[0] === SNAKE || change[0] === BLOCK || change[0] === MIKE || change[0] === FRUIT || change[0] === POISONFRUIT) {
            // change object
            var type = change[0];
            var id = change[1];
            var fromDead = change[2][0];
            var toDead = change[3][0];
            var fromLocations = change[2][1].map(transformLocation);
            var toLocations = change[3][1].map(transformLocation);
            var fromSplocks = change[2][2].map(transformLocation);
            var toSplocks = change[3][2].map(transformLocation);
            if (fromLocations.filter(function (location) { return location >= level.map.length; }).length > 0) {
                return "Can't move " + describe(type, id) + " out of bounds";
            }
            if (fromSplocks.filter(function (location) { return location >= level.map.length; }).length > 0) {
                return "Can't move " + describe(type, id) + " out of bounds";
            }
            var object = findObjectOfTypeAndId(type, id);
            if (toLocations.length !== 0 || toSplocks.length !== 0) {
                // should exist at this location
                if (object == null) return "Can't move " + describe(type, id) + " because it doesn't exist";
                if (!deepEquals(object.locations, toLocations)) return "Can't move " + describe(object) + " because it's in the wrong place";
                if (!deepEquals(object.splocks, toSplocks)) return "Can't move " + describe(object) + " because it's in the wrong place";
                if (object.dead !== toDead) return "Can't move " + describe(object) + " because it's alive/dead state doesn't match";
                // doit
                if (fromLocations.length !== 0 || fromSplocks.length !== 0) {
                    var oldState = serializeObjectState(object);
                    object.locations = fromLocations;
                    object.splocks = fromSplocks;
                    object.dead = fromDead;
                    changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
                } else {
                    removeObject(object, changeLog);
                }
            } else {
                // shouldn't exist
                if (object != null) return "Can't create " + describe(type, id) + " because it already exists";
                // doit
                object = {
                    type: type,
                    id: id,
                    dead: fromDead,
                    locations: fromLocations,
                    splocks: fromSplocks
                };
                level.objects.push(object);
                changeLog.push([object.type, object.id, [0, []], serializeObjectState(object)]);
            }
        } else throw unreachable();
    }
}
function describe(arg1, arg2) {
    // describe(0) -> "Space"
    // describe(SNAKE, 0) -> "Snake 0 (Red)"
    // describe(object) -> "Snake 0 (Red)"
    // describe(BLOCK, 1) -> "Block 1"
    // describe(FRUIT) -> "Fruit"
    if (typeof arg1 === "number") {
        switch (arg1) {
            case SPACE: return "Space";
            case WALL: return "a Wall";
            case SPIKE: return "Spikes";
            case EXIT: return "an Exit";
            case PORTAL: return "a Portal";
            case RAINBOW: return "a Rainbow";
            case TRELLIS: return "a Trellis";
            case ONEWAYWALLU: return "a One Way Wall (facing U)";
            case ONEWAYWALLD: return "a One Way Wall (facing D)";
            case ONEWAYWALLL: return "a One Way Wall (facing L)";
            case ONEWAYWALLR: return "a One Way Wall (facing R)";
            case CLOSEDLIFT: return "a Closed Lift";
            case OPENLIFT: return "an Open Lift";
            case CLOUD: return "a Cloud";
            case BUBBLE: return "a Bubble";
            case LAVA: return "Lava";
            case WATER: return "Water";
            default: throw unreachable();
        }
    }
    if (arg1 === SNAKE) {
        var color = (function () {
            switch (snakeColors[arg2 % snakeColors.length]) {
                case "#fd0c0b": return " (Red)";
                case "#18d11f": return " (Green)";
                case "#004cff": return " (Blue)";
                case "#fdc122": return " (Yellow)";
                default: throw unreachable();
            }
        })();
        return "Snake " + arg2 + color;
    }
    if (arg1 === BLOCK) {
        return "Block " + arg2;
    }
    if (arg1 === MIKE) {
        return "Mike " + arg2;
    }
    if (arg1 === FRUIT) {
        return "Fruit";
    }
    if (arg1 === POISONFRUIT) {
        return "Poison Fruit";
    }
    if (typeof arg1 === "object") return describe(arg1.type, arg1.id);
    throw unreachable();
}

function undoStuffChanged(undoStuff) {
    if (replayString) {
        var expectedPrefix = replayMagicNumber + "&";
        var pre = cursor - expectedPrefix.length - cursorOffset;
        var post = replayLength - cursor + expectedPrefix.length + cursorOffset;
        var movesText = pre + "\xa0\xa0✾\xa0\xa0" + post;
        document.getElementById("movesSpan").textContent = movesText;
    } else {
        var movesText = undoStuff.undoStack.length + "\xa0\xa0✾\xa0\xa0" + undoStuff.redoStack.length;
        document.getElementById(undoStuff.spanId).textContent = movesText;
        document.getElementById(undoStuff.undoButtonId).disabled = undoStuff.undoStack.length === 0;
        document.getElementById(undoStuff.redoButtonId).disabled = undoStuff.redoStack.length === 0;
    }

    // render paradox display
    var uniqueParadoxes = [];
    var paradoxCounts = [];
    paradoxes.forEach(function (paradoxDescription) {
        var index = uniqueParadoxes.indexOf(paradoxDescription);
        if (index !== -1) {
            paradoxCounts[index] += 1;
        } else {
            uniqueParadoxes.push(paradoxDescription);
            paradoxCounts.push(1);
        }
    });
    var paradoxDivContent = "";
    uniqueParadoxes.forEach(function (paradox, i) {
        if (i > 0) paradoxDivContent += "<br>\n";
        if (paradoxCounts[i] > 1) paradoxDivContent += "(" + paradoxCounts[i] + "x) ";
        paradoxDivContent += "Time Travel Paradox! " + uniqueParadoxes[i];
    });
    document.getElementById("paradoxDiv").innerHTML = paradoxDivContent;

    updateDirtyState();

    if (unmoveStuff.redoStack.length === 0) {
        document.getElementById("removeButton").classList.remove("click-me");
    }
}

var CLEAN_NO_TIMELINES = 0;
var CLEAN_WITH_REDO = 1;
var REPLAY_DIRTY = 2;
var EDITOR_DIRTY = 3;
var dirtyState = CLEAN_NO_TIMELINES;
var editorHasBeenTouched = false;
function updateDirtyState() {
    if (haveCheatcodesBeenUsed() || editorHasBeenTouched) {
        dirtyState = EDITOR_DIRTY;
    } else if (unmoveStuff.undoStack.length > 0) {
        dirtyState = REPLAY_DIRTY;
    } else if (unmoveStuff.redoStack.length > 0) {
        dirtyState = CLEAN_WITH_REDO;
    } else {
        dirtyState = CLEAN_NO_TIMELINES;
    }

    var saveLevelButton = document.getElementById("saveLevelButton");
    // the save button clears your timelines
    saveLevelButton.disabled = dirtyState === CLEAN_NO_TIMELINES;
    if (dirtyState >= EDITOR_DIRTY) {
        // you should save
        saveLevelButton.classList.add("click-me");
    } else {
        saveLevelButton.classList.remove("click-me");
    }

    var saveProgressButton = document.getElementById("saveProgressButton");
    // you can't save a replay if your level is dirty
    if (dirtyState === CLEAN_WITH_REDO) {
        saveProgressButton.textContent = "Forget Progress";
    } else {
        saveProgressButton.textContent = "Save Progress";
    }
    saveProgressButton.disabled = dirtyState >= EDITOR_DIRTY || dirtyState === CLEAN_NO_TIMELINES;
}
function haveCheatcodesBeenUsed() {
    return !unmoveStuff.undoStack.every(function (changeLog) {
        // normal movement always starts with "i".
        return changeLog[0][0] === "i";
    });
}

var persistentState = {
    showEditor: false,
    editorLeft: false,
    showGrid: false,
    hideHotkeys: false,
};
function savePersistentState() {
    localStorage.snakefall = JSON.stringify(persistentState);
}
function loadPersistentState() {
    try {
        persistentState = JSON.parse(localStorage.snakefall);
    } catch (e) {
    }
    persistentState.showEditor = !!persistentState.showEditor;
    persistentState.editorLeft = !!persistentState.editorLeft;
    persistentState.showGrid = !!persistentState.showGrid;
    persistentState.hideHotkeys = !!persistentState.hideHotkeys;
    showEditorChanged();
}
var isGravityEnabled = true;
function isGravity() {
    return isGravityEnabled || !persistentState.showEditor;
}
var isCollisionEnabled = true;
function isCollision() {
    return isCollisionEnabled || !persistentState.showEditor;
}
function isAnyCheatcodeEnabled() {
    return persistentState.showEditor && (
        !isGravityEnabled || !isCollisionEnabled
    );
}

var background, wall, snakeColors, blockColors, spikeColors, fruitColors, textStyle, experimentalColors;

var bg1 = ["fade", "rgba(145, 198, 254", "rgba(133, 192, 255"]; //  91c6fe
var bg2 = ["fade", "rgba(254, 198, 145", "rgba(255, 192, 133"];
var bg3 = ["fade", "rgba(145, 254, 198", "rgba(117, 255, 192"];
var bg4 = ["fade", "rgba(7, 7, 83", "rgba(0, 0, 70"];
var bg5 = ["fade", "rgba(140, 190, 190", "rgba(135, 185, 185"];

var wall1 = { base: "#976537", surface: "#96fe45", curvedWalls: true, surfaceShape: "grass", grass: true, flowers: true, baseSpots: true, randomColors: false };
var wall2 = { base: "#30455B", surface: "white", curvedWalls: true, surfaceShape: "snow", grass: false, flowers: false, baseSpots: true, randomColors: false };
var wall3 = { base: "#734d26", surface: "#009933", curvedWalls: true, surfaceShape: "grass", grass: true, flowers: true, baseSpots: true, randomColors: false };
var wall4 = { base: "#844204", surface: "#282", curvedWalls: false, surfaceShape: "stripe", grass: false, flowers: false, baseSpots: false, randomColors: false };
var wall5 = { base: "#00aaff", surface: "#ffb3ec", curvedWalls: true, surfaceShape: "grass", grass: false, flowers: false, baseSpots: false, randomColors: false };
var wall6 = { base: "black", surface: "rainbow", curvedWalls: false, surfaceShape: "stripe", grass: false, flowers: false, baseSpots: false, randomColors: false };
var wall7 = { base: "transparent", surface: "green", curvedWalls: false, surfaceShape: "algae", grass: true, flowers: false, baseSpots: false, randomColors: true };

// must be full length to satisfy tint function
var snakeColors1 = ["#fd0c0b", "#18d11f", "#004dff", "#fdc122"];
var snakeColors2 = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];
var snakeColors3 = ["#BA145C", "#E91624", "#F75802", "#FEFE28"];
var snakeColors4 = ["#000000", "#000000", "#000000", "#000000"];

var fruitColors1 = ["#ff0066", "#ff36a6", "#ff6b1f", "#ff9900", "#ff2600"];
var fruitColors2 = ["black", "black", "black", "black", "black"];
var fruitColors3 = ["#ffcc00", "#ffa700", "#ff9380", "#ff5439"];
var fruitColors4 = ["#9900cc", "#6600cc", "#0033cc", "#0099cc", "#00cccc"];

var spikeColors1 = { spokes: "#999", support: "#444", box: "#555", bolt: "#777" };
var spikeColors2 = { spokes: "#888", support: "#111", box: "#333", bolt: "#111" };
var spikeColors3 = { spokes: "#333", support: "#333", box: "#333", bolt: "#777" };
var spikeColors4 = { spokes: "#595959", support: "#3b2f2b", box: "#3b2f2b", bolt: "#595959" };

// must be 6-digit hex colors to satisfy tint function
var blockColors1 = ["#de5a6d", "#fa65dd", "#c367e3", "#9c62fa", "#625ff0"];
var blockColors2 = ["#00FFFB", "#66ffd9", "#00e673", "#bfff00", "#ecff00"];
var blockColors3 = ["#de7913", "#7d46a0", "#39868b", "#41ccc2", "#ccc500"];
var blockColors4 = ["#660050", "#990033", "#b35900", "#e6b800 ", "#008000"];
var blockColors5 = ["#ffccff", "#ffc2b3", "#ffffcc", "#ccffe6", "#ccffff"];
var blockColors6 = ["#bf4053", "#ec799f", "#a679d2", "#6a45a1", "#4d6dcb"];

var fontSize = tileSize * 5;
var textStyle1 = { fontSize: fontSize, fontFamily: "American Typewriter", win: "#fdc122", lose: "#fd0c0b" };
var textStyle2 = { fontSize: fontSize, fontFamily: "American Typewriter", win: "#400080", lose: "#ff6600" };
var textStyle3 = { fontSize: fontSize, fontFamily: "American Typewriter", win: "#BA145C", lose: "#F75802" };
var textStyle4 = { fontSize: fontSize, fontFamily: "Arial", win: "#ff0", lose: "#f00" };
var textStyle5 = { fontSize: fontSize, fontFamily: "American Typewriter", win: "#80FF00", lose: "#00FFFB" };

var experimentalColors1 = ["white", "#ffccff"];
var experimentalColors2 = ["white", "#FEFE28"];

var themes = [  //name, background, wall, snakeColors, blockColors, spikeColors, fruitColors, stemColor, textStyle, experimentalColors
    ["Spring", bg1, wall1, snakeColors1, blockColors6, spikeColors1, fruitColors1, "green", textStyle1, experimentalColors1],
    ["Winter", bg1, wall2, snakeColors1, blockColors1, spikeColors3, fruitColors1, "green", textStyle1, experimentalColors1],
    ["Summer", bg2, wall3, snakeColors3, blockColors3, spikeColors4, fruitColors1, "green", textStyle3, experimentalColors2],
    ["Submerged", bg5, wall7, snakeColors1, blockColors2, spikeColors4, fruitColors4, "green", textStyle5, experimentalColors1],
    // ["Dream", bg3, wall5, snakeColors1, blockColors4, spikeColors4, fruitColors2, "white", textStyle2, experimentalColors2],
    ["Midnight Rainbow", bg4, wall6, snakeColors1, blockColors1, spikeColors2, "white", "white", textStyle1, experimentalColors1],
    ["Classic", "#8888ff", wall4, snakeColors2, blockColors1, spikeColors3, fruitColors1, "green", textStyle4, experimentalColors1],
];

var themeCounter = 0;
var cachedTheme = localStorage.getItem("cachedTheme");
if (cachedTheme == null) themeCounter = 0;
else themeCounter = cachedTheme;
var themeName = themes[themeCounter][0];
document.getElementById("themeButton").innerHTML = "Theme: <b>" + themeName + "</b>";
function populateThemeVars() {
    themeName = themes[themeCounter][0];
    background = themes[themeCounter][1];
    wall = themes[themeCounter][2];
    snakeColors = themes[themeCounter][3];
    blockColors = themes[themeCounter][4];
    spikeColors = themes[themeCounter][5];
    fruitColors = themes[themeCounter][6];
    textStyle = themes[themeCounter][8];
    experimentalColors = themes[themeCounter][9];
}

function showEditorChanged() {
    document.getElementById("showHideEditor").textContent = (persistentState.showEditor ? "Hide" : "Show") + " Editor";
    document.getElementById("ghostEditorPane").style.display = persistentState.showEditor ? "inline-block" : "none";

    ["editorDiv", "editorPane"].forEach(function (id) {
        document.getElementById(id).style.display = persistentState.showEditor ? "inline-block" : "none";
    });

    ["canvas3", "canvas5", "canvas6"].forEach(function (canvas) {
        document.getElementById(canvas).style.display = persistentState.showEditor ? "none" : "block";
    });

    document.getElementById("wasdSpan").textContent = persistentState.showEditor ? "" : " or WASD";

    if (!persistentState.showEditor) {
        document.getElementById("hideHotkeyButton").disabled = true;
    }
    else {
        document.getElementById("hideHotkeyButton").disabled = false;
    }

    if (persistentState.showEditor && defaultOn) document.getElementById("animationSlider").checked = animationsOn = false;
    else if (persistentState.showEditor && !defaultOn) document.getElementById("animationSlider").checked = animationsOn = JSON.parse(localStorage.getItem("cachedAO"));
    if (!persistentState.showEditor) document.getElementById("animationSlider").checked = animationsOn = JSON.parse(localStorage.getItem("cachedAO"));

    // loadFromLocationHash();
}

function move(dr, dc, doAnimations) {
    if (!isDead()) spike2Death = [];
    lowDeath = false;

    document.getElementById("cycleDiv").innerHTML = "";
    postPortalSnakeOutline = [];
    portalConflicts = [];
    portalOutOfBounds = false;
    portalFailure = false;
    cycle = false;
    cycleId = -1;
    multiDiagrams = false;

    if (!isAlive()) return;
    animationQueue = [];
    animationQueueCursor = 0;
    freshlyRemovedAnimatedObjects = [];
    animationStart = new Date().getTime();
    var activeSnake = findActiveSnake();
    var headRowcol = getRowcol(level, activeSnake.locations[0]);
    var newRowcol = { r: headRowcol.r + dr, c: headRowcol.c + dc };
    if (!isInBounds(level, newRowcol.r, newRowcol.c)) return;
    var newLocation = getLocation(level, newRowcol.r, newRowcol.c);
    var changeLog = [];

    // The changeLog for a player movement starts with the input
    // when playing normally.
    if (!isAnyCheatcodeEnabled()) {
        changeLog.push(["i", activeSnake.id, dr, dc, animationQueue, freshlyRemovedAnimatedObjects]);
    }

    var ate = false;
    var atePoison = false;
    var pushedObjects = [];

    //track ClosedLifts that had objects on them
    var occupiedClosedLift = getOccupiedClosedLiftLocations();

    if (isCollision()) {
        var newTile = level.map[newLocation];
        if (newTile === BUBBLE || newTile === CLOUD) {
            paintTileAtLocation(newLocation, SPACE, changeLog);
        }
        else if (!isTileCodeAir(activeSnake, null, newTile, dr, dc)) return; // can't go through that tile
        var otherObject = findObjectAtLocation(newLocation);
        if (otherObject != null) {
            if (otherObject === activeSnake) return; // can't push yourself
            if (otherObject.type === FRUIT) {
                // eat
                removeObject(otherObject, changeLog);
                ate = true;
            } else if (otherObject.type === POISONFRUIT) {
                // eat poison
                removeObject(otherObject, changeLog);
                atePoison = true;
            } else if (isTileCodeAir(activeSnake, null, newTile, dr, dc)) {
                otherObject = findObjectAtLocation(newLocation);
                if (otherObject != null) {
                    if (otherObject === activeSnake) return; // can't push yourself
                    if (otherObject.splocks.includes(newLocation) && !otherObject.locations.includes(newLocation)) return false; // can't push splock
                    if (otherObject.type === MIKE && otherObject.locations.includes(newLocation)) return false; // can't push mike
                    // push objects
                    if (!checkMovement(activeSnake, otherObject, dr, dc, pushedObjects)) return false;
                }
            } else return; // can't go through that tile
        }
    }

    // slither forward
    var activeSnakeOldState = serializeObjectState(activeSnake);
    var size1 = activeSnake.locations.length === 1;
    doAnimations = doAnimations == undefined && animationsOn ? true : false;
    var speed = doAnimations ? 70 : 1;
    var slitherAnimations = [
        speed,
        [
            // size-1 snakes really do more of a move than a slither
            size1 ? MOVE_SNAKE : SLITHER_HEAD,
            activeSnake.id,
            dr,
            dc,
        ]
    ];

    // drag your tail forward based on what was/wasn't eaten
    var times = 1;
    if (ate) { times--; }
    if (atePoison) { times++; }
    //if we're going to shrink out of existence, prevent it
    var snake_length = activeSnake.locations.length;
    var poisonKill = false;
    if (times > snake_length) {
        times = snake_length;
        activeSnake.dead = true;
        //make the snake appear to vanish into non-existence
        activeSnake.locations.unshift({ r: -99, c: -99 });
        poisonKill = true;
    }
    for (var t = 0; t < times; ++t) {
        for (var i = 1; i < activeSnake.locations.length; i++) {
            // drag your tail forward
            var oldRowcol = getRowcol(level, activeSnake.locations[i]);
            newRowcol = getRowcol(level, activeSnake.locations[i - 1]);
            if (!size1) {
                slitherAnimations.push(
                    [
                        SLITHER_TAIL + i,
                        activeSnake.id,
                        newRowcol.r - oldRowcol.r,
                        newRowcol.c - oldRowcol.c,
                    ]
                );
            }
        }
        activeSnake.locations.pop();
    }
    if (!poisonKill) activeSnake.locations.unshift(newLocation);
    changeLog.push([activeSnake.type, activeSnake.id, activeSnakeOldState, serializeObjectState(activeSnake)]);

    // did you just push your face into a portal?
    var portalLocations = getActivePortalLocations();
    var portalActivationLocations = [];
    if (portalLocations.indexOf(newLocation) !== -1) {
        portalActivationLocations.push(newLocation);
    }
    // push everything, too
    moveObjects(pushedObjects, dr, dc, portalLocations, portalActivationLocations, changeLog, slitherAnimations);
    animationQueue.push(slitherAnimations);

    occupiedClosedLift = combineOldAndNewLiftOccupations(occupiedClosedLift);

    // gravity loop
    var stateToAnimationIndex = {};
    if (isGravity()) for (var fallHeight = 1; ; fallHeight++) {
        var serializedState = serializeObjects(level.objects);
        var infiniteLoopStartIndex = stateToAnimationIndex[serializedState];
        if (infiniteLoopStartIndex != null) {
            // infinite loop
            animationQueue.push([0, [INFINITE_LOOP, animationQueue.length - infiniteLoopStartIndex]]);
            break;
        } else {
            stateToAnimationIndex[serializedState] = animationQueue.length;
        }
        // do portals separate from falling logic
        if (portalActivationLocations.length === 1) {
            var portalAnimations = [500];
            var result = activatePortal(portalLocations, portalActivationLocations[0], portalAnimations, changeLog);
            if (result === "works") {
                portalFailure = false;
                portalOutOfBounds = false;
                animationQueue.push(portalAnimations);
            } else if (result === "blocked") {
                portalFailure = true;
                portalOutOfBounds = false;
            } else if (result === "outside") {
                portalFailure = true;
                portalOutOfBounds = true;
            } else if (result === "blockedBySnake") {
                portalFailure = false;
                portalOutOfBounds = false;
            }
            portalActivationLocations = [];
        }
        // now do falling logic
        var didAnything = false;
        var fallingAnimations = [
            70 / Math.sqrt(fallHeight),
        ];
        var exitAnimationQueue = [];

        // check for exit
        if (!isUneatenFruit()) {
            var snakes = getSnakes();
            for (var i = 0; i < snakes.length; i++) {
                var snake = snakes[i];
                if (level.map[snake.locations[0]] === EXIT) {
                    // (one of) you made it!
                    removeAnimatedObject(snake, changeLog);
                    exitAnimationQueue.push([
                        200,
                        [EXIT_SNAKE, snake.id, 0, 0],
                    ]);
                    didAnything = true;
                }
            }
        }

        occupiedClosedLift = combineOldAndNewLiftOccupations(occupiedClosedLift);

        // fall
        var dyingObjects = [];
        var fallingObjects = level.objects.filter(function (object) {
            if (object.type === FRUIT || object.type === POISONFRUIT) return; // can't fall
            var theseDyingObjects = [];
            if (!checkMovement(null, object, 1, 0, [], theseDyingObjects)) return false;
            // this object can fall. maybe more will fall with it too. we'll check those separately.
            theseDyingObjects.forEach(function (object) {
                addIfAbsent(dyingObjects, object);
            });
            // when falling with splocks, animation doesn't show fall because this code is never reached (works with blocks without splocks)
            return true;
        });

        // this code doesn't work with splocks
        if (dyingObjects.length > 0) {
            var anySnakesDied = false;
            dyingObjects.forEach(function (object) {
                if (object.type === SNAKE) {
                    // look what you've done
                    var oldState = serializeObjectState(object);
                    object.dead = true;
                    changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
                    anySnakesDied = true;
                } else if (object.type === BLOCK || object.type === MIKE) {
                    // a box fell off the world
                    if (object.splocks != null) rngCorrection.push(object.splocks);
                    removeAnimatedObject(object, changeLog);
                    removeFromArray(fallingObjects, object);
                    exitAnimationQueue.push([
                        200,
                        [
                            DIE_BLOCK,
                            object.id,
                            0, 0
                        ],
                    ]);
                    didAnything = true;
                } else throw unreachable();
            });
            if (anySnakesDied) break;
        }
        if (fallingObjects.length > 0) {
            moveObjects(fallingObjects, 1, 0, portalLocations, portalActivationLocations, changeLog, fallingAnimations);
            didAnything = true;
        }

        occupiedClosedLift = openLift(occupiedClosedLift, changeLog);

        if (!didAnything) break;
        Array.prototype.push.apply(animationQueue, exitAnimationQueue);
        if (fallingAnimations.length > 1) animationQueue.push(fallingAnimations);
    }

    pushUndo(unmoveStuff, changeLog);
    render();
}

function combineOldAndNewLiftOccupations(oldOccupiedClosedLift) {
    var newOccupiedClosedLift = getOccupiedClosedLiftLocations();
    var newlyOccupiedClosedLift = getSetSubtract(newOccupiedClosedLift, oldOccupiedClosedLift);
    return oldOccupiedClosedLift.concat(newlyOccupiedClosedLift);
}

function openLift(oldOccupiedClosedLift, changeLog) {
    var newOccupiedClosedLift = getOccupiedClosedLiftLocations();
    var nowUnoccupiedClosedLift = getSetSubtract(oldOccupiedClosedLift, newOccupiedClosedLift);
    for (var i = 0; i < nowUnoccupiedClosedLift.length; i++) {
        paintTileAtLocation(nowUnoccupiedClosedLift[i], OPENLIFT, changeLog);
    }
    return newOccupiedClosedLift;
}

function getSetSubtract(array1, array2) {
    if (array1.length === 0) return [];
    return array1.filter(function (x) { return array2.indexOf(x) == -1; });
}

function checkMovement(pusher, pushedObject, dr, dc, pushedObjects, dyingObjects) {
    // pusher can be null (for gravity)
    // pushedObjects include snake itself when making any move
    // gravity pushes every object on every move
    // find forward locations
    pushedObjects.push(pushedObject);
    var forwardLocations = [];
    for (var i = 0; i < pushedObjects.length; i++) {
        pushedObject = pushedObjects[i];
        //splocks
        for (var j = 0; j < pushedObject.splocks.length; j++) {
            var rowcol = getRowcol(level, pushedObject.splocks[j]);
            var forwardRowcol = { r: rowcol.r + dr, c: rowcol.c + dc };

            if (!isInBounds(level, forwardRowcol.r, forwardRowcol.c)) {
                if (dyingObjects == null) {
                    // can't push things out of bounds
                    return false;
                } else {
                    // this thing is going to fall out of bounds
                    addIfAbsent(dyingObjects, pushedObject);
                    addIfAbsent(pushedObjects, pushedObject);
                    continue;
                }
            }
            var forwardLocation = getLocation(level, forwardRowcol.r, forwardRowcol.c);
            var yetAnotherObject = findObjectAtLocation(forwardLocation);
            if (yetAnotherObject != null) {
                if (yetAnotherObject.type === FRUIT || yetAnotherObject.type === POISONFRUIT) return false;
                // this is the problem - this prevents snakes from carrying splocks but kills them unnecessarily
                if (yetAnotherObject.type === SNAKE) {
                    yetAnotherObject.locations.forEach(function (loc) {
                        var snakeRowcol = getRowcol(level, loc);
                        var snakeForwardRowcol = { r: snakeRowcol.r + dr, c: snakeRowcol.c + dc };
                        // can't get location using snakeForwardRowcol, screws up code
                        if (isInBounds(level, snakeForwardRowcol.r, snakeForwardRowcol.c)) {
                            var snakeForwardLocation = getLocation(level, snakeForwardRowcol.r, snakeForwardRowcol.c);
                            var snakeYetAnotherObject = findObjectAtLocation(snakeForwardLocation);
                            if (level.map[snakeForwardLocation] !== SPACE || (snakeYetAnotherObject != null && !(snakeYetAnotherObject.type === SNAKE && snakeYetAnotherObject.id === yetAnotherObject.id))) {
                                spike2Death = [pushedObject.type, pushedObject.id, yetAnotherObject];
                                addIfAbsent(dyingObjects, yetAnotherObject);
                            }
                        }
                    });
                    continue;
                }
                if (yetAnotherObject.type === BLOCK && yetAnotherObject.splocks.includes(forwardLocation)) {
                    var object = findObjectAtLocation(offsetLocation(forwardLocation, -dr, -dc));
                    if (object.type === SNAKE) {
                        spike2Death = [pushedObject.type, pushedObject.id];
                        addIfAbsent(dyingObjects, object);
                        continue;
                    }
                }
                if (yetAnotherObject === pusher) {
                    // indirect pushing ourselves.
                    // special check for when we're indirectly pushing the tip of our own tail.
                    if (forwardLocation === pusher.locations[pusher.locations.length - 1]) {
                        // for some reason this is ok. ------------ THIS IS THE TAIL GLITCH
                        continue;
                    }
                    return false;
                }
                // for (var k = 0; k < pushedObject.locations.length; k++) {
                // var rowcol = getRowcol(level, pushedObject.locations[k]);
                addIfAbsent(pushedObjects, yetAnotherObject);
                // }
                if (level.map[forwardLocation] === TRELLIS || level.map[forwardLocation] === ONEWAYWALLU) addIfAbsent(forwardLocations, forwardLocation);
            } else addIfAbsent(forwardLocations, forwardLocation);
        }

        //locations
        for (var j = 0; j < pushedObject.locations.length; j++) {
            var rowcol = getRowcol(level, pushedObject.locations[j]);
            var forwardRowcol = { r: rowcol.r + dr, c: rowcol.c + dc };
            if (!isInBounds(level, forwardRowcol.r, forwardRowcol.c)) {
                if (dyingObjects == null) {
                    // can't push things out of bounds
                    return false;
                } else {
                    // this thing is going to fall out of bounds
                    addIfAbsent(dyingObjects, pushedObject);
                    addIfAbsent(pushedObjects, pushedObject);
                    continue;
                }
            }

            var forwardLocation = getLocation(level, forwardRowcol.r, forwardRowcol.c);
            if (dr === 1 && level.map[forwardLocation] === RAINBOW) {
                // this rainbow holds us, unless we're going through it
                var neighborLocations;
                if (pushedObject.type === SNAKE) {
                    neighborLocations = [];
                    if (j > 0) neighborLocations.push(pushedObject.locations[j - 1]);
                    if (j < pushedObject.locations.length - 1) neighborLocations.push(pushedObject.locations[j + 1]);
                } else if (pushedObject.type === BLOCK) {
                    neighborLocations = pushedObject.locations;
                } else throw asdf;
                if (neighborLocations.indexOf(forwardLocation) === -1) return false; // flat surface
                // we slip right past it
            }

            var yetAnotherObject = findObjectAtLocation(forwardLocation);
            if (yetAnotherObject != null) {
                var object = findObjectAtLocation(offsetLocation(forwardLocation, -dr, -dc));
                if (yetAnotherObject.type === FRUIT || yetAnotherObject.type === POISONFRUIT) {
                    // not pushable
                    return false;
                }
                if (yetAnotherObject.type === SNAKE && pushedObject.type === MIKE) {
                    spike2Death = [pushedObject.type, pushedObject.id];
                    addIfAbsent(dyingObjects, yetAnotherObject);
                    continue;
                }
                if (yetAnotherObject.type === MIKE && object.type === SNAKE) {
                    addIfAbsent(dyingObjects, object);
                    continue;
                }
                //prevents snakes lifting up splocks
                if (yetAnotherObject.type === BLOCK && yetAnotherObject.splocks.includes(forwardLocation) && object.type === SNAKE) {
                    dieOnSplock = object.id;
                    addIfAbsent(dyingObjects, object);
                    continue;
                }
                if (yetAnotherObject === pusher) {
                    // indirect pushing ourselves.
                    // special check for when we're indirectly pushing the tip of our own tail.
                    if (forwardLocation === pusher.locations[pusher.locations.length - 1]) {
                        // for some reason this is ok. ------------ THIS IS THE TAIL GLITCH
                        continue;
                    }
                    return false;
                }
                addIfAbsent(pushedObjects, yetAnotherObject);
                if (level.map[forwardLocation] === TRELLIS || level.map[forwardLocation] === ONEWAYWALLU) addIfAbsent(forwardLocations, forwardLocation);
            } else addIfAbsent(forwardLocations, forwardLocation);
        }
    }

    // check forward locations
    for (var i = 0; i < forwardLocations.length; i++) {
        forwardLocation = forwardLocations[i];
        // many of these locations can be inside objects,
        // but that means the tile must be air,
        // and we already know pushing that object.
        var tileCode = level.map[forwardLocation];
        object = findObjectAtLocation(offsetLocation(forwardLocation, -dr, -dc));
        if (!isTileCodeAir(pusher, object, tileCode, dr, dc)) {
            if (dyingObjects != null) {
                if (tileCode === SPIKE) {
                    // uh... which object was this again?
                    if (object.type === SNAKE) {
                        // ouch!
                        addIfAbsent(dyingObjects, object);
                        continue;
                    }
                }
                else if (tileCode === LAVA) {
                    if (object.type === SNAKE || object.type === BLOCK || object.type === MIKE) {
                        addIfAbsent(dyingObjects, object);
                        continue;
                    }
                }
                else if (tileCode === WATER) {
                    if (object.type === BLOCK || object.type === MIKE) {
                        addIfAbsent(dyingObjects, object);
                        continue;
                    }
                }
            }
            // can't push into something solid
            return false;
        }
    }
    // the push is go
    return true;
}

function activateAnySnakePlease() {
    var snakes = getSnakes();
    if (snakes.length === 0) return; // nope.avi
    activeSnakeId = snakes[0].id;
}

function moveObjects(objects, dr, dc, portalLocations, portalActivationLocations, changeLog, animations) {
    objects.forEach(function (object) {
        var oldState = serializeObjectState(object);
        var oldPortals = getSetIntersection(portalLocations, object.locations);
        for (var i = 0; i < object.locations.length; i++) {
            object.locations[i] = offsetLocation(object.locations[i], dr, dc);
            if (level.map[object.locations[i]] == BUBBLE || level.map[object.locations[i]] == CLOUD)
                paintTileAtLocation(object.locations[i], SPACE, changeLog);
        }
        for (var i = 0; i < object.splocks.length; i++) {
            object.splocks[i] = offsetLocation(object.splocks[i], dr, dc);
        }
        changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
        animations.push([
            "m" + object.type, // MOVE_SNAKE | MOVE_BLOCK | MOVE_MIKE
            object.id,
            dr,
            dc,
        ]);

        var newPortals = getSetIntersection(portalLocations, object.locations);
        var activatingPortals = newPortals.filter(function (portalLocation) {
            return oldPortals.indexOf(portalLocation) === -1;
        });
        if (activatingPortals.length === 1) {
            // exactly one new portal we're touching. activate it
            portalActivationLocations.push(activatingPortals[0]);
        }
    });
}

function activatePortal(portalLocations, portalLocation, animations, changeLog) {
    var otherPortalLocation = portalLocations[1 - portalLocations.indexOf(portalLocation)];
    var portalRowcol = getRowcol(level, portalLocation);
    var otherPortalRowcol = getRowcol(level, otherPortalLocation);
    var delta = { r: otherPortalRowcol.r - portalRowcol.r, c: otherPortalRowcol.c - portalRowcol.c };

    var object = findObjectAtLocation(portalLocation);
    var locationsLength = object.locations.length;
    var totalLocations = object.locations.concat(object.splocks);
    var objectLength = totalLocations.length;
    var newLocations = [];
    for (var i = 0; i < objectLength; i++) {
        var rowcol = getRowcol(level, totalLocations[i]);
        var r = rowcol.r + delta.r;
        var c = rowcol.c + delta.c;

        var outlineID = Math.floor(postPortalSnakeOutline.length / objectLength);
        if (r >= 0 && c >= 0) {
            postPortalSnakeOutline.push({
                id: outlineID,
                r: r,
                c: c,
            });
            newLocations.push(getLocation(level, r, c));
        }
        if (!isInBounds(level, r, c)) return "outside"; // out of bounds
    }

    var blockedBySnake = false;
    for (var i = 0; i < newLocations.length; i++) {
        var location = newLocations[i];
        if (!isTileCodeAir(object, null, level.map[location], 0, 0)) portalConflicts.push(getRowcol(level, location)); // blocked by tile
        var otherObject = findObjectAtLocation(location);
        if (otherObject != null && otherObject !== object) {
            if (otherObject.type !== SNAKE) portalConflicts.push(getRowcol(level, location)); // blocked by object
            else blockedBySnake = true;
        }
    }
    if (blockedBySnake) {
        portalConflicts = [];
        return "blockedBySnake";
    }
    if (portalConflicts.length > 0) return "blocked";

    // zappo presto!
    var oldState = serializeObjectState(object);
    object.locations = newLocations.slice(0, locationsLength);
    object.splocks = newLocations.slice(locationsLength);
    changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
    animations.push([
        "t" + object.type, // TELEPORT_SNAKE | TELEPORT_BLOCK | TELEPORT_MIKE
        object.id,
        delta.r,
        delta.c,
    ]);
    return "works";
}

function isTileCodeAir(pusher, pushedObject, tileCode, dr, dc) {
    switch (tileCode) {
        case SPACE: case EXIT: case PORTAL: case CLOSEDLIFT: return true;
        case TRELLIS: case BUBBLE: return pusher != null;
        case RAINBOW: return dr != 1;
        case ONEWAYWALLU: return dr != 1;
        case ONEWAYWALLD: return dr != -1;
        case ONEWAYWALLL: return dc != 1;
        case ONEWAYWALLR: return dc != -1;
        default: return false;
    }
}

function addIfAbsent(array, element) {
    if (array.indexOf(element) !== -1) return;
    array.push(element);
}
function removeAnyObjectAtLocation(location, changeLog) {
    var object = findObjectAtLocation(location);
    if (object != null) removeObject(object, changeLog);
}
function removeAnimatedObject(object, changeLog) {
    removeObject(object, changeLog);
    freshlyRemovedAnimatedObjects.push(object);
}
function removeObject(object, changeLog) {
    removeFromArray(level.objects, object);
    changeLog.push([object.type, object.id, [object.dead, copyArray(object.locations), copyArray(object.splocks)], [0, [], []]]);
    if (object.type === SNAKE && object.id === activeSnakeId) {
        activateAnySnakePlease();
    }
    if (object.type === BLOCK && paintBrushTileCode === BLOCK && paintBrushBlockId === object.id) {
        // no longer editing an object that doesn't exist
        paintBrushBlockId = null;
    }
    if (object.type === MIKE && paintBrushTileCode === MIKE && paintBrushMikeId === object.id) {
        // no longer editing an object that doesn't exist
        paintBrushMikeId = null;
    }
    if (object.type === BLOCK) {
        delete blockSupportRenderCache[object.id];
    }
    if (object.type === MIKE) {
        delete mikeSupportRenderCache[object.id];
    }
}
function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index === -1) throw unreachable();
    array.splice(index, 1);
}
function findActiveSnake() {
    var snakes = getSnakes();
    for (var i = 0; i < snakes.length; i++) {
        if (snakes[i].id === activeSnakeId) return snakes[i];
    }
    throw unreachable();
}
function findBlockById(id) {
    return findObjectOfTypeAndId(BLOCK, id);
}
function findMikeById(id) {
    return findObjectOfTypeAndId(MIKE, id);
}
function findSnakesOfColor(color) {
    return level.objects.filter(function (object) {
        if (object.type !== SNAKE) return false;
        return object.id % snakeColors.length === color;
    });
}
function findObjectOfTypeAndId(type, id) {
    for (var i = 0; i < level.objects.length; i++) {
        var object = level.objects[i];
        if (object.type === type && object.id === id) return object;
    }
    return null;
}
function findObjectAtLocation(location) {
    for (var i = 0; i < level.objects.length; i++) {
        var object = level.objects[i];
        if (object.locations.indexOf(location) !== -1 || object.splocks.indexOf(location) !== -1)   //new code to erase splocks by clicking the spikes
            // if (object.locations.indexOf(location) !== -1)
            return object;
    }
    return null;
}
function isUneatenFruit() {
    return getObjectsOfType(FRUIT).length > 0 || getObjectsOfType(POISONFRUIT).length > 0;
}
function getActivePortalLocations() {
    var portalLocations = getPortalLocations();
    if (portalLocations.length !== 2) return []; // nice try
    return portalLocations;
}
function getPortalLocations() {
    var result = [];
    for (var i = 0; i < level.map.length; i++) {
        if (level.map[i] === PORTAL) result.push(i);
    }
    return result;
}
function isSnakeOnPortal() {
    var portalLocations = getPortalLocations();
    if (portalLocations.length !== 2) return false;
    var o1 = findObjectAtLocation(portalLocations[0]);
    var o2 = findObjectAtLocation(portalLocations[1]);
    if ((o1 != null && o1.type === SNAKE) || (o2 != null && o2.type === SNAKE)) return true;
    return false;
}
function countSnakes() {
    return getSnakes().length;
}
function getSnakes() {
    return getObjectsOfType(SNAKE);
}
function getBlocks() {
    return getObjectsOfType(BLOCK);
}
function getMikes() {
    return getObjectsOfType(MIKE);
}
function getOccupiedClosedLiftLocations() {
    var result = [];
    for (var i = 0; i < level.map.length; i++) {
        if (level.map[i] === CLOSEDLIFT) {
            if (findObjectAtLocation(i))
                result.push(i);
        }
    }
    return result;
}
function getObjectsOfType(type) {
    return level.objects.filter(function (object) {
        return object.type == type;
    });
}
function isDead() {
    if (animationQueue.length > 0 && animationQueue[animationQueue.length - 1][1][0] === INFINITE_LOOP) return true;
    return getSnakes().filter(function (snake) {
        return !!snake.dead;
    }).length > 0;
}
function isAlive() {
    return countSnakes() > 0 && !isDead();
}

var activeSnakeId = null;

var SLITHER_HEAD = "sh";
var SLITHER_TAIL = "st";
var MOVE_SNAKE = "ms";
var MOVE_BLOCK = "mb";
var TELEPORT_SNAKE = "ts";
var TELEPORT_BLOCK = "tb";
var EXIT_SNAKE = "es";
var DIE_SNAKE = "ds";
var DIE_BLOCK = "db";
var INFINITE_LOOP = "il";
var animationQueue = [
    // // sequence of disjoint animation groups.
    // // each group completes before the next begins.
    // [
    //   70, // duration of this animation group
    //   // multiple things to animate simultaneously
    //   [
    //     SLITHER_HEAD | SLITHER_TAIL | MOVE_SNAKE | MOVE_BLOCK | MOVE_MIKE | TELEPORT_SNAKE | TELEPORT_BLOCK | TELEPORT_MIKE,
    //     objectId,
    //     dr,
    //     dc,
    //   ],
    //   [
    //     INFINITE_LOOP,
    //     loopSizeNotIncludingThis,
    //   ],
    // ],
];
var animationQueueCursor = 0;
var animationStart = null; // new Date().getTime()
var animationProgress; // 0.0 <= x < 1.0
var freshlyRemovedAnimatedObjects = [];

// render the support beams for blocks into a temporary buffer, and remember it.
// this is due to stencil buffers causing slowdown on some platforms. see #25.
var blockSupportRenderCache = {
    // id: canvas4,
    // "0": document.createElement("canvas"),
};
var mikeSupportRenderCache = {
    // id: canvas4,
    // "0": document.createElement("canvas"),
};

function render() {
    if (level == null) return;
    if (animationQueueCursor < animationQueue.length) {
        var animationDuration = animationQueue[animationQueueCursor][0];
        animationProgress = (new Date().getTime() - animationStart) / animationDuration;
        if (animationProgress >= 1.0) {
            // animation group complete
            animationProgress -= 1.0;
            animationQueueCursor++;
            if (animationQueueCursor < animationQueue.length && animationQueue[animationQueueCursor][1][0] === INFINITE_LOOP) {
                var infiniteLoopSize = animationQueue[animationQueueCursor][1][1];
                animationQueueCursor -= infiniteLoopSize;
            }
            animationStart = new Date().getTime();
        }
    }
    if (animationQueueCursor === animationQueue.length) animationProgress = 1.0;

    [canvas2, canvas4, canvas6].forEach(function (canvas) {
        canvas.width = tileSize * level.width;
        canvas.height = tileSize * level.height;
    });
    var canvasContainer = document.getElementById("canvasContainer");
    canvasContainer.style.height = tileSize * level.height;
    canvasContainer.style.width = tileSize * level.width;

    var context;
    // draw background if resizing occurs
    if (false) {
        context = canvas2.getContext("2d");
        drawBackground(context, canvas2);
    }
    context = canvas4.getContext("2d");

    themeName = themes[themeCounter][0];
    background = themes[themeCounter][1];
    wall = themes[themeCounter][2];
    snakeColors = themes[themeCounter][3];
    blockColors = themes[themeCounter][4];
    spikeColors = themes[themeCounter][5];
    fruitColors = themes[themeCounter][6];
    textStyle = themes[themeCounter][8];
    experimentalColors = themes[themeCounter][9];

    if (persistentState.showGrid && !persistentState.showEditor) {
        drawGrid();
    }

    // normal render
    renderLevel();

    if (persistentState.showGrid && persistentState.showEditor) {
        drawGrid();
    }

    if (persistentState.showEditor) {
        if (paintBrushTileCode === BLOCK && paintBrushBlockId != null) {
            // fade everything else away
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(0, 0, canvas4.width, canvas4.height);
            // and render just this object in focus
            var activeBlock = findBlockById(paintBrushBlockId);
            renderLevel([activeBlock]);
        } else if (paintBrushTileCode === MIKE && paintBrushMikeId != null) {
            // fade everything else away
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(0, 0, canvas4.width, canvas4.height);
            // and render just this object in focus
            var activeMike = findMikeById(paintBrushMikeId);
            renderLevel([activeMike]);
        } else if (paintBrushTileCode === "select") {
            getSelectedLocations().forEach(function (location) {
                var rowcol = getRowcol(level, location);
                context.fillStyle = "rgba(128, 128, 128, 0.3)";
                context.fillRect(rowcol.c * tileSize, rowcol.r * tileSize, tileSize, tileSize);
            });
        }
    }

    // serialize
    if (!isDead()) {
        var serialization = stringifyLevel(level);
        document.getElementById("serializationTextarea").value = serialization;
        var link = location.href.substring(0, location.href.length - location.hash.length);
        link += "#level=" + compressSerialization(serialization);
        document.getElementById("shareLinkTextbox").value = link;
        var link2 = window.location.href.split("#");
        var replay = link2[2] != undefined ? "#" + link2[2] : "";
        document.getElementById("link2Textbox").value = "#" + link2[1] + replay;
    }

    // throw this in there somewhere
    document.getElementById("showGridButton").textContent = (persistentState.showGrid ? "Hide" : "Show") + " Grid";
    document.getElementById("hideHotkeyButton").textContent = (persistentState.hideHotkeys ? "Show" : "Hide") + " Hotkeys";

    if (animationProgress < 1.0) requestAnimationFrame(render);
    return; // this is the end of the function proper

    function renderLevel(onlyTheseObjects) {
        var objects = level.objects;
        if (onlyTheseObjects != null) {
            objects = onlyTheseObjects;
        } else {
            objects = level.objects.concat(freshlyRemovedAnimatedObjects.filter(function (object) {
                // the object needs to have a future removal animation, or else, it's gone already.
                return hasFutureRemoveAnimation(object);
            }));
        }
        // begin by rendering the background connections for blocks
        if (!dont) {
            objects.forEach(function (object) {
                if (object.type !== BLOCK) return;
                var animationDisplacementRowcol = findAnimationDisplacementRowcol(object.type, object.id);
                var minR = Infinity;
                var maxR = -Infinity;
                var minC = Infinity;
                var maxC = -Infinity;






                //combine locations and splocks because they're treated the same
                var locations = object.locations.concat(object.splocks);
                var minDistance = Infinity;
                var connected = [];
                var connectedPoints = [];
                for (var i = 0; i < locations.length; i++) {
                    var rowcol = getRowcol(level, locations[i]);
                    for (var j = 0; j < locations.length; j++) {
                        if (j != i) {
                            var rowcolComparison = getRowcol(level, locations[j]);
                            var distance = Math.abs(rowcol.r - rowcolComparison.r) + Math.abs(rowcol.c - rowcolComparison.c);
                            if (distance < minDistance) {
                                minDistance = distance;
                                connected = [i, j];
                                connectedPoints = [rowcol, rowcolComparison];
                            }
                        }
                    }
                }
                // new array omitting blocks that are already connected
                var remainingLocations = locations;
                remainingLocations.splice(connected[0], 1);
                remainingLocations.splice(connected[1], 1);

                connectedPoints.forEach(function (rowcol) {
                    if (rowcol.r < minR) minR = rowcol.r;
                    if (rowcol.r > maxR) maxR = rowcol.r;
                    if (rowcol.c < minC) minC = rowcol.c;
                    if (rowcol.c > maxC) maxC = rowcol.c;
                });

                // add the horizontal connector locations to the connected blocks array
                for (var i = 0; i < maxC - minC; i++) {
                    var connectorRowcol = { r: minR, c: maxC - i };
                    addIfAbsent(connectedPoints, connectorRowcol);
                }

                // add the vertical connector locations to the connected blocks array
                for (var i = 1; i < maxR - minR; i++) {
                    var connectorRowcol = { r: maxR - i, c: maxC };
                    addIfAbsent(connectedPoints, connectorRowcol);
                }

                // find the next closest blocks and the point to which it's closest
                minDistance = Infinity;
                for (var i = 0; i < remainingLocations.length; i++) {
                    var rowcol = getRowcol(level, remainingLocations[i]);
                    for (var j = 0; j < connectedPoints.length; j++) {
                        var distance = Math.abs(rowcol.r - connectedPoints.r) + Math.abs(rowcol.c - connectedPoints.c);
                        if (distance < minDistance) {
                            minDistance = distance;
                            connected = [i, j];
                        }
                    }
                }










                object.locations.forEach(function (location) {
                    var rowcol = getRowcol(level, location);
                    if (rowcol.r < minR) minR = rowcol.r;
                    if (rowcol.r > maxR) maxR = rowcol.r;
                    if (rowcol.c < minC) minC = rowcol.c;
                    if (rowcol.c > maxC) maxC = rowcol.c;
                });

                var image = blockSupportRenderCache[object.id];
                if (image == null) {
                    // render the support beams to a buffer
                    blockSupportRenderCache[object.id] = image = document.createElement("canvas");
                    image.width = (maxC - minC + 1) * tileSize;
                    image.height = (maxR - minR + 1) * tileSize;
                    var bufferContext = image.getContext("2d");
                    // Make a stencil that excludes the insides of blocks.
                    // Then when we render the support beams, we won't see the supports inside the block itself.
                    bufferContext.beginPath();
                    // Draw a path around the whole screen in the opposite direction as the rectangle paths below.
                    // This means that the below rectangles will be removing area from the greater rectangle.
                    bufferContext.rect(image.width, 0, -image.width, image.height);
                    for (var i = 0; i < object.locations.length; i++) {
                        var rowcol = getRowcol(level, object.locations[i]);
                        var r = rowcol.r - minR;
                        var c = rowcol.c - minC;
                        bufferContext.rect(c * tileSize, r * tileSize, tileSize, tileSize);
                    }
                    bufferContext.clip();
                    for (var i = 0; i < object.locations.length - 1; i++) {
                        var rowcol1 = getRowcol(level, object.locations[i]);
                        rowcol1.r -= minR;
                        rowcol1.c -= minC;
                        var rowcol2 = getRowcol(level, object.locations[i + 1]);
                        rowcol2.r -= minR;
                        rowcol2.c -= minC;
                        var cornerRowcol = { r: rowcol1.r, c: rowcol2.c };
                        var connectorColor = tint(blockColors[object.id % blockColors.length], .5);
                        drawConnector(bufferContext, rowcol1.r, rowcol1.c, cornerRowcol.r, cornerRowcol.c, connectorColor);
                        drawConnector(bufferContext, rowcol2.r, rowcol2.c, cornerRowcol.r, cornerRowcol.c, connectorColor);
                    }
                }
                var r = minR + animationDisplacementRowcol.r;
                var c = minC + animationDisplacementRowcol.c;
                if (isDead() && spike2Death[0] === BLOCK && spike2Death[1] === object.id && spike2Death[2].dead) r += .5;
                var savedContext2 = context;
                context = canvas2.getContext("2d");
                context.drawImage(image, c * tileSize, r * tileSize);
                context = savedContext2;
            });

            objects.forEach(function (object) {
                if (object.type !== MIKE) return;
                var animationDisplacementRowcol = findAnimationDisplacementRowcol(object.type, object.id);
                var minR = Infinity;
                var maxR = -Infinity;
                var minC = Infinity;
                var maxC = -Infinity;
                object.locations.forEach(function (location) {
                    var rowcol = getRowcol(level, location);
                    if (rowcol.r < minR) minR = rowcol.r;
                    if (rowcol.r > maxR) maxR = rowcol.r;
                    if (rowcol.c < minC) minC = rowcol.c;
                    if (rowcol.c > maxC) maxC = rowcol.c;
                });
                var image = mikeSupportRenderCache[object.id];
                if (image == null) {
                    // render the support beams to a buffer
                    mikeSupportRenderCache[object.id] = image = document.createElement("canvas");
                    image.width = (maxC - minC + 1) * tileSize;
                    image.height = (maxR - minR + 1) * tileSize;
                    var bufferContext = image.getContext("2d");
                    // Make a stencil that excludes the insides of mikes.
                    // Then when we render the support beams, we won't see the supports inside the mike itself.
                    bufferContext.beginPath();
                    // Draw a path around the whole screen in the opposite direction as the rectangle paths below.
                    // This means that the below rectangles will be removing area from the greater rectangle.
                    bufferContext.rect(image.width, 0, -image.width, image.height);
                    for (var i = 0; i < object.locations.length; i++) {
                        var rowcol = getRowcol(level, object.locations[i]);
                        var r = rowcol.r - minR;
                        var c = rowcol.c - minC;
                        bufferContext.rect(c * tileSize, r * tileSize, tileSize, tileSize);
                    }
                    bufferContext.clip();
                    for (var i = 0; i < object.locations.length - 1; i++) {
                        var rowcol1 = getRowcol(level, object.locations[i]);
                        rowcol1.r -= minR;
                        rowcol1.c -= minC;
                        var rowcol2 = getRowcol(level, object.locations[i + 1]);
                        rowcol2.r -= minR;
                        rowcol2.c -= minC;
                        var cornerRowcol = { r: rowcol1.r, c: rowcol2.c };
                        var connectorColor = tint(blockColors[blockColors.length - 1 - object.id % blockColors.length], .5);
                        drawConnector(bufferContext, rowcol1.r, rowcol1.c, cornerRowcol.r, cornerRowcol.c, connectorColor);
                        drawConnector(bufferContext, rowcol2.r, rowcol2.c, cornerRowcol.r, cornerRowcol.c, connectorColor);
                    }
                }
                var r = minR + animationDisplacementRowcol.r;
                var c = minC + animationDisplacementRowcol.c;
                var savedContext2 = context;
                context = canvas2.getContext("2d");
                context.drawImage(image, c * tileSize, r * tileSize);
                context = savedContext2;
            });
        }

        var rng = new Math.seedrandom("b");
        var exitExists = false;
        if (!dont) {
            if (onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {    //draws wall underside curves and/or grass
                    for (var c = 0; c < level.width; c++) {
                        var location = getLocation(level, r, c);
                        var tileCode = level.map[location];
                        if (persistentState.showEditor || (!persistentState.showEditor && tileCode !== WALL && tileCode !== SPIKE)) drawTile(context, tileCode, r, c, level, location, rng, true, true);
                        if (tileCode === EXIT) exitExists = true;
                    }
                }
            }

            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                if (object.type === BLOCK || object.type === MIKE) drawObject(object, rng);
            }

            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                if (object.type === SNAKE) drawObject(object);
            }

            if (persistentState.showEditor && onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        var location = getLocation(level, r, c);
                        var tileCode = level.map[location];
                        if (tileCode === WATER || tileCode === LAVA) drawTile(context, tileCode, r, c, level, location, rng, false);
                    }
                }
            }

            if (persistentState.showEditor && onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        location = getLocation(level, r, c);
                        tileCode = level.map[location];
                        if (tileCode === WALL) drawTile(context, tileCode, r, c, level, location, rng, false, false);    //draws only walls
                    }
                }
            }

            if (!persistentState.showEditor) context = canvas6.getContext("2d");
            if (onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        location = getLocation(level, r, c);
                        tileCode = level.map[location];
                        if ((persistentState.showEditor && (tileCode === ONEWAYWALLR || tileCode === ONEWAYWALLL || tileCode === TRELLIS)) || tileCode === CLOUD || tileCode === BUBBLE) drawTile(context, tileCode, r, c, level, location, rng, false);
                    }
                }
            }

            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                if (object.type === FRUIT || object.type === POISONFRUIT) drawObject(object, rng);  //draws fruit
            }

            if (portalFailure && countSnakes() != 0) {
                drawSnakeOutline(postPortalSnakeOutline, portalConflicts);   //failed portal diagram
                if (portalOutOfBounds) {
                    context.strokeStyle = "rgba(255,0,0,.5)";
                    context.lineWidth = tileSize / 2;
                    roundRect(context, 0, 0, canvas4.width, canvas4.height, 0, false, true);
                }
            }

            // banners
            if (countSnakes() === 0 && exitExists) {
                if (!cs) {
                    context.fillStyle = "rgba(0,0,0,.7)";
                    context.fillRect(0, 0, level.width * tileSize, level.height * tileSize);

                    context.fillStyle = textStyle.win;
                    context.font = textStyle.fontSize + "px " + textStyle.fontFamily;
                    context.shadowOffsetX = 5;
                    context.shadowOffsetY = 5;
                    context.shadowColor = "rgba(255,255,255,0.1)";
                    context.shadowBlur = 4;
                    context.textBaseline = "middle";
                    fitTextOnCanvas(context, "Well done!", textStyle.fontFamily);
                    document.getElementById("copySVButton").disabled = false;
                }
                else checkResult = true;
            }
            if (isDead()) {
                if (!cs) {
                    canvas7.style.display = "block"
                    context = canvas7.getContext("2d");
                    context.fillStyle = "rgba(0,0,0,.7)";
                    context.clearRect(0, 0, level.width * tileSize, level.height * tileSize);
                    context.fillRect(0, 0, level.width * tileSize, level.height * tileSize);
                    var snakes = getSnakes();
                    var deadSnakes;
                    deadSnakes = snakes.filter(function (snake) {
                        return snake.dead === true;
                    });
                    var newRowcols = [];
                    deadSnakes[0].locations.forEach(function (loc) {
                        var start = lowDeath ? -.5 : -1;
                        var localRowcol = getRowcol(level, loc);
                        for (var i = start; i <= (start + 2); i++) {
                            for (var j = -1; j < 2; j++) {
                                newRowcols.push({ r: localRowcol.r + i, c: localRowcol.c + j });
                            }
                        }
                        // context.globalCompositeOperation("destination-out");
                        // context.beginPath();
                        // context.arc((locRowcol.c + .5) * tileSize, (locRowcol.r + .5) * tileSize, tileSize / 2, 0, 2 * Math.PI);
                        // context.closePath();
                    });
                    for (var i = 0; i < newRowcols.length; i++) {
                        context.clearRect(newRowcols[i].c * tileSize, newRowcols[i].r * tileSize, tileSize, tileSize);
                    }
                }
                else checkResult = false;
            }
        }

        if (cs && cr) {
            context = canvas6.getContext("2d");
            drawBackground(context, canvas6);
            context.fillStyle = "green";
            context.font = textStyle.fontSize + "px Impact";
            context.shadowOffsetX = 5;
            context.shadowOffsetY = 5;
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 4;
            var textString = "\u2713";
            context.textBaseline = "middle";
            var textWidth = context.measureText(textString).width;
            context.fillText(textString, (canvas6.width / 2) - (textWidth / 2), canvas6.height / 2);
        }
        else if (cs && !cr) {
            context = canvas6.getContext("2d");
            drawBackground(context, canvas6);
            context.fillStyle = "red";
            context.font = textStyle.fontSize + "px Impact";
            context.shadowOffsetX = 5;
            context.shadowOffsetY = 5;
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 4;
            var textString = "\u2716";
            context.textBaseline = "middle";
            var textWidth = context.measureText(textString).width;
            context.fillText(textString, (canvas6.width / 2) - (textWidth / 2), canvas6.height / 2);
        }

        // editor hover
        if (persistentState.showEditor && paintBrushTileCode != null && hoverLocation != null && hoverLocation < level.map.length) {
            var savedContext = context;
            var buffer = document.createElement("canvas");
            buffer.width = canvas4.width;
            buffer.height = canvas4.height;
            context = buffer.getContext("2d");

            var hoverRowcol = getRowcol(level, hoverLocation);
            var objectHere = findObjectAtLocation(hoverLocation);
            if (typeof paintBrushTileCode === "number") {
                if (level.map[hoverLocation] !== paintBrushTileCode) {
                    drawTile(context, paintBrushTileCode, hoverRowcol.r, hoverRowcol.c, level, hoverLocation, rng);
                }
            } else if (paintBrushTileCode === SNAKE) {
                if (!(objectHere != null && objectHere.type === SNAKE && objectHere.id === paintBrushSnakeColorIndex)) {
                    drawObject(newSnake(paintBrushSnakeColorIndex, hoverLocation));
                }
            } else if (paintBrushTileCode === BLOCK) {
                if (!(objectHere != null && objectHere.type === BLOCK && objectHere.id === paintBrushBlockId) && !splockIsActive) {
                    drawObject(newBlock(hoverLocation), rng);
                }
                else if (!(objectHere != null && objectHere.type === BLOCK && objectHere.id === paintBrushBlockId) && splockIsActive && paintBrushBlockId != null) {
                    drawTile(context, SPIKE, hoverRowcol.r, hoverRowcol.c, level, hoverLocation, rng);
                }
            } else if (paintBrushTileCode === MIKE) {
                if (!(objectHere != null && objectHere.type === MIKE && objectHere.id === paintBrushMikeId)) {
                    drawObject(newMike(hoverLocation), rng);
                }
            } else if (paintBrushTileCode === FRUIT) {
                if (!(objectHere != null && objectHere.type === FRUIT)) {
                    drawObject(newFruit(hoverLocation), rng);
                }
            } else if (paintBrushTileCode === POISONFRUIT) {
                if (!(objectHere != null && objectHere.type === POISONFRUIT)) {
                    drawObject(newPoisonFruit(hoverLocation), rng);
                }
            } else if (paintBrushTileCode === "resize") {
                void 0; // do nothing
            } else if (paintBrushTileCode === "select") {
                void 0; // do nothing
            } else if (paintBrushTileCode === "paste") {
                // show what will be pasted if you click
                var pastedData = previewPaste(hoverRowcol.r, hoverRowcol.c);
                pastedData.selectedLocations.forEach(function (location) {
                    var tileCode = pastedData.level.map[location];
                    var rowcol = getRowcol(level, location);
                    drawTile(context, tileCode, rowcol.r, rowcol.c, pastedData.level, location, rng);
                });
                pastedData.selectedObjects.forEach(drawObject, rng);
            } else throw unreachable();

            context = savedContext;
            context.save();
            context.globalAlpha = .2;
            context.drawImage(buffer, 0, 0);
            context.restore();
        }
        didResize = false;
    }

    function tint(hex, delta) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);

        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        s = s * 100;
        s = Math.round(s);
        l = l * 100 * delta;
        l = Math.round(l);
        h = Math.round(360 * h);

        return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // function hslToRgb(h, s, l) {
    //     var r, g, b;

    //     if (s == 0) {
    //         r = g = b = l; // achromatic
    //     } else {
    //         var hue2rgb = function hue2rgb(p, q, t) {
    //             if (t < 0) t += 1;
    //             if (t > 1) t -= 1;
    //             if (t < 1 / 6) return p + (q - p) * 6 * t;
    //             if (t < 1 / 2) return q;
    //             if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    //             return p;
    //         }

    //         var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    //         var p = 2 * l - q;
    //         r = hue2rgb(p, q, h + 1 / 3);
    //         g = hue2rgb(p, q, h);
    //         b = hue2rgb(p, q, h - 1 / 3);
    //     }

    //     return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    // }

    function drawObject(object, rng) {
        var r, c;
        switch (object.type) {
            case SNAKE:
                themeName !== "Classic" ? drawNewSnake() : drawOriginalSnake();
                break;
            case BLOCK:
                drawBlock(object, rng);
                break;
            case MIKE:
                drawMike(object, rng);
                break;
            case FRUIT:
            case POISONFRUIT:
                var isPoison = object.type == POISONFRUIT;
                drawFruit(object, isPoison, rng);
                break;
            default: throw unreachable();
        }
        function getAdjacentTiles() {
            return [
                [getTile(r - 1, c - 1),
                getTile(r - 1, c + 0),
                getTile(r - 1, c + 1)],
                [getTile(r + 0, c - 1),
                    null,
                getTile(r + 0, c + 1)],
                [getTile(r + 1, c - 1),
                getTile(r + 1, c + 0),
                getTile(r + 1, c + 1)],
            ];
        }
        function getTile(r, c) {
            if (!isInBounds(level, r, c)) return null;
            return level.map[getLocation(level, r, c)];
        }

        function drawNewSnake() {
            var falling = false;
            var animationDisplacementRowcol = findAnimationDisplacementRowcol(object.type, object.id);
            if (animationDisplacementRowcol.r != 0) falling = true;
            var lastRowcol = null
            var nextRowcol = null
            var color = snakeColors[object.id % snakeColors.length];
            var colorIndex = object.id % snakeColors.length;
            var altColor = tint(color, 1.2);
            if (snakeColors === snakeColors2) altColor = color;
            var headRowcol;
            var orientation = 10;
            for (var stage = 1; stage <= 2; stage++) {
                for (var i = 0; i < object.locations.length; i++) {
                    if (stage === 1 && i === 0) continue;
                    var animation;
                    var rowcol = getRowcol(level, object.locations[i]);
                    if (stage === 2) {
                        if (i === 0 && (animation = findAnimation([SLITHER_HEAD], object.id)) != null) {
                            rowcol.r += animation[2] * (animationProgress - 1);
                            rowcol.c += animation[3] * (animationProgress - 1);
                        } else if ((animation = findAnimation([SLITHER_TAIL + i], object.id)) != null) {
                            rowcol.r += animation[2] * (animationProgress - 1);
                            rowcol.c += animation[3] * (animationProgress - 1);
                        }
                    }

                    lastRowcol = getRowcol(level, object.locations[i - 1]); //closer to head
                    nextRowcol = getRowcol(level, object.locations[i + 1]); //closer to tail
                    var rc = rowcol;
                    var lrc = lastRowcol;
                    var nrc = nextRowcol;

                    if (object.dead && (!dieOnSplock || dieOnSplock === object.id)) {
                        // if (spike2Death[2] != null) {
                        //     if (spike2Death[2].type === SNAKE && spike2Death[2].id === object.id)
                        // }
                        lowDeath = true;
                        rowcol.r += .5;
                        lastRowcol.r += .5;
                        nextRowcol.r += .5;
                        falling = true;
                    }
                    rowcol.r += animationDisplacementRowcol.r;
                    rowcol.c += animationDisplacementRowcol.c;
                    lastRowcol.r += animationDisplacementRowcol.r;
                    lastRowcol.c += animationDisplacementRowcol.c;
                    nextRowcol.r += animationDisplacementRowcol.r;
                    nextRowcol.c += animationDisplacementRowcol.c;

                    var cx = rowcol.c * tileSize;
                    var cy = rowcol.r * tileSize;

                    if (i === 0) {
                        context.fillStyle = color;
                        headRowcol = rowcol;

                        //determines orientation of face
                        if (!falling) nextRowcol = getRowcol(level, object.locations[1]);
                        if (nextRowcol.r < rowcol.r) {  //last move down
                            roundRect(context, cx, cy, tileSize, tileSize, { bl: borderRadius, br: borderRadius }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 2;
                            else if (colorIndex === 1) orientation = 6;
                            else if (colorIndex === 2) orientation = 3;
                            else if (colorIndex === 3) orientation = 5;
                        }
                        else if (nextRowcol.r > rowcol.r) {  //last move up
                            roundRect(context, cx, cy, tileSize, tileSize, { tl: borderRadius, tr: borderRadius }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 0;
                            else if (colorIndex === 1) orientation = 4;
                            else if (colorIndex === 2) orientation = 1;
                            else if (colorIndex === 3) orientation = 7;
                        }
                        else if (nextRowcol.c < rowcol.c) {  //last move right
                            roundRect(context, cx, cy, tileSize, tileSize, { tr: borderRadius, br: borderRadius }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 1;
                            else if (colorIndex === 1) orientation = 5;
                            else if (colorIndex === 2) orientation = 2;
                            else if (colorIndex === 3) orientation = 4;
                        }
                        else if (nextRowcol.c > rowcol.c) {  //last move left
                            roundRect(context, cx, cy, tileSize, tileSize, { tl: borderRadius, bl: borderRadius }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 3;
                            else if (colorIndex === 1) orientation = 7;
                            else if (colorIndex === 2) orientation = 0;
                            else if (colorIndex === 3) orientation = 6;
                        }
                        else {
                            roundRect(context, cx, cy, tileSize, tileSize, borderRadius, true, false);  //draw head
                            orientation = 10;
                        }
                    } else {
                        if (i % 2 == 0) context.fillStyle = color;
                        else context.fillStyle = altColor;

                        if (i === object.locations.length - 1) {
                            if (lastRowcol.r > rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { tl: borderRadius, tr: borderRadius }, true, false); }
                            else if (lastRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { bl: borderRadius, br: borderRadius }, true, false); }
                            else if (lastRowcol.c < rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tr: borderRadius, br: borderRadius }, true, false); }
                            else if (lastRowcol.c > rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tl: borderRadius, bl: borderRadius }, true, false); }
                        }
                        else if (i < object.locations.length - 1) {
                            if (lastRowcol.r > rowcol.r && nextRowcol.c < rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tr: borderRadius }, true, false); }
                            else if (lastRowcol.r > rowcol.r && nextRowcol.c > rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tl: borderRadius }, true, false); }
                            else if (lastRowcol.r < rowcol.r && nextRowcol.c < rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { br: borderRadius }, true, false); }
                            else if (lastRowcol.r < rowcol.r && nextRowcol.c > rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { bl: borderRadius }, true, false); }

                            else if (lastRowcol.c > rowcol.c && nextRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { bl: borderRadius }, true, false); }
                            else if (lastRowcol.c > rowcol.c && nextRowcol.r > rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { tl: borderRadius }, true, false); }
                            else if (lastRowcol.c < rowcol.c && nextRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { br: borderRadius }, true, false); }
                            else if (lastRowcol.c < rowcol.c && nextRowcol.r > rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { tr: borderRadius }, true, false); }

                            else if (lastRowcol.c < rowcol.c && nextRowcol.c > rowcol.c || lastRowcol.c > rowcol.c && nextRowcol.c < rowcol.c || lastRowcol.r < rowcol.r && nextRowcol.r > rowcol.r || lastRowcol.r > rowcol.r && nextRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, 0, true, false); }
                        }
                        else roundRect(context, cx, cy, tileSize, tileSize, borderRadius, true, false);
                    }
                }
            }
            r = headRowcol.r;
            c = headRowcol.c;
            drawFace(object.id, c, r, orientation, getAdjacentTiles());
        }

        function drawOriginalSnake() {
            var animationDisplacementRowcol = findAnimationDisplacementRowcol(object.type, object.id);
            var lastRowcol = null
            var color = snakeColors[object.id % snakeColors.length];
            var headRowcol;
            for (var i = 0; i <= object.locations.length; i++) {
                var animation;
                var rowcol;
                if (i === 0 && (animation = findAnimation([SLITHER_HEAD], object.id)) != null) {
                    // animate head slithering forward
                    rowcol = getRowcol(level, object.locations[i]);
                    rowcol.r += animation[2] * (animationProgress - 1);
                    rowcol.c += animation[3] * (animationProgress - 1);
                } else if (i === object.locations.length) {
                    // animated tail?
                    if ((animation = findAnimation([SLITHER_TAIL], object.id)) != null) {
                        // animate tail slithering to catch up
                        rowcol = getRowcol(level, object.locations[i - 1]);
                        rowcol.r += animation[2] * (animationProgress - 1);
                        rowcol.c += animation[3] * (animationProgress - 1);
                    } else {
                        // no animated tail needed
                        break;
                    }
                } else {
                    rowcol = getRowcol(level, object.locations[i]);
                }
                if (object.dead) rowcol.r += 0.5;
                rowcol.r += animationDisplacementRowcol.r;
                rowcol.c += animationDisplacementRowcol.c;
                if (i === 0) {
                    // head
                    headRowcol = rowcol;
                    drawDiamond(rowcol.r, rowcol.c, color);
                } else {
                    // middle
                    var cx = (rowcol.c + 0.5) * tileSize;
                    var cy = (rowcol.r + 0.5) * tileSize;
                    context.fillStyle = color;
                    var orientation;
                    if (lastRowcol.r < rowcol.r) {
                        orientation = 0;
                        context.beginPath();
                        context.moveTo((lastRowcol.c + 0) * tileSize, (lastRowcol.r + 0.5) * tileSize);
                        context.lineTo((lastRowcol.c + 1) * tileSize, (lastRowcol.r + 0.5) * tileSize);
                        context.arc(cx, cy, tileSize / 2, 0, Math.PI);
                        context.fill();
                    } else if (lastRowcol.r > rowcol.r) {
                        orientation = 2;
                        context.beginPath();
                        context.moveTo((lastRowcol.c + 1) * tileSize, (lastRowcol.r + 0.5) * tileSize);
                        context.lineTo((lastRowcol.c + 0) * tileSize, (lastRowcol.r + 0.5) * tileSize);
                        context.arc(cx, cy, tileSize / 2, Math.PI, 0);
                        context.fill();
                    } else if (lastRowcol.c < rowcol.c) {
                        orientation = 3;
                        context.beginPath();
                        context.moveTo((lastRowcol.c + 0.5) * tileSize, (lastRowcol.r + 1) * tileSize);
                        context.lineTo((lastRowcol.c + 0.5) * tileSize, (lastRowcol.r + 0) * tileSize);
                        context.arc(cx, cy, tileSize / 2, 1.5 * Math.PI, 2.5 * Math.PI);
                        context.fill();
                    } else if (lastRowcol.c > rowcol.c) {
                        orientation = 1;
                        context.beginPath();
                        context.moveTo((lastRowcol.c + 0.5) * tileSize, (lastRowcol.r + 0) * tileSize);
                        context.lineTo((lastRowcol.c + 0.5) * tileSize, (lastRowcol.r + 1) * tileSize);
                        context.arc(cx, cy, tileSize / 2, 2.5 * Math.PI, 1.5 * Math.PI);
                        context.fill();
                    }
                }
                lastRowcol = rowcol;
            }
            // eye
            if (object.id === activeSnakeId) {
                drawCircle(context, headRowcol.r, headRowcol.c, 0.5, "#fff");
                drawCircle(context, headRowcol.r, headRowcol.c, 0.2, "#000");
            }

            function drawDiamond(r, c, fillStyle) {
                var x = c * tileSize;
                var y = r * tileSize;
                context.fillStyle = fillStyle;
                context.beginPath();
                context.moveTo(x + tileSize / 2, y);
                context.lineTo(x + tileSize, y + tileSize / 2);
                context.lineTo(x + tileSize / 2, y + tileSize);
                context.lineTo(x, y + tileSize / 2);
                context.lineTo(x + tileSize / 2, y);
                context.fill();
            }
        }
    }

    function drawFace(snake, headCol, headRow, orientation, adjacentTiles) {
        drawFace2(snake, headCol, headRow, orientation, isNotSpace);
        function isNotSpace(dr, dc) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            var result = tileCode === WALL || tileCode === SPIKE || tileCode === CLOUD || tileCode === BUBBLE || tileCode === LAVA || tileCode === WATER;
            if (dr == 1 || dr == -1) return result || tileCode === OPENLIFT;
            else return result;
        }
    }

    function drawFace2(snake, headCol, headRow, orientation, isOccupied) {
        var forwardLocation;
        var forwardObject = null;
        var straight;

        var x = headCol * tileSize;
        var y = headRow * tileSize;

        var scaleFactor = 1.5;
        var scale1;
        var scale2;
        var eye1 = tileSize * .8;
        var eye2 = tileSize * .4;

        var eyeSize = tileSize / 5;
        var eyeRotation = 2;
        var z1, z2, z3, z4, z5, z6, z7, z8;
        var a1, a2, a3, a4, a5, a6, a7, a8;
        var b1, b2, b3, b4, b5, b6, b7, b8, b9, b10;
        var beakRotation = 1.5;
        var arcDirection = false;

        switch (orientation) {
            case 0:    //red up and blue left
                z1 = eye2;
                z2 = tileSize - eye1;
                z3 = eye2;
                z4 = tileSize - eye2;
                z5 = eye2;
                z6 = tileSize - eye1;
                z7 = eye2;
                z8 = tileSize - eye2
                eyeRotation = 1.5;
                scale1 = scaleFactor;
                scale2 = 1;

                if (1 <= headRow && headRow < level.height - 1) {
                    forwardLocation = getLocation(level, headRow - 1, headCol);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(-1, 0) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .6;
                    b2 = tileSize * .05;
                    b3 = tileSize * .7;
                    b4 = -tileSize * .05;
                    b5 = tileSize;
                    b6 = tileSize * .1;
                    b7 = tileSize * .2;
                    b8 = tileSize * .1;
                }
                else straight = true;

                a1 = tileSize * .7;
                a2 = tileSize * .3;
                a3 = tileSize * .7;
                a4 = -tileSize * .3;
                a5 = tileSize * .7;
                a6 = tileSize * .3;
                a7 = tileSize / 6;
                a8 = 0;
                beakRotation = 1;
                arcDirection = false;
                break;
            case 1:    //red right and blue up
            case 10:
                z1 = eye1;
                z2 = eye2;
                z3 = eye2;
                z4 = eye2;
                z5 = eye1;
                z6 = eye2;
                z7 = eye2;
                z8 = eye2;
                eyeRotation = 2;
                scale1 = 1;
                scale2 = scaleFactor;

                if (1 <= headCol && headCol < level.width - 1) {
                    forwardLocation = getLocation(level, headRow, headCol + 1);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(0, 1) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .95;
                    b2 = tileSize * .6;
                    b3 = tileSize * 1.05;
                    b4 = tileSize * .7;
                    b5 = tileSize * .9;
                    b6 = tileSize;
                    b7 = -tileSize * .1;
                    b8 = tileSize * .2;
                }
                else straight = true;

                a1 = tileSize * .7;
                a2 = tileSize * .7;
                a3 = tileSize * 1.3;
                a4 = tileSize * .7;
                a5 = tileSize * .7;
                a6 = tileSize * .7;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = 1.5;
                arcDirection = false;
                break;
            case 2:    //red down and blue right
                z1 = tileSize - eye2;
                z2 = eye1;
                z3 = tileSize - eye2;
                z4 = eye2;
                z5 = tileSize - eye2;
                z6 = eye1;
                z7 = tileSize - eye2;
                z8 = eye2;
                eyeRotation = 2.5;
                scale1 = scaleFactor;
                scale2 = 1;

                if (1 <= headRow && headRow < level.height - 1) {
                    forwardLocation = getLocation(level, headRow + 1, headCol);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(1, 0) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .4;
                    b2 = tileSize * .95;
                    b3 = tileSize * .3;
                    b4 = tileSize * 1.05;
                    b5 = 0;
                    b6 = tileSize * .9;
                    b7 = -tileSize * .2;
                    b8 = -tileSize * .1;
                }
                else straight = true;

                a1 = tileSize * .3;
                a2 = tileSize * .7;
                a3 = tileSize * .3;
                a4 = tileSize * 1.3;
                a5 = tileSize * .3;
                a6 = tileSize * .7;
                a7 = tileSize / 6;
                a8 = 0;
                beakRotation = 2;
                arcDirection = false;
                break;
            case 3:    //red left and blue down
                z1 = tileSize - eye1;
                z2 = tileSize - eye2;
                z3 = tileSize - eye2;
                z4 = tileSize - eye2;
                z5 = tileSize - eye1;
                z6 = tileSize - eye2;
                z7 = tileSize - eye2;
                z8 = tileSize - eye2;
                eyeRotation = 3;
                scale1 = 1;
                scale2 = scaleFactor;

                if (1 <= headCol && headCol < level.width - 1) {
                    forwardLocation = getLocation(level, headRow, headCol - 1);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(0, -1) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .05;
                    b2 = tileSize * .4;
                    b3 = -tileSize * .05;
                    b4 = tileSize * .3;
                    b5 = tileSize * .1;
                    b6 = 0;
                    b7 = tileSize * .1;
                    b8 = -tileSize * .2;
                }
                else straight = true;

                a1 = tileSize * .3;
                a2 = tileSize * .3;
                a3 = tileSize - tileSize * 1.3;
                a4 = tileSize * .3;
                a5 = tileSize * .3;
                a6 = tileSize * .3;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = 2.5;
                arcDirection = false;
                break;
            case 4:    //green up and yellow right
                z1 = tileSize - eye2;
                z2 = tileSize - eye1;
                z3 = tileSize - eye2;
                z4 = tileSize - eye2;
                z5 = tileSize - eye2;
                z6 = tileSize - eye1;
                z7 = tileSize - eye2;
                z8 = tileSize - eye2
                eyeRotation = 2.5;
                scale1 = scaleFactor;
                scale2 = 1;

                if (1 <= headRow && headRow < level.height - 1) {
                    forwardLocation = getLocation(level, headRow - 1, headCol);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(-1, 0) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .4;
                    b2 = tileSize * .05;
                    b3 = tileSize * .3;
                    b4 = -tileSize * .05;
                    b5 = 0;
                    b6 = tileSize * .1;
                    b7 = -tileSize * .2;
                    b8 = tileSize * .1;
                }
                else straight = true;

                a1 = tileSize * .3;
                a2 = tileSize * .3;
                a3 = tileSize * .3;
                a4 = -tileSize * .3;
                a5 = tileSize * .3;
                a6 = tileSize * .3;
                a7 = tileSize / 6;
                a8 = 0;
                beakRotation = 2;
                arcDirection = true;
                break;
            case 5:    //green right and yellow down
                z1 = eye1;
                z2 = tileSize - eye2;
                z3 = eye2;
                z4 = tileSize - eye2;
                z5 = eye1;
                z6 = tileSize - eye2;
                z7 = eye2;
                z8 = tileSize - eye2;
                eyeRotation = 3;
                scale1 = 1;
                scale2 = scaleFactor;

                if (1 <= headCol && headCol < level.width - 1) {
                    forwardLocation = getLocation(level, headRow, headCol + 1);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(0, 1) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .95;
                    b2 = tileSize * .4;
                    b3 = tileSize * 1.05;
                    b4 = tileSize * .3;
                    b5 = tileSize * .9;
                    b6 = 0;
                    b7 = -tileSize * .1;
                    b8 = -tileSize * .2;
                }
                else straight = true;

                a1 = tileSize * .7;
                a2 = tileSize * .3;
                a3 = tileSize * 1.3;
                a4 = tileSize * .3;
                a5 = tileSize * .7;
                a6 = tileSize * .3;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = .5;
                arcDirection = true;
                break;
            case 6:    //green down and yellow left
                z1 = eye2;
                z2 = eye1;
                z3 = eye2;
                z4 = eye2;
                z5 = eye2;
                z6 = eye1;
                z7 = eye2;
                z8 = eye2;
                eyeRotation = 1.5;
                scale1 = scaleFactor;
                scale2 = 1;

                if (1 <= headRow && headRow < level.height - 1) {
                    forwardLocation = getLocation(level, headRow + 1, headCol);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(1, 0) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .6;
                    b2 = tileSize * .95;
                    b3 = tileSize * .7;
                    b4 = tileSize * 1.05;
                    b5 = tileSize;
                    b6 = tileSize * .9;
                    b7 = tileSize * .2;
                    b8 = -tileSize * .1;
                }
                else straight = true;

                a1 = tileSize * .7;
                a2 = tileSize * .7;
                a3 = tileSize * .7;
                a4 = tileSize * 1.3;
                a5 = tileSize * .7;
                a6 = tileSize * .7;
                a7 = tileSize / 6;
                a8 = 0;
                beakRotation = 1;
                arcDirection = true;
                break;
            case 7:    //green left and yellow up
                z1 = tileSize - eye1;
                z2 = eye2;
                z3 = tileSize - eye2;
                z4 = eye2;
                z5 = tileSize - eye1;
                z6 = eye2;
                z7 = tileSize - eye2;
                z8 = eye2;
                eyeRotation = 2;
                scale1 = 1;
                scale2 = scaleFactor;

                if (1 <= headCol && headCol < level.width - 1) {
                    forwardLocation = getLocation(level, headRow, headCol - 1);
                    forwardObject = findObjectAtLocation(forwardLocation);
                }
                if (isOccupied(0, -1) || (forwardObject != null && forwardObject.type !== FRUIT)) {
                    straight = false;
                    b1 = tileSize * .05;
                    b2 = tileSize * .6;
                    b3 = -tileSize * .05;
                    b4 = tileSize * .7;
                    b5 = tileSize * .1;
                    b6 = tileSize;
                    b7 = tileSize * .1;
                    b8 = tileSize * .2;
                }
                else straight = true;

                a1 = tileSize * .3;
                a2 = tileSize * .7;
                a3 = tileSize - tileSize * 1.3;
                a4 = tileSize * .7;
                a5 = tileSize * .3;
                a6 = tileSize * .7;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = 1.5;
                arcDirection = true;
                break;
        }

        if (snake === activeSnakeId) {     //draw eyes for active snake only    
            context.fillStyle = "white";
            context.save();
            context.scale(scale1, scale2);
            context.beginPath();
            context.arc((x + z1) / scale1, (y + z2) / scale2, eyeSize, (eyeRotation - 1) * Math.PI, eyeRotation * Math.PI, true);
            context.closePath();
            context.restore();
            context.fill();

            context.fillStyle = "white";
            context.save();
            context.scale(scale1, scale2);
            context.beginPath();
            context.arc((x + z3) / scale1, (y + z4) / scale2, eyeSize, (eyeRotation - 1) * Math.PI, eyeRotation * Math.PI, true);
            context.closePath();
            context.restore();
            context.fill();

            context.fillStyle = "black";
            context.save();
            context.scale(scale1, scale2);
            context.beginPath();
            context.arc((x + z5) / scale1, (y + z6) / scale2, eyeSize / 2, (eyeRotation - 1) * Math.PI, eyeRotation * Math.PI, true);
            context.closePath();
            context.restore();
            context.fill();

            context.fillStyle = "black";
            context.save();
            context.scale(scale1, scale2);
            context.beginPath();
            context.arc((x + z7) / scale1, (y + z8) / scale2, eyeSize / 2, (eyeRotation - 1) * Math.PI, eyeRotation * Math.PI, true);
            context.closePath();
            context.restore();
            context.fill();
        }

        //beak
        context.fillStyle = "#F9921C";
        context.strokeStyle = "#f98806";
        context.lineWidth = tileSize / 24;
        context.beginPath();
        context.arc(x + a1, y + a2, tileSize / 6, (beakRotation - 1) * Math.PI, beakRotation * Math.PI, arcDirection);
        if (straight) context.lineTo(x + a3, y + a4);
        else {
            context.lineTo(x + b1, y + b2);
            context.bezierCurveTo(x + b1, y + b2, x + b3, y + b4, x + b5, y + b6);
            context.lineTo(x + b1 + b7, y + b2 + b8);
        }
        context.closePath();
        context.stroke();
        context.fill();
    }

    function drawFruit(object, isPoison, rng) {
        var isPoison = object.type === POISONFRUIT;
        var rowcol = getRowcol(level, object.locations[0]);
        var c = rowcol.c;
        var r = rowcol.r;
        var startC = c * tileSize + tileSize / 2;
        var startR = (r + .08) * tileSize;
        var resize = tileSize * 1.7;

        var color = fruitColors[object.id % fruitColors.length];
        var stemColor = themes[themeCounter][7];
        if (themeName === "Classic") {
            var circle = true;
            color = "#f0f";
        }
        context.save();
        if (isPoison) {
            color = "#666600";
            stemColor = "#805500";
        }

        context.fillStyle = color;
        if (circle) {
            drawCircle(context, r, c, 1, color);
        }
        else {
            if (wall.surface == "rainbow") {
                if (isPoison) {
                    stemColor = "black";
                    var grd = context.createLinearGradient(c * tileSize, r * tileSize, (c + 1) * tileSize, (r + 1) * tileSize);
                    grd.addColorStop(0, "black");
                    grd.addColorStop(1 / 2, "gray");
                    grd.addColorStop(1, "black");
                    context.fillStyle = grd;
                } else {
                    stemColor = "white";
                    var grd = context.createLinearGradient(c * tileSize, r * tileSize, (c + 1) * tileSize, (r + 1) * tileSize);
                    grd.addColorStop(0, "white");
                    grd.addColorStop(1 / 2, "#888");
                    grd.addColorStop(1, "white");
                    context.fillStyle = grd;
                }

                // context.lineWidth = tileSize / 8;
                // context.strokeStyle = "white";
            }
            // context.transform(.8, 0, 0, .8, 100, 100);
            context.beginPath();
            context.moveTo(startC, startR);
            context.bezierCurveTo(startC - resize * .1, startR - resize * .05, startC - resize * .25, startR - resize * .1, startC - resize * .3, startR + resize * .05);
            context.bezierCurveTo(startC - resize * .35, startR + resize * .15, startC - resize * .3, startR + resize * .6, startC, startR + resize * .5);
            context.bezierCurveTo(startC + resize * .3, startR + resize * .6, startC + resize * .35, startR + resize * .15, startC + resize * .3, startR + resize * .05);
            context.bezierCurveTo(startC + resize * .25, startR - resize * .05, startC + resize * .1, startR - resize * .1, startC, startR);
            context.closePath();
            context.fill();

            context.beginPath();
            context.moveTo(startC, startR);
            context.bezierCurveTo(startC - resize * .1, startR - resize * .05, startC, startR - resize * .1, startC - resize * .1, startR - resize * .15);
            context.bezierCurveTo(startC, startR - resize * .1, startC + resize * .05, startR - resize * .1, startC, startR);
            context.fillStyle = stemColor;
            context.fill();
        }
        if (isPoison) {
            for (var i = 0; i < 60; i++) {
                var spotC = rng();
                var spotR = rng();
                var mod = i % 2;
                switch (mod) {
                    case 0: context.fillStyle = "rgba(20,20,0,.2)"; break;
                    case 1: context.fillStyle = "rgba(100,200,255,.2)"; break;
                }
                context.globalCompositeOperation = "source-atop";
                context.beginPath();
                context.arc((c + spotC) * tileSize, (r + spotR) * tileSize, tileSize / 22, 0, 2 * Math.PI);
                context.fill();
            }
            for (var i = 0; i < 10; i++) {
                var spotC = rng();
                var spotR = rng();
                var mod = i % 2;
                switch (mod) {
                    case 0: context.fillStyle = "rgba(20,20,0,.2)"; break;
                    case 1: context.fillStyle = "rgba(100,200,255,.1)"; break;
                }
                context.globalCompositeOperation = "source-atop";
                context.beginPath();
                context.arc((c + spotC) * tileSize, (r + spotR) * tileSize, tileSize / 10, 0, 2 * Math.PI);
                context.fill();
            }
        }
        context.restore();
    }

    function drawConnector(context, r1, c1, r2, c2, color) {
        // either r1 and r2 or c1 and c2 must be equal
        if (r1 > r2 || c1 > c2) {
            var rTmp = r1;
            var cTmp = c1;
            r1 = r2;
            c1 = c2;
            r2 = rTmp;
            c2 = cTmp;
        }
        var connectorSize = .38;
        var xLo = (c1 + connectorSize) * tileSize;
        var yLo = (r1 + connectorSize) * tileSize;
        var xHi = (c2 + 1 - connectorSize) * tileSize;
        var yHi = (r2 + 1 - connectorSize) * tileSize;
        context.fillStyle = color;
        context.fillRect(xLo, yLo, xHi - xLo, yHi - yLo);
    }

    function drawBlock(block, rng) {
        var animationDisplacementRowcol = findAnimationDisplacementRowcol(block.type, block.id);
        var blockRowcols = block.locations.map(function (location) {
            return getRowcol(level, location);
        });
        var splockRowcols = block.splocks.map(function (location) {
            return getRowcol(level, location);
        });

        var color = blockColors[block.id % blockColors.length];
        splockRowcols.forEach(function (rowcol) {
            var r = rowcol.r + animationDisplacementRowcol.r;
            var c = rowcol.c + animationDisplacementRowcol.c;
            if (isDead() && spike2Death[0] === BLOCK && spike2Death[1] === block.id && spike2Death[2].dead) r += .5;
            drawSpikes(context, r, c, null, rng, blockRowcols, splockRowcols, color);
        });

        blockRowcols.forEach(function (rowcol) {
            var r = rowcol.r + animationDisplacementRowcol.r;
            var c = rowcol.c + animationDisplacementRowcol.c;
            if (isDead() && spike2Death[0] === BLOCK && spike2Death[1] === block.id && spike2Death[2].dead) r += .5;

            context.fillStyle = color;
            var outlineThickness = .4;
            var complement = 1 - outlineThickness;
            var outlinePixels = outlineThickness * tileSize;

            var c1, c2, c3, c4;
            c1 = c2 = c3 = c4 = blockRadius;
            if (isAlsoThisBlock(-1, 0)) c1 = c3 = 0;
            if (isAlsoThisBlock(1, 0)) c2 = c4 = 0;
            if (isAlsoThisBlock(0, -1)) c1 = c2 = 0;
            if (isAlsoThisBlock(0, 1)) c3 = c4 = 0;

            // draw curves
            var size = .9;
            var inverse = 1 - size;

            // top right
            if (isAlsoThisBlock(1, 0) && isAlsoThisBlock(0, -1) && !isAlsoThisBlock(1, -1)) {
                var y = r;
                var x = c + 1;
                context.beginPath();
                context.moveTo((x + inverse) * tileSize, y * tileSize);
                context.lineTo(x * tileSize, y * tileSize);
                context.lineTo(x * tileSize, (y - inverse) * tileSize);
                context.arc((x + inverse) * tileSize, (y - inverse) * tileSize, inverse * tileSize, Math.PI, .5 * Math.PI, true);
                context.closePath();
                context.fill();
            }
            // top left
            else if (isAlsoThisBlock(-1, 0) && isAlsoThisBlock(0, -1) && !isAlsoThisBlock(-1, -1)) {
                var y = r;
                var x = c - 1;
                context.beginPath();
                context.moveTo((x + size) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, (y - inverse) * tileSize);
                context.arc((x + size) * tileSize, (y - inverse) * tileSize, inverse * tileSize, 0, .5 * Math.PI, false);
                context.closePath();
                context.fill();
            }
            // top left
            else if (isAlsoThisBlock(-1, 1) && isAlsoThisBlock(0, 1) && !isAlsoThisBlock(-1, 0)) {
                var y = r + 1;
                var x = c - 1;
                context.beginPath();
                context.moveTo((x + size) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, (y - inverse) * tileSize);
                context.arc((x + size) * tileSize, (y - inverse) * tileSize, inverse * tileSize, 0, .5 * Math.PI, false);
                context.closePath();
                context.fill();
            }
            // bottom right
            else if (isAlsoThisBlock(1, 0) && isAlsoThisBlock(0, 1) && !isAlsoThisBlock(1, 1)) {
                var y = r + 1;
                var x = c + 1;
                context.beginPath();
                context.moveTo((x + inverse) * tileSize, y * tileSize);
                context.lineTo(x * tileSize, y * tileSize);
                context.lineTo(x * tileSize, (y + inverse) * tileSize);
                context.arc((x + inverse) * tileSize, (y + inverse) * tileSize, inverse * tileSize, Math.PI, 1.5 * Math.PI, false);
                context.closePath();
                context.fill();
            }
            // bottom right
            else if (!isAlsoThisBlock(1, 0) && isAlsoThisBlock(0, -1) && isAlsoThisBlock(1, -1)) {
                var y = r;
                var x = c + 1;
                context.beginPath();
                context.moveTo((x + inverse) * tileSize, y * tileSize);
                context.lineTo(x * tileSize, y * tileSize);
                context.lineTo(x * tileSize, (y + inverse) * tileSize);
                context.arc((x + inverse) * tileSize, (y + inverse) * tileSize, inverse * tileSize, Math.PI, 1.5 * Math.PI, false);
                context.closePath();
                context.fill();
            }
            // bottom left
            else if (isAlsoThisBlock(-1, 0) && isAlsoThisBlock(0, 1) && !isAlsoThisBlock(-1, 1)) {
                var y = r + 1;
                var x = c - 1;
                context.beginPath();
                context.moveTo((x + size) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, (y + inverse) * tileSize);
                context.arc((x + size) * tileSize, (y + inverse) * tileSize, inverse * tileSize, 0, 1.5 * Math.PI, true);
                context.closePath();
                context.fill();
            }
            // bottom left (why needed?)
            else if (isAlsoThisBlock(-1, -1) && isAlsoThisBlock(0, -1) && !isAlsoThisBlock(-1, 0)) {
                var y = r;
                var x = c - 1;
                context.beginPath();
                context.moveTo((x + size) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, y * tileSize);
                context.lineTo((x + 1) * tileSize, (y + inverse) * tileSize);
                context.arc((x + size) * tileSize, (y + inverse) * tileSize, inverse * tileSize, 0, 1.5 * Math.PI, true);
                context.closePath();
                context.fill();
            }

            if (!isAlsoThisBlock(-1, -1) && isAlsoThisBlock(0, -1))
                roundRect(context, c * tileSize, r * tileSize, outlinePixels, outlinePixels, { tl: 0, tr: 0, bl: 0, br: blockRadius }, true, false);
            if (!isAlsoThisBlock(1, -1) && isAlsoThisBlock(0, -1))
                roundRect(context, (c + complement) * tileSize, r * tileSize, outlinePixels, outlinePixels, { tl: 0, tr: 0, bl: blockRadius, br: 0 }, true, false);
            if (!isAlsoThisBlock(-1, 1) && isAlsoThisBlock(0, 1))
                roundRect(context, c * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels, { tl: 0, tr: blockRadius, bl: 0, br: 0 }, true, false);
            if (!isAlsoThisBlock(1, 1) && isAlsoThisBlock(0, 1))
                roundRect(context, (c + complement) * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels, { tl: blockRadius, tr: 0, bl: 0, br: 0 }, true, false);

            if (!isAlsoThisBlock(0, -1)) roundRect(context, c * tileSize, r * tileSize, tileSize, outlinePixels, { tl: c1, tr: c2, bl: c3, br: c4 }, true, false);
            if (!isAlsoThisBlock(0, 1)) roundRect(context, c * tileSize, (r + complement) * tileSize, tileSize, outlinePixels, { tl: c1, tr: c2, bl: c3, br: c4 }, true, false);
            if (!isAlsoThisBlock(-1, 0)) roundRect(context, c * tileSize, r * tileSize, outlinePixels, tileSize, { tl: c1, tr: c2, bl: c3, br: c4 }, true, false);
            if (!isAlsoThisBlock(1, 0)) roundRect(context, (c + complement) * tileSize, r * tileSize, outlinePixels, tileSize, { tl: c1, tr: c2, bl: c3, br: c4 }, true, false);

            function isAlsoThisBlock(dc, dr) {
                for (var i = 0; i < blockRowcols.length; i++) {
                    var otherRowcol = blockRowcols[i];
                    if (rowcol.r + dr === otherRowcol.r && rowcol.c + dc === otherRowcol.c) return true;
                }
                return false;
            }
        });
    }

    function drawMike(mike, rng) {
        var animationDisplacementRowcol = findAnimationDisplacementRowcol(mike.type, mike.id);
        var mikeRowcols = mike.locations.map(function (location) {
            return getRowcol(level, location);
        });
        var color = blockColors[blockColors.length - 1 - mike.id % blockColors.length]
        mikeRowcols.forEach(function (rowcol) {
            var r = rowcol.r + animationDisplacementRowcol.r;
            var c = rowcol.c + animationDisplacementRowcol.c;
            if (isDead() && spike2Death[0] === MIKE && spike2Death[1] === mike.id) r += .5;
            drawStar(context, (c + .5) * tileSize, (r + .5) * tileSize, 31, tileSize * .45, tileSize * .36, color);

            var side = 0;
            var size = tileSize / 6;
            var x = (c + .5) * tileSize;
            var y = (r + .5) * tileSize;

            var rotation = rng() * 2 * Math.PI;
            context.save();
            context.translate(x, y);
            context.rotate(rotation);
            context.translate(-x, -y);

            context.beginPath();
            context.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));
            for (side; side < 7; side++) {
                context.lineTo((x + size * Math.cos(side * 2 * Math.PI / 6)) * 1, (y + size * Math.sin(side * 2 * Math.PI / 6)) * 1);
            }
            // context.lineWidth = 1.5;
            // context.strokeStyle = "#999";
            // context.stroke();
            // context.fillStyle = tint(color, .5);
            context.fillStyle = "#444";
            context.fill();
            context.restore();
        });

        function drawStar(context, cx, cy, spikes, outerRadius, innerRadius, color) {
            var rot = 1.5 * Math.PI;
            var x = cx;
            var y = cy;
            var step = Math.PI / spikes;

            context.save();
            context.translate(x, y);
            context.rotate(Math.PI / 12);
            context.translate(-x, -y);
            context.beginPath();
            context.moveTo(cx, cy - outerRadius)
            for (i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                context.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                context.lineTo(x, y);
                rot += step;
            }
            context.lineTo(cx, cy - outerRadius);
            context.closePath();
            context.lineWidth = 2;
            context.strokeStyle = tint(color, .95);
            context.stroke();
            context.fillStyle = color;
            context.fill();
            context.restore();
        }
    }

    function drawGrid() {
        var buffer = document.createElement("canvas");
        buffer.width = canvas4.width;
        buffer.height = canvas4.height;
        var localContext = buffer.getContext("2d");

        localContext.strokeStyle = "#fff";
        localContext.beginPath();
        for (var r = 0; r < level.height; r++) {
            localContext.moveTo(0, tileSize * r);
            localContext.lineTo(tileSize * level.width, tileSize * r);
        }
        for (var c = 0; c < level.width; c++) {
            localContext.moveTo(tileSize * c, 0);
            localContext.lineTo(tileSize * c, tileSize * level.height);
        }
        localContext.stroke();

        context.save();
        context.globalAlpha = 0.4;
        context.drawImage(buffer, 0, 0);
        context.restore();
    }

    function drawSnakeOutline(outline, conflicts) {
        if (multiDiagrams) document.getElementById("cycleDiv").innerHTML = "Press the / (forward slash) key to cycle through diagrams";

        var xSpots = [];
        var maxID = -1;
        for (var i = 0; i < outline.length; i++) {
            maxID = outline[i].id;
        }
        if (maxID > 0) multiDiagrams = true;

        var buffer = document.createElement("canvas");
        buffer.width = canvas4.width;
        buffer.height = canvas4.height;
        var localContext = buffer.getContext("2d");

        for (var i = 0; i < outline.length; i++) {
            if (!(cycle && outline[i].id != cycleId)) {
                localContext.strokeStyle = "white";
                localContext.lineWidth = tileSize / 6;
                var c = outline[i].c;
                var r = outline[i].r;
                localContext.beginPath();
                localContext.moveTo((c + .35) * tileSize, r * tileSize);
                localContext.lineTo((c + .65) * tileSize, r * tileSize);
                localContext.moveTo((c + .9) * tileSize, r * tileSize);
                localContext.arcTo((c + 1) * tileSize, r * tileSize, (c + 1) * tileSize, (r + .1) * tileSize, tileSize / 6);
                localContext.moveTo((c + 1) * tileSize, (r + .35) * tileSize);
                localContext.lineTo((c + 1) * tileSize, (r + .65) * tileSize);
                localContext.moveTo((c + 1) * tileSize, (r + .9) * tileSize);
                localContext.arcTo((c + 1) * tileSize, (r + 1) * tileSize, (c + .9) * tileSize, (r + 1) * tileSize, tileSize / 6);
                localContext.moveTo((c + .65) * tileSize, (r + 1) * tileSize);
                localContext.lineTo((c + .35) * tileSize, (r + 1) * tileSize);
                localContext.moveTo((c + .1) * tileSize, (r + 1) * tileSize);
                localContext.arcTo(c * tileSize, (r + 1) * tileSize, c * tileSize, (r + .9) * tileSize, tileSize / 6);
                localContext.moveTo(c * tileSize, (r + .65) * tileSize);
                localContext.lineTo(c * tileSize, (r + .35) * tileSize);
                localContext.moveTo(c * tileSize, (r + .1) * tileSize);
                localContext.arcTo(c * tileSize, r * tileSize, (c + .1) * tileSize, r * tileSize, tileSize / 6);
                localContext.stroke();

                for (var j = 0; j < conflicts.length; j++) {
                    if (conflicts[j].c === c && conflicts[j].r === r) {
                        xSpots.push({
                            c: conflicts[j].c,
                            r: conflicts[j].r
                        });
                    }
                }
            }
        }
        for (var i = 0; i < xSpots.length; i++) {
            c = xSpots[i].c;
            r = xSpots[i].r;
            localContext.strokeStyle = "red";
            localContext.lineWidth = tileSize / 2.8;
            localContext.beginPath();
            localContext.moveTo((c - .12) * tileSize, (r - .12) * tileSize);
            localContext.lineTo((c + 1.12) * tileSize, (r + 1.12) * tileSize);
            localContext.moveTo((c + 1.12) * tileSize, (r - .12) * tileSize);
            localContext.lineTo((c - .12) * tileSize, (r + 1.12) * tileSize);
            localContext.stroke();
        }

        if (cycleId > maxID) cycleId = 0;
        context.save();
        context.globalAlpha = 1;
        context.drawImage(buffer, 0, 0);
        context.restore();
    }

    function fitTextOnCanvas(context, text, fontface) {
        var fontsize = 1000;
        while (context.measureText(text).width > (canvas7.width / 1.2) || context.measureText(text).height > (canvas7.height / 1.2)) {
            fontsize--;
            context.font = fontsize + "px " + fontface;
        }
        var textWidth = context.measureText(text).width;
        context.fillText(text, (canvas7.width / 2) - (textWidth / 2), canvas7.height / 2);
    }
}

// DRAWING FUNCTIONS
// -----------------------------------------------------------------------------------------------------------------------------

function drawTile(context, tileCode, r, c, level, location, rng, isCurve, grass) {
    switch (tileCode) {
        case SPACE:
            break;
        case WALL:
            if (isCurve && wall.curvedWalls) drawCurves(context, r, c, getAdjacentTiles());
            else if (!isCurve && wall.curvedWalls) drawWall(context, r, c, getAdjacentTiles(), rng, false);

            if (!wall.curvedWalls) drawWall(context, r, c, getAdjacentTiles(), rng, grass);
            break;
        case SPIKE:
            drawSpikes(context, r, c, getAdjacentTiles(), rng);
            break;
        case EXIT:
            var radiusFactor = isUneatenFruit() ? 0.7 : 1.2;
            drawQuarterPie(context, r, c, radiusFactor, snakeColors[0], 0);
            drawQuarterPie(context, r, c, radiusFactor, snakeColors[1], 1);
            drawQuarterPie(context, r, c, radiusFactor, snakeColors[2], 2);
            drawQuarterPie(context, r, c, radiusFactor, snakeColors[3], 3);
            break;
        case PORTAL:
            drawPortal(context, r, c, location);
            break;
        case RAINBOW:
            drawRainbow(context, r, c, getAdjacentTiles());
            break;
        case TRELLIS:
            drawTrellis(context, r, c);
            break;
        case ONEWAYWALLU:
            drawOneWayWall(context, r, c, -1, 0);
            break;
        case ONEWAYWALLD:
            drawOneWayWall(context, r, c, 1, 0);
            break;
        case ONEWAYWALLL:
            drawOneWayWall(context, r, c, 0, -1);
            break;
        case ONEWAYWALLR:
            drawOneWayWall(context, r, c, 0, 1);
            break;
        case CLOSEDLIFT:
            drawLift(context, r, c, false);
            break;
        case OPENLIFT:
            drawLift(context, r, c, true);
            break;
        case CLOUD:
            drawCloud(context, c * tileSize, r * tileSize, getAdjacentTiles(), rng);
            break;
        case BUBBLE:
            drawBubble(context, r, c);
            break;
        case LAVA:
            drawLiquid(context, r, c, LAVA, getAdjacentTiles());
            break;
        case WATER:
            drawLiquid(context, r, c, WATER, getAdjacentTiles());
            break;
        default: throw unreachable();
    }
    function getAdjacentTiles() {
        return [
            [getTile(r - 1, c - 1),
            getTile(r - 1, c + 0),
            getTile(r - 1, c + 1)],
            [getTile(r + 0, c - 1),
                null,
            getTile(r + 0, c + 1)],
            [getTile(r + 1, c - 1),
            getTile(r + 1, c + 0),
            getTile(r + 1, c + 1)],
        ];
    }
    function getTile(r, c) {
        if (!isInBounds(level, r, c)) return null;
        return level.map[getLocation(level, r, c)];
    }
}

function drawBackground(context, canvas) {
    //solid color background or provide color base for other backgrounds
    context.fillStyle = Array.isArray(background) ? "white" : background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (Array.isArray(background)) {
        //checkerboard background
        if (background[0] == "fade") {
            for (var i = 0; i < level.width; i++) {
                for (var j = 0; j < level.height; j++) {
                    /* var bgColor1 = hexToRgb(background[1]);
                    var bgColor2 = tint(background[1], .8);
 
                    var h = bgColor2.substr(bgColor2.indexOf("(") + 1, bgColor2.indexOf(","));
                    var s = bgColor2.substr(bgColor2.indexOf(",") + 1, bgColor2.indexOf(","));
                    var l = bgColor2.substr(bgColor2.split(",", 1).join(",").length + 1, bgColor2.indexOf(")"));
 
                    bgColor2 = hslToRgb(h, s, l); */

                    var bgColor1 = background[1];
                    var bgColor2 = background[2];

                    var shade = (j + 1) * .03 + .5;
                    if ((i + j) % 2 == 0) context.fillStyle = bgColor1 + ", " + shade + ")";
                    else context.fillStyle = bgColor2 + ", " + shade + ")";
                    context.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
                }
            }
        }
        //gradient background
        else if (background[0] == "gradient") {
            var grd = context.createLinearGradient(0, 0, 0, canvas.height);
            grd.addColorStop(0, "rgba(255,255,255,.5)");
            grd.addColorStop(1 / 2, "rgba(0, 200, 255, .5)");
            grd.addColorStop(1, "rgba(0, 100, 255, .5)");
            context.fillStyle = grd;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}

function drawCurves(context, r, c, adjacentTiles) {
    drawCurves2(context, r, c, isWall, wall.base);

    function isWall(dc, dr) {
        var tileCode = adjacentTiles[1 + dr][1 + dc];
        return tileCode == null || tileCode === WALL;
    }
}

function drawCurves2(context, r, c, isOccupied, base) {
    context.fillStyle = base;
    var size = .6;
    var inverse = 1 - size;
    // under side right
    if (isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(1, 1) && wall.curvedWalls) {
        r = r + 1;
        c = c + 1;
        context.beginPath();
        context.moveTo((c + inverse) * tileSize, r * tileSize);
        context.lineTo(c * tileSize, r * tileSize);
        context.lineTo(c * tileSize, (r + inverse) * tileSize);
        context.arc((c + inverse) * tileSize, (r + inverse) * tileSize, inverse * tileSize, Math.PI, 1.5 * Math.PI, false);
        context.closePath();
        context.fill();
    }
    // under side left
    else if (isOccupied(-1, 0) && isOccupied(0, 1) && !isOccupied(-1, 1) && wall.curvedWalls) {
        r = r + 1;
        c = c - 1;
        context.beginPath();
        context.moveTo((c + size) * tileSize, r * tileSize);
        context.lineTo((c + 1) * tileSize, r * tileSize);
        context.lineTo((c + 1) * tileSize, (r + inverse) * tileSize);
        context.arc((c + size) * tileSize, (r + inverse) * tileSize, inverse * tileSize, 0, 1.5 * Math.PI, true);
        context.closePath();
        context.fill();
    }
    // under side left (no idea why this is needed)
    else if (r != 0 && isOccupied(-1, -1) && isOccupied(0, -1) && !isOccupied(-1, 0) && wall.curvedWalls) {
        r = r;
        c = c - 1;
        context.beginPath();
        context.moveTo((c + size) * tileSize, r * tileSize);
        context.lineTo((c + 1) * tileSize, r * tileSize);
        context.lineTo((c + 1) * tileSize, (r + inverse) * tileSize);
        context.arc((c + size) * tileSize, (r + inverse) * tileSize, inverse * tileSize, 0, 1.5 * Math.PI, true);
        context.closePath();
        context.fill();
    }
}

function drawWall(context, r, c, adjacentTiles, rng, grass) {
    drawBase(context, r, c, isWall, rng, wall.base);
    drawTileOutlines(context, r, c, isWall, rng);
    drawPlant(context, r, c, isWall, rng, wall.surface);
    drawFlower(context, r, c, isWall, rng);

    function isWall(dc, dr) {
        var tileCode = adjacentTiles[1 + dr][1 + dc];
        return tileCode == null || tileCode === WALL;
    }
}

function drawFlower(context, r, c, isOccupied, rng) {
    if (wall.flowers && !isOccupied(-1, -1) && isOccupied(-1, 0) && rng() > .3) {
        c = c - 1;
        var offset = rng();
        context.save();
        context.transform(1, 0, 0, 1, offset * tileSize, 0);

        context.fillStyle = "#6666ff";
        context.beginPath();
        context.arc((c) * tileSize, (r) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c - .13) * tileSize, (r + .08) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c - .13) * tileSize, (r + .22) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c) * tileSize, (r + .3) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c + .13) * tileSize, (r + .22) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c + .13) * tileSize, (r + .08) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c) * tileSize, (r + .15) * tileSize, tileSize / 5.5, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc((c) * tileSize, (r + .15) * tileSize, tileSize / 12, 0, 2 * Math.PI);
        context.fillStyle = "yellow";
        context.fill();
        context.restore();
    }
}

function drawPlant(context, r, c, isOccupied, rng, fillStyle) {
    var tileCode = r === 0 ? 0 : level.map[getLocation(level, r - 1, c)];
    if ((wall.randomColors && isOccupied(0, 1) && isOccupied(-1, 0) && isOccupied(-1, 1)) || (wall.surfaceShape === "grass" && !isOccupied(0, -1) && tileCode !== CLOSEDLIFT && tileCode !== OPENLIFT)) {
        var plant = 1;
        var startPoint = (rng() * .7 - .3) * tileSize;
        context.fillStyle = fillStyle;
        if (!isOccupied(0, -1) && tileCode !== CLOSEDLIFT && tileCode !== OPENLIFT) {
            plant = 0;
            startPoint = (rng() * .4 + .3) * tileSize;
        }

        if (rng() > .75) {
            context.beginPath();
            context.arc(c * tileSize + startPoint, (r + plant + .1) * tileSize, tileSize / 6, 0, 2 * Math.PI);
            context.fill();

            var basePoint = { c: c * tileSize + startPoint, r: (r + plant + .1) * tileSize };
            for (var i = -2; i <= 2; i++) {
                var width = tileSize / (rng() + 5);
                var height = -tileSize * (rng() * .2 + .3);
                var angle = Math.PI * (rng() * .08 + .14) * (i - rng() / 2);

                context.save();
                context.translate(basePoint.c, basePoint.r);
                context.rotate(angle);
                context.translate(-basePoint.c, -basePoint.r);
                context.fillRect(c * tileSize + startPoint - width / 2, (r + plant) * tileSize, width, height);
                context.beginPath();
                context.arc(c * tileSize + startPoint, (r + plant) * tileSize + height, width / 2, 0, 2 * Math.PI);
                context.fill();
                context.restore();
            }
        }
    }
}

function drawBase(context, r, c, isOccupied, rng, fillStyle) {
    var x = c * tileSize;
    var y = r * tileSize;

    context.fillStyle = fillStyle;
    if (wall.randomColors) {
        context.fillStyle = "rgb(50,70,100)";
        if (isOccupied(0, 1) && isOccupied(1, 0) && isOccupied(1, 1)) context.fillRect((c + .5) * tileSize, (r + .5) * tileSize, tileSize, tileSize);
        if (r === 0 && isOccupied(1, 0)) context.fillRect((c + .5) * tileSize, (r - .5) * tileSize, tileSize, tileSize);
        if (c === 0) context.fillRect((c - .5) * tileSize, r * tileSize, tileSize, tileSize);
        if (r === 0 && c === 0) context.fillRect((c - .5) * tileSize, (r - .5) * tileSize, tileSize, tileSize);
        var color = rng === 0 ? 0 : Math.floor(rng() * 4) * 10;
        context.fillStyle = "rgb(" + (color + 50) + "," + (color + 70) + "," + (color + 100) + ")";
        roundRect(context, x, y, tileSize, tileSize, borderRadius, true, false);
    }
    else {
        if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { bl: borderRadius, br: borderRadius }, true, false);
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { tl: borderRadius, bl: borderRadius }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { tl: borderRadius, tr: borderRadius }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { tr: borderRadius, br: borderRadius }, true, false);
        else if (isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { bl: borderRadius }, true, false);
        else if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { br: borderRadius }, true, false);
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { tl: borderRadius }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, { tr: borderRadius }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, x, y, tileSize, tileSize, borderRadius, true, false);
        else roundRect(context, x, y, tileSize, tileSize, 0, true, false);

        if (wall.baseSpots) {
            var color = Math.floor(rng() * 2);
            switch (color) {
                case 0: context.fillStyle = "rgba(0,0,0,.05)"; break;
                case 1: context.fillStyle = "rgba(255,255,255,.05)"; break;
            }
            var radius = rng() * tileSize / 4 + tileSize / 10;
            x = rng() * (x + tileSize - radius - (x + radius)) + x + radius;
            y = rng() * (y + tileSize - radius - (y + radius)) + y + radius;

            context.beginPath();
            var freq = rng() * 100;
            if (freq < 20) context.arc(x, (r + .5) * tileSize, radius, 0, 2 * Math.PI);
            context.fill();
        }
    }
}

function drawTileOutlines(context, r, c, isOccupied, rng) {
    if (wall.surface !== "rainbow") context.fillStyle = wall.surface;
    else {
        context.fillStyle = "white";
        var mod = (r + c) % 17;
        switch (mod) {
            case 0: context.fillStyle = "#ff004c"; break;
            case 1: context.fillStyle = "#e30000"; break;
            case 2: context.fillStyle = "#ff4c00"; break;
            case 3: context.fillStyle = "#ff9900"; break;
            case 4: context.fillStyle = "#ffe500"; break;
            case 5: context.fillStyle = "#cbff00"; break;
            case 6: context.fillStyle = "#7fff00"; break;
            case 7: context.fillStyle = "#00ff19"; break;
            case 8: context.fillStyle = "#00ff66"; break;
            case 9: context.fillStyle = "#00ffb2"; break;
            case 10: context.fillStyle = "#00ffff"; break;
            case 11: context.fillStyle = "#00b2ff"; break;
            case 12: context.fillStyle = "#3200ff"; break;
            case 13: context.fillStyle = "#5702c6"; break;
            case 14: context.fillStyle = "#cc00ff"; break;
            case 15: context.fillStyle = "#ff00e5"; break;
            case 16: context.fillStyle = "#ff0098"; break;
        }
    }

    if (wall.surfaceShape === "algae") {
        if (!isOccupied(0, -1)) {
            context.beginPath();
            context.moveTo(c * tileSize, (r - .05) * tileSize);
            context.bezierCurveTo((c - .25) * tileSize, (r - .1) * tileSize, (c - .4) * tileSize, (r + .1) * tileSize, (c - .25) * tileSize, (r + .2) * tileSize);
            context.bezierCurveTo((c - .3) * tileSize, (r + .55) * tileSize, (c - .1) * tileSize, (r + .6) * tileSize, (c + .1) * tileSize, (r + .55) * tileSize);
            context.bezierCurveTo((c + .3) * tileSize, (r + .7) * tileSize, (c + .7) * tileSize, (r + .6) * tileSize, (c + .65) * tileSize, (r + .5) * tileSize);
            context.bezierCurveTo((c + 1) * tileSize, (r + .6) * tileSize, (c + 1.3) * tileSize, (r + .6) * tileSize, (c + 1.15) * tileSize, (r + .1) * tileSize);
            context.bezierCurveTo((c + 1.15) * tileSize, r * tileSize, (c + 1.2) * tileSize, (r - .1) * tileSize, (c + 1) * tileSize, (r - .05) * tileSize);
            context.bezierCurveTo((c + .8) * tileSize, (r - .1) * tileSize, (c + .7) * tileSize, (r - .15) * tileSize, (c + .6) * tileSize, (r - .05) * tileSize);
            context.bezierCurveTo((c + .4) * tileSize, (r - .1) * tileSize, (c + .3) * tileSize, (r - .15) * tileSize, (c + .2) * tileSize, (r - .05) * tileSize);
            context.bezierCurveTo((c + .2) * tileSize, (r - .1) * tileSize, (c + .1) * tileSize, (r - .15) * tileSize, (c + 0) * tileSize, (r - .05) * tileSize);
            context.fill();
        } else if (isOccupied(0, -1) && isOccupied(-1, 0) && !isOccupied(-1, -1)) {
            context.beginPath();
            context.moveTo((c - .05) * tileSize, (r + .55) * tileSize);
            context.bezierCurveTo((c + .1) * tileSize, (r + .5) * tileSize, (c + .3) * tileSize, (r + .55) * tileSize, (c + .2) * tileSize, (r + .25) * tileSize);
            context.bezierCurveTo((c + .25) * tileSize, (r + .2) * tileSize, (c + .35) * tileSize, (r - .05) * tileSize, (c + .05) * tileSize, (r - .05) * tileSize);
            context.lineTo(c * tileSize, r * tileSize);
            context.closePath();
            context.fill();
        }
    }
    else if (wall.surfaceShape === "snow") {
        if (!isOccupied(0, -1)) {
            context.beginPath();
            context.moveTo((c + 1) * tileSize, (r - .05) * tileSize);
            context.lineTo(c * tileSize, (r - .05) * tileSize);
            context.bezierCurveTo((c - .2) * tileSize, (r - .05) * tileSize, (c - .35) * tileSize, (r + .4) * tileSize, (c + 0) * tileSize, (r + .45) * tileSize);
            context.bezierCurveTo((c + .1) * tileSize, (r + .55) * tileSize, (c + .45) * tileSize, (r + .6) * tileSize, (c + .6) * tileSize, (r + .45) * tileSize);
            context.bezierCurveTo((c + .85) * tileSize, (r + .6) * tileSize, (c + 1.3) * tileSize, (r + .3) * tileSize, (c + 1.1) * tileSize, (r - .02) * tileSize);
            context.fill();
            if (isOccupied(-1, -1)) {
                context.beginPath();
                context.moveTo((c + .4) * tileSize, (r - .05) * tileSize);
                context.bezierCurveTo((c + .15) * tileSize, (r - .15) * tileSize, (c + .1) * tileSize, (r - .4) * tileSize, (c + .05) * tileSize, (r - .45) * tileSize);
                context.bezierCurveTo((c + .05) * tileSize, (r - .5) * tileSize, (c - .1) * tileSize, (r - .5) * tileSize, (c - .1) * tileSize, (r - .4) * tileSize);
                context.bezierCurveTo((c - .1) * tileSize, (r - .3) * tileSize, (c - .1) * tileSize, (r - .1) * tileSize, (c - .18) * tileSize, (r + .1) * tileSize);
                context.closePath();
                context.fill();
            }
            if (isOccupied(1, -1)) {
                context.beginPath();
                context.moveTo((c + .6) * tileSize, (r - .05) * tileSize);
                context.bezierCurveTo((c + .85) * tileSize, (r - .15) * tileSize, (c + .9) * tileSize, (r - .4) * tileSize, (c + .95) * tileSize, (r - .45) * tileSize);
                context.bezierCurveTo((c + .95) * tileSize, (r - .5) * tileSize, (c + 1.1) * tileSize, (r - .5) * tileSize, (c + 1.1) * tileSize, (r - .4) * tileSize);
                context.bezierCurveTo((c + 1.1) * tileSize, (r - .3) * tileSize, (c + 1.2) * tileSize, (r - .1) * tileSize, (c + 1.15) * tileSize, (r + .3) * tileSize);
                context.closePath();
                context.fill();
            }
        } else if (isOccupied(0, -1) && isOccupied(-1, 0) && !isOccupied(-1, -1)) {
            context.beginPath();
            context.moveTo((c - .05) * tileSize, (r + .38) * tileSize);
            context.bezierCurveTo((c + .1) * tileSize, (r + .53) * tileSize, (c + .3) * tileSize, (r - .15) * tileSize, (c + .05) * tileSize, (r - .05) * tileSize);
            context.lineTo(c * tileSize, r * tileSize);
            context.closePath();
            context.fill();
        }
    }
    else if (wall.surfaceShape === "grass") {
        if (!isOccupied(0, -1)) {
            context.beginPath();
            context.moveTo((c + 1) * tileSize, (r - .05) * tileSize);
            context.lineTo(c * tileSize, (r - .05) * tileSize);
            context.bezierCurveTo((c - .3) * tileSize, r * tileSize, (c - .15) * tileSize, (r + .6) * tileSize, (c + .1) * tileSize, (r + .3) * tileSize);
            context.bezierCurveTo((c + .15) * tileSize, (r + .4) * tileSize, (c + .3) * tileSize, (r + .5) * tileSize, (c + .45) * tileSize, (r + .3) * tileSize);
            context.bezierCurveTo((c + .6) * tileSize, (r + .5) * tileSize, (c + .7) * tileSize, (r + .45) * tileSize, (c + .8) * tileSize, (r + .3) * tileSize);
            context.bezierCurveTo((c + 1) * tileSize, (r + .6) * tileSize, (c + 1.3) * tileSize, r * tileSize, (c + 1) * tileSize, (r - .05) * tileSize);
            context.closePath();
            context.fill();
        } else if (isOccupied(0, -1) && isOccupied(-1, 0) && !isOccupied(-1, -1)) {
            context.beginPath();
            context.moveTo((c - .05) * tileSize, (r + .38) * tileSize);
            context.bezierCurveTo((c + .2) * tileSize, (r + .38) * tileSize, (c + .25) * tileSize, (r - .05) * tileSize, c * tileSize, (r - .05) * tileSize);
            context.closePath();
            context.fill();
        }
    }
    else if (wall.surfaceShape === "stripe") {
        var outlineThickness = .2;
        var complement = 1 - outlineThickness;
        var outlinePixels = outlineThickness * tileSize;
        if (!isOccupied(0, -1)) context.fillRect(c * tileSize, r * tileSize, tileSize, outlinePixels);
        if (!isOccupied(-1, -1)) context.fillRect(c * tileSize, r * tileSize, outlinePixels, outlinePixels);
        if (!isOccupied(1, -1)) context.fillRect((c + complement) * tileSize, r * tileSize, outlinePixels, outlinePixels);
        if (!isOccupied(-1, 1)) context.fillRect(c * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels);
        if (!isOccupied(1, 1)) context.fillRect((c + complement) * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels);
        if (!isOccupied(0, 1)) context.fillRect(c * tileSize, (r + complement) * tileSize, tileSize, outlinePixels);
        if (!isOccupied(-1, 0)) context.fillRect(c * tileSize, r * tileSize, outlinePixels, tileSize);
        if (!isOccupied(1, 0)) context.fillRect((c + complement) * tileSize, r * tileSize, outlinePixels, tileSize);
    }
}

function drawGrass(context, r, c) {
    count = Math.floor(rng() * 3 + 10);
    for (var i = 0; i < count; i++) {
        var bladeStart = rng();
        var bladeHeight = rng() * .1 + .05;
        var curve = rng() * .15;
        if (i % 2 != 0) {
            bladeStart = bladeStart * (-1) + 1;
            curve = curve * (-1);
        }
        context.beginPath();
        context.moveTo((c + bladeStart) * tileSize, (r + .1) * tileSize);
        context.bezierCurveTo((c + bladeStart) * tileSize, r * tileSize, (c + bladeStart / 1.2 + curve) * tileSize, (r - bladeHeight) * tileSize, (c + bladeStart / 1.2 + curve * 2) * tileSize, (r - bladeHeight) * tileSize);
        context.strokeStyle = wall.surface;
        context.lineWidth = tileSize / 70;
        context.stroke();
    }
}

function drawSpikes(context, r, c, adjacentTiles, rng, blockRowcols, spike2Rowcols, color) {
    var x = c * tileSize;
    var y = r * tileSize;
    if (themeName === "Classic") {
        context.fillStyle = "#333";
        context.beginPath();
        context.moveTo(x + tileSize * 0.3, y + tileSize * 0.3);
        context.lineTo(x + tileSize * 0.4, y + tileSize * 0.0);
        context.lineTo(x + tileSize * 0.5, y + tileSize * 0.3);
        context.lineTo(x + tileSize * 0.6, y + tileSize * 0.0);
        context.lineTo(x + tileSize * 0.7, y + tileSize * 0.3);
        context.lineTo(x + tileSize * 1.0, y + tileSize * 0.4);
        context.lineTo(x + tileSize * 0.7, y + tileSize * 0.5);
        context.lineTo(x + tileSize * 1.0, y + tileSize * 0.6);
        context.lineTo(x + tileSize * 0.7, y + tileSize * 0.7);
        context.lineTo(x + tileSize * 0.6, y + tileSize * 1.0);
        context.lineTo(x + tileSize * 0.5, y + tileSize * 0.7);
        context.lineTo(x + tileSize * 0.4, y + tileSize * 1.0);
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.7);
        context.lineTo(x + tileSize * 0.0, y + tileSize * 0.6);
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.5);
        context.lineTo(x + tileSize * 0.0, y + tileSize * 0.4);
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.3);
        context.fill();
    }
    else {
        var spikeWidth = 10 / 9;
        drawSpokes(context, x, y, spikeWidth, color);
        if (color == undefined) drawSpikeSupports(context, r, c, x, y, spikeWidth, isSpike, isWall, rng);
        else drawSpikeSupports(context, r, c, x, y, spikeWidth, isAlsoThisSpike2, isAlsoThisBlock, rng, color);

        function isSpike(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === SPIKE;
        }
        function isWall(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === WALL;
        }
        function isAlsoThisSpike2(dc, dr) {
            for (var i = 0; i < spike2Rowcols.length; i++) {
                var otherRowcol = spike2Rowcols[i];
                if (r + dr === otherRowcol.r && c + dc === otherRowcol.c) return true;
            }
            return false;
        }
        function isAlsoThisBlock(dc, dr) {
            for (var i = 0; i < blockRowcols.length; i++) {
                var otherRowcol = blockRowcols[i];
                if (r + dr === otherRowcol.r && c + dc === otherRowcol.c) return true;
            }
            return false;
        }
    }
}

function drawSpokes(context, x, y, spikeWidth, color) {
    context.fillStyle = color != undefined ? color : spikeColors.spokes;
    context.beginPath();
    context.moveTo(x + tileSize * .2 * spikeWidth, y + tileSize * 0.3); //top spikes
    context.lineTo(x + tileSize * .3 * spikeWidth, y + tileSize * 0.0);
    context.lineTo(x + tileSize * .4 * spikeWidth, y + tileSize * 0.3);
    context.lineTo(x + tileSize * .5 * spikeWidth, y + tileSize * 0.3);
    context.lineTo(x + tileSize * .6 * spikeWidth, y + tileSize * 0.0);
    context.lineTo(x + tileSize * .7 * spikeWidth, y + tileSize * 0.3);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(x + tileSize * 0.7, y + tileSize * .2 * spikeWidth); //right spikes
    context.lineTo(x + tileSize * 1.0, y + tileSize * .3 * spikeWidth);
    context.lineTo(x + tileSize * 0.7, y + tileSize * .4 * spikeWidth);
    context.lineTo(x + tileSize * 0.7, y + tileSize * .5 * spikeWidth);
    context.lineTo(x + tileSize * 1.0, y + tileSize * .6 * spikeWidth);
    context.lineTo(x + tileSize * 0.7, y + tileSize * .7 * spikeWidth);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(x + tileSize * .7 * spikeWidth, y + tileSize * 0.7); //bottom spikes
    context.lineTo(x + tileSize * .6 * spikeWidth, y + tileSize * 1.0);
    context.lineTo(x + tileSize * .5 * spikeWidth, y + tileSize * 0.7);
    context.lineTo(x + tileSize * .4 * spikeWidth, y + tileSize * 0.7);
    context.lineTo(x + tileSize * .3 * spikeWidth, y + tileSize * 1.0);
    context.lineTo(x + tileSize * .2 * spikeWidth, y + tileSize * 0.7);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(x + tileSize * 0.3, y + tileSize * .7 * spikeWidth); //left spikes
    context.lineTo(x + tileSize * 0.0, y + tileSize * .6 * spikeWidth);
    context.lineTo(x + tileSize * 0.3, y + tileSize * .5 * spikeWidth);
    context.lineTo(x + tileSize * 0.3, y + tileSize * .4 * spikeWidth);
    context.lineTo(x + tileSize * 0.0, y + tileSize * .3 * spikeWidth);
    context.lineTo(x + tileSize * 0.3, y + tileSize * .2 * spikeWidth);
    context.closePath();
    context.fill();
}

function drawSpikeSupports(context, r, c, x, y, spikeWidth, isOccupied, canConnect, rng, color) {
    var skip = false;
    // if (isOccupied = canConnect) skip = true;
    var boltBool = false;
    var splock = false;
    if (color != undefined) splock = true;
    context.fillStyle = splock ? color : spikeColors.support;
    var color2 = splock ? color : spikeColors.spokes;

    if (!skip && canConnect(0, 1) && (!(isOccupied(-1, 0) && isOccupied(1, 0) && (canConnect(1, 1) || canConnect(-1, 1))))) {
        context.fillRect((c + .26) * tileSize, (r + .7) * tileSize, tileSize * .48, tileSize * .4);
        boltBool = true;
    }
    if (!skip && !canConnect(0, 1) || splock) {
        if (canConnect(0, -1) && (!(!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0) && canConnect(-1, -1) && canConnect(1, -1)) || splock)) {
            context.fillRect((c + .26) * tileSize, r * tileSize, tileSize * .48, tileSize * .4);
            boltBool = true;
        }
        if (canConnect(-1, 0) && (!(isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0) && canConnect(-1, -1) && canConnect(-1, 1)) || splock)) {
            context.fillRect(c * tileSize, (r + .26) * tileSize, tileSize * .4, tileSize * .48);
            boltBool = true;
        }
        if (canConnect(1, 0) && (!(isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0) && canConnect(1, -1) && canConnect(1, 1)) || splock)) {
            context.fillRect((c + .7) * tileSize, (r + .26) * tileSize, tileSize * .4, tileSize * .48);
            boltBool = true;
        }
    }

    var spikeSize = .2;
    context.fillStyle = spikeColors.box;
    if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) {                                            //TOUCHING ONE
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * .8, 0, true, false);
        boltBool = true;
    }
    else if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) {
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * 1.05, tileSize * .6, 0, true, false);
        boltBool = true;
    }
    else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * .6, tileSize * 1.05, 0, true, false);
        boltBool = true;
    }
    else if (!isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * .8, tileSize * .6, 0, true, false);
        boltBool = true;
    }
    else if (isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) {                                         //TOUCHING TWO (CORNERS)
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * .8, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * 1.05, tileSize * .6, 0, true, false);
        if (!skip && !canConnect(1, -1)) boltBool = true;
    }
    else if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * .8, tileSize * .6, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * .8, 0, true, false);
        if (!skip && !canConnect(-1, -1)) boltBool = true;
    }
    else if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * 1.05, tileSize * .6, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * .6, tileSize * 1.05, 0, true, false);
        if (!skip && !canConnect(1, 1)) boltBool = true;
    }
    else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * .8, tileSize * .6, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * .6, tileSize * 1.05, 0, true, false);
        if (!skip && !canConnect(-1, 1)) boltBool = true;
    }
    else if (isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {                                         //TOUCHING TWO (OPPOSITES)
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * 1.2, 0, true, false);
    }
    else if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * 1.2, tileSize * .6, 0, true, false);
    }
    else if (isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {                                         //TOUCHING THREE
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        context.fillStyle = spikeColors.box;
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * 1.1, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * 1.05, tileSize * .6, 0, true, false);
        boltBool = true;
    }
    else if (isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * 1.1, tileSize * .6, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * .8, 0, true, false);
        boltBool = true;
    }
    else if (isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * 1.1, 0, true, false);
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * .8, tileSize * .6, 0, true, false);
        boltBool = true;
    }
    else if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * 1.1, tileSize * .6, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * .6, tileSize * 1.05, 0, true, false);
        boltBool = true;
    }
    else if (isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {                                              //TOUCHING FOUR  
        drawMiddleSpikes(context, x, y, spikeWidth, color2);
        drawCenterSpikes(context, x, y, spikeWidth, color2);
        roundRect(context, c * tileSize, (r + spikeSize) * tileSize, tileSize * 1.1, tileSize * .6, 0, true, false);
        roundRect(context, (c + spikeSize) * tileSize, r * tileSize, tileSize * .6, tileSize * 1.1, 0, true, false);
        //boltBool = true;
    }
    else {
        roundRect(context, (c + spikeSize) * tileSize, (r + spikeSize) * tileSize, tileSize * .6, tileSize * .6, 0, true, false);
        boltBool = true;
    }
    if (!skip && canConnect(1, 1) && canConnect(-1, 1) && isOccupied(-1, 0) && isOccupied(1, 0)) boltBool = false;

    if (boltBool) drawBolt(context, r, c, rng, color);

    function drawCenterSpikes(context, x, y, spikeWidth, fillStyle) {
        context.save();
        context.fillStyle = fillStyle;
        context.beginPath();
        context.moveTo(x + tileSize * .8 * spikeWidth, y + tileSize * 0.3);
        context.lineTo(x + tileSize * .9 * spikeWidth, y + tileSize * 0.0);
        context.lineTo(x + tileSize * 1 * spikeWidth, y + tileSize * 0.3);
        context.closePath();
        context.fill();

        context.beginPath();
        context.moveTo(x + tileSize * .8 * spikeWidth, y + tileSize * 0.7);
        context.lineTo(x + tileSize * .9 * spikeWidth, y + tileSize * 1.0);
        context.lineTo(x + tileSize * 1 * spikeWidth, y + tileSize * 0.7);
        context.closePath();
        context.fill();
        context.restore();
    }
    function drawMiddleSpikes(context, x, y, spikeWidth, fillStyle) {
        context.save();
        context.fillStyle = fillStyle;
        context.beginPath();
        context.moveTo(x + tileSize * .3, y + tileSize * .8 * spikeWidth);
        context.lineTo(x + tileSize * 0, y + tileSize * .9 * spikeWidth);
        context.lineTo(x + tileSize * .3, y + tileSize * 1 * spikeWidth);
        context.closePath();
        context.fill();

        context.beginPath();
        context.moveTo(x + tileSize * .7, y + tileSize * .8 * spikeWidth);
        context.lineTo(x + tileSize * 1, y + tileSize * .9 * spikeWidth);
        context.lineTo(x + tileSize * .7, y + tileSize * 1 * spikeWidth);
        context.closePath();
        context.fill();
        context.restore();
    }
}

function drawBolt(context, r, c, rng, color) {
    var splock = false;
    if (color != undefined) splock = true;
    context.fillStyle = splock ? color : spikeColors.bolt;
    context.strokeStyle = spikeColors.box;

    var radius = .2;
    context.beginPath();
    context.arc((c + .5) * tileSize, (r + .5) * tileSize, radius * tileSize, 0, 2 * Math.PI);
    context.closePath();
    context.fill();

    context.lineWidth = tileSize / 17;
    var x = rng() * radius + .5 - radius;
    var y = Math.sqrt(Math.pow(radius, 2) - Math.pow(x - .5, 2)) + .5;
    if (Math.floor(rng() * 2) == 0) y = 1 - y;
    context.beginPath();
    context.moveTo((c + x) * tileSize, (r + y) * tileSize);
    context.lineTo((c + 1 - x) * tileSize, (r + 1 - y) * tileSize);
    context.closePath();
    context.stroke();
}

function drawRainbow(context, r, c, adjacentTiles) {
    newRainbow(context, r, c, isRainbow);

    function isRainbow(dc, dr) {
        var tileCode = adjacentTiles[1 + dr][1 + dc];
        return tileCode == null || tileCode === RAINBOW;
    }
}

function newRainbow(context, r, c, isOccupied) {

    var x1 = (isOccupied(-1, 0)) ? 0 : .05;
    var x2 = (isOccupied(1, 0)) ? 0 : .05;

    var rainbowColors = ["#ffcccc", "#ffe0cc", "#ffffcc", "#e6ffe6", "#e6e6ff"];
    context.lineWidth = tileSize / 17;
    for (var i = 0; i < 5; i++) {
        context.beginPath();
        context.arc((c + .5) * tileSize, (r + .5) * tileSize, tileSize / 2 - context.lineWidth * (i + .5), Math.PI, 2 * Math.PI);
        context.strokeStyle = rainbowColors[i];
        context.stroke();
    }

    // for (var i = 0; i < 5; i++) {
    //     var j = (i != 0) ? i - 1 : 0;
    //     context.beginPath();
    //     context.moveTo(c * tileSize + tileSize * (i * x1), r * tileSize + tileSize * (.05 + (.1 * i) - (j * .02)));
    //     context.strokeStyle = rainbowColors[i];
    //     var lw = tileSize * (.1 - (i * .02));
    //     context.lineWidth = lw;
    //     context.lineTo(c * tileSize + tileSize * (1 - (i * x2)), r * tileSize + tileSize * (.05 + (.1 * i) - (j * .02)));
    //     context.stroke();
    // }
}

function drawTrellis(context, r, c) {
    context.fillStyle = "white";
    roundRect(context, (c - .05) * tileSize, r * tileSize, tileSize, tileSize * .1, 0, true, false);
    roundRect(context, (c - .05) * tileSize, r * tileSize, tileSize * .1, tileSize, 0, true, false);
    roundRect(context, (c + .95) * tileSize, r * tileSize, tileSize * .1, tileSize, 0, true, false);
    roundRect(context, (c - .05) * tileSize, (r - .2) * tileSize, tileSize * .1, tileSize * .2, 0, true, false);
    roundRect(context, (c + .95) * tileSize, (r - .2) * tileSize, tileSize * .1, tileSize * .2, 0, true, false);
}

function drawPortal(context, r, c, location) {
    var whitePortal = isSnakeOnPortal();
    var activePortalLocations = getActivePortalLocations();
    context.save();
    if (!whitePortal && activePortalLocations.indexOf(location) !== -1) {
        context.fillStyle = "black";
        context.strokeStyle = "purple";
        context.shadowColor = "purple";
        context.shadowBlur = 5;
        context.lineWidth = 3;
        context.beginPath();
        context.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, tileSize / 1.9, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }
    else if (whitePortal) {
        context.fillStyle = "white";
        context.strokeStyle = "purple";
        context.shadowColor = "purple";
        context.shadowBlur = 5;
        context.lineWidth = 3;
        context.beginPath();
        context.arc(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2, tileSize / 3, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }
    else drawCircle(context, r, c, 1, "#999");
    context.restore();
}

function drawTurnstile(context, r, c, dc) {
    if (dc == -1) {
        var x1 = c * tileSize;
        var x2 = (c + 1) * tileSize;
        var y1 = r * tileSize;
        var y2 = (r + 1) * tileSize;
        var start = c * tileSize;
        var light1 = (c + .1) * tileSize;
        var light2 = (c + .4) * tileSize;
        var lineStart = (c + .25) * tileSize;
        var lineEnd = (c + .65) * tileSize;
    }
    else if (dc == 1) {
        var x2 = c * tileSize;
        var x1 = (c + 1) * tileSize;
        var y1 = r * tileSize;
        var y2 = (r + 1) * tileSize;
        var start = (c + .5) * tileSize;
        var light1 = (c + .9) * tileSize;
        var light2 = (c + .6) * tileSize;
        var lineStart = (c + .75) * tileSize;
        var lineEnd = (c + .35) * tileSize;
    }

    var grd = context.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0, "#d9d9d9");
    grd.addColorStop(1 / 3, "#ffffff");
    grd.addColorStop(1, "#d9d9d9");
    context.fillStyle = grd;
    context.strokeStyle = "white";

    roundRect(context, start, r * tileSize, tileSize * .5, tileSize, 2, true, false);

    //lights
    context.lineWidth = 3;
    context.beginPath();
    context.fillStyle = "red";
    context.arc(light1, (r + .11) * tileSize, tileSize / 15, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.fillStyle = "green";
    context.arc(light2, (r + .11) * tileSize, tileSize / 14, 0, 2 * Math.PI);
    context.fill();

    //spokes
    context.strokeStyle = context.fillStyle = "#555";
    context.lineWidth = 1.5;
    for (var i = .3; i < 1; i += .15) {
        context.beginPath();
        context.moveTo(lineStart, (r + i) * tileSize);
        context.lineTo(lineEnd, (r + i) * tileSize);
        context.closePath();
        context.stroke();
        context.arc(light1, (r + i) * tileSize, tileSize / 24, 0, 2 * Math.PI)
        context.fill();
    }
}

function drawOneWayWall(context, r, c, dr, dc) {
    context.lineWidth = 2;
    context.strokeStyle = "#333";
    context.fillStyle = "orange";
    context.beginPath();
    if (dr == -1) {
        context.moveTo(c * tileSize, r * tileSize + tileSize / 2);
        context.lineTo(c * tileSize + tileSize / 4, r * tileSize + tileSize / 4);
        context.stroke();
        context.moveTo(c * tileSize + 3 * tileSize / 4, r * tileSize + tileSize / 4);
        context.lineTo((c + 1) * tileSize, r * tileSize + tileSize / 2);
    }
    else if (dr == 1) {
        context.moveTo(c * tileSize, r * tileSize + tileSize / 2);
        context.lineTo(c * tileSize + tileSize / 4, r * tileSize + 3 * tileSize / 4);
        context.stroke();
        context.moveTo(c * tileSize + 3 * tileSize / 4, r * tileSize + 3 * tileSize / 4);
        context.lineTo((c + 1) * tileSize, r * tileSize + tileSize / 2);
    }
    else if (dc == -1) {
        context.moveTo(c * tileSize + tileSize / 2, r * tileSize);
        context.lineTo(c * tileSize + tileSize / 4, r * tileSize + tileSize / 4);
        context.stroke();
        context.moveTo(c * tileSize + tileSize / 4, r * tileSize + 3 * tileSize / 4);
        context.lineTo(c * tileSize + tileSize / 2, r * tileSize + tileSize);
    }
    else if (dc == 1) {
        context.moveTo(c * tileSize + tileSize / 2, r * tileSize);
        context.lineTo(c * tileSize + 3 * tileSize / 4, r * tileSize + tileSize / 4);
        context.stroke();
        context.moveTo(c * tileSize + 3 * tileSize / 4, r * tileSize + 3 * tileSize / 4);
        context.lineTo(c * tileSize + tileSize / 2, r * tileSize + tileSize);
    }
    context.stroke();
    context.lineWidth = 0;

    if (dr == -1) roundRect(context, (c - 1 / 15) * tileSize, (r - 1 / 15) * tileSize, tileSize + 2 * tileSize / 15, tileSize / 4 + 2 * tileSize / 15, tileSize / 17, true, false);
    else if (dr == 1) roundRect(context, (c - 1 / 15) * tileSize, (r + 1 - 1 / 15 - 1 / 4) * tileSize, tileSize + 2 * tileSize / 15, tileSize / 4 + 2 * tileSize / 15, tileSize / 17, true, false);
    else if (dc == -1) roundRect(context, (c - 1 / 15) * tileSize, r * tileSize - tileSize / 15, tileSize / 4 + 2 * tileSize / 15, tileSize + 2 * tileSize / 15, tileSize / 17, true, false);
    else if (dc == 1) roundRect(context, (c + 1 - 1 / 15 - 1 / 4) * tileSize, r * tileSize - tileSize / 15, tileSize / 4 + 2 * tileSize / 15, tileSize + 2 * tileSize / 15, tileSize / 17, true, false);
}

/* var grd = context.createLinearGradient(c * tileSize, r * tileSize, (c + 1) * tileSize, (r + 1) * tileSize);
grd.addColorStop(0, "rgba(255,255,255,.4)");
grd.addColorStop(.1, "rgba(255,255,255,.5)");
grd.addColorStop(.2, "rgba(255,255,255,.3)");
grd.addColorStop(.3, "rgba(255,255,255,.4)");
grd.addColorStop(.4, "rgba(255,255,255,.6)");
grd.addColorStop(.5, "rgba(255,255,255,.5)");
grd.addColorStop(.6, "rgba(255,255,255,.3)");
grd.addColorStop(.7, "rgba(255,255,255,.4)");
grd.addColorStop(.8, "rgba(255,255,255,.5)");
grd.addColorStop(.9, "rgba(255,255,255,.6)");
grd.addColorStop(1, "rgba(255,255,255,.5)");
 
context.fillStyle = grd;
roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, 2, true, false);
context.save();
var color1 = color2 = color3 = color4 = "transparent";
 
var preventColor = "rgba(255,0,0,.5)";
 
context.fillStyle = "black";
if (type === 0) {
    color1 = "black";
}
else if (type === 1) {
    // color1 = "red";
    context.beginPath();
    context.moveTo((c + .4) * tileSize, (r + .2) * tileSize);
    context.lineTo((c + .4) * tileSize, (r + .55) * tileSize);
    context.lineTo((c + .3) * tileSize, (r + .55) * tileSize);
    context.lineTo((c + .5) * tileSize, (r + .8) * tileSize);
    context.lineTo((c + .7) * tileSize, (r + .55) * tileSize);
    context.lineTo((c + .6) * tileSize, (r + .55) * tileSize);
    context.lineTo((c + .6) * tileSize, (r + .2) * tileSize);
    context.lineTo((c + .4) * tileSize, (r + .2) * tileSize);
    context.closePath();
    context.fill();
}
else if (type === 2) {
    // color3 = "red";
    context.beginPath();
    context.moveTo((c + .6) * tileSize, (r + .8) * tileSize);
    context.lineTo((c + .6) * tileSize, (r + .45) * tileSize);
    context.lineTo((c + .7) * tileSize, (r + .45) * tileSize);
    context.lineTo((c + .5) * tileSize, (r + .2) * tileSize);
    context.lineTo((c + .3) * tileSize, (r + .45) * tileSize);
    context.lineTo((c + .4) * tileSize, (r + .45) * tileSize);
    context.lineTo((c + .4) * tileSize, (r + .8) * tileSize);
    context.lineTo((c + .6) * tileSize, (r + .8) * tileSize);
    context.closePath();
    context.fill();
}
else if (type === 3) {
    // color4 = "red";
    context.beginPath();
    context.moveTo((c + .2) * tileSize, (r + .6) * tileSize);
    context.lineTo((c + .55) * tileSize, (r + .6) * tileSize);
    context.lineTo((c + .55) * tileSize, (r + .7) * tileSize);
    context.lineTo((c + .8) * tileSize, (r + .5) * tileSize);
    context.lineTo((c + .55) * tileSize, (r + .3) * tileSize);
    context.lineTo((c + .55) * tileSize, (r + .4) * tileSize);
    context.lineTo((c + .2) * tileSize, (r + .4) * tileSize);
    context.lineTo((c + .2) * tileSize, (r + .6) * tileSize);
    context.closePath();
    context.fill();
}
else if (type === 4) {
    // color2 = "red";
    context.beginPath();
    context.moveTo((c + .8) * tileSize, (r + .6) * tileSize);
    context.lineTo((c + .45) * tileSize, (r + .6) * tileSize);
    context.lineTo((c + .45) * tileSize, (r + .7) * tileSize);
    context.lineTo((c + .2) * tileSize, (r + .5) * tileSize);
    context.lineTo((c + .45) * tileSize, (r + .3) * tileSize);
    context.lineTo((c + .45) * tileSize, (r + .4) * tileSize);
    context.lineTo((c + .8) * tileSize, (r + .4) * tileSize);
    context.lineTo((c + .8) * tileSize, (r + .6) * tileSize);
    context.closePath();
    context.fill();
}
 
context.strokeStyle = "red";
context.lineWidth = 2;
context.beginPath();
context.arc((c + .5) * tileSize, (r + .5) * tileSize, tileSize / 3, 0, 2 * Math.PI);
context.closePath();
context.stroke();
 
context.beginPath();
context.moveTo((c + .3) * tileSize, (r + .3) * tileSize);
context.lineTo((c + .7) * tileSize, (r + .7) * tileSize);
context.closePath();
context.stroke();
 
context.shadowBlur = 3;
context.lineWidth = 3;
context.strokeStyle = color1;
context.beginPath();
context.moveTo(c * tileSize, r * tileSize);
context.lineTo((c + 1) * tileSize, r * tileSize);
context.closePath();
context.stroke();
context.strokeStyle = color2;
context.beginPath();
context.moveTo((c + 1) * tileSize, r * tileSize);
context.lineTo((c + 1) * tileSize, (r + 1) * tileSize);
context.closePath();
context.stroke();
context.strokeStyle = color3;
context.beginPath();
context.moveTo((c + 1) * tileSize, (r + 1) * tileSize);
context.lineTo(c * tileSize, (r + 1) * tileSize);
context.closePath();
context.stroke();
context.strokeStyle = color4;
context.beginPath();
context.moveTo(c * tileSize, (r + 1) * tileSize);
context.lineTo(c * tileSize, r * tileSize);
context.closePath();
context.stroke();
context.restore(); */

function drawBubble(context, r, c) {
    bubbleX = c * tileSize;
    var grd = context.createRadialGradient(bubbleX, r * tileSize, 0, bubbleX, r * tileSize, tileSize);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(.5, "rgba(220,255,255,.3)");
    grd.addColorStop(1, "rgba(0,100,255,.12)");
    context.fillStyle = grd;

    context.beginPath();
    context.arc((c + .5) * tileSize, (r + .5) * tileSize, tileSize / 1.8, 0, 2 * Math.PI);
    context.fill();
}

function drawLiquid(context, r, c, type, adjacentTiles) {
    context.save();
    var tubColor;
    var color1;
    var color2;
    var color3;
    if (type == LAVA) {
        color1 = "red";
        color2 = "#e69900";
        color3 = "#111";
        context.strokeStyle = color1;
        context.shadowColor = color1;
        tubColor = "black";
    }
    else {
        color1 = "#80ffe5";
        color2 = "#1a8cff";
        color3 = "white";
        context.strokeStyle = color1;
        context.shadowColor = "white";
        tubColor = "white";
    }

    context.fillStyle = color3;
    roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, 0, true, false);

    context.shadowBlur = 10;
    context.lineWidth = 3.5;
    for (var i = .1; i <= .8; i += .1) {
        var mod = Math.round((i + .1) * 10) % 3;
        switch (mod) {
            case 0: context.strokeStyle = color2; break;
            case 1: context.strokeStyle = color3; break;
            case 2: context.strokeStyle = color1; break;
        }
        context.beginPath();
        context.moveTo(c * tileSize, (r + i + .1) * tileSize);
        context.bezierCurveTo((c + 1 / 6) * tileSize, (r + i) * tileSize, (c + 1 / 3) * tileSize, (r + i) * tileSize, (c + 1 / 2) * tileSize, (r + i + .1) * tileSize);
        context.bezierCurveTo((c + 2 / 3) * tileSize, (r + i + .2) * tileSize, (c + 5 / 6) * tileSize, (r + i + .2) * tileSize, (c + 1) * tileSize, (r + i + .1) * tileSize);
        context.stroke();
        context.shadowBlur = 0;
        context.shadowColor = "transparent";
    }

    context.fillStyle = color3;
    if (!isSameLiquid(-1, 0)) {
        if (isSameLiquid(-1, -1)) roundRect(context, (c - .1) * tileSize, r * tileSize, tileSize * .2, tileSize, 0, true, false);
        else roundRect(context, (c - .1) * tileSize, r * tileSize, tileSize * .2, tileSize, 0, true, false);
    }
    if (!isSameLiquid(1, 0)) {
        if (isSameLiquid(1, -1)) roundRect(context, (c + .9) * tileSize, r * tileSize, tileSize * .2, tileSize, 0, true, false);
        else roundRect(context, (c + .9) * tileSize, r * tileSize, tileSize * .2, tileSize, 0, true, false);
    }
    if (!isSameLiquid(0, 1)) {
        if (isSameLiquid(-1, 1) && !isSameLiquid(1, 1)) roundRect(context, (c - .1) * tileSize, (r + .8) * tileSize, tileSize * 1.2, tileSize * .25, 0, true, false);
        else if (!isSameLiquid(-1, 1) && isSameLiquid(1, 1)) roundRect(context, (c - .1) * tileSize, (r + .8) * tileSize, tileSize * 1.2, tileSize * .25, 0, true, false);
        else if (isSameLiquid(-1, 1) && isSameLiquid(1, 1)) roundRect(context, (c - .1) * tileSize, (r + .8) * tileSize, tileSize * 1.2, tileSize * .25, 0, true, false);
        else roundRect(context, (c - .1) * tileSize, (r + .8) * tileSize, tileSize * 1.2, tileSize * .25, 0, true, false);
    }
    context.restore();

    function isSameLiquid(dc, dr) {
        var tileCode = adjacentTiles[1 + dr][1 + dc];
        return tileCode == null || tileCode === type;
    }
}

function drawLift(context, r, c, isOpen) {
    context.lineWidth = .5;
    context.strokeStyle = "#777";
    var strokeBool = false;
    if (!isOpen) {
        context.fillStyle = "#e68a00";
        roundRect(context, (c + .05) * tileSize, r * tileSize + tileSize, tileSize * .9, tileSize * .2, 2, true, strokeBool);
        context.fillStyle = "#cc0000";
        roundRect(context, (c + .3) * tileSize, (r + .8) * tileSize, tileSize * .4, tileSize * .2, { tl: 2, tr: 2 }, true, strokeBool);
    }
    else if (isOpen) {
        context.fillStyle = "#e68a00";
        roundRect(context, (c + .05) * tileSize, (r + .8) * tileSize, tileSize * .9, tileSize * .2, tileSize / 17, true, strokeBool);
        roundRect(context, (c + .05) * tileSize, r * tileSize, tileSize * .9, tileSize * .2, tileSize / 17, true, strokeBool);

        if (themeName != "Midnight Rainbow") context.fillStyle = "#333";
        else context.fillStyle = "gainsboro";

        context.beginPath();
        context.moveTo((c + .9) * tileSize, (r + .8) * tileSize);
        context.lineTo((c + .3) * tileSize, (r + .5) * tileSize);
        context.lineTo((c + .9) * tileSize, (r + .2) * tileSize);
        context.lineTo((c + .7) * tileSize, (r + .2) * tileSize);
        context.lineTo((c + .2) * tileSize, (r + .45) * tileSize);
        context.bezierCurveTo((c + .16) * tileSize, (r + .45) * tileSize, (c + .16) * tileSize, (r + .55) * tileSize, (c + .2) * tileSize, (r + .55) * tileSize);
        context.lineTo((c + .7) * tileSize, (r + .8) * tileSize);
        context.lineTo((c + .9) * tileSize, (r + .8) * tileSize);
        context.closePath();
        context.fill();

        context.beginPath();
        context.moveTo((c + .1) * tileSize, (r + .8) * tileSize);
        context.lineTo((c + .7) * tileSize, (r + .5) * tileSize);
        context.lineTo((c + .1) * tileSize, (r + .2) * tileSize);
        context.lineTo((c + .3) * tileSize, (r + .2) * tileSize);
        context.lineTo((c + .8) * tileSize, (r + .45) * tileSize);
        context.bezierCurveTo((c + .84) * tileSize, (r + .45) * tileSize, (c + .84) * tileSize, (r + .55) * tileSize, (c + .8) * tileSize, (r + .55) * tileSize);
        context.lineTo((c + .3) * tileSize, (r + .8) * tileSize);
        context.lineTo((c + .1) * tileSize, (r + .8) * tileSize);
        context.closePath();
        context.fill();
    }
}

function drawQuarterPie(context, r, c, radiusFactor, fillStyle, quadrant) {
    var cx = (c + 0.5) * tileSize;
    var cy = (r + 0.5) * tileSize;
    context.fillStyle = fillStyle;
    context.beginPath();
    context.moveTo(cx, cy);
    context.arc(cx, cy, radiusFactor * tileSize / 2, quadrant * Math.PI / 2, (quadrant + 1) * Math.PI / 2);
    context.fill();
}

function drawCircle(context, r, c, radiusFactor, fillStyle) {
    context.fillStyle = fillStyle;
    context.beginPath();
    context.arc((c + 0.5) * tileSize, (r + 0.5) * tileSize, tileSize / 2 * radiusFactor, 0, 2 * Math.PI);
    context.fill();
}

function drawCloud(c, x, y, adjacentTiles, rng) {
    c.save();
    c.fillStyle = experimentalColors[0];
    c.shadowOffsetX = 5;
    c.shadowOffsetY = 5;
    c.shadowColor = "rgba(0,0,0, .03)";

    c.beginPath();
    c.moveTo(x + tileSize * 0, y + tileSize * 0);

    c.bezierCurveTo(x + tileSize * 0, y - tileSize * .15, x + tileSize * .33, y - tileSize * .15, x + tileSize * .33, y + tileSize * 0);
    c.bezierCurveTo(x + tileSize * .33, y - tileSize * .15, x + tileSize * .67, y - tileSize * .15, x + tileSize * .67, y + tileSize * 0);
    c.bezierCurveTo(x + tileSize * .67, y - tileSize * .15, x + tileSize * 1, y - tileSize * .15, x + tileSize * 1, y + tileSize * 0);

    c.bezierCurveTo(x + tileSize * 1.15, y + tileSize * 0, x + tileSize * 1.15, y + tileSize * .33, x + tileSize * 1, y + tileSize * .33);
    c.bezierCurveTo(x + tileSize * 1.15, y + tileSize * .33, x + tileSize * 1.15, y + tileSize * .67, x + tileSize * 1, y + tileSize * .67);
    c.bezierCurveTo(x + tileSize * 1.15, y + tileSize * .67, x + tileSize * 1.15, y + tileSize * 1, x + tileSize * 1, y + tileSize * 1);

    c.bezierCurveTo(x + tileSize * 1, y + tileSize * 1.15, x + tileSize * .67, y + tileSize * 1.15, x + tileSize * .67, y + tileSize * 1);
    c.bezierCurveTo(x + tileSize * .67, y + tileSize * 1.15, x + tileSize * .33, y + tileSize * 1.15, x + tileSize * .33, y + tileSize * 1);
    c.bezierCurveTo(x + tileSize * .33, y + tileSize * 1.15, x + tileSize * 0, y + tileSize * 1.15, x + tileSize * 0, y + tileSize * 1);

    c.closePath();
    c.fill();
    c.restore();
    c.save();

    if (!isCloud(-1, 0)) {
        c.fillStyle = experimentalColors[0];
        c.beginPath();
        c.moveTo(x + tileSize * 0, y + tileSize * 1);
        c.bezierCurveTo(x - tileSize * .15, y + tileSize * 1, x - tileSize * .15, y + tileSize * .67, x + tileSize * 0, y + tileSize * .67);
        c.bezierCurveTo(x - tileSize * .15, y + tileSize * .67, x - tileSize * .15, y + tileSize * .33, x + tileSize * 0, y + tileSize * .33);
        c.bezierCurveTo(x - tileSize * .15, y + tileSize * .33, x - tileSize * .15, y + tileSize * 0, x + tileSize * 0, y + tileSize * 0);
        if (isWall(-1, 0)) {
            c.shadowOffsetX = -2;
            c.shadowOffsetY = 2;
            c.shadowColor = "rgba(0,0,0, .03)";
        }
        c.fill();
    }
    c.restore();

    function isCloud(dc, dr) {
        var tileCode = adjacentTiles[1 + dr][1 + dc];
        return tileCode == null || tileCode === CLOUD;
    }
    function isWall(dc, dr) {
        var tileCode = adjacentTiles[1 + dr][1 + dc];
        return tileCode == null || tileCode === WALL;
    }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// -------------------------------------------------------------------------------------------------------

function findAnimation(animationTypes, objectId) {
    if (animationQueueCursor === animationQueue.length) return null;
    var currentAnimation = animationQueue[animationQueueCursor];
    for (var i = 1; i < currentAnimation.length; i++) {
        var animation = currentAnimation[i];
        if (animationTypes.indexOf(animation[0]) !== -1 && animation[1] === objectId) return animation;
    }
}
function findAnimationDisplacementRowcol(objectType, objectId) {
    var dr = 0;
    var dc = 0;
    var animationTypes = [
        "m" + objectType, // MOVE_SNAKE | MOVE_BLOCK | MOVE_MIKE
        "t" + objectType, // TELEPORT_SNAKE | TELEPORT_BLOCK | TELEPORT_MIKE
    ];
    // skip the current one
    for (var i = animationQueueCursor + 1; i < animationQueue.length; i++) {
        var animations = animationQueue[i];
        for (var j = 1; j < animations.length; j++) {
            var animation = animations[j];
            if (animationTypes.indexOf(animation[0]) !== -1 &&
                animation[1] === objectId) {
                dr += animation[2];
                dc += animation[3];
            }
        }
    }
    var movementAnimation = findAnimation(animationTypes, objectId);
    if (movementAnimation != null) {
        dr += movementAnimation[2] * (1 - animationProgress);
        dc += movementAnimation[3] * (1 - animationProgress);
    }
    return { r: -dr, c: -dc };
}
function hasFutureRemoveAnimation(object) {
    var animationTypes = [
        EXIT_SNAKE,
        DIE_BLOCK,
    ];
    for (var i = animationQueueCursor; i < animationQueue.length; i++) {
        var animations = animationQueue[i];
        for (var j = 1; j < animations.length; j++) {
            var animation = animations[j];
            if (animationTypes.indexOf(animation[0]) !== -1 &&
                animation[1] === object.id) {
                return true;
            }
        }
    }
}

function previewPaste(hoverR, hoverC) {
    var offsetR = hoverR - clipboardOffsetRowcol.r;
    var offsetC = hoverC - clipboardOffsetRowcol.c;

    var newLevel = JSON.parse(JSON.stringify(level));
    var selectedLocations = [];
    var selectedObjects = [];
    clipboardData.selectedLocations.forEach(function (location) {
        var tileCode = clipboardData.level.map[location];
        var rowcol = getRowcol(clipboardData.level, location);
        var r = rowcol.r + offsetR;
        var c = rowcol.c + offsetC;
        if (!isInBounds(newLevel, r, c)) return;
        var newLocation = getLocation(newLevel, r, c);
        newLevel.map[newLocation] = tileCode;
        selectedLocations.push(newLocation);
    });
    clipboardData.selectedObjects.forEach(function (object) {
        var newLocations = [];
        for (var i = 0; i < object.locations.length; i++) {
            var rowcol = getRowcol(clipboardData.level, object.locations[i]);
            rowcol.r += offsetR;
            rowcol.c += offsetC;
            if (!isInBounds(newLevel, rowcol.r, rowcol.c)) {
                // this location is oob
                if (object.type === SNAKE) {
                    // snakes must be completely in bounds
                    return;
                }
                // just skip it
                continue;
            }
            var newLocation = getLocation(newLevel, rowcol.r, rowcol.c);
            newLocations.push(newLocation);
        }
        if (newLocations.length === 0) return; // can't have a non-present object
        var newObject = JSON.parse(JSON.stringify(object));
        newObject.locations = newLocations;
        selectedObjects.push(newObject);
    });
    return {
        level: newLevel,
        selectedLocations: selectedLocations,
        selectedObjects: selectedObjects,
    };
}

function getNaiveOrthogonalPath(a, b) {
    // does not include a, but does include b.
    var rowcolA = getRowcol(level, a);
    var rowcolB = getRowcol(level, b);
    var path = [];
    if (rowcolA.r < rowcolB.r) {
        for (var r = rowcolA.r; r < rowcolB.r; r++) {
            path.push(getLocation(level, r + 1, rowcolA.c));
        }
    } else {
        for (var r = rowcolA.r; r > rowcolB.r; r--) {
            path.push(getLocation(level, r - 1, rowcolA.c));
        }
    }
    if (rowcolA.c < rowcolB.c) {
        for (var c = rowcolA.c; c < rowcolB.c; c++) {
            path.push(getLocation(level, rowcolB.r, c + 1));
        }
    } else {
        for (var c = rowcolA.c; c > rowcolB.c; c--) {
            path.push(getLocation(level, rowcolB.r, c - 1));
        }
    }
    return path;
}
function identityFunction(x) {
    return x;
}
function compareId(a, b) {
    return operatorCompare(a.id, b.id);
}
function operatorCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
function copyArray(array) {
    return array.map(identityFunction);
}
function getSetIntersection(array1, array2) {
    if (array1.length * array2.length === 0) return [];
    return array1.filter(function (x) { return array2.indexOf(x) !== -1; });
}
function makeScaleCoordinatesFunction(width1, width2) {
    return function (location) {
        return location + (width2 - width1) * Math.floor(location / width1);
    };
}

var expectHash;
window.addEventListener("hashchange", function () {
    if (location.hash === expectHash) {
        // We're in the middle of saveLevel() or saveReplay().
        // Don't react to that event.
        expectHash = null;
        return;
    }
    // The user typed into the url bar or used Back/Forward browser buttons, etc.
    loadFromLocationHash();
});
function loadFromLocationHash() {
    var hashSegments = location.hash.split("#");
    hashSegments.shift(); // first element is always ""
    if (!(1 <= hashSegments.length && hashSegments.length <= 2)) return false;
    var hashPairs = hashSegments.map(function (segment) {
        var equalsIndex = segment.indexOf("=");
        if (equalsIndex === -1) return ["", segment]; // bad
        return [segment.substring(0, equalsIndex), segment.substring(equalsIndex + 1)];
    });

    if (hashPairs[0][0] !== "level" && hashPairs[0][0] !== "sv") return false;
    if (hashPairs[0][0] === "sv") {
        sv = true;
        canvas7.style.display = "block";
        document.getElementById("ghostEditorPane").style.display = "none";
        document.getElementById("editorPane").style.display = "none";
        document.getElementById("bottomEverything").style.display = "none";
        document.getElementById("csText").style.display = "block";
    }

    try {
        var level = parseLevel(hashPairs[0][1]);
    } catch (e) {
        alert(e);
        return false;
    }
    loadLevel(level);

    if (hashPairs.length > 1) {
        try {
            if (hashPairs[1][0] !== "replay") throw new Error("unexpected hash pair: " + hashPairs[1][0]);
            parseAndLoadReplay(hashPairs[1][1]);
        } catch (e) {
            alert(e);
            return false;
        }
    }
    return true;
}

// run test suite
var testTime = new Date().getTime();
if (compressSerialization(stringifyLevel(parseLevel(testLevel_v0))) !== testLevel_v0_converted) throw new Error("v0 level conversion is broken");
// ask the debug console for this variable if you're concerned with how much time this wastes.
testTime = new Date().getTime() - testTime;

loadPersistentState();
if (!loadFromLocationHash()) {
    loadLevel(parseLevel(exampleLevel));
}
