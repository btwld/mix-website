"""Screenshot the built landing page at given shore times.

    uv run --offline --no-project --with playwright==1.63.0 python -I tool/shots.py OUT_DIR 0.8 2.6 ...
    uv run ... tool/shots.py OUT_DIR 0:10:0.25      # every 0.25 s from 0 up to 10

Serves build/web, opens it once with `?t=` (which holds the shore still), steps the time with `window.shoreSet`
and saves OUT_DIR/shore-<time>.png. SHOT_SIZE=1200x800 and SHOT_SCALE=2 change the window and its pixel density.
SHOT_GPU=1 draws on the graphics card instead of in software: much faster, for dense sequences.

    uv run ... tool/shots.py OUT_DIR slides          # one picture of each slide, as OUT_DIR/slide-<n>.png
    uv run ... tool/shots.py OUT_DIR slides 4 7      # only slides 4 and 7
"""
import asyncio, functools, http.server, os, sys, threading
from pathlib import Path

from playwright.async_api import async_playwright

APP = Path(__file__).resolve().parent.parent
W, H = (int(v) for v in os.environ.get('SHOT_SIZE', '1440x900').split('x'))
SCALE = float(os.environ.get('SHOT_SCALE', '1'))
GPU = os.environ.get('SHOT_GPU') == '1'
SLIDES = 8
CACHED = Path.home() / 'Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell'


def serve(directory):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    # A long queue, so the burst of a cold start is not reset (see serve.py).
    http.server.ThreadingHTTPServer.request_queue_size = 256
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=directory))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def times(args):
    for arg in args:
        if ':' in arg:
            start, stop, step = (float(v) for v in arg.split(':'))
            for k in range(round((stop - start) / step)):
                yield round(start + k * step, 4)
        else:
            yield float(arg)


async def main(out, wanted):
    out.mkdir(parents=True, exist_ok=True)
    server = serve(str(APP / 'build/web'))
    async with async_playwright() as p:
        drawing = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] if GPU else ['--enable-unsafe-swiftshader']
        options = {'args': drawing + ['--in-process-gpu', f'--window-size={W},{H}']}
        if CACHED.exists():
            options['executable_path'] = str(CACHED)
        browser = await p.chromium.launch(**options)
        page = await browser.new_page(viewport={'width': W, 'height': H}, device_scale_factor=SCALE)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        base = f'http://127.0.0.1:{server.server_address[1]}/'
        # A first load to warm the browser's cache: this small server can drop a
        # request in the burst of a cold start, which leaves a font missing.
        await page.goto(f'{base}?t=0')
        await page.wait_for_selector('flutter-view', timeout=60000)
        await asyncio.sleep(2)
        errors.clear()
        if isinstance(wanted, tuple):
            for n in wanted:
                await page.goto(f'{base}?t=2.2&slide={n}')
                await page.wait_for_selector('flutter-view', timeout=60000)
                await asyncio.sleep(2.5 if GPU else 5)
                path = out / f'slide-{n}.png'
                await page.screenshot(path=str(path))
                print(path)
            wanted = []
        if wanted:
            await page.goto(f'{base}?t=0')
            await page.wait_for_selector('flutter-view', timeout=60000)
            await page.wait_for_function('typeof window.shoreSet === "function"', timeout=60000)
            await asyncio.sleep(2.5)
        for t in wanted:
            # Set the time, then let two frames pass so the new one is on screen.
            await page.evaluate('''t => new Promise(done => {
              window.shoreSet(t);
              requestAnimationFrame(() => requestAnimationFrame(() => done()));
            })''', t)
            await asyncio.sleep(0.12 if GPU else 1.2)
            path = out / f'shore-{t:06.3f}.png'
            await page.screenshot(path=str(path))
            print(path)
        await browser.close()
    if errors:
        print('page errors:', *errors[:5], sep='\n  ')


if __name__ == '__main__':
    slides = sys.argv[2:3] == ['slides']
    wanted = tuple(int(n) for n in sys.argv[3:]) or tuple(range(SLIDES)) if slides else list(times(sys.argv[2:]))
    asyncio.run(main(Path(sys.argv[1]), wanted))
