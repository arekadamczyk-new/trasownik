# Składa index.html z interfejsu (ui.html) i rdzenia (core.js): python3 src/build.py
import pathlib
d = pathlib.Path(__file__).parent
ui = (d / 'ui.html').read_text(encoding='utf-8')
core = (d / 'core.js').read_text(encoding='utf-8')
(d.parent / 'index.html').write_text(ui.replace('/*CORE*/', core), encoding='utf-8')
