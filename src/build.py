# Składa index.html z interfejsu (ui.html) i rdzenia (core.js): python3 src/build.py
import pathlib
d = pathlib.Path(__file__).parent
ui = (d / 'ui.html').read_text(encoding='utf-8')
core = (d / 'shapes.js').read_text(encoding='utf-8') + '\n' + (d / 'core.js').read_text(encoding='utf-8')
(d.parent / 'index.html').write_text(ui.replace('/*CORE*/', core), encoding='utf-8')
# do testów w Node: jeden plik z kształtami i rdzeniem
(d / 'bundle.test.js').write_text(core + "\nmodule.exports = { SHAPES, PROFILES, FUN_WORDS, makeProj, textShape, prepShape, buildContext, searchShape, routePlacement, planRoute, resample, polyLen };\n", encoding='utf-8')
