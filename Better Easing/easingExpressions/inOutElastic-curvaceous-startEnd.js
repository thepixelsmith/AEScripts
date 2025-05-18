// Curvaceous - start to end
// 2.0.1 : inOutElastic
// Created: 2025-05-13


function inOutElastic(t, b, c, d) {
	if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
	if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
	else var s = p/(2*Math.PI) * Math.asin (c/a);
	if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;

}

function curvaceous() {
	
	try {
		var key1 = key(1);
		var key2 = key(numKeys);
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
		return valueAtTime(inOutElastic(t, sX, eX, d));
	}
}

(curvaceous() || value);

