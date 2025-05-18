// Curvaceous - all keyframes
// 2.0.1 : outCirc
// Created: 2025-05-13


function outCirc(t, b, c, d) {
	return c * Math.sqrt(1 - (t=t/d-1)*t) + b;

}

function curvaceous() {
	var n = 0;
	if (numKeys > 0) {
		n = nearestKey(time).index;
		if (key(n).time > time)	{ n-- }
	}

	// after the first two keys, yet before the last two, just do nothing
	if (n > 1 && n < numKeys -1 ) {
		return null;
	}

	try {
		var key1 = key(n);
		var key2 = key(n+1);
	} catch(e) {
		return null;
	}
	
	t = time - key1.time;
	d = key2.time - key1.time;

	sX = key1.time;
	eX = key2.time - key1.time;


	if ((time < key1.time) || (time > key2.time)) {
		return null;
	} else {
		return valueAtTime(outCirc(t, sX, eX, d));
	}
}

(curvaceous() || value);

