import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Small original vector drawings. Each head overlaps a complete torso, while
// the chin line keeps the head legible; no disconnected neck or blob perimeter.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Match assets/logo.svg exactly: dark outline/ears, golden fur, cream muzzle.
const C = { ink: '#34312d', fur: '#e9b750', light: '#fffaf0', mask: '#fffaf0', ear: '#34312d', tongue: '#fffaf0', white: '#fffaf0' };
const path = (d, fill = 'none', width = 4.6) => `<path d="${d}" fill="${fill}" stroke-width="${width}"/>`;
const ellipse = (cx, cy, rx, ry, fill, width = 4.2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke-width="${width}"/>`;
const fur = d => path(d, C.fur);
const line = d => path(d, 'none', 3.5);

function head(x, y, scale = 1, tilt = 0, expression = 'happy') {
  const closed = expression === 'sleep';
  const eyes = closed
    ? line('M-50 0Q-37 13-23 0M25 0Q38 13 51 0')
    : `${ellipse(-37, 0, 15.5, 18.5, C.white)}${ellipse(39, -1, 15.5, 18.5, C.white)}${ellipse(-35, 2, 10, 13, C.ink, 0)}${ellipse(41, 1, 10, 13, C.ink, 0)}`;
  const tongue = expression === 'happy' || expression === 'wave'
    ? `${path('M-2 46L15 45L14 57Q12 69 4 66Q-3 64-2 46Z', C.tongue, 3.5)}${line('M7 48L7 57')}` : '';
  return `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})">
    ${fur('M-62-61C-38-77 41-79 68-62C90-48 96-13 87 18C79 52 50 74 8 75C-33 77-71 62-84 34C-98 4-88-43-62-61Z')}
    ${path('M-61-61C-82-65-105-45-104-23C-104-9-98 12-88 13C-76 11-65-16-60-38Q-55-54-61-61Z', C.ear)}
    ${path('M68-62C90-61 108-42 106-17C106-3 101 12 92 14C80 7 74-16 69-36Q64-53 68-62Z', C.ear)}
    ${line('M-12-34Q0-40 12-34')}
    ${eyes}${tongue}
    ${path('M-3 18C-15 14-28 26-28 40C-28 54-13 60-4 52Q3 45 2 30Z', C.mask, 4)}
    ${path('M4 18C17 15 29 28 28 42C26 56 12 59 4 50Q-1 41 1 29Z', C.mask, 4)}
    ${path('M-10 15Q1 9 12 15Q12 21 2 27Q-8 23-10 15Z', C.ink, 3.6)}
    ${expression === 'curious' ? line('M-11 59Q0 55 12 59') : ''}
  </g>`;
}

function tail(x, y, turn = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${turn})">${path('M15 14C-8 19-22 6-20-10C-19-25-3-28 5-18C11-8 1 1-5-5C-10-10-6-15-2-14', C.fur, 5)}</g>`;
}

function sitting({ tilt = 0, eye = 'happy', paw = '', look = 0 } = {}) {
  return `${tail(76, 215)}
    ${fur('M104 121C81 137 67 164 67 197C67 225 88 239 119 241L220 241C244 226 250 209 243 183C239 157 221 135 205 125Z')}
    ${path('M150 179Q178 187 207 176L218 224Q181 237 144 224Z', C.light, 0)}
    ${fur('M91 216Q107 207 123 224L132 237Q131 244 119 242L96 238Q86 233 91 216Z')}
    ${fur('M153 214L153 240Q153 248 160 248Q168 248 168 240L169 219')}
    ${paw ? '' : fur('M216 214L217 238Q217 245 225 244Q232 243 230 236L227 218')}
    ${head(169 + look, 112 - Math.abs(look) * .3, .94, tilt, eye)}
    ${paw}`;
}

const poses = [
  {
    name: 'walking-right',
    drawing: `${tail(75, 157, 8)}${fur('M86 142C112 128 167 133 204 152C226 161 237 182 226 201L226 215Q232 225 225 228L218 227L207 209Q161 220 127 206L116 221Q113 230 104 228L99 225L108 207C76 205 62 192 64 171Q64 152 86 142Z')}${fur('M129 199L139 216Q145 224 153 220L155 215L143 198')}${head(213, 107, .82, -7)}`
  },
  { name: 'sitting-attentively', drawing: sitting() },
  {
    name: 'running-right',
    drawing: `${tail(68, 135, -12)}${fur('M80 134C107 126 164 132 206 150Q237 167 224 193L239 203Q246 209 240 214Q235 218 229 212L207 199Q163 212 129 200L108 217Q100 224 94 218Q88 215 98 210L111 196Q63 187 62 166Q60 144 80 134Z')}${fur('M135 198L151 209Q160 214 157 220Q154 225 146 220L126 210')}${head(217, 105, .8, 7)}${line('M36 175L49 175M29 192L43 192')}`
  },
  { name: 'waving-hello', drawing: sitting({ eye: 'wave', paw: `${fur('M229 181Q243 176 246 159L248 151Q251 142 257 146Q262 150 259 158L257 172Q252 189 237 195')}${line('M272 141L278 135M274 157L282 155')}` }) },
  { name: 'looking-up', drawing: sitting({ tilt: -10, eye: 'curious', look: 6 }) },
  {
    name: 'small-hop',
    drawing: `${tail(80, 172, 12)}${fur('M114 107Q76 123 71 156Q70 185 103 202L108 214Q111 224 120 220L126 204Q167 217 203 202L214 213Q220 220 227 214L218 195Q247 167 235 141Q224 119 203 113Z')}${path('M136 164Q171 173 205 160L207 192Q178 209 143 197Z', C.light, 0)}${head(171, 95, .92, 0)}${line('M118 238L114 248M176 239L176 251M229 234L235 244')}`
  },
  {
    name: 'play-bow',
    drawing: `${tail(86, 110, -30)}${fur('M79 111Q103 100 125 120L163 155Q197 166 225 193L239 215Q243 222 232 224L190 222Q161 218 136 199L110 161L92 198Q87 207 79 204Q72 201 77 193L79 155Q66 125 79 111Z')}${fur('M185 212L172 220Q168 227 179 230L201 229Q212 226 210 220')}${head(221, 164, .74, 14)}`
  },
  { name: 'head-tilt-listening', drawing: sitting({ tilt: 12, eye: 'curious' }) },
  {
    name: 'lying-down',
    drawing: `${tail(67, 203, 3)}${fur('M74 182Q97 161 132 176L184 193L229 216Q241 234 221 239L90 240Q62 236 59 217Q55 197 74 182Z')}${fur('M77 228Q90 220 113 227L125 234Q128 241 114 242L87 241Q74 238 77 228Z')}${fur('M190 229Q218 222 243 229Q255 231 254 238Q252 243 241 242L198 242Q187 239 190 229Z')}${head(208, 166, .75, -3, 'sleep')}`
  },
  { name: 'thinking-paw-to-cheek', drawing: sitting({ eye: 'curious', paw: fur('M224 209Q235 201 227 188L218 177Q212 171 208 177Q206 181 215 190L219 203') }) },
  {
    name: 'side-sitting',
    drawing: `${tail(77, 214, 10)}${fur('M112 120Q78 146 75 181Q70 211 91 232Q117 247 149 242L229 239Q244 221 235 194L216 144Z')}${fur('M93 217Q110 207 126 218L145 235Q150 242 140 244L104 239Q90 236 93 217Z')}${fur('M210 213L211 237Q211 245 218 244Q225 243 223 236L221 218')}${head(185, 114, .93, 5, 'curious')}`
  },
  { name: 'waving-goodbye', drawing: `<g transform="translate(320 0) scale(-1 1)">${sitting({ tilt: -7, eye: 'wave', paw: `${fur('M229 181Q243 176 246 159L248 151Q251 142 257 146Q262 150 259 158L257 172Q252 189 237 195')}${line('M272 141L278 135M274 157L282 155')}` })}</g>` }
];

function svg(pose) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 280" width="320" height="280" role="img" aria-labelledby="title"><title id="title">WelleW pug — ${pose.name}</title><g stroke="${C.ink}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">${pose.drawing}</g></svg>\n`.replace(/[ \t]+$/gm, "");
}

if (process.argv.includes('--preview')) {
  await mkdir(resolve(root, 'reference'), { recursive: true });
  await writeFile(resolve(root, 'reference/pug-master-v3.svg'), svg(poses[1]));
  console.log('Canonical sitting pug saved for review.');
} else {
  await mkdir(resolve(root, 'assets/pug'), { recursive: true });
  for (const [index, pose] of poses.entries()) await writeFile(resolve(root, `assets/pug/pose-${String(index + 1).padStart(2, '0')}.svg`), svg(pose));
  console.log('12 simplified pug poses saved.');
}
