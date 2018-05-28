//------------------------------------------------------------------------------
function bin(raw) {
	raw = atob(raw.substr(raw.indexOf(';base64,') + 8));
	let i = raw.length;
	const b = new ArrayBuffer(i);
	const a = new Uint8Array(b);

	while (i !== 0) {
		i--;
		a[i] = raw.charCodeAt(i);
	}

	return b;
}
//------------------------------------------------------------------------------
const wasmBinary = bin('@@import ./build/webpjs.wasm');
const webpRaw = [
	bin('@@import test1.webp'),
	bin('@@import test2.webp'),
	bin('@@import test3.webp'),
	bin('@@import test4.webp'),
	bin('@@import test5.webp'),
	bin('@@import test6.webp')
];
//------------------------------------------------------------------------------
