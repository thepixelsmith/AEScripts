// #target aftereffects

// Lord of the Eases
// Author: Jerron Smith
// Version: 1.5.0
// Created: 2025-05-13

(function lordOfTheEases(thisObj) {
    var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Lord of the Eases", undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 10;

    var easingTypes = ["Quad", "Cubic", "Quart", "Quint", "Sine", "Expo", "Circ", "Back", "Elastic", "Bounce"];
    var easingModes = ["Ease In", "Ease Out", "Ease In & Out"];

    var group1 = win.add("group");
    group1.add("statictext", undefined, "Easing:");
    var easingDropdown = group1.add("dropdownlist", undefined, easingTypes);
    easingDropdown.selection = 0;

    var group2 = win.add("group");
    group2.add("statictext", undefined, "Mode:");
    var modeDropdown = group2.add("dropdownlist", undefined, easingModes);
    modeDropdown.selection = 0;

    var buttonGroup = win.add("group");
    buttonGroup.alignment = "left";
    var applyBtn = buttonGroup.add("button", undefined, "Apply");
    var removeBtn = buttonGroup.add("button", undefined, "Remove");

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
    var infoText = chartPanel.add("statictext", undefined, chartDescriptions[easingDropdown.selection.text], { multiline: true });

    easingDropdown.onChange = function() {
        infoText.text = chartDescriptions[easingDropdown.selection.text];
    };

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
            if (mode === "Ease In") easing.push("output = c * tNorm * tNorm + b;");
            else if (mode === "Ease Out") easing.push("output = -c * tNorm * (tNorm - 2) + b;");
            else easing.push("if (tNorm < 0.5) { output = 2 * c * tNorm * tNorm + b; } else { var tn = 2 * tNorm - 1; output = -c / 2 * (tn * (tn - 2) - 1) + b; }");
        } else if (type === "Cubic") {
            if (mode === "Ease In") easing.push("output = c * Math.pow(tNorm, 3) + b;");
            else if (mode === "Ease Out") easing.push("var tn = tNorm - 1; output = c * (Math.pow(tn, 3) + 1) + b;");
            else easing.push("if (tNorm < 0.5) { output = c / 2 * Math.pow(2 * tNorm, 3) + b; } else { output = c / 2 * (Math.pow(2 * tNorm - 2, 3) + 2) + b; }");
        }

        easing.push("  output;");
        easing.push("}");
        return exprHeader + base.concat(easing).join("\n");
    }

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
            prop.expression = getPennerExpression(type, mode);
        }
        app.endUndoGroup();
    }

    function removeExpressions() {
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) return;
        var selectedProps = comp.selectedProperties;
        for (var i = 0; i < selectedProps.length; i++) {
            if (selectedProps[i].canSetExpression) selectedProps[i].expression = "";
        }
    }

    applyBtn.onClick = applyExpression;
    removeBtn.onClick = removeExpressions;

    if (win instanceof Window) win.center(), win.show();
    else win.layout.layout(true);
})(this);
