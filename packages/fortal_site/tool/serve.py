"""Serve the built site for a local look: `python3 tool/serve.py [port]`.

Python's stock `http.server` queues only five waiting connections, so the burst of requests a Flutter page makes
on a cold start can be reset, and a dropped font request leaves icons as empty boxes. This serves the same files
with a queue long enough for that burst.

It also sends what a WebAssembly build (`flutter build web --wasm`) needs: `application/wasm` for `.wasm`, so the
browser compiles while downloading, and the cross-origin isolation headers, so the skwasm renderer can draw on a
separate thread. Without them a wasm build still runs, single-threaded.
"""
import functools, http.server, sys
from pathlib import Path


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 256


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.wasm': 'application/wasm',
        '.mjs': 'text/javascript',
        '.js': 'text/javascript',
    }

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    web = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / 'build/web'
    handler = functools.partial(Handler, directory=str(web))
    print(f'http://127.0.0.1:{port}/')
    Server(('127.0.0.1', port), handler).serve_forever()
