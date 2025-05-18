/**
 * LayerOffset.jsx - Version 2.0
 * Created: 2025-05-07 11:00 AM EDT
 * Author: Jerron Smith
 * Description: AE dockable panel to offset selected layers by timecode input or incremental steps.
 *
 * Features:
 * - Offsets layers using SMPTE timecode input (00:00:00:00 format)
 * - Option to reverse layer order for offset sequencing
 * - Incremental nudge controls (←/→) with Shift for 10-frame jumps
 * - 'Reset to Home' button resets selected layers to start at 0
 * - Designed as a dockable ScriptUI panel for After Effects
 */

#targetengine "offsetLayers"

function offsetLayersPanel(thisObj) {
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Layer Offset", undefined, { resizeable: true });

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 10;

    // Offset Input Group
    var inputGroup = win.add("group");
    inputGroup.orientation = "row";
    inputGroup.add("statictext", undefined, "Offset By:");

    var timeInput = inputGroup.add("edittext", undefined, "00:00:01:00");
    timeInput.characters = 10;

    timeInput.onChange = function () {
        var raw = timeInput.text.replace(/[^0-9]/g, "");
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;
        var fps = comp.frameRate;

        if (raw.length === 0) {
            timeInput.text = "00:00:01:00";
            return;
        }

        while (raw.length < 8) raw = "0" + raw;

        var ff = parseInt(raw.substring(6, 8), 10);
        var ss = parseInt(raw.substring(4, 6), 10);
        var mm = parseInt(raw.substring(2, 4), 10);
        var hh = parseInt(raw.substring(0, 2), 10);

        if (ff >= fps) {
            ss += Math.floor(ff / fps);
            ff = ff % fps;
        }
        if (ss >= 60) {
            mm += Math.floor(ss / 60);
            ss = ss % 60;
        }
        if (mm >= 60) {
            hh += Math.floor(mm / 60);
            mm = mm % 60;
        }

        function pad(n) { return (n < 10 ? "0" : "") + n; }
        var cleanSMPTE = pad(hh) + ":" + pad(mm) + ":" + pad(ss) + ":" + pad(ff);
        timeInput.text = String(cleanSMPTE);
    };

    var btnMinus = inputGroup.add("button", undefined, "−");
    btnMinus.preferredSize = [timeInput.preferredSize.height, timeInput.preferredSize.height];
    btnMinus.helpTip = "Decrease the offset time by 1 frame (Shift for 10 frames)";
    var btnPlus = inputGroup.add("button", undefined, "+");
    btnPlus.preferredSize = [timeInput.preferredSize.height, timeInput.preferredSize.height];
    btnPlus.helpTip = "Increase the offset time by 1 frame (Shift for 10 frames)";

    var reverseCheckbox = win.add("checkbox", undefined, "Reverse Layer Order");

    // Action Buttons
    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignChildren = ["fill", "center"];

    var btnApply = buttonGroup.add("button", undefined, "Offset Layers");
    btnApply.preferredSize.width = 85;
    btnApply.helpTip = "Apply the current offset value to the selected layers";
    var btnReset = buttonGroup.add("button", undefined, "Reset to Home");
    btnReset.preferredSize.width = 85;
    btnReset.helpTip = "Reset selected layers to start at time zero";

    // Incremental Arrows
    var arrowPanel = win.add("panel", undefined, "Quick Offset");
    arrowPanel.orientation = "row";
    arrowPanel.alignChildren = ["fill", "center"];

    var btnBack = arrowPanel.add("button", undefined, "←");
    btnBack.preferredSize.width = 20;
    btnBack.helpTip = "Offset selected layers backward by 1 frame (Shift for 10 frames)";
    var btnFwd = arrowPanel.add("button", undefined, "→");
    btnFwd.preferredSize.width = 20;
    btnFwd.helpTip = "Offset selected layers forward by 1 frame (Shift for 10 frames)";

    function parseSMPTE(str, fps) {
        var parts = str.split(":");
        var hh = parseInt(parts[0], 10) || 0;
        var mm = parseInt(parts[1], 10) || 0;
        var ss = parseInt(parts[2], 10) || 0;
        var ff = parseInt(parts[3], 10) || 0;
        return ((hh * 3600 + mm * 60 + ss) * fps + ff);
    }

    function formatSMPTE(frameCount, fps) {
        var tf = Math.round(frameCount); // already in frames
        var hh = Math.floor(tf / (3600 * fps));
        var mm = Math.floor((tf % (3600 * fps)) / (60 * fps));
        var ss = Math.floor((tf % (60 * fps)) / fps);
        var ff = tf % fps;
        function pad(n) { return (n < 10 ? "0" : "") + n; }
        return pad(hh)+":"+pad(mm)+":"+pad(ss)+":"+pad(ff);
    }

    function offsetLayers(offsetTime, reverse) {
        app.beginUndoGroup("Offset Layers");
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;

        var fps = comp.frameRate;
        var layers = comp.selectedLayers;
        if (layers.length < 2) return;

        var sorted = layers.slice().sort(function (a, b) { return a.index - b.index; });
        if (reverse) sorted.reverse();

        var anchor = sorted[0].inPoint;
        for (var i = 0; i < sorted.length; i++) {
            var newStart = anchor + (offsetTime * i);
            sorted[i].startTime = newStart - (sorted[i].inPoint - sorted[i].startTime);
        }
        app.endUndoGroup();
    }

    function resetLayers() {
        app.beginUndoGroup("Reset Layers");
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;
        var layers = comp.selectedLayers;
        for (var i = 0; i < layers.length; i++) {
            layers[i].startTime = 0 - (layers[i].inPoint - layers[i].startTime);
        }
        app.endUndoGroup();
    }

    function shiftLayers(direction) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;
        var fps = comp.frameRate;
        var delta = (ScriptUI.environment.keyboardState.shiftKey ? 10 : 1) * direction / fps;
        var layers = comp.selectedLayers;
        if (layers.length === 0) return;

        var sorted = layers.slice().sort(function (a, b) {
            return a.index - b.index;
        });

        if (reverseCheckbox.value) sorted.reverse();

        for (var i = 0; i < sorted.length; i++) {
            sorted[i].startTime += delta * i;
        }
    }

    btnApply.onClick = function () {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;
        var fps = comp.frameRate;
        var frameCount = parseSMPTE(timeInput.text, fps);
        offsetLayers(frameCount / fps, reverseCheckbox.value);
    };

    btnReset.onClick = function () {
        resetLayers();
    };

    btnBack.onClick = function () { shiftLayers(-1); };
    btnFwd.onClick = function () { shiftLayers(1); };

    btnMinus.onClick = function () {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;
        var fps = comp.frameRate;
        var delta = ScriptUI.environment.keyboardState.shiftKey ? 10 : 1;
        var frameCount = parseSMPTE(timeInput.text, fps);
        frameCount = Math.max(0, frameCount - delta);
        var cleanSMPTE = String(formatSMPTE(frameCount, fps));
        timeInput.text = cleanSMPTE;
        timeInput.onChange();
    };

    btnPlus.onClick = function () {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) return;
        var fps = comp.frameRate;
        var delta = ScriptUI.environment.keyboardState.shiftKey ? 10 : 1;
        var frameCount = parseSMPTE(timeInput.text, fps);
        frameCount = Math.max(0, frameCount + delta);
        timeInput.text = formatSMPTE(frameCount, fps);
        timeInput.onChange();
    };

    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }

    return win;
}

offsetLayersPanel(this);
