#target aftereffects

// Lord of the Eases
// Author: Jerron Smith
// Version: 1.5.0
// Created: 2025-05-13

// ===============================
// Version History
// -------------------------------
// v1.0.0 (2025-05-13): Initial internal function integration, removed external file dependencies
// v1.1.0 (2025-05-14): Embedded Penner-style easing equations, added inline expression builder and full easing options

// ===============================
// Features
// -------------------------------
// - All Penner easing types: Linear, Quad, Cubic, Quart, Quint, Sine, Expo, Circ, Back, Elastic, Bounce
// - Modes: Ease In, Ease Out, Ease In & Out
// - Apply to: All keyframes, First only, Last only, First and Last only
// - Fully inline expression builder (no external files)
// - Replaces expressions only on properties with selected keyframes

(function betterEasingPanel(thisObj) {
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Lord of the Eases", undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;

    // Dropdown options
    var easingTypes = ["Quad", "Cubic", "Quart", "Quint", "Sine", "Expo", "Circ", "Back", "Elastic", "Bounce"];
    var easingModes = ["Ease In", "Ease Out", "Ease In & Out"];
    // Easing type dropdown
    var group1 = win.add("group");
    group1.add("statictext", undefined, "Easing:");
    var easingDropdown = group1.add("dropdownlist", undefined, easingTypes);
    easingDropdown.selection = 0;

    // Easing mode dropdown
    var group2 = win.add("group");
    group2.add("statictext", undefined, "Mode:");
    var modeDropdown = group2.add("dropdownlist", undefined, easingModes);
    modeDropdown.selection = 0;

    // Parameter controls for Elastic and Back
    
    backOvershootInput.characters = 5;

    // Button group
    var buttonGroup = win.add("group");
    buttonGroup.alignment = "left";
    var applyBtn = buttonGroup.add("button", undefined, "Apply");
    var removeBtn = buttonGroup.add("button", undefined, "Remove");

    // Expression Library
    function getPennerExpression(type, mode) {
    var exprHeader = "// Lord of the Eases : " + mode + " " + type + " : Generated\n" + "// Created: 2025-05-13\n";

    var base = [
        "n = 0;",
        "if (numKeys > 0){",
        "  n = nearestKey(time).index;",
        "  if (key(n).time > time){ n--; }",
        "}",
        "if (n < 1 || n >= numKeys){",
        "  value;",
        "} else {",
        "  t = time - key(n).time;",
        "  d = key(n+1).time - key(n).time;",
        "  b = key(n).value;",
        "  c = key(n+1).value - b;",
        "  tNorm = t / d;",
        "  var output, s;"
    ];

    var easing = [];

    if (type === "Quad") {
    if (mode === "Ease In") {
            easing.push("output = c * tNorm * tNorm + b;");
        } else if (mode === "Ease Out") {
            easing.push("output = -c * tNorm * (tNorm - 2) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm < 0.5) { output = 2 * c * tNorm * tNorm + b; } else { var tn = 2 * tNorm - 1; output = -c / 2 * (tn * (tn - 2) - 1) + b; }");
        }
    } else if (type === "Cubic") {
        if (mode === "Ease In") {
            easing.push("output = c * Math.pow(tNorm, 3) + b;");
        } else if (mode === "Ease Out") {
            easing.push("var tn = tNorm - 1; output = c * (Math.pow(tn, 3) + 1) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm < 0.5) { output = c / 2 * Math.pow(2 * tNorm, 3) + b; } else { output = c / 2 * (Math.pow(2 * tNorm - 2, 3) + 2) + b; }");
        }
    } else if (type === "Quart") {
        if (mode === "Ease In") {
            easing.push("output = c * Math.pow(tNorm, 4) + b;");
        } else if (mode === "Ease Out") {
            easing.push("var tn = tNorm - 1; output = -c * (Math.pow(tn, 4) - 1) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm < 0.5) { output = c / 2 * Math.pow(2 * tNorm, 4) + b; } else { output = -c / 2 * (Math.pow(2 * tNorm - 2, 4) - 2) + b; }");
        }
    } else if (type === "Quint") {
        if (mode === "Ease In") {
            easing.push("output = c * Math.pow(tNorm, 5) + b;");
        } else if (mode === "Ease Out") {
            easing.push("var tn = tNorm - 1; output = c * (Math.pow(tn, 5) + 1) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm < 0.5) { output = c / 2 * Math.pow(2 * tNorm, 5) + b; } else { output = c / 2 * (Math.pow(2 * tNorm - 2, 5) + 2) + b; }");
        }
    }
    else if (type === "Sine") {
        if (mode === "Ease In") {
            easing.push("output = -c * Math.cos(tNorm * (Math.PI / 2)) + c + b;");
        } else if (mode === "Ease Out") {
            easing.push("output = c * Math.sin(tNorm * (Math.PI / 2)) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("output = -c / 2 * (Math.cos(Math.PI * tNorm) - 1) + b;");
        }
    } else if (type === "Expo") {
        if (mode === "Ease In") {
            easing.push("output = c * Math.pow(2, 10 * (tNorm - 1)) + b;");
        } else if (mode === "Ease Out") {
            easing.push("output = c * (-Math.pow(2, -10 * tNorm) + 1) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm < 0.5) { output = c / 2 * Math.pow(2, 10 * (2 * tNorm - 1)) + b; } else { output = c / 2 * (-Math.pow(2, -10 * (2 * tNorm - 1)) + 2) + b; }");
        }
    } else if (type === "Circ") {
        if (mode === "Ease In") {
            easing.push("output = -c * (Math.sqrt(1 - tNorm * tNorm) - 1) + b;");
        } else if (mode === "Ease Out") {
            easing.push("var tn = tNorm - 1; output = c * Math.sqrt(1 - tn * tn) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm < 0.5) { output = -c / 2 * (Math.sqrt(1 - 4 * tNorm * tNorm) - 1) + b; } else { var tn = 2 * tNorm - 2; output = c / 2 * (Math.sqrt(1 - tn * tn) + 1) + b; }");
        }
    } else if (type === "Back") {
        easing.push("s = 1.70158;");
        if (mode === "Ease In") {
            easing.push("output = c * tNorm * tNorm * ((s + 1) * tNorm - s) + b;");
        } else if (mode === "Ease Out") {
            easing.push("var tn = tNorm - 1; output = c * (tn * tn * ((s + 1) * tn + s) + 1) + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("s *= 1.525; if (tNorm < 0.5) { output = c / 2 * (Math.pow(2 * tNorm, 2) * ((s + 1) * 2 * tNorm - s)) + b; } else { var tn = 2 * tNorm - 2; output = c / 2 * (tn * tn * ((s + 1) * tn + s) + 2) + b; }");
        }
        }
    } else if (type === "Elastic") {
        easing.push("var p = 0.3; var a = c; var s = p / 4;");
        if (mode === "Ease In") {
            easing.push("if (tNorm === 0) output = b; else if (tNorm === 1) output = b + c; else output = -(a * Math.pow(2, 10 * (tNorm - 1)) * Math.sin((tNorm - 1 - s) * (2 * Math.PI) / p)) + b;");
        } else if (mode === "Ease Out") {
            easing.push("if (tNorm === 0) output = b; else if (tNorm === 1) output = b + c; else output = a * Math.pow(2, -10 * tNorm) * Math.sin((tNorm - s) * (2 * Math.PI) / p) + c + b;");
        } else if (mode === "Ease In & Out") {
            easing.push("if (tNorm === 0) output = b; else if (tNorm === 1) output = b + c; else if ((tNorm *= 2) < 1) output = -0.5 * (a * Math.pow(2, 10 * (tNorm - 1)) * Math.sin((tNorm - 1.1) * (2 * Math.PI) / p)) + b; else output = a * Math.pow(2, -10 * (tNorm - 1)) * Math.sin((tNorm - 1.1) * (2 * Math.PI) / p) * 0.5 + c + b;");
        }
    } else if (type === "Bounce") {
    easing.push("var bounce = 0;");
    if (mode === "Ease In") {
        easing.push("t = 1 - tNorm;");
    } else if (mode === "Ease Out") {
        easing.push("t = tNorm;");
    } else {
        easing.push("t = tNorm < 0.5 ? 1 - (tNorm * 2) : (tNorm * 2 - 1);");
    }

    easing.push("if (t < (1/2.75)) { bounce = 7.5625*t*t; }");
    easing.push("else if (t < (2/2.75)) { t -= (1.5/2.75); bounce = 7.5625*t*t + 0.75; }");
    easing.push("else if (t < (2.5/2.75)) { t -= (2.25/2.75); bounce = 7.5625*t*t + 0.9375; }");
    easing.push("else { t -= (2.625/2.75); bounce = 7.5625*t*t + 0.984375; }");

    if (mode === "Ease In") {
        easing.push("output = c - (bounce * c) + b;");
    } else if (mode === "Ease Out") {
        easing.push("output = bounce * c + b;");
    } else {
        easing.push("output = tNorm < 0.5 ? (c - (bounce * c)) * 0.5 + b : bounce * c * 0.5 + c * 0.5 + b;");
    }
}


    easing.push("  output;");
    easing.push("}");

    return exprHeader + base.concat(easing).join("\n");
}

    // Apply logic
    function applyExpression() {
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            alert("Please select a composition and keyframed properties.");
            return;
        }

        var selectedProps = comp.selectedProperties;
        if (selectedProps.length === 0) {
            alert("No properties selected.");
            return;
        }

        var type = easingDropdown.selection.text;
        var mode = modeDropdown.selection.text;
        
        app.beginUndoGroup("Apply Lord of the Eases");
        for (var i = 0; i < selectedProps.length; i++) {
            var prop = selectedProps[i];
            if (!prop.canSetExpression || prop.numKeys < 2) continue;

            // Temporarily: always apply to entire property
            prop.expression = getPennerExpression(type, mode);
        }
        app.endUndoGroup();
    }

    // Remove expression from selected properties
    function removeExpressions() {
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) return;
        var selectedProps = comp.selectedProperties;
        for (var i = 0; i < selectedProps.length; i++) {
            if (selectedProps[i].canSetExpression) selectedProps[i].expression = "";
        }
    }

    // Button Events
    applyBtn.onClick = applyExpression;
    removeBtn.onClick = removeExpressions;

    // Easing chart panel
    var chartDescriptions = {
        "Quad": "Ease that starts slowly and accelerates — good for natural motion.",
        "Cubic": "Ease with a strong acceleration curve — pronounced start or end.",
        "Quart": "Very sharp acceleration or deceleration — dramatic effect.",
        "Quint": "Extreme easing with rapid changes — ideal for stylized motion.",
        "Sine": "Smooth and subtle easing — follows a sinusoidal wave.",
        "Expo": "Slow to start or stop but quickly accelerates or decelerates — explosive feel.",
        "Circ": "Easing that mimics circular motion — soft start and end.",
        "Back": "Goes slightly past the target value before settling — adds elasticity.",
        "Elastic": "Highly elastic motion with spring-like bounces — exaggerated style.",
        "Bounce": "Simulates bouncing on impact — multiple decaying rebounds."
    };

    var chartPanel = win.add("panel", undefined, "Easing Guide");
    chartPanel.alignChildren = "left";
    chartPanel.preferredSize = [300, 60];
    var infoText = chartPanel.add("statictext", undefined, chartDescriptions[easingDropdown.selection.text], {multiline: true});

    easingDropdown.onChange = function() {
        infoText.text = chartDescriptions[easingDropdown.selection.text];
    };

    if (win instanceof Window) win.center(), win.show();
    else win.layout.layout(true);
})(this);
