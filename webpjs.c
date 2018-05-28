#include <stdio.h>
#include <stdlib.h>
#include "emscripten.h"
#include "../libwebp/src/webp/decode.h"

EMSCRIPTEN_KEEPALIVE
extern int version() {
	return WebPGetDecoderVersion();
}

EMSCRIPTEN_KEEPALIVE
extern int * getInfo(const uint8_t * data, size_t size)
{
	int * results = (int *) malloc(3 * sizeof(int));

	int width;
	int height;

	// (const uint8_t* data, size_t size, int* w, int* h) -> int;
	results[0] = WebPGetInfo(data, size, &width, &height);
	results[1] = width;
	results[2] = height;

	return results;
}

EMSCRIPTEN_KEEPALIVE
extern uint8_t * decode(const uint8_t * data, size_t size)
{
	int width;
	int height;

	return WebPDecodeRGBA(data, size, &width, &height);
}

EMSCRIPTEN_KEEPALIVE
extern uint8_t * svpng(uint32_t w, uint32_t h, const uint8_t * img, int alpha)
{
#define SVPNG_PUT(u) *result++ = ((uint8_t) (u))

    static const unsigned t[] = {
		0, 0x1db71064, 0x3b6e20c8, 0x26d930ac, 0x76dc4190, 0x6b6b51f4, 0x4db26158, 0x5005713c, 
		// CRC32 Table
		0xedb88320, 0xf00f9344, 0xd6d6a3e8, 0xcb61b38c, 0x9b64c2b0, 0x86d3d2d4, 0xa00ae278, 0xbdbdf21c
	};

    uint32_t a = 1, b = 0, c, p = w * (alpha ? 4 : 3) + 1, x, y, i;   // ADLER-a, ADLER-b, CRC, pitch

#define SVPNG_U8A(ua, l) for (i = 0; i < l; i++) SVPNG_PUT((ua)[i]);
#define SVPNG_U32(u) do { SVPNG_PUT((u) >> 24); SVPNG_PUT(((u) >> 16) & 255); SVPNG_PUT(((u) >> 8) & 255); SVPNG_PUT((u) & 255); } while(0)
#define SVPNG_U8C(u) do { SVPNG_PUT(u); c ^= (u); c = (c >> 4) ^ t[c & 15]; c = (c >> 4) ^ t[c & 15]; } while(0)
#define SVPNG_U8AC(ua, l) for (i = 0; i < l; i++) SVPNG_U8C((ua)[i])
#define SVPNG_U16LC(u) do { SVPNG_U8C((u) & 255); SVPNG_U8C(((u) >> 8) & 255); } while(0)
#define SVPNG_U32C(u) do { SVPNG_U8C((u) >> 24); SVPNG_U8C(((u) >> 16) & 255); SVPNG_U8C(((u) >> 8) & 255); SVPNG_U8C((u) & 255); } while(0)
#define SVPNG_U8ADLER(u) do { SVPNG_U8C(u); a = (a + (u)) % 65521; b = (b + a) % 65521; } while(0)
#define SVPNG_BEGIN(s, l) do { SVPNG_U32(l); c = ~0U; SVPNG_U8AC(s, 4); } while(0)
#define SVPNG_END() SVPNG_U32(~c)

	uint32_t byte_length = 0
		+ 8 							// Magic
		+ 8								// IHDR
		+ 8 + 2 + 3						// chunk
		+ 4								// IHDR end
		+ 8								// IDAT
		+ 2								// Deflate block begin
		+ h * (1 + 4 + 1 + (p - 1))		// Image pixel data
		+ 4								// Deflate block end with adler
		+ 4								// IDAT end
		+ 8 + 4							// IEND
	;

	uint8_t * result = (uint8_t *) malloc(byte_length + sizeof(uint32_t));

	if (result == NULL)
		return NULL;

	*(uint32_t *) result = byte_length;
	result += sizeof(uint32_t);

    SVPNG_U8A("\x89PNG\r\n\32\n", 8);           /* Magic */
    SVPNG_BEGIN("IHDR", 13);                    /* IHDR chunk { */
    SVPNG_U32C(w); SVPNG_U32C(h);               /*   Width & Height (8 bytes) */
    SVPNG_U8C(8); SVPNG_U8C(alpha ? 6 : 2);     /*   Depth=8, Color=True color with/without alpha (2 bytes) */
    SVPNG_U8AC("\0\0\0", 3);                    /*   Compression=Deflate, Filter=No, Interlace=No (3 bytes) */
    SVPNG_END();                                /* } */
    SVPNG_BEGIN("IDAT", 2 + h * (5 + p) + 4);   /* IDAT chunk { */
    SVPNG_U8AC("\x78\1", 2);                    /*   Deflate block begin (2 bytes) */

    for (y = 0; y < h; y++) {                   /*   Each horizontal line makes a block for simplicity */
        SVPNG_U8C(y == h - 1);                  /*   1 for the last block, 0 for others (1 byte) */
        SVPNG_U16LC(p); SVPNG_U16LC(~p);        /*   Size of block in little endian and its 1's complement (4 bytes) */
        SVPNG_U8ADLER(0);                       /*   No filter prefix (1 byte) */

        for (x = 0; x < p - 1; x++, img++)
            SVPNG_U8ADLER(*img);                /*   Image pixel data */
    }

    SVPNG_U32C((b << 16) | a);                  /*   Deflate block end with adler (4 bytes) */
    SVPNG_END();                                /* } */
    SVPNG_BEGIN("IEND", 0); SVPNG_END();        /* IEND chunk {} */

	return result - (byte_length + sizeof(uint32_t));
}

EMSCRIPTEN_KEEPALIVE
extern uint8_t * webp2png(const uint8_t * webp, size_t size)
{
	int width;
	int height;

	uint8_t * rgba = WebPDecodeRGBA(webp, size, &width, &height);

	if (rgba == NULL)
		return NULL;

	uint8_t * png = svpng(width, height, rgba, 1);

	free(rgba);

	return png;
}
