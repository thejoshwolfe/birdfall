function unreachable() { return new Error("unreachable"); }
if (typeof VERSION !== "undefined") {
    document.getElementById("versionSpan").innerHTML =
        '<a href="https://github.com/thejoshwolfe/snakefall/blob/' + VERSION.sha1 + '/README.md">' + VERSION.tag + '</a>';
}
/*$(document).ready(function() {
    var fruits1 = getObjectsOfType(FRUIT);
    $(fruits1[0]).jqFloat({
            width: 10,
            height: 10,
            speed: 100
        });
});*/

var img3 = document.createElement('img');
//img3.src = '/Snakefall/Snakebird Images/Cherry2.png';

var canvas = document.getElementById("canvas");

var SPACE = "0".charCodeAt(0);
var WALL = "1".charCodeAt(0);
var SPIKE = "2".charCodeAt(0);
var FRUIT_v0 = "3".charCodeAt(0); //legacy
var EXIT = "4".charCodeAt(0);
var PORTAL = "5".charCodeAt(0);
var PLATFORM = "P".charCodeAt(0);
var TRELLIS = "p".charCodeAt(0);
var ONEWAYWALLU = "u".charCodeAt(0);
var ONEWAYWALLD = "d".charCodeAt(0);
var TURNSTILEL = "l".charCodeAt(0);
var TURNSTILER = "r".charCodeAt(0);
var CLOSEDLIFT = "c".charCodeAt(0);
var OPENLIFT = "o".charCodeAt(0);
var CLOUD = "C".charCodeAt(0);
var BUBBLE = "b".charCodeAt(0);
var LAVA = "v".charCodeAt(0);
var WATER = "w".charCodeAt(0);
var validTileCodes = [SPACE, WALL, SPIKE, EXIT, PORTAL, PLATFORM, TRELLIS, ONEWAYWALLU, ONEWAYWALLD, TURNSTILEL, TURNSTILER, CLOSEDLIFT, OPENLIFT, CLOUD, BUBBLE, LAVA, WATER];

// object types
var SNAKE = "s";
var BLOCK = "b";
var FRUIT = "f";
var POISON_FRUIT = "p";

var headRowMove;
var headColMove;
var checkResult = false;
var cr = false;
var cs = false;
var postPortalSnakeOutline = [];
var portalConflicts = [];
var portalFailure = false;

var tileSize = 34;
var level;
var unmoveStuff = { undoStack: [], redoStack: [], spanId: "movesSpan", undoButtonId: "unmoveButton", redoButtonId: "removeButton" };
var uneditStuff = { undoStack: [], redoStack: [], spanId: "editsSpan", undoButtonId: "uneditButton", redoButtonId: "reeditButton" };
var paradoxes = [];
function loadLevel(newLevel) {
    level = newLevel;
    currentSerializedLevel = compressSerialization(stringifyLevel(newLevel));

    activateAnySnakePlease();
    unmoveStuff.undoStack = [];
    unmoveStuff.redoStack = [];
    undoStuffChanged(unmoveStuff);
    uneditStuff.undoStack = [];
    uneditStuff.redoStack = [];
    undoStuffChanged(uneditStuff);
    blockSupportRenderCache = {};
    render();
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
    var cursor = 0;
    skipWhitespace();
    var versionTag = string.substr(cursor, magicNumber.length);
    switch (versionTag) {
        case magicNumber_v0:
        case magicNumber: break;
        default: throw new Error("not a snakefall level");
    }
    cursor += magicNumber.length;
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
            });
            tileCode = SPACE;
        }
        if (tileCode === PLATFORM || tileCode === TRELLIS || tileCode === ONEWAYWALLU || tileCode === ONEWAYWALLD || tileCode === TURNSTILEL || tileCode === TURNSTILER || tileCode === CLOSEDLIFT || tileCode === OPENLIFT || tileCode === CLOUD || tileCode === BUBBLE || tileCode === LAVA || tileCode === WATER) tileCounter++;
        if (validTileCodes.indexOf(tileCode) === -1) throw parserError("invalid tilecode: " + JSON.stringify(mapData[i]));
        level.map.push(tileCode);
    }

    // objects
    skipWhitespace();
    while (cursor < string.length) {
        var object = {
            type: "?",
            id: -1,
            dead: false,
            locations: [],
        };

        // type
        object.type = string[cursor];
        var locationsLimit;
        if (object.type === SNAKE) locationsLimit = -1;
        else if (object.type === BLOCK) locationsLimit = -1;
        else if (object.type === FRUIT || object.type === POISON_FRUIT) locationsLimit = 1;
        else throw parserError("expected object type code");
        cursor += 1;

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

        level.objects.push(object);
        skipWhitespace();
    }

    if (tileCounter > 0) document.getElementById("levelType").innerHTML = "EXPERIMENTAL LEVEL<br><span style='font-size:8pt'>contains experimental elements</span>";
    else document.getElementById("levelType").innerHTML = "STANDARD LEVEL<br><span style='font-size:8pt'>does not contain experimental elements</span>";

    for (var i = 0; i < upconvertedObjects.length; i++) {
        level.objects.push(upconvertedObjects[i]);
    }

    return level;

    function skipWhitespace() {
        while (" \n\t\r".indexOf(string[cursor]) !== -1) {
            cursor += 1;
        }
    }
    function consumeKeyword(keyword) {
        skipWhitespace();
        if (string.indexOf(keyword, cursor) !== cursor) throw parserError("expected " + JSON.stringify(keyword));
        cursor += 1;
    }
    function readInt() {
        skipWhitespace();
        for (var i = cursor; i < string.length; i++) {
            if ("0123456789".indexOf(string[i]) === -1) break;
        }
        var substring = string.substring(cursor, i);
        if (substring.length === 0) throw parserError("expected int");
        cursor = i;
        return parseInt(substring, 10);
    }
    function readRun() {
        consumeKeyword("?");
        var endIndex = string.indexOf("/", cursor);
        var substring = string.substring(cursor, endIndex);
        cursor = endIndex + 1;
        return substring;
    }
    function parserError(message) {
        return new Error("parse error at position " + cursor + ": " + message);
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
    var shouldBeTheSame = parseLevel(output);
    if (!deepEquals(level, shouldBeTheSame)) throw asdf; // serialization/deserialization is broken

    return output;
}
function serializeObjects(objects) {
    var output = "";
    for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        output += object.type + object.id + " ";
        output += "?" + object.locations.join("&") + "/\n";
    }
    return output;
}
function serializeObjectState(object) {
    if (object == null) return [0, []];
    return [object.dead, copyArray(object.locations)];
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
function parseAndLoadReplay(string) {
    string = decompressSerialization(string);
    var expectedPrefix = replayMagicNumber + "&";
    if (string.substring(0, expectedPrefix.length) !== expectedPrefix) throw new Error("unrecognized replay string");
    var cursor = expectedPrefix.length;

    // the starting snakeid is 0, which may not exist, but we only validate it when doing a move.
    activeSnakeId = 0;
    while (cursor < string.length) {
        var snakeIdStr = "";
        var c = string.charAt(cursor);
        cursor += 1;
        while ('0' <= c && c <= '9') {
            snakeIdStr += c;
            if (cursor >= string.length) throw new Error("replay string has unexpected end of input");
            c = string.charAt(cursor);
            cursor += 1;
        }
        if (snakeIdStr.length > 0) {
            activeSnakeId = parseInt(snakeIdStr);
            // don't just validate when switching snakes, but on every move.
        }

        // doing a move.
        if (!getSnakes().some(function (snake) {
            return snake.id === activeSnakeId;
        })) {
            throw new Error("invalid snake id: " + activeSnakeId);
        }
        switch (c) {
            case 'l': move(0, -1); break;
            case 'u': move(-1, 0); break;
            case 'r': move(0, 1); break;
            case 'd': move(1, 0); break;
            default: throw new Error("replay string has invalid direction: " + c);
        }
    }

    // now that the replay was executed successfully, undo it all so that it's available in the redo buffer.
    reset(unmoveStuff);
    document.getElementById("removeButton").classList.add("click-me");
}

var currentSerializedLevel;
function saveLevel() {
    if (isDead()) return alert("Can't save while you're dead!");
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
var ALT = 4;
document.addEventListener("keydown", function (event) {
    var modifierMask = (
        (event.shiftKey ? SHIFT : 0) |
        (event.ctrlKey ? CTRL : 0) |
        (event.altKey ? ALT : 0)
    );
    switch (event.keyCode) {
        case 37: // left
            if (modifierMask === 0) { move(0, -1); break; }
            return;
        case 38: // up
            if (modifierMask === 0) { move(-1, 0); break; }
            return;
        case 39: // right
            if (modifierMask === 0) { move(0, 1); break; }
            return;
        case 40: // down
            if (modifierMask === 0) { move(1, 0); break; }
            return;
        case 8:  // backspace
            if (modifierMask === 0) { undo(unmoveStuff); break; }
            if (modifierMask === SHIFT) { redo(unmoveStuff); break; }
            return;
        case "Q".charCodeAt(0):
            if (modifierMask === 0) { undo(unmoveStuff); break; }
            if (modifierMask === SHIFT) { redo(unmoveStuff); break; }
            return;
        case "Z".charCodeAt(0):
            if (modifierMask === 0) { undo(unmoveStuff); break; }
            if (modifierMask === SHIFT) { redo(unmoveStuff); break; }
            if (persistentState.showEditor && modifierMask === CTRL) { undo(uneditStuff); break; }
            if (persistentState.showEditor && modifierMask === CTRL | SHIFT) { redo(uneditStuff); break; }
            return;
        case "Y".charCodeAt(0):
            if (modifierMask === 0) { redo(unmoveStuff); break; }
            if (persistentState.showEditor && modifierMask === CTRL) { redo(uneditStuff); break; }
            return;
        case "R".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode("resize"); break; }
            if (modifierMask === 0) { reset(unmoveStuff); break; }
            if (modifierMask === SHIFT) { unreset(unmoveStuff); break; }
            return;
        case 220: // backslash
            if (modifierMask === 0) { toggleShowEditor(); break; }
            return;
        case "A".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(0, -1); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode("select"); break; }
            if (persistentState.showEditor && modifierMask === CTRL) { selectAll(); break; }
            return;
        case "E".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(SPACE); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(EXIT); break; }
            return;
        case 46: // delete
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(SPACE); break; }
            return;
        case "W".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(-1, 0); break; }
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(WALL); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(WATER); break; }
            return;
        case "S".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(1, 0); break; }
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(SPIKE); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(SNAKE); break; }
            if (persistentState.showEditor && modifierMask === CTRL) { saveLevel(); break; }
            if (!persistentState.showEditor && modifierMask === CTRL) { saveReplay(); break; }
            if (modifierMask === (CTRL | SHIFT)) { saveReplay(); break; }
            return;
        case "X".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === CTRL) { cutSelection(); break; }
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(CLOSEDLIFT); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(OPENLIFT); break; }
            return;
        case "F".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(FRUIT); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(POISON_FRUIT); break; }
            return;
        case "D".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(0, 1); break; }
            return;
        case "B".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(BLOCK); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(BUBBLE); break; }
            return;
        case "P".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(-1, 0); break; }
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(PORTAL); break; }
            return;
        case "U".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(-1, 0); break; }
            return;
        case "L".charCodeAt(0):
            if (!persistentState.showEditor && modifierMask === 0) { move(-1, 0); break; }
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
            if (persistentState.showEditor && modifierMask === CTRL) { copySelection(); break; }
            return;
        case "V".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === CTRL) { setPaintBrushTileCode("paste"); break; }
        case "H".charCodeAt(0):
            if (modifierMask === 0) { toggleHotkeys(); break; }
        case "T".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(TURNSTILEL); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(TURNSTILER); break; }
        case "O".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(ONEWAYWALLU); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(ONEWAYWALLD); break; }
        case "M".charCodeAt(0):
            if (persistentState.showEditor && modifierMask === 0) { setPaintBrushTileCode(PLATFORM); break; }
            if (persistentState.showEditor && modifierMask === SHIFT) { setPaintBrushTileCode(TRELLIS); break; }
        case 13: //return
            if (persistentState.showEditor && modifierMask === 0) { toggleTheme(); break; }
        case 32: // spacebar
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
    event.preventDefault();
    render();
});

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
    move(-1, 0);
    return;
});
document.getElementById("arrowDown").addEventListener("click", function () {
    move(1, 0);
    return;
});
document.getElementById("arrowLeft").addEventListener("click", function () {
    move(0, -1);
    return;
});
document.getElementById("arrowRight").addEventListener("click", function () {
    move(0, 1);
    return;
});
document.getElementById("bigButtonButton").addEventListener("click", function () {
    toggleButtonSize();
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
document.getElementById("checkSolutionButton").addEventListener("click", function () {
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
function toggleShowEditor() {
    persistentState.showEditor = !persistentState.showEditor;
    savePersistentState();
    showEditorChanged();
}
function toggleButtonSize() {
    persistentState.bigButton = !persistentState.bigButton;
    savePersistentState();
    var buttons = document.getElementsByClassName("bottomButton");
    if (persistentState.bigButton) {
        for (var i = 0; i < buttons.length; i++)
            buttons[i].classList.add("bigButton");
    }
    else {
        for (var i = 0; i < buttons.length; i++)
            buttons[i].classList.remove("bigButton");
    }
    render();
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
    for (var i = 0; i < hotkeys.length; i++) {
        if (persistentState.hideHotkeys) hotkeys[i].style.display = "block";
        else hotkeys[i].style.display = "none";
    }
    for (var i = 0; i < spacers.length; i++) {
        if (persistentState.hideHotkeys) spacers[i].style.display = "none";
        else spacers[i].style.display = "block";
    }
    render();
}

["serializationTextarea", "shareLinkTextbox"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (event) {
        // let things work normally
        event.stopPropagation();
    });
});
document.getElementById("submitSerializationButton").addEventListener("click", function () {
    var string = document.getElementById("serializationTextarea").value;
    try {
        var newLevel = parseLevel(string);
    } catch (e) {
        alert(e);
        return;
    }
    loadLevel(newLevel);
});
document.getElementById("shareLinkTextbox").addEventListener("focus", function () {
    setTimeout(function () {
        document.getElementById("shareLinkTextbox").select();
    }, 0);
});

var paintBrushTileCode = null;
var paintBrushSnakeColorIndex = 0;
var paintBrushBlockId = 0;
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
    ["paintFruitButton", FRUIT],
    ["paintPoisonFruitButton", POISON_FRUIT],
    ["paintPortalButton", PORTAL],
    ["paintPlatformButton", PLATFORM],
    ["paintTrellisButton", TRELLIS],
    ["paintOneWayWallUButton", ONEWAYWALLU],
    ["paintOneWayWallDButton", ONEWAYWALLD],
    ["paintTurnstileLButton", TURNSTILEL],
    ["paintTurnstileRButton", TURNSTILER],
    ["paintClosedLiftButton", CLOSEDLIFT],
    ["paintOpenLiftButton", OPENLIFT],
    ["paintCloudButton", CLOUD],
    ["paintBubbleButton", BUBBLE],
    ["paintLavaButton", LAVA],
    ["paintWaterButton", WATER],
    ["paintSnakeButton", SNAKE],
    ["paintBlockButton", BLOCK],
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
function toggleTheme() {
    if (themeCounter < themes.length - 1) themeCounter++;
    else themeCounter = 0;
    blockSupportRenderCache = [];
    render();
    document.getElementById("themeButton").innerHTML = "Theme: <b>" + themes[themeCounter][0] + "</b>";
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
    document.getElementById("cheatGravityButton").style.background = isGravityEnabled ? "" : "#f88";

    document.getElementById("cheatCollisionButton").textContent = isCollisionEnabled ? "Collision: ON" : "Collision: OFF";
    document.getElementById("cheatCollisionButton").style.background = isCollisionEnabled ? "" : "#f88";
}

// be careful with location vs rowcol, because this variable is used when resizing
var lastDraggingRowcol = null;
var hoverLocation = null;
var draggingChangeLog = null;
canvas.addEventListener("mousedown", function (event) {
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
canvas.addEventListener("dblclick", function (event) {
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
        } else if (object.type === FRUIT) {
            // edit fruits, i guess
            paintBrushTileCode = FRUIT;
        } else if (object.type === POISON_FRUIT) {
            // edit poison fruits, i guess
            paintBrushTileCode = POISON_FRUIT;
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
canvas.addEventListener("mousemove", function (event) {
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
canvas.addEventListener("mouseout", function () {
    if (hoverLocation !== location) {
        // turn off the hover when the mouse leaves
        hoverLocation = null;
        render();
    }
});
function getLocationFromEvent(event) {
    var r = Math.floor(eventToMouseY(event, canvas) / tileSize);
    var c = Math.floor(eventToMouseX(event, canvas) / tileSize);
    // since the canvas is centered, the bounding client rect can be half-pixel aligned,
    // resulting in slightly out-of-bounds mouse events.
    r = clamp(r, 0, level.height);
    c = clamp(c, 0, level.width);
    return getLocation(level, r, c);
}
function eventToMouseX(event, canvas) { return event.clientX - canvas.getBoundingClientRect().left; }
function eventToMouseY(event, canvas) { return event.clientY - canvas.getBoundingClientRect().top; }

function selectAll() {
    selectionStart = 0;
    selectionEnd = level.map.length - 1;
    setPaintBrushTileCode("select");
}

function setPaintBrushTileCode(tileCode) {
    if (tileCode === "paste") {
        // make sure we have something to paste
        if (clipboardData == null) return;
    }
    if (paintBrushTileCode === "select" && tileCode !== "select" && selectionStart != null && selectionEnd != null) {
        // usually this means to fill in the selection
        if (tileCode == null) {
            // cancel selection
            selectionStart = null;
            selectionEnd = null;
            return;
        }
        // fill in the selection
        fillSelection(tileCode);
        selectionStart = null;
        selectionEnd = null;
        return;
    }
    if (tileCode === SNAKE) {
        if (paintBrushTileCode === SNAKE) {
            // next snake color
            paintBrushSnakeColorIndex = (paintBrushSnakeColorIndex + 1) % snakeColors.length;
        }
    } else if (tileCode === BLOCK) {
        var blocks = getBlocks();
        if (paintBrushTileCode === BLOCK && blocks.length > 0) {
            // cycle through block ids
            blocks.sort(compareId);
            if (paintBrushBlockId != null) {
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
                paintBrushBlockId = blocks[0].id;
            }
        } else {
            // new block id
            paintBrushBlockId = null;
        }
    } else if (tileCode == null) {
        // escape
        if (paintBrushTileCode === BLOCK && paintBrushBlockId != null) {
            // stop editing this block, but keep the block brush selected
            tileCode = BLOCK;
            paintBrushBlockId = null;
        }
    }
    paintBrushTileCode = tileCode;
    paintBrushTileCodeChanged();
}
function paintBrushTileCodeChanged() {
    paintButtonIdAndTileCodes.forEach(function (pair) {
        var id = pair[0];
        var tileCode = pair[1];
        var backgroundStyle = "";
        var textColor = "";
        if (tileCode === paintBrushTileCode) {
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
        if (object != null) addIfNotPresent(selectedObjects, object);
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
            if (object != null) addIfNotPresent(objects, object);
        }
    }
    // select the rest of any partially-selected objects
    objects.forEach(function (object) {
        object.locations.forEach(function (location) {
            addIfNotPresent(locations, location);
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
    };
}
function newPoisonFruit(location) {
    var fruits = getObjectsOfType(POISON_FRUIT);
    fruits.sort(compareId);
    for (var i = 0; i < fruits.length; i++) {
        if (fruits[i].id !== i) break;
    }
    return {
        type: POISON_FRUIT,
        id: i,
        dead: false, // unused
        locations: [location],
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
            } else if (object.type === FRUIT) {
                object.id = newFruit().id;
            } else if (object.type === POISON_FRUIT) {
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
                if (existingIndex !== -1) {
                    // reclicking part of this object means to delete just part of it.
                    if (thisBlock.locations.length === 1) {
                        // goodbye
                        removeObject(thisBlock, changeLog);
                        paintBrushBlockId = null;
                    } else {
                        thisBlock.locations.splice(existingIndex, 1);
                    }
                } else {
                    // add a tile to the block
                    removeAnyObjectAtLocation(location, changeLog);
                    thisBlock.locations.push(location);
                }
            }
            changeLog.push([thisBlock.type, thisBlock.id, oldBlockSerialization, serializeObjectState(thisBlock)]);
            delete blockSupportRenderCache[thisBlock.id];
        }
    } else if (paintBrushTileCode === FRUIT || paintBrushTileCode === POISON_FRUIT) {
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
        } else if (change[0] === SNAKE || change[0] === BLOCK || change[0] === FRUIT || change[0] === POISON_FRUIT) {
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
    if (undoStuff.undoStack.length === 0) return; // already at the beginning
    animationQueue = [];
    animationQueueCursor = 0;
    paradoxes = [];
    undoOneFrame(undoStuff);
    undoStuffChanged(undoStuff);
}
function reset(undoStuff) {
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
    var hash = "#level=" + currentSerializedLevel;
    if (dirtyState === REPLAY_DIRTY) {
        // there is a replay to save
        hash += "#replay=" + compressSerialization(stringifyReplay());
    }

    var sv = "https://jmdiamond3.github.io/Snakefall-Redesign/SolutionVerification.html" + hash;
    //var sv = "http://127.0.0.1:5500/Snakefall/SolutionVerification.html" + hash;
    copyToClipboard(sv);
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
        } else if (change[0] === SNAKE || change[0] === BLOCK || change[0] === FRUIT || change[0] === POISON_FRUIT) {
            // change object
            var type = change[0];
            var id = change[1];
            var fromDead = change[2][0];
            var toDead = change[3][0];
            var fromLocations = change[2][1].map(transformLocation);
            var toLocations = change[3][1].map(transformLocation);
            if (fromLocations.filter(function (location) { return location >= level.map.length; }).length > 0) {
                return "Can't move " + describe(type, id) + " out of bounds";
            }
            var object = findObjectOfTypeAndId(type, id);
            if (toLocations.length !== 0) {
                // should exist at this location
                if (object == null) return "Can't move " + describe(type, id) + " because it doesn't exit";
                if (!deepEquals(object.locations, toLocations)) return "Can't move " + describe(object) + " because it's in the wrong place";
                if (object.dead !== toDead) return "Can't move " + describe(object) + " because it's alive/dead state doesn't match";
                // doit
                if (fromLocations.length !== 0) {
                    var oldState = serializeObjectState(object);
                    object.locations = fromLocations;
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
            case PLATFORM: return "a Platform";
            case TRELLIS: return "a Trellis";
            case ONEWAYWALLU: return "a One Way Wall (facing U)";
            case ONEWAYWALLD: return "a One Way Wall (facing D)";
            case TURNSTILEL: return "a One Way Wall (facing L)";
            case TURNSTILER: return "a One Way Wall (facing R)";
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
    if (arg1 === FRUIT) {
        return "Fruit";
    }
    if (arg1 === POISON_FRUIT) {
        return "Poison Fruit";
    }
    if (typeof arg1 === "object") return describe(arg1.type, arg1.id);
    throw unreachable();
}

function undoStuffChanged(undoStuff) {
    var movesText = undoStuff.undoStack.length + "+" + undoStuff.redoStack.length;
    document.getElementById(undoStuff.spanId).textContent = movesText;
    document.getElementById(undoStuff.undoButtonId).disabled = undoStuff.undoStack.length === 0;
    document.getElementById(undoStuff.redoButtonId).disabled = undoStuff.redoStack.length === 0;

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
    bigButton: false,
    showGrid: false,
    hideHotkeys: true,
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
    persistentState.bigButton = !!persistentState.bigButton;
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
var themeName = "Spring";
var background, surface, material, snakeColors, blockColors, spikeColors, fruitColors, textStyle, experimentalColors;
var curlyOutline = false;

var bg1 = ["rgba(145, 198, 254", "rgba(133, 192, 255"];
var bg2 = ["rgba(254, 198, 145", "rgba(255, 192, 133"];
var bg3 = ["rgba(145, 254, 198", "rgba(117, 255, 192"];
var bg4 = ["rgba(7, 7, 83", "rgba(0, 0, 70"];

var snakeColors1 = ["#fd0c0b", "#18d11f", "#004cff", "#fdc122"];    //must be full length to satisfy tint function
var snakeColors2 = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];
var snakeColors3 = ["#BA145C", "#E91624", "#F75802", "#FEFE28"];
var snakeColors4 = ["#000000", "#000000", "#000000", "#000000"];

var fruitColors1 = ["#ff0066", "#ff36a6", "#ff6b1f", "#ff9900", "#ff2600"];
var fruitColors2 = ["black", "black", "black", "black", "black"];

var spikeColors1 = ["#999", "#444", "#555", "#777"];    //spokes, supports, box, bolt
var spikeColors2 = ["#333", "#333", "#111", "#333"];
var spikeColors3 = ["#333", "#333", "#333", "#777"];

var blockColors1 = ["#de5a6d", "#fa65dd", "#c367e3", "#9c62fa", "#625ff0"];    //must be 6-digit hex colors to satisfy tint function
var blockColors2 = ["#ffffff", "#999999", "#555555", "#000000"];
var blockColors3 = ["#de7913", "#7d46a0", "#39868b", "#41ccc2", "#ccc500"];
var blockColors4 = ["#660050", "#990033", "#b32400", "#e6b800 ", "#008000"];
var blockColors5 = ["#ffccff", "#ffc2b3", "#ffffcc", "#ccffe6", "#ccffff"];

var fontSize = tileSize * 5;
var textStyle1 = ["" + fontSize + "px Impact", "#fdc122", "#fd0c0b"];    //font, Win, Lose
var textStyle2 = ["" + fontSize + "px Impact", "#400080", "#ff6600"];
var textStyle3 = ["" + fontSize + "px Impact", "#BA145C", "#F75802"];
var textStyle4 = ["" + fontSize + "px Impact", "#ff0", "#f00"];

var experimentalColors1 = ["white", "#ffccff"];
var experimentalColors2 = ["white", "#FEFE28"];

var themeCounter = 0;

var themes = [  //name, background, material, surface, curlyOutline, blockColors, spikeColors, fruitColors, stemColor, textStyle, experimentalColors
    //["sky",],
    ["Spring", bg1, "#976537", "#95ff45", true, snakeColors1, blockColors1, spikeColors1, fruitColors1, "green", textStyle1, experimentalColors1],
    ["Winter", bg1, "#30455B", "white", true, snakeColors1, blockColors1, spikeColors1, fruitColors1, "green", textStyle1, experimentalColors1],
    ["Classic", "#8888ff", "#844204", "#282", false, snakeColors2, blockColors1, spikeColors3, fruitColors1, "green", textStyle4, experimentalColors1],
    ["Summer", bg2, "#734d26", "#009933", true, snakeColors3, blockColors3, spikeColors1, fruitColors1, "green", textStyle3, experimentalColors2],
    ["Dream", bg3, "#00aaff", "#ffb3ec", true, snakeColors1, blockColors4, spikeColors1, fruitColors2, "white", textStyle2, experimentalColors2],
    ["Midnight Rainbow", bg4, "black", "rainbow", false, snakeColors1, blockColors5, spikeColors2, "white", "white", textStyle1, experimentalColors1]
];


function showEditorChanged() {
    document.getElementById("showHideEditor").textContent = (persistentState.showEditor ? "Hide" : "Show") + " Editor";
    ["editorDiv", "editorPane"].forEach(function (id) {
        document.getElementById(id).style.display = persistentState.showEditor ? "block" : "none";
    });
    document.getElementById("wasdSpan").textContent = persistentState.showEditor ? "" : " or WASD";

    render();
}

function move(dr, dc) {
    portalFailure = false;
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
    var ate_poison = false;
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
            } else if (otherObject.type === POISON_FRUIT) {
                // eat poison
                removeObject(otherObject, changeLog);
                ate_poison = true;
            } else if (isTileCodeAir(activeSnake, null, newTile, dr, dc)) {
                otherObject = findObjectAtLocation(newLocation);
                if (otherObject != null) {
                    if (otherObject === activeSnake) return; // can't push yourself
                    // push objects
                    if (!checkMovement(activeSnake, otherObject, dr, dc, pushedObjects)) return false;
                }
            } else return; // can't go through that tile
        }
    }

    // slither forward
    var activeSnakeOldState = serializeObjectState(activeSnake);
    var size1 = activeSnake.locations.length === 1;
    var slitherAnimations = [
        70,
        [
            // size-1 snakes really do more of a move than a slither
            size1 ? MOVE_SNAKE : SLITHER_HEAD,
            activeSnake.id,
            dr,
            dc,
        ]
    ];
    activeSnake.locations.unshift(newLocation);

    // drag your tail forward based on what was/wasn't eaten
    var times = 1;
    if (ate) { times--; }
    if (ate_poison) { times++; }
    //if we're going to shrink out of existence, prevent it
    var snake_length = activeSnake.locations.length - 1;
    if (times > snake_length) {
        times = snake_length;
        activeSnake.dead = true;
        //make the snake appear to vanish into non-existence
        activeSnake.locations[0] = { r: -99, c: -99 };
    }
    for (var t = 0; t < times; ++t) {
        for (var i = 1; i < activeSnake.locations.length; i++) {
            // drag your tail forward
            var oldRowcol = getRowcol(level, activeSnake.locations[i + 1]);
            newRowcol = getRowcol(level, activeSnake.locations[i]);
            if (!size1) {
                slitherAnimations.push([
                    SLITHER_TAIL,
                    activeSnake.id,
                    newRowcol.r - oldRowcol.r,
                    newRowcol.c - oldRowcol.c,
                ]);
            }
        }
        activeSnake.locations.pop();
    }
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
    if (isGravity()) for (var fallHeight = 1; ; fallHeight++) {
        // do portals separate from falling logic
        if (portalActivationLocations.length === 1) {
            var portalAnimations = [300];
            if (activatePortal(portalLocations, portalActivationLocations[0], portalAnimations, changeLog)) {
                portalFailure = false;
                animationQueue.push(portalAnimations);
            } else portalFailure = true;
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
            if (object.type === FRUIT || object.type === POISON_FRUIT) return; // can't fall
            var theseDyingObjects = [];
            if (!checkMovement(null, object, 1, 0, [], theseDyingObjects)) return false;
            // this object can fall. maybe more will fall with it too. we'll check those separately.
            theseDyingObjects.forEach(function (object) {
                addIfNotPresent(dyingObjects, object);
            });
            return true;
        });
        if (dyingObjects.length > 0) {
            var anySnakesDied = false;
            dyingObjects.forEach(function (object) {
                if (object.type === SNAKE) {
                    // look what you've done
                    var oldState = serializeObjectState(object);
                    object.dead = true;
                    changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
                    anySnakesDied = true;
                } else if (object.type === BLOCK) {
                    // a box fell off the world
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
    pushedObjects.push(pushedObject);
    // find forward locations
    var forwardLocations = [];
    for (var i = 0; i < pushedObjects.length; i++) {
        pushedObject = pushedObjects[i];
        for (var j = 0; j < pushedObject.locations.length; j++) {
            var rowcol = getRowcol(level, pushedObject.locations[j]);
            var forwardRowcol = { r: rowcol.r + dr, c: rowcol.c + dc };
            if (!isInBounds(level, forwardRowcol.r, forwardRowcol.c)) {
                if (dyingObjects == null) {
                    // can't push things out of bounds
                    return false;
                } else {
                    // this thing is going to fall out of bounds
                    addIfNotPresent(dyingObjects, pushedObject);
                    addIfNotPresent(pushedObjects, pushedObject);
                    continue;
                }
            }
            var forwardLocation = getLocation(level, forwardRowcol.r, forwardRowcol.c);
            if (dr === 1 && level.map[forwardLocation] === PLATFORM) {
                // this platform holds us, unless we're going through it
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
                if (yetAnotherObject.type === FRUIT || yetAnotherObject.type === POISON_FRUIT) {
                    // not pushable
                    return false;
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
                addIfNotPresent(pushedObjects, yetAnotherObject);
                if (level.map[forwardLocation] === TRELLIS || level.map[forwardLocation] === ONEWAYWALLU) addIfNotPresent(forwardLocations, forwardLocation);
            } else
                addIfNotPresent(forwardLocations, forwardLocation);
        }
    }
    // check forward locations
    for (var i = 0; i < forwardLocations.length; i++) {
        var forwardLocation = forwardLocations[i];
        // many of these locations can be inside objects,
        // but that means the tile must be air,
        // and we already know pushing that object.
        var tileCode = level.map[forwardLocation];
        var object = findObjectAtLocation(offsetLocation(forwardLocation, -dr, -dc));
        if (!isTileCodeAir(pusher, object, tileCode, dr, dc)) {
            if (dyingObjects != null) {
                if (tileCode === SPIKE) {
                    // uh... which object was this again?
                    if (object.type === SNAKE) {
                        // ouch!
                        addIfNotPresent(dyingObjects, object);
                        continue;
                    }
                }
                else if (tileCode === LAVA) {
                    if (object.type === SNAKE || object.type === BLOCK) {
                        addIfNotPresent(dyingObjects, object);
                        continue;
                    }
                }
                else if (tileCode === WATER) {
                    if (object.type === BLOCK) {
                        addIfNotPresent(dyingObjects, object);
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
        changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
        animations.push([
            "m" + object.type, // MOVE_SNAKE | MOVE_BLOCK
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
    postPortalSnakeOutline = [];
    portalConflicts = [];
    var otherPortalLocation = portalLocations[1 - portalLocations.indexOf(portalLocation)];
    var portalRowcol = getRowcol(level, portalLocation);
    var otherPortalRowcol = getRowcol(level, otherPortalLocation);
    var delta = { r: otherPortalRowcol.r - portalRowcol.r, c: otherPortalRowcol.c - portalRowcol.c };

    var object = findObjectAtLocation(portalLocation);
    var newLocations = [];
    for (var i = 0; i < object.locations.length; i++) {
        var rowcol = getRowcol(level, object.locations[i]);
        var r = rowcol.r + delta.r;
        var c = rowcol.c + delta.c;
        postPortalSnakeOutline[i] = { r: rowcol.r + delta.r, c: rowcol.c + delta.c };

        if (!isInBounds(level, r, c)) return false; // out of bounds
        newLocations.push(getLocation(level, r, c));
    }

    for (var i = 0; i < newLocations.length; i++) {
        var location = newLocations[i];
        if (!isTileCodeAir(object, null, level.map[location], 0, 0)) portalConflicts.push(getRowcol(level, location)); // blocked by tile
        var otherObject = findObjectAtLocation(location);
        if (otherObject != null && otherObject !== object) portalConflicts.push(getRowcol(level, location)); // blocked by object
    }
    if (portalConflicts.length > 0) return false;

    // zappo presto!
    var oldState = serializeObjectState(object);
    object.locations = newLocations;
    changeLog.push([object.type, object.id, oldState, serializeObjectState(object)]);
    animations.push([
        "t" + object.type, // TELEPORT_SNAKE | TELEPORT_BLOCK
        object.id,
        delta.r,
        delta.c,
    ]);
    return true;
}

function isTileCodeAir(pusher, pushedObject, tileCode, dr, dc) {
    switch (tileCode) {
        case SPACE: case EXIT: case PORTAL: case CLOSEDLIFT: return true;
        case TRELLIS: case BUBBLE: return pusher != null;
        case PLATFORM: return dr != 1;
        case ONEWAYWALLU: return dr != 1;
        case ONEWAYWALLD: return dr != -1;
        case TURNSTILEL: return dc != 1;
        case TURNSTILER: return dc != -1;
        default: return false;
    }
}

function addIfNotPresent(array, element) {
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
    changeLog.push([object.type, object.id, [object.dead, copyArray(object.locations)], [0, []]]);
    if (object.type === SNAKE && object.id === activeSnakeId) {
        activateAnySnakePlease();
    }
    if (object.type === BLOCK && paintBrushTileCode === BLOCK && paintBrushBlockId === object.id) {
        // no longer editing an object that doesn't exit
        paintBrushBlockId = null;
    }
    if (object.type === BLOCK) {
        delete blockSupportRenderCache[object.id];
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
        if (object.locations.indexOf(location) !== -1)
            return object;
    }
    return null;
}
function isUneatenFruit() {
    return getObjectsOfType(FRUIT).length > 0 || getObjectsOfType(POISON_FRUIT).length > 0;
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
function countSnakes() {
    return getSnakes().length;
}
function getSnakes() {
    return getObjectsOfType(SNAKE);
}
function getBlocks() {
    return getObjectsOfType(BLOCK);
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
    //     SLITHER_HEAD | SLITHER_TAIL | MOVE_SNAKE | MOVE_BLOCK | TELEPORT_SNAKE | TELEPORT_BLOCK,
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
    // id: canvas,
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
    canvas.width = tileSize * level.width;
    canvas.height = tileSize * level.height;
    var context = canvas.getContext("2d");

    themeName = themes[themeCounter][0];
    if (themeName != "sky") {
        background = themes[themeCounter][1];
        material = themes[themeCounter][2];
        surface = themes[themeCounter][3];
        curlyOutline = themes[themeCounter][4];
        snakeColors = themes[themeCounter][5];
        blockColors = themes[themeCounter][6];
        spikeColors = themes[themeCounter][7];
        fruitColors = themes[themeCounter][8];
        textStyle = themes[themeCounter][10];
        experimentalColors = themes[themeCounter][11];

        if (!Array.isArray(background)) {
            context.fillStyle = background;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        else {
            for (var i = 0; i < level.width; i++) {   //checkerboard background
                for (var j = 0; j < level.height; j++) {
                    var bgColor1 = background[0];
                    var bgColor2 = background[1];
                    var shade = (j + 1) * .03 + .5;
                    if ((i + j) % 2 == 0) context.fillStyle = bgColor1 + ", " + shade + ")";
                    else context.fillStyle = bgColor2 + ", " + shade + ")";
                    context.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
                }
            }
        }
    }
    else {
        var img = document.createElement('img');
        //img.src='/Snakefall/Snakebird Images/sky2.jpeg';    
        //context.drawImage(img,0,0,canvas.width, canvas.height)
        //context.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (persistentState.showGrid && !persistentState.showEditor) {
        drawGrid();
    }

    var activePortalLocations = getActivePortalLocations();

    // normal render
    renderLevel();

    if (persistentState.showGrid && persistentState.showEditor) {
        drawGrid();
    }

    if (persistentState.showEditor) {
        if (paintBrushTileCode === BLOCK) {
            if (paintBrushBlockId != null) {
                // fade everything else away
                context.fillStyle = "rgba(0, 0, 0, 0.8)";
                context.fillRect(0, 0, canvas.width, canvas.height);
                // and render just this object in focus
                var activeBlock = findBlockById(paintBrushBlockId);
                renderLevel([activeBlock]);
            }
        } else if (paintBrushTileCode === "select") {
            getSelectedLocations().forEach(function (location) {
                var rowcol = getRowcol(level, location);
                drawRect(rowcol.r, rowcol.c, "rgba(128, 128, 128, 0.3)");
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
    }

    // throw this in there somewhere
    document.getElementById("showGridButton").textContent = (persistentState.showGrid ? "Hide" : "Show") + " Grid";
    document.getElementById("hideHotkeyButton").textContent = (persistentState.hideHotkeys ? "Hide" : "Show") + " Hotkeys";
    document.getElementById("bigButtonButton").textContent = (persistentState.bigButton ? "Regular" : "Large") + " Buttons";

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
        objects.forEach(function (object) {
            if (object.type !== BLOCK) return;
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
            context.drawImage(image, c * tileSize, r * tileSize);
        });

        if (!cs) {
            // terrain
            if (onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        var location = getLocation(level, r, c);
                        var tileCode = level.map[location];
                        drawTile(tileCode, r, c, level, location, true);
                    }
                }
            }

            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                if (object.type === SNAKE || object.type === BLOCK) drawObject(object);  //draws snakes and blocks
            }

            if (onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        location = getLocation(level, r, c);
                        tileCode = level.map[location];
                        if (tileCode === WATER || tileCode === LAVA || tileCode === SPIKE) drawTile(tileCode, r, c, level, location, false);    //draws only walls
                    }
                }
            }

            if (onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        location = getLocation(level, r, c);
                        tileCode = level.map[location];
                        if (tileCode === WALL) drawTile(tileCode, r, c, level, location, false);    //draws only walls
                    }
                }
            }

            if (onlyTheseObjects == null) {
                for (var r = 0; r < level.height; r++) {
                    for (var c = 0; c < level.width; c++) {
                        location = getLocation(level, r, c);
                        tileCode = level.map[location];
                        if (tileCode === TURNSTILER || tileCode === TURNSTILEL || tileCode === CLOUD || tileCode === BUBBLE || tileCode === TRELLIS) drawTile(tileCode, r, c, level, location, false);
                    }
                }
            }

            for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                if (object.type === FRUIT || object.type === POISON_FRUIT) drawObject(object);  //draws fruit
            }
        }

        if (portalFailure) drawSnakeOutline(postPortalSnakeOutline, portalConflicts);
        // banners
        if (countSnakes() === 0 && !cs) {
            context.fillStyle = textStyle[1];
            context.font = textStyle[0];
            context.shadowOffsetX = 5;
            context.shadowOffsetY = 5;
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 4;
            var textString = "WIN";
            var textWidth = context.measureText(textString).width;
            context.fillText(textString, (canvas.width / 2) - (textWidth / 2), canvas.height / 2);
            checkResult = true;
        }
        if (isDead()) {
            context.fillStyle = textStyle[2];
            context.font = textStyle[0];
            context.shadowOffsetX = 5;
            context.shadowOffsetY = 5;
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 4;
            textString = "LOSE";
            textWidth = context.measureText(textString).width;
            context.fillText(textString, (canvas.width / 2) - (textWidth / 2), canvas.height / 2);
            checkResult = false;
        }

        if (cs && cr) {
            context.fillStyle = "green";
            context.font = textStyle[0];
            context.shadowOffsetX = 5;
            context.shadowOffsetY = 5;
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 4;
            var textString = "\u2713";
            var textWidth = context.measureText(textString).width;
            context.fillText(textString, (canvas.width / 2) - (textWidth / 2), canvas.height / 2);
        }
        else if (cs && !cr) {
            context.fillStyle = "red";
            context.font = textStyle[0];
            context.shadowOffsetX = 5;
            context.shadowOffsetY = 5;
            context.shadowColor = "rgba(0,0,0,0.5)";
            context.shadowBlur = 4;
            var textString = "\u2716";
            var textWidth = context.measureText(textString).width;
            context.fillText(textString, (canvas.width / 2) - (textWidth / 2), canvas.height / 2);
        }

        // editor hover
        if (persistentState.showEditor && paintBrushTileCode != null && hoverLocation != null && hoverLocation < level.map.length) {

            var savedContext = context;
            var buffer = document.createElement("canvas");
            buffer.width = canvas.width;
            buffer.height = canvas.height;
            context = buffer.getContext("2d");

            var hoverRowcol = getRowcol(level, hoverLocation);
            var objectHere = findObjectAtLocation(hoverLocation);
            if (typeof paintBrushTileCode === "number") {
                if (level.map[hoverLocation] !== paintBrushTileCode) {
                    drawTile(paintBrushTileCode, hoverRowcol.r, hoverRowcol.c, level, hoverLocation);
                }
            } else if (paintBrushTileCode === SNAKE) {
                if (!(objectHere != null && objectHere.type === SNAKE && objectHere.id === paintBrushSnakeColorIndex)) {
                    drawObject(newSnake(paintBrushSnakeColorIndex, hoverLocation));
                }
            } else if (paintBrushTileCode === BLOCK) {
                if (!(objectHere != null && objectHere.type === BLOCK && objectHere.id === paintBrushBlockId)) {
                    drawObject(newBlock(hoverLocation));
                }
            } else if (paintBrushTileCode === FRUIT) {
                if (!(objectHere != null && objectHere.type === FRUIT)) {
                    drawObject(newFruit(hoverLocation));
                }
            } else if (paintBrushTileCode === POISON_FRUIT) {
                if (!(objectHere != null && objectHere.type === POISON_FRUIT)) {
                    drawObject(newPoisonFruit(hoverLocation));
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
                    drawTile(tileCode, rowcol.r, rowcol.c, pastedData.level, location);
                });
                pastedData.selectedObjects.forEach(drawObject);
            } else throw unreachable();

            context = savedContext;
            context.save();
            context.globalAlpha = 0.2;
            context.drawImage(buffer, 0, 0);
            context.restore();
        }
    }

    function drawTile(tileCode, r, c, level, location, isCurve) {
        switch (tileCode) {
            case SPACE:
                break;
            case WALL:
                if (isCurve && curlyOutline) drawCurves(r, c, getAdjacentTiles());
                else drawWall(r, c, getAdjacentTiles());
                break;
            case SPIKE:
                drawSpikes(r, c, getAdjacentTiles(), level);
                break;
            case EXIT:
                var radiusFactor = isUneatenFruit() ? 0.7 : 1.2;
                drawQuarterPie(r, c, radiusFactor, snakeColors[0], 0);
                drawQuarterPie(r, c, radiusFactor, snakeColors[1], 1);
                drawQuarterPie(r, c, radiusFactor, snakeColors[2], 2);
                drawQuarterPie(r, c, radiusFactor, snakeColors[3], 3);
                break;
            case PORTAL:
                context.save();
                if (activePortalLocations.indexOf(location) !== -1) {
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
                else drawCircle(r, c, 1, "#999");
                context.restore();
                break;
            case PLATFORM:
                drawPlatform(r, c, getAdjacentTiles());
                break;
            case TRELLIS:
                drawTrellis(r, c);
                break;
            case ONEWAYWALLU:
                drawOneWayWall(r, c, -1);
                break;
            case ONEWAYWALLD:
                drawOneWayWall(r, c, 1);
                break;
            case TURNSTILEL:
                drawTurnstile(r, c, -1);
                break;
            case TURNSTILER:
                drawTurnstile(r, c, 1);
                break;
            case CLOSEDLIFT:
                drawLift(r, c, false);
                break;
            case OPENLIFT:
                drawLift(r, c, true);
                break;
            case CLOUD:
                drawCloud(context, c * tileSize, r * tileSize);
                break;
            case BUBBLE:
                drawBubble(r, c);
                break;
            case LAVA:
                drawLiquid(r, c, LAVA, getAdjacentTiles());
                break;
            case WATER:
                drawLiquid(r, c, WATER, getAdjacentTiles());
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

    function drawObject(object) {
        switch (object.type) {
            case SNAKE:
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
                for (var i = 0; i < object.locations.length; i++) {
                    var animation;
                    var rowcol;
                    if (i === 0 && (animation = findAnimation([SLITHER_HEAD], object.id)) != null) {  // animate head slithering forward
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
                    } else rowcol = getRowcol(level, object.locations[i]);

                    lastRowcol = getRowcol(level, object.locations[i - 1]); //closer to head
                    nextRowcol = getRowcol(level, object.locations[i + 1]); //closer to tail
                    var rc = rowcol;
                    var lrc = lastRowcol;
                    var nrc = nextRowcol;

                    if (object.dead) {    //if snake dies after moving left or right, head is positioned down
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
                            roundRect(context, cx, cy, tileSize, tileSize, { bl: 10, br: 10 }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 2;
                            else if (colorIndex === 1) orientation = 6;
                            else if (colorIndex === 2) orientation = 3;
                            else if (colorIndex === 3) orientation = 5;
                        }
                        else if (nextRowcol.r > rowcol.r) {  //last move up
                            roundRect(context, cx, cy, tileSize, tileSize, { tl: 10, tr: 10 }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 0;
                            else if (colorIndex === 1) orientation = 4;
                            else if (colorIndex === 2) orientation = 1;
                            else if (colorIndex === 3) orientation = 7;
                        }
                        else if (nextRowcol.c < rowcol.c) {  //last move right
                            roundRect(context, cx, cy, tileSize, tileSize, { tr: 10, br: 10 }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 1;
                            else if (colorIndex === 1) orientation = 5;
                            else if (colorIndex === 2) orientation = 2;
                            else if (colorIndex === 3) orientation = 4;
                        }
                        else if (nextRowcol.c > rowcol.c) {  //last move left
                            roundRect(context, cx, cy, tileSize, tileSize, { tl: 10, bl: 10 }, true, false);  //draw head
                            if (colorIndex === 0) orientation = 3;
                            else if (colorIndex === 1) orientation = 7;
                            else if (colorIndex === 2) orientation = 0;
                            else if (colorIndex === 3) orientation = 6;
                        }
                        else {
                            roundRect(context, cx, cy, tileSize, tileSize, 10, true, false);  //draw head
                            orientation = 10;
                        }
                    } else {
                        if (i % 2 == 0) context.fillStyle = color;
                        else context.fillStyle = altColor;

                        if (i === object.locations.length - 1) {
                            if (lastRowcol.r > rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { tl: 10, tr: 10 }, true, false); }
                            else if (lastRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { bl: 10, br: 10 }, true, false); }
                            else if (lastRowcol.c < rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tr: 10, br: 10 }, true, false); }
                            else if (lastRowcol.c > rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tl: 10, bl: 10 }, true, false); }
                        }
                        else if (i != object.locations.length - 1 && i != object.locations.length) {
                            if (lastRowcol.r > rowcol.r && nextRowcol.c < rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tr: 10 }, true, false); }
                            else if (lastRowcol.r > rowcol.r && nextRowcol.c > rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { tl: 10 }, true, false); }
                            else if (lastRowcol.r < rowcol.r && nextRowcol.c < rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { br: 10 }, true, false); }
                            else if (lastRowcol.r < rowcol.r && nextRowcol.c > rowcol.c) { roundRect(context, cx, cy, tileSize, tileSize, { bl: 10 }, true, false); }

                            else if (lastRowcol.c > rowcol.c && nextRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { bl: 10 }, true, false); }
                            else if (lastRowcol.c > rowcol.c && nextRowcol.r > rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { tl: 10 }, true, false); }
                            else if (lastRowcol.c < rowcol.c && nextRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { br: 10 }, true, false); }
                            else if (lastRowcol.c < rowcol.c && nextRowcol.r > rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, { tr: 10 }, true, false); }

                            else if (lastRowcol.c < rowcol.c && nextRowcol.c > rowcol.c || lastRowcol.c > rowcol.c && nextRowcol.c < rowcol.c || lastRowcol.r < rowcol.r && nextRowcol.r > rowcol.r || lastRowcol.r > rowcol.r && nextRowcol.r < rowcol.r) { roundRect(context, cx, cy, tileSize, tileSize, 0, true, false); }
                        }
                        else roundRect(context, cx, cy, tileSize, tileSize, 10, true, false);
                    }
                }
                drawFace(object.id, headRowcol.c, headRowcol.r, orientation);
                break;
            case BLOCK:
                drawBlock(object);
                break;
            case FRUIT:
            case POISON_FRUIT:
                var is_poison = object.type == POISON_FRUIT;
                rowcol = getRowcol(level, object.locations[0]);
                var c = rowcol.c;
                var r = rowcol.r;
                var startC = c * tileSize + tileSize / 2;
                var startR = r * tileSize + tileSize * .2;
                var resize = tileSize * 1.7;
                var color = fruitColors[object.id % fruitColors.length];
                var stemColor = themes[themeCounter][9]
                if (themeName === "Classic") color = "#f0f";
                if (is_poison) { color = "#666600"; stemColor = "black"; }
                context.fillStyle = color;
                if (themeName != "Classic") {
                    if (surface == "rainbow") {
                        stemColor = "white";
                        if (!is_poison) context.fillStyle = "black";
                        context.lineWidth = tileSize / 8;
                        context.strokeStyle = "white";
                        resize = tileSize * 1.4;
                    }
                    context.beginPath();
                    context.moveTo(startC, startR);
                    context.bezierCurveTo(startC - resize * .1, startR - resize * .05, startC - resize * .25, startR - resize * .1, startC - resize * .3, startR + resize * .05);
                    context.bezierCurveTo(startC - resize * .35, startR + resize * .15, startC - resize * .3, startR + resize * .6, startC, startR + resize * .5);
                    context.bezierCurveTo(startC + resize * .3, startR + resize * .6, startC + resize * .35, startR + resize * .15, startC + resize * .3, startR + resize * .05);
                    context.bezierCurveTo(startC + resize * .25, startR - resize * .05, startC + resize * .1, startR - resize * .1, startC, startR);
                    context.closePath();
                    context.fill();
                    if (surface == "rainbow") context.stroke();

                    context.beginPath();
                    context.moveTo(startC, startR);
                    context.bezierCurveTo(startC - resize * .1, startR - resize * .05, startC, startR - resize * .1, startC - resize * .1, startR - resize * .15);
                    context.bezierCurveTo(startC, startR - resize * .1, startC + resize * .05, startR - resize * .1, startC, startR);
                    context.fillStyle = stemColor;
                    context.fill();
                }
                else drawCircle(rowcol.r, rowcol.c, 1, color);
                break;
            default: throw unreachable();
        }
    }

    function drawPlatform(r, c, adjacentTiles) {
        newPlatform(r, c, isPlatform);

        function isPlatform(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === PLATFORM;
        }
    }

    function newPlatform(r, c, isOccupied) {

        var x1 = .05;
        var x2 = .05;
        if (isOccupied(-1, 0)) x1 = 0;
        if (isOccupied(1, 0)) x2 = 0;

        var platformColors = ["#ffcccc", "#ffe0cc", "#ffffcc", "#e6ffe6", "#e6e6ff"];
        for (var i = 0; i < 5; i++) {
            var j = i - 1;
            if (j < 0) j = 0;
            context.beginPath();
            context.moveTo(c * tileSize + tileSize * (i * x1), r * tileSize + tileSize * (.05 + (.1 * i) - (j * .02)));
            context.strokeStyle = platformColors[i];
            context.lineWidth = tileSize * (.1 - (i * .02));
            context.lineTo(c * tileSize + tileSize * (1 - (i * x2)), r * tileSize + tileSize * (.05 + (.1 * i) - (j * .02)));
            context.stroke();
        }
    }

    function drawTrellis(r, c) {
        context.fillStyle = "white";
        roundRect(context, (c - .05) * tileSize, r * tileSize, tileSize, tileSize * .1, 0, true, false);
        roundRect(context, (c - .05) * tileSize, r * tileSize, tileSize * .1, tileSize, 0, true, false);
        roundRect(context, (c + .95) * tileSize, r * tileSize, tileSize * .1, tileSize, 0, true, false);
        roundRect(context, (c - .05) * tileSize, (r - .2) * tileSize, tileSize * .1, tileSize * .2, 0, true, false);
        roundRect(context, (c + .95) * tileSize, (r - .2) * tileSize, tileSize * .1, tileSize * .2, 0, true, false);
    }

    function drawTurnstile(r, c, dc) {
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

    function drawOneWayWall(r, c, dr) {
        context.lineWidth = 2;
        context.strokeStyle = "#333";
        context.fillStyle = "orange";
        context.beginPath();
        if (dr == -1) {
            context.moveTo(c * tileSize, r * tileSize + tileSize / 2);
            context.lineTo(c * tileSize + tileSize / 4, r * tileSize + tileSize / 4);
            context.stroke();
            context.moveTo(c * tileSize + 3 * tileSize / 4, r * tileSize + tileSize / 4);
            context.lineTo(c * tileSize + tileSize, r * tileSize + tileSize / 2);
        }
        else if (dr == 1) {
            context.moveTo(c * tileSize, r * tileSize + tileSize / 2);
            context.lineTo(c * tileSize + tileSize / 4, r * tileSize + 3 * tileSize / 4);
            context.stroke();
            context.moveTo(c * tileSize + 3 * tileSize / 4, r * tileSize + 3 * tileSize / 4);
            context.lineTo(c * tileSize + tileSize, r * tileSize + tileSize / 2);
        }
        context.stroke();
        context.lineWidth = 0;

        if (dr == -1) roundRect(context, c * tileSize - tileSize / 15, r * tileSize - tileSize / 15, tileSize + 2 * tileSize / 15, tileSize / 4 + 2 * tileSize / 15, 2, true, false);
        else if (dr == 1) roundRect(context, c * tileSize - tileSize / 15, (r + 1) * tileSize - tileSize / 15 - tileSize / 4, tileSize + 2 * tileSize / 15, tileSize / 4 + 2 * tileSize / 15, 2, true, false);
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

    function drawBubble(r, c) {
        bubbleX = c * tileSize;
        var grd = context.createRadialGradient(bubbleX, r * tileSize, 0, bubbleX, r * tileSize, tileSize);
        grd.addColorStop(0, "rgba(255,255,255,1)");
        grd.addColorStop(.5, "rgba(220,255,255,.2)");
        grd.addColorStop(1, "rgba(0,100,255,.05)");
        context.fillStyle = grd;
        context.lineWidth = 1;
        context.strokeStyle = "rgba(255,255,255,.05)";

        context.beginPath();
        context.arc(c * tileSize + tileSize * .5, r * tileSize + tileSize * .5, tileSize / 1.8, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }

    function drawLiquid(r, c, type, adjacentTiles) {
        newLiquid(r, c, type, isSameLiquid);

        function isSameLiquid(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === type;
        }
    }

    function newLiquid(r, c, type, isOccupied) {
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

        context.shadowBlur = 10;
        context.lineWidth = 3.5;
        for (var i = -.1; i <= 1; i += .1) {
            context.beginPath();
            context.moveTo(c * tileSize, (r + i + .1) * tileSize);
            context.bezierCurveTo((c + 1 / 6) * tileSize, (r + i) * tileSize, (c + 1 / 3) * tileSize, (r + i) * tileSize, (c + 1 / 2) * tileSize, (r + i + .1) * tileSize);
            context.bezierCurveTo((c + 2 / 3) * tileSize, (r + i + .2) * tileSize, (c + 5 / 6) * tileSize, (r + i + .2) * tileSize, (c + 1) * tileSize, (r + i + .1) * tileSize);
            context.stroke();
            context.shadowBlur = 0;
            context.shadowColor = "transparent";
            var mod = Math.round((i + .1) * 10) % 3;
            switch (mod) {
                case 0: context.strokeStyle = color2; break;
                case 1: context.strokeStyle = color3; break;
                case 2: context.strokeStyle = color1; break;
            }
        }

        context.fillStyle = tubColor;
        if (!isOccupied(-1, 0)) {
            if (isOccupied(-1, -1)) roundRect(context, c * tileSize - tileSize * .1, (r + .1) * tileSize, tileSize * .2, tileSize * 1.2, 0, true, false);
            else roundRect(context, c * tileSize - tileSize * .1, (r - .1) * tileSize, tileSize * .2, tileSize * 1.4, 0, true, false);
        }
        if (!isOccupied(1, 0)) {
            if (isOccupied(1, -1)) roundRect(context, c * tileSize + tileSize * .9, (r + .1) * tileSize, tileSize * .2, tileSize * 1.2, 0, true, false);
            else roundRect(context, c * tileSize + tileSize * .9, (r - .1) * tileSize, tileSize * .2, tileSize * 1.4, 0, true, false);
        }
        if (!isOccupied(0, 1)) {
            if (isOccupied(-1, 1) && !isOccupied(1, 1)) roundRect(context, c * tileSize - tileSize * .1, (r + 1.05) * tileSize, tileSize * 1.1, tileSize * .25, 0, true, false);
            else if (!isOccupied(-1, 1) && isOccupied(1, 1)) roundRect(context, c * tileSize, (r + 1.05) * tileSize, tileSize * 1.3, tileSize * .25, 0, true, false);
            else if (isOccupied(-1, 1) && isOccupied(1, 1)) roundRect(context, c * tileSize - tileSize * .1, (r + 1.05) * tileSize, tileSize * 1.1, tileSize * .25, 0, true, false);
            else roundRect(context, c * tileSize, (r + 1.05) * tileSize, tileSize * 1.1, tileSize * .25, 0, true, false);
        }
        context.restore();
    }

    function drawLift(r, c, isOpen) {
        context.lineWidth = .5;
        context.strokeStyle = "#777";
        var strokeBool = false;
        if (!isOpen) {
            context.fillStyle = "#e68a00";
            roundRect(context, c * tileSize + tileSize * .05, r * tileSize + tileSize, tileSize * .9, tileSize * .2, 2, true, strokeBool);
            context.fillStyle = "#cc0000";
            roundRect(context, c * tileSize + tileSize * .3, r * tileSize + tileSize * .8, tileSize * .4, tileSize * .2, { tl: 2, tr: 2 }, true, strokeBool);
        }
        else if (isOpen) {
            context.fillStyle = "#e68a00";
            roundRect(context, c * tileSize + tileSize * .05, r * tileSize + tileSize * .8, tileSize * .9, tileSize * .2, 2, true, strokeBool);
            roundRect(context, c * tileSize + tileSize * .05, r * tileSize, tileSize * .9, tileSize * .2, 2, true, strokeBool);

            if (themeName != "Midnight Rainbow") context.fillStyle = "#333";
            else context.fillStyle = "gainsboro";

            context.beginPath();
            context.moveTo(c * tileSize + tileSize * .9, r * tileSize + tileSize * .8);
            context.lineTo(c * tileSize + tileSize * .3, r * tileSize + tileSize * .5);
            context.lineTo(c * tileSize + tileSize * .9, r * tileSize + tileSize * .2);
            context.lineTo(c * tileSize + tileSize * .7, r * tileSize + tileSize * .2);
            context.lineTo(c * tileSize + tileSize * .2, r * tileSize + tileSize * .45);
            context.bezierCurveTo(c * tileSize + tileSize * .16, r * tileSize + tileSize * .45, c * tileSize + tileSize * .16, r * tileSize + tileSize * .55, c * tileSize + tileSize * .2, r * tileSize + tileSize * .55);
            context.lineTo(c * tileSize + tileSize * .7, r * tileSize + tileSize * .8);
            context.lineTo(c * tileSize + tileSize * .9, r * tileSize + tileSize * .8);
            context.closePath();
            context.fill();

            context.beginPath();
            context.moveTo(c * tileSize + tileSize * .1, r * tileSize + tileSize * .8);
            context.lineTo(c * tileSize + tileSize * .7, r * tileSize + tileSize * .5);
            context.lineTo(c * tileSize + tileSize * .1, r * tileSize + tileSize * .2);
            context.lineTo(c * tileSize + tileSize * .3, r * tileSize + tileSize * .2);
            context.lineTo(c * tileSize + tileSize * .8, r * tileSize + tileSize * .45);
            context.bezierCurveTo(c * tileSize + tileSize * .84, r * tileSize + tileSize * .45, c * tileSize + tileSize * .84, r * tileSize + tileSize * .55, c * tileSize + tileSize * .8, r * tileSize + tileSize * .55);
            context.lineTo(c * tileSize + tileSize * .3, r * tileSize + tileSize * .8);
            context.lineTo(c * tileSize + tileSize * .1, r * tileSize + tileSize * .8);
            context.closePath();
            context.fill();
        }
    }

    function drawWall(r, c, adjacentTiles) {
        drawTileNew(r, c, isWall, 0.2, material);
        drawTileOutlines(r, c, isWall, 0.2, curlyOutline);
        context.save();
        if (curlyOutline) drawBushes(r, c, isWall);
        context.restore();
        context.fillStyle = "#895C33"; // dirt edge

        function isWall(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === WALL;
        }
    }

    function drawTileNew(r, c, isOccupied, outlineThickness, fillStyle) {
        context.fillStyle = fillStyle;
        if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { bl: 10, br: 10 }, true, false);
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { tl: 10, bl: 10 }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { tl: 10, tr: 10 }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { tr: 10, br: 10 }, true, false);
        else if (isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { bl: 10 }, true, false);
        else if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { br: 10 }, true, false);
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { tl: 10 }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, { tr: 10 }, true, false);
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, 10, true, false);
        else roundRect(context, c * tileSize, r * tileSize, tileSize, tileSize, 0, true, false);

        /*var randomSpot = Math.floor(Math.random() * 5);   //random spots on dirt
        var randomColor = Math.floor(Math.random() * 5);
        context.beginPath();
        switch(randomSpot){
            case 0:
                context.arc(c*tileSize+tileSize*.5,r*tileSize+tileSize*.5, 5, 0, 2*Math.PI);
            case 1:
                context.arc(c*tileSize+tileSize*.5,r*tileSize+tileSize*.5, 4, 0, 2*Math.PI);
            case 2:
                context.arc(c*tileSize+tileSize*.5,r*tileSize+tileSize*.5, 3, 0, 2*Math.PI);
            case 3:
                context.arc(c*tileSize+tileSize*.5,r*tileSize+tileSize*.5, 2, 0, 2*Math.PI);
            case 4:
                context.arc(c*tileSize+tileSize*.5,r*tileSize+tileSize*.5, 1, 0, 2*Math.PI);
        }
        context.stroke();*/
    }

    function drawCurves(r, c, adjacentTiles) {
        drawCurves2(r, c, isWall, material);

        function isWall(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === WALL;
        }
    }

    function drawCurves2(r, c, isOccupied, material) {
        context.fillStyle = material;
        if (isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(1, 1) && curlyOutline) {
            context.fillRect((c + 1) * tileSize, (r + 1) * tileSize, tileSize / 6, tileSize / 6);
            //context.globalCompositeOperation = "destination-out";
            context.beginPath();
            context.arc((c + 1) * tileSize + tileSize / 6, (r + 1) * tileSize + tileSize / 6, tileSize / 6, 0, 2 * Math.PI);
            context.closePath();

            var bgColor;
            if ((c + r) % 2 == 0) bgColor = background[0];
            else bgColor = background[1];
            var r1, r2, b1, b2, g1, g2;
            r1 = bgColor.substr(5, bgColor.indexOf(",") - 5);
            g1 = bgColor.substr(bgColor.indexOf(",") + 1, bgColor.indexOf(",") - 4);
            b1 = bgColor.substr(bgColor.indexOf(",", bgColor.indexOf(",") + 1) + 1, bgColor.indexOf(",") - 4);
            var shade = (r + 1) * .03 + .5;
            if (shade > 1)
                shade = 1;
            r2 = 255 + (r1 - 255) * shade;
            g2 = 255 + (g1 - 255) * shade;
            b2 = 255 + (b1 - 255) * shade;
            context.fillStyle = "rgb(" + r2 + ", " + g2 + ", " + b2 + ")";
            context.fill();
            context.globalCompositeOperation = "source-over";
        }
        if (isOccupied(-1, 0) && isOccupied(0, 1) && !isOccupied(-1, 1) && curlyOutline) {
            context.fillRect(c * tileSize - tileSize / 6, (r + 1) * tileSize, tileSize / 6, tileSize / 6);
            //context.globalCompositeOperation = "destination-out";
            context.beginPath();
            context.arc(c * tileSize - tileSize / 6, (r + 1) * tileSize + tileSize / 6, tileSize / 6, 0, 2 * Math.PI);
            context.closePath();

            var bgColor;
            if ((c + r) % 2 == 0) bgColor = background[0];
            else bgColor = background[1];
            var r1, r2, b1, b2, g1, g2;
            r1 = bgColor.substr(5, bgColor.indexOf(",") - 5);
            g1 = bgColor.substr(bgColor.indexOf(",") + 1, bgColor.indexOf(",") - 4);
            b1 = bgColor.substr(bgColor.indexOf(",", bgColor.indexOf(",") + 1) + 1, bgColor.indexOf(",") - 4);
            var shade = (r + 1) * .03 + .5;
            if (shade > 1)
                shade = 1;
            r2 = 255 + (r1 - 255) * shade;
            g2 = 255 + (g1 - 255) * shade;
            b2 = 255 + (b1 - 255) * shade;
            context.fillStyle = "rgb(" + r2 + ", " + g2 + ", " + b2 + ")";
            context.fill();
            context.globalCompositeOperation = "source-over";
        }
    }

    function drawTileOutlines(r, c, isOccupied, outlineThickness, curlyOutline) {
        if (surface != "rainbow") {
            context.fillStyle = surface;
        }
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
        var complement = 1 - outlineThickness;
        var outlinePixels = outlineThickness * tileSize;
        var complementPixels = (1 - 2 * outlineThickness) * tileSize;

        if (curlyOutline && !isOccupied(0, -1)) {
            if (!isOccupied(-1, 0) && isOccupied(1, 0)) {
                context.beginPath();
                context.moveTo(c * tileSize + tileSize * .1, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .05, r * tileSize + tileSize * .3, c * tileSize + tileSize * .3, r * tileSize + tileSize * .4, c * tileSize + tileSize * .33, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .35, r * tileSize + tileSize * .4, c * tileSize + tileSize * .6, r * tileSize + tileSize * .4, c * tileSize + tileSize * .67, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .75, r * tileSize + tileSize * .3, c * tileSize + tileSize * .9, r * tileSize + tileSize * .4, c * tileSize + tileSize * 1, r * tileSize + tileSize * .2);
                context.lineTo(c * tileSize + tileSize, r * tileSize);
                context.lineTo(c * tileSize + tileSize * .2, r * tileSize);
                context.bezierCurveTo(c * tileSize - tileSize * .2, r * tileSize - tileSize * .05, c * tileSize - tileSize * .15, r * tileSize + tileSize * .5, c * tileSize + tileSize * .1, r * tileSize + tileSize * .25);
                context.closePath();
            }
            else if (isOccupied(-1, 0) && !isOccupied(1, 0)) {
                context.beginPath();
                context.moveTo(c * tileSize + tileSize * .9, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .95, r * tileSize + tileSize * .3, c * tileSize + tileSize * .7, r * tileSize + tileSize * .4, c * tileSize + tileSize * .67, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .65, r * tileSize + tileSize * .4, c * tileSize + tileSize * .4, r * tileSize + tileSize * .4, c * tileSize + tileSize * .33, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .3, r * tileSize + tileSize * .3, c * tileSize + tileSize * .1, r * tileSize + tileSize * .4, c * tileSize, r * tileSize + tileSize * .2);
                context.lineTo(c * tileSize, r * tileSize);
                context.lineTo(c * tileSize + tileSize * .8, r * tileSize);
                context.bezierCurveTo((c + 1) * tileSize + tileSize * .2, r * tileSize - tileSize * .05, (c + 1) * tileSize + tileSize * .15, r * tileSize + tileSize * .5, (c + 1) * tileSize - tileSize * .1, r * tileSize + tileSize * .25);
                context.closePath();
            }
            else if (!isOccupied(-1, 0) && !isOccupied(1, 0)) {
                context.beginPath();
                context.moveTo(c * tileSize + tileSize * .9, r * tileSize - tileSize * 0);
                context.lineTo(c * tileSize + tileSize * .2, r * tileSize);
                context.bezierCurveTo(c * tileSize - tileSize * .2, r * tileSize - tileSize * .05, c * tileSize - tileSize * .15, r * tileSize + tileSize * .5, c * tileSize + tileSize * .1, r * tileSize + tileSize * .25);
                context.bezierCurveTo(c * tileSize + tileSize * .05, r * tileSize + tileSize * .3, c * tileSize + tileSize * .3, r * tileSize + tileSize * .4, c * tileSize + tileSize * .33, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .35, r * tileSize + tileSize * .4, c * tileSize + tileSize * .6, r * tileSize + tileSize * .4, c * tileSize + tileSize * .67, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .75, r * tileSize + tileSize * .3, c * tileSize + tileSize * .8, r * tileSize + tileSize * .4, c * tileSize + tileSize * .9, r * tileSize + tileSize * .2);
                context.bezierCurveTo((c + 1) * tileSize - tileSize * .1, r * tileSize + tileSize * .4, (c + 1) * tileSize + tileSize * .3, r * tileSize + tileSize * .3, (c + 1) * tileSize, r * tileSize + tileSize * .02);
                context.closePath();
            }
            else {
                context.beginPath();
                context.moveTo(c * tileSize, r * tileSize);
                context.lineTo(c * tileSize, r * tileSize + tileSize * .15);
                context.bezierCurveTo(c * tileSize + tileSize * 0, r * tileSize + tileSize * .4, c * tileSize + tileSize * .3, r * tileSize + tileSize * .3, c * tileSize + tileSize * .33, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .35, r * tileSize + tileSize * .3, c * tileSize + tileSize * .6, r * tileSize + tileSize * .3, c * tileSize + tileSize * .67, r * tileSize + tileSize * .2);
                context.bezierCurveTo(c * tileSize + tileSize * .75, r * tileSize + tileSize * .4, c * tileSize + tileSize * .9, r * tileSize + tileSize * .3, c * tileSize + tileSize * 1, r * tileSize + tileSize * .2);
                context.lineTo(c * tileSize + tileSize, r * tileSize);
                context.closePath();
            }
            context.fill();
        }
        else if (!curlyOutline && !isOccupied(0, -1)) {
            context.fillRect((c) * tileSize, (r) * tileSize, tileSize, outlinePixels);

        }
        if (!curlyOutline && !isOccupied(-1, -1)) context.fillRect((c) * tileSize, (r) * tileSize, outlinePixels, outlinePixels);
        if (!curlyOutline && !isOccupied(1, -1)) context.fillRect((c + complement) * tileSize, (r) * tileSize, outlinePixels, outlinePixels);
        if (!curlyOutline && !isOccupied(-1, 1)) context.fillRect((c) * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels);
        if (!curlyOutline && !isOccupied(1, 1)) context.fillRect((c + complement) * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels);
        if (!curlyOutline && !isOccupied(0, 1)) context.fillRect((c) * tileSize, (r + complement) * tileSize, tileSize, outlinePixels);
        if (!curlyOutline && !isOccupied(-1, 0)) context.fillRect((c) * tileSize, (r) * tileSize, outlinePixels, tileSize);
        if (!curlyOutline && !isOccupied(1, 0)) context.fillRect((c + complement) * tileSize, (r) * tileSize, outlinePixels, tileSize);
    }

    function drawBushes(r, c, isOccupied) {
        if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(1, -1)) {
            /*context.shadowColor = "#666";
            context.shadowOffsetX = -.5;
            context.shadowOffsetY = -.5;
            context.shadowBlur = 1;*/

            context.beginPath();
            context.moveTo((c + 1) * tileSize, r * tileSize);
            context.lineTo((c + 1) * tileSize, r * tileSize - tileSize * .4);
            context.bezierCurveTo((c + 1) * tileSize - tileSize * .1, r * tileSize - tileSize * .4, (c + 1) * tileSize - tileSize * .2, r * tileSize - tileSize * .4, (c + 1) * tileSize - tileSize * .2, r * tileSize - tileSize * .2);
            context.bezierCurveTo((c + 1) * tileSize - tileSize * .3, r * tileSize - tileSize * .2, (c + 1) * tileSize - tileSize * .4, r * tileSize - tileSize * .1, (c + 1) * tileSize - tileSize * .3, r * tileSize);
            context.lineTo((c + 1) * tileSize, r * tileSize);
            context.closePath();
            context.fill();

            context.beginPath();
            context.moveTo((c + 1) * tileSize, r * tileSize - tileSize * .4);
            context.bezierCurveTo((c + 1) * tileSize - tileSize * .1, r * tileSize - tileSize * .4, (c + 1) * tileSize - tileSize * .2, r * tileSize - tileSize * .4, (c + 1) * tileSize - tileSize * .2, r * tileSize - tileSize * .2);
            context.bezierCurveTo((c + 1) * tileSize - tileSize * .3, r * tileSize - tileSize * .2, (c + 1) * tileSize - tileSize * .4, r * tileSize - tileSize * .1, (c + 1) * tileSize - tileSize * .3, r * tileSize);
        }

        if (!isOccupied(0, -1) && isOccupied(-1, 0) && isOccupied(-1, -1)) {
            /*context.shadowColor = "#666";
            context.shadowOffsetX = .5;
            context.shadowOffsetY = -.5;
            context.shadowBlur = 1;*/

            context.beginPath();
            context.moveTo(c * tileSize, r * tileSize);
            context.lineTo(c * tileSize, r * tileSize - tileSize * .4);
            context.bezierCurveTo(c * tileSize + tileSize * .1, r * tileSize - tileSize * .4, c * tileSize + tileSize * .2, r * tileSize - tileSize * .4, c * tileSize + tileSize * .2, r * tileSize - tileSize * .2);
            context.bezierCurveTo(c * tileSize + tileSize * .3, r * tileSize - tileSize * .2, c * tileSize + tileSize * .4, r * tileSize - tileSize * .1, c * tileSize + tileSize * .3, r * tileSize);
            context.lineTo(c * tileSize, r * tileSize);
            context.closePath();
            context.fill();

            context.restore();

            context.beginPath();
            context.moveTo(c * tileSize, r * tileSize - tileSize * .4);
            context.bezierCurveTo(c * tileSize + tileSize * .1, r * tileSize - tileSize * .4, c * tileSize + tileSize * .2, r * tileSize - tileSize * .4, c * tileSize + tileSize * .2, r * tileSize - tileSize * .2);
            context.bezierCurveTo(c * tileSize + tileSize * .3, r * tileSize - tileSize * .2, c * tileSize + tileSize * .4, r * tileSize - tileSize * .1, c * tileSize + tileSize * .3, r * tileSize);
            /*context.strokeStyle = "#7dff1a";
            context.stroke();*/
        }
    }

    function drawSpikes(r, c, adjacentTiles) {
        var x = c * tileSize;
        var y = r * tileSize;
        context.fillStyle = spikeColors[0];

        context.beginPath();
        context.moveTo(x + tileSize * 0.25, y + tileSize * 0.3); //top spikes
        context.lineTo(x + tileSize * 0.35, y + tileSize * 0.0);
        context.lineTo(x + tileSize * 0.45, y + tileSize * 0.3);
        context.lineTo(x + tileSize * 0.55, y + tileSize * 0.3);
        context.lineTo(x + tileSize * 0.65, y + tileSize * 0.0);
        context.lineTo(x + tileSize * 0.75, y + tileSize * 0.3);

        context.moveTo(x + tileSize * 0.7, y + tileSize * 0.25); //right spikes
        context.lineTo(x + tileSize * 1.0, y + tileSize * 0.35);
        context.lineTo(x + tileSize * 0.7, y + tileSize * 0.45);
        context.lineTo(x + tileSize * 0.7, y + tileSize * 0.55);
        context.lineTo(x + tileSize * 1.0, y + tileSize * 0.65);
        context.lineTo(x + tileSize * 0.7, y + tileSize * 0.75);

        context.moveTo(x + tileSize * 0.75, y + tileSize * 0.7); //bottom spikes
        context.lineTo(x + tileSize * 0.65, y + tileSize * 1.0);
        context.lineTo(x + tileSize * 0.55, y + tileSize * 0.7);
        context.lineTo(x + tileSize * 0.45, y + tileSize * 0.7);
        context.lineTo(x + tileSize * 0.35, y + tileSize * 1.0);
        context.lineTo(x + tileSize * 0.25, y + tileSize * 0.7);

        context.moveTo(x + tileSize * 0.3, y + tileSize * 0.75); //left spikes
        context.lineTo(x + tileSize * 0.0, y + tileSize * 0.65);
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.55);
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.45);
        context.lineTo(x + tileSize * 0.0, y + tileSize * 0.35);
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.25);
        context.closePath();

        /*context.lineTo(x + tileSize * 1.0, y + tileSize * 0.4);      
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
        context.lineTo(x + tileSize * 0.3, y + tileSize * 0.3);*/
        context.fill();
        drawSpikeSupports(r, c, isSpike, isWall);

        function isSpike(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === SPIKE;
        }
        function isWall(dc, dr) {
            var tileCode = adjacentTiles[1 + dr][1 + dc];
            return tileCode == null || tileCode === WALL;
        }
    }

    function drawSpikeSupports(r, c, isOccupied, canConnect) {
        var boltBool = false;
        var occupiedCount = 0;
        if (canConnect(0, 1)) {
            context.fillStyle = spikeColors[1];
            context.fillRect(c * tileSize + (tileSize * .3), r * tileSize + (tileSize * .8), tileSize * .4, tileSize * .4);
            boltBool = true;
        }
        if (canConnect(0, -1) && !canConnect(0, 1)) {
            if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0) && canConnect(-1, -1) && canConnect(1, -1)) { }
            else {
                context.fillStyle = spikeColors[1];
                context.fillRect(c * tileSize + (tileSize * .3), r * tileSize, tileSize * .4, tileSize * .4);
                boltBool = true;
            }
        }
        if (canConnect(-1, 0) && !canConnect(0, 1)) {
            if (isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0) && canConnect(-1, -1) && canConnect(-1, 1)) { }
            else {
                context.fillStyle = spikeColors[1];
                context.fillRect(c * tileSize, r * tileSize + (tileSize * .3), tileSize * .4, tileSize * .4);
                boltBool = true;
            }
        }
        if (canConnect(1, 0) && !canConnect(0, 1)) {
            if (isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0) && canConnect(1, -1) && canConnect(1, 1)) { }
            else {
                context.fillStyle = spikeColors[1];
                context.fillRect(c * tileSize + (tileSize * .8), r * tileSize + (tileSize * .3), tileSize * .4, tileSize * .4);
                boltBool = true;
            }
        }

        context.fillStyle = spikeColors[2];
        if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) {                                             //TOUCHING ONE
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize * .8, { bl: 4, br: 4 }, true, false);
            boltBool = true;
        }
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) {
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize, tileSize * .6, { tl: 4, bl: 4 }, true, false);
            boltBool = true;
        }
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .6, tileSize * .8, { tl: 4, tr: 4 }, true, false);
            boltBool = true;
        }
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, { tr: 4, br: 4 }, true, false);
            boltBool = true;
        }
        else if (isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && !isOccupied(-1, 0)) {                                         //TOUCHING TWO (CORNERS)
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize * .8, { bl: 4 }, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, { bl: 4 }, true, false);
            if (!canConnect(1, -1)) boltBool = true;
        }
        else if (isOccupied(0, -1) && !isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, { br: 4 }, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize * .8, { br: 4 }, true, false);
            if (!canConnect(-1, -1)) boltBool = true;
        }
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, { tl: 4 }, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .6, tileSize * .8, { tl: 4 }, true, false);
            if (!canConnect(1, 1)) boltBool = true;
        }
        else if (!isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, { tr: 4 }, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .6, tileSize * .8, { tr: 4 }, true, false);
            if (!canConnect(-1, 1)) boltBool = true;
        }
        else if (isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {                                         //TOUCHING TWO (OPPOSITES)
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize, 0, true, false);
        }
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize, tileSize * .6, 0, true, false);
        }
        else if (isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && !isOccupied(-1, 0)) {                                         //TOUCHING THREE
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize, 0, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, 0, true, false);
            boltBool = true;
        }
        else if (isOccupied(0, -1) && isOccupied(1, 0) && !isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize, tileSize * .6, 0, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize * .8, 0, true, false);
            boltBool = true;
        }
        else if (isOccupied(0, -1) && !isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize, 0, true, false);
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize * .8, tileSize * .6, 0, true, false);
            boltBool = true;
        }
        else if (!isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize, tileSize * .6, 0, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .6, tileSize * .8, 0, true, false);
            boltBool = true;
        }
        else if (isOccupied(0, -1) && isOccupied(1, 0) && isOccupied(0, 1) && isOccupied(-1, 0)) {                                              //TOUCHING FOUR                                 
            roundRect(context, c * tileSize, r * tileSize + (tileSize * .2), tileSize, tileSize * .6, 0, true, false);
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize, tileSize * .6, tileSize, 0, true, false);
            //boltBool = true;
        }
        else {
            roundRect(context, c * tileSize + (tileSize * .2), r * tileSize + (tileSize * .2), tileSize * .6, tileSize * .6, 0, true, false);
            boltBool = true;
        }

        if (boltBool) drawBolt(r, c);
    }

    function drawBolt(r, c) {
        context.strokeStyle = spikeColors[3];
        context.beginPath();
        context.arc(c * tileSize + (tileSize * .55), r * tileSize + (tileSize * .45), 4, -.7 * Math.PI, .2 * Math.PI);
        context.lineTo(c * tileSize + (tileSize * .45), r * tileSize + (tileSize * .35));
        context.closePath();
        context.fillStyle = spikeColors[3];
        context.fill();
        context.stroke();

        context.beginPath();
        context.moveTo(c * tileSize + (tileSize * .43), r * tileSize + (tileSize * .47));
        context.arc(c * tileSize + (tileSize * .48), r * tileSize + (tileSize * .52), 4, .2 * Math.PI, -.75 * Math.PI);
        //context.lineTo(c*tileSize+(tileSize*.4),r*tileSize+(tileSize*.6));
        context.closePath();
        context.fillStyle = spikeColors[3];
        context.fill();
        context.stroke();
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
    function drawBlock(block) {
        var animationDisplacementRowcol = findAnimationDisplacementRowcol(block.type, block.id);
        var rowcols = block.locations.map(function (location) {
            return getRowcol(level, location);
        });
        rowcols.forEach(function (rowcol) {
            var r = rowcol.r + animationDisplacementRowcol.r;
            var c = rowcol.c + animationDisplacementRowcol.c;
            context.fillStyle = blockColors[block.id % blockColors.length];
            var outlineThickness = .4;

            var complement = 1 - outlineThickness;
            var outlinePixels = outlineThickness * tileSize;
            if (!isAlsoThisBlock(-1, -1)) context.fillRect((c) * tileSize, (r) * tileSize, outlinePixels, outlinePixels);
            if (!isAlsoThisBlock(1, -1)) context.fillRect((c + complement) * tileSize, (r) * tileSize, outlinePixels, outlinePixels);
            if (!isAlsoThisBlock(-1, 1)) context.fillRect((c) * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels);
            if (!isAlsoThisBlock(1, 1)) context.fillRect((c + complement) * tileSize, (r + complement) * tileSize, outlinePixels, outlinePixels);
            if (!isAlsoThisBlock(0, -1)) context.fillRect((c) * tileSize, (r) * tileSize, tileSize, outlinePixels);
            if (!isAlsoThisBlock(0, 1)) context.fillRect((c) * tileSize, (r + complement) * tileSize, tileSize, outlinePixels);
            if (!isAlsoThisBlock(-1, 0)) context.fillRect((c) * tileSize, (r) * tileSize, outlinePixels, tileSize);
            if (!isAlsoThisBlock(1, 0)) context.fillRect((c + complement) * tileSize, (r) * tileSize, outlinePixels, tileSize);

            function isAlsoThisBlock(dc, dr) {
                for (var i = 0; i < rowcols.length; i++) {
                    var otherRowcol = rowcols[i];
                    if (rowcol.r + dr === otherRowcol.r && rowcol.c + dc === otherRowcol.c) return true;
                }
                return false;
            }
        });
    }
    function drawQuarterPie(r, c, radiusFactor, fillStyle, quadrant) {
        var cx = (c + 0.5) * tileSize;
        var cy = (r + 0.5) * tileSize;
        context.fillStyle = fillStyle;
        context.beginPath();
        context.moveTo(cx, cy);
        context.arc(cx, cy, radiusFactor * tileSize / 2, quadrant * Math.PI / 2, (quadrant + 1) * Math.PI / 2);
        context.fill();
    }
    function drawDiamond(r, c, fillStyle) {
        var x = c * tileSize;
        var y = r * tileSize;
        context.fillStyle = fillStyle;
        roundRect(context, x, y, tileSize, tileSize, 10, true, false);
    }
    function drawCircle(r, c, radiusFactor, fillStyle) {
        context.fillStyle = fillStyle;
        context.beginPath();
        context.arc((c + 0.5) * tileSize, (r + 0.5) * tileSize, tileSize / 2 * radiusFactor, 0, 2 * Math.PI);
        context.fill();
    }
    function drawRect(r, c, fillStyle) {
        context.fillStyle = fillStyle;
        context.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
    }

    function drawCloud(c, x, y) {
        c.fillStyle = experimentalColors[0];
        /*c.beginPath();
        c.rect(x, y, tileSize, tileSize);
        c.fill();
        c.closePath();*/

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

        c.bezierCurveTo(x - tileSize * .15, y + tileSize * 1, x - tileSize * .15, y + tileSize * .67, x + tileSize * 0, y + tileSize * .67);
        c.bezierCurveTo(x - tileSize * .15, y + tileSize * .67, x - tileSize * .15, y + tileSize * .33, x + tileSize * 0, y + tileSize * .33);
        c.bezierCurveTo(x - tileSize * .15, y + tileSize * .33, x - tileSize * .15, y + tileSize * 0, x + tileSize * 0, y + tileSize * 0);

        c.closePath();
        c.fill();
        //c.stroke();
    }

    function drawFace(snake, headCol, headRow, orientation) {
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

                a1 = tileSize * .7;
                a2 = tileSize - tileSize * .7;
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

                a1 = tileSize - tileSize * .7;
                a2 = tileSize * .7;
                a3 = tileSize - tileSize * .7;
                a4 = tileSize * 1.3;
                a5 = tileSize - tileSize * .7;
                a6 = tileSize * .7;
                a7 = tileSize / 6;
                a8 = 0;
                beakRotation = 1;
                arcDirection = true;
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

                a1 = tileSize - tileSize * .7;
                a2 = tileSize - tileSize * .7;
                a3 = tileSize - tileSize * 1.3;
                a4 = tileSize - tileSize * .7;
                a5 = tileSize - tileSize * .7;
                a6 = tileSize - tileSize * .7;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = 1.5;
                arcDirection = true;
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

                a1 = tileSize - tileSize * .7;
                a2 = tileSize - tileSize * .7;
                a3 = tileSize - tileSize * .7;
                a4 = -tileSize * .3;
                a5 = tileSize - tileSize * .7;
                a6 = tileSize * .3;
                a7 = tileSize / 6;
                a8 = 0;
                beakRotation = 1;
                arcDirection = false;
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

                a1 = tileSize * .7;
                a2 = tileSize - tileSize * .7;
                a3 = tileSize * 1.3;
                a4 = tileSize - tileSize * .7;
                a5 = tileSize * .7;
                a6 = tileSize - tileSize * .7;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = 1.5;
                arcDirection = false;
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

                a1 = tileSize - tileSize * .7;
                a2 = tileSize * .7;
                a3 = tileSize - tileSize * 1.3;
                a4 = tileSize * .7;
                a5 = tileSize - tileSize * .7;
                a6 = tileSize * .7;
                a7 = 0;
                a8 = tileSize / 6;
                beakRotation = 1.5;
                arcDirection = true;
                break;
            case 10:    //single unit snake
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
        context.beginPath();
        context.arc(x + a1, y + a2, tileSize / 6, (beakRotation - 1) * Math.PI, beakRotation * Math.PI, arcDirection);
        context.lineTo(x + a3, y + a4);
        context.lineTo(x + a5 + a7, y + a6 + a8);
        context.closePath();
        context.fill();
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

    function shadeColor(color, percent) {

        var R = parseInt(color.substring(1, 3), 16);
        var G = parseInt(color.substring(3, 5), 16);
        var B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        var RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        var GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        var BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }


    function drawR(r, c, fillStyle) {
        context.fillStyle = fillStyle;
        var cornerRadius = 20;
        context.lineJoin = "round";
        context.lineWidth = 1;
        context.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
        //context.fillRect(c*tileSize, r*tileSize, tileSize, tileSize);
    }

    function drawGrid() {
        var buffer = document.createElement("canvas");
        buffer.width = canvas.width;
        buffer.height = canvas.height;
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
        var buffer = document.createElement("canvas");
        buffer.width = canvas.width;
        buffer.height = canvas.height;
        var localContext = buffer.getContext("2d");

        localContext.setLineDash([8, 4]);
        localContext.strokeStyle = "white";
        localContext.lineWidth = tileSize / 6;
        for (var i = 0; i < outline.length; i++) {
            roundRect(localContext, outline[i].c * tileSize, outline[i].r * tileSize, tileSize, tileSize, 5, false, true);
        }

        localContext.setLineDash([]);
        localContext.strokeStyle = "red";
        localContext.lineWidth = tileSize / 3;
        for (var i = 0; i < conflicts.length; i++) {
            var c = conflicts[i].c;
            var r = conflicts[i].r;
            localContext.beginPath();
            localContext.moveTo((c - .2) * tileSize, (r - .2) * tileSize);
            localContext.lineTo((c + 1.2) * tileSize, (r + 1.2) * tileSize);
            localContext.moveTo((c + 1.2) * tileSize, (r - .2) * tileSize);
            localContext.lineTo((c - .2) * tileSize, (r + 1.2) * tileSize);
            localContext.stroke();
        }

        context.save();
        context.globalAlpha = 1;
        context.drawImage(buffer, 0, 0);
        context.restore();
    }
}

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
        "m" + objectType, // MOVE_SNAKE | MOVE_BLOCK
        "t" + objectType, // TELEPORT_SNAKE | TELEPORT_BLOCK
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

    if (hashPairs[0][0] !== "level") return false;
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
