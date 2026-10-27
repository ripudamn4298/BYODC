// BYODC art — the head chefs and the kitchen (REVIEW_NOTES N-098, the picture beside 4.1's
// numbers box). The box says a GPU is not simply a stronger CPU: they are built for different
// work. So the two chips sit side by side and behave differently.
//   CPU (AMD Ryzen 9 9950X): 16 large cores, each mostly control unit with a small adder.
//     Every core runs its own instruction and changes it on its own beat.
//   GPU (NVIDIA H100): groups of tiny lanes, each group under one scheduler. Every lane flashes
//     blue (live signal, DESIGN.md §1a) on the same beat, on the same instruction.
// An arrow from the CPU to the GPU shows the CPU handing it a job. Only a few hundred of the
// H100's 16,896 lanes are drawn. Names are plain badges, not logos.
//
// Facts: Ryzen 9 9950X, 16 cores, up to 5.7 GHz boost (AMD specification). H100 SXM, 16,896
// FP32 CUDA cores ("lanes"), up to 1.98 GHz boost (NVIDIA Hopper architecture paper).
import { svgEl, mulberry32 } from '../engine/util.js';
import { Anim } from '../engine/anim.js';

const INSTR = ['+3', '×2', 'IF', 'LOAD', 'SAVE', 'JUMP', '−1', 'CMP', 'CALL', 'AND'];

const badge = (x, y, s) => {
  const w = s.length * 6.4 + 16;
  return `<rect x="${(x - w / 2).toFixed(1)}" y="${y - 11}" width="${w.toFixed(1)}" height="16" rx="8" fill="var(--ink)"/>
    <text x="${x}" y="${y + 1}" class="lbl" style="fill:var(--paper-high);font-size:8px">${s}</text>`;
};

export async function cpuGpuArt(root){
  const add = html => { const g = svgEl('g'); g.innerHTML = html; root.appendChild(g); return g; };
  const rand = mulberry32(98);

  add(`<text x="360" y="52" class="lbl" style="fill:var(--ink)">A CPU AND A GPU, BUILT FOR DIFFERENT WORK</text>
    <text x="360" y="66" class="lbl-faint" font-size="7.5">DRAWN SIDE BY SIDE, NOT TO SCALE</text>`);

  /* ---------- the CPU: 16 big cores, each deciding its own next step ---------- */
  const CX = 50, CY = 100, CW = 280, CH = 230;
  const cpu = add(`${badge(CX + CW / 2, 92, 'AMD RYZEN 9 9950X')}
    <rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="4" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.4"/>`);
  const cores = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
    const x = CX + 9 + c * 67, y = CY + 8 + r * 55;
    const g = svgEl('g');
    g.innerHTML = `<rect class="core" x="${x}" y="${y}" width="61" height="49" rx="2" fill="var(--paper)" stroke="var(--hairline-strong)" stroke-width="1.2"/>
      <rect x="${x + 4}" y="${y + 4}" width="53" height="27" rx="1.5" fill="var(--ink)"/>
      <text class="ins" x="${x + 30.5}" y="${y + 21.5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:10px;fill:var(--paper-high)">${INSTR[(r * 4 + c) % INSTR.length]}</text>
      <rect x="${x + 4}" y="${y + 35}" width="16" height="10" rx="1" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width=".8"/>
      <text x="${x + 12}" y="${y + 43}" text-anchor="middle" style="font-family:var(--font-mono);font-size:8px;fill:var(--ink)">+</text>`;
    g.style.opacity = '0';
    cpu.appendChild(g);
    cores.push({ g, rect: g.querySelector('.core'), ins: g.querySelector('.ins'), next: 0 });
  }
  add(`<text x="${CX + CW / 2}" y="352" class="lbl" style="fill:var(--ink)">CPU · THE HEAD CHEFS</text>
    <text x="${CX + CW / 2}" y="368" class="lbl" font-size="9" style="font-family:var(--font-mono);fill:var(--ink)">16 CORES · UP TO 5.7 GHZ</text>
    <text x="${CX + CW / 2}" y="384" class="lbl-faint" font-size="8">EACH CORE HAS A BIG CONTROL UNIT OF ITS OWN</text>
    <text x="${CX + CW / 2}" y="397" class="lbl-faint" font-size="8">EACH CORE RUNS ITS OWN INSTRUCTION</text>
    <text x="${CX + CW / 2}" y="410" class="lbl-faint" font-size="8">RUNS THE OPERATING SYSTEM</text>`);

  /* ---------- the hand-over ---------- */
  const job = add(`<line x1="${CX + CW + 8}" y1="215" x2="${CX + CW + 50}" y2="215" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M ${CX + CW + 50} 210 L ${CX + CW + 58} 215 L ${CX + CW + 50} 220 Z" fill="var(--ink)"/>
    <text x="${CX + CW + 31}" y="205" class="lbl" font-size="7.5" style="fill:var(--ink)">JOB</text>`);
  job.style.opacity = '0';

  /* ---------- the GPU: groups of tiny lanes, one scheduler per group ---------- */
  const GX = 390, GY = 100, GW = 280, GH = 230;
  const gpu = add(`${badge(GX + GW / 2, 92, 'NVIDIA H100')}
    <rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" rx="4" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.4"/>`);
  const lanes = [], scheds = [];
  for (let gr = 0; gr < 2; gr++) for (let gc = 0; gc < 2; gc++){
    const x0 = GX + 8 + gc * 136, y0 = GY + 8 + gr * 110;
    const g = svgEl('g');
    let html = `<rect x="${x0}" y="${y0}" width="128" height="104" rx="2" fill="var(--paper)" stroke="var(--hairline-strong)" stroke-width="1"/>
      <rect x="${x0 + 4}" y="${y0 + 4}" width="120" height="13" rx="1.5" fill="var(--ink)"/>
      <text class="sch" x="${x0 + 64}" y="${y0 + 13.5}" text-anchor="middle" style="font-family:var(--font-mono);font-size:7.5px;letter-spacing:.1em;fill:var(--paper-high)">SCHEDULER · +3</text>`;
    for (let r = 0; r < 10; r++) for (let c = 0; c < 15; c++){
      html += `<rect class="ln" x="${(x0 + 5 + c * 8).toFixed(1)}" y="${(y0 + 21 + r * 8).toFixed(1)}" width="6" height="6" rx=".8" fill="var(--paper-high)" stroke="var(--ink-faint)" stroke-width=".6"/>`;
    }
    g.innerHTML = html;
    g.style.opacity = '0';
    gpu.appendChild(g);
    lanes.push(...g.querySelectorAll('.ln'));
    scheds.push({ g, t: g.querySelector('.sch') });
  }
  add(`<text x="${GX + GW / 2}" y="352" class="lbl" style="fill:var(--ink)">GPU · THE KITCHEN OF HELPERS</text>
    <text x="${GX + GW / 2}" y="368" class="lbl" font-size="9" style="font-family:var(--font-mono);fill:var(--ink)">16,896 LANES · UP TO 1.98 GHZ</text>
    <text x="${GX + GW / 2}" y="384" class="lbl-faint" font-size="8">EACH LANE IS SMALL, WITH NO CONTROL UNIT</text>
    <text x="${GX + GW / 2}" y="397" class="lbl-faint" font-size="8">ONE SCHEDULER SENDS ONE INSTRUCTION TO ITS GROUP</text>
    <text x="${GX + GW / 2}" y="410" class="lbl-faint" font-size="8">WORKS WHEN THE CPU HANDS IT A JOB</text>
    <text x="${GX + GW / 2}" y="428" class="lbl-faint" font-size="7">600 OF THE 16,896 LANES ARE DRAWN</text>`);

  /* grow in: the CPU's cores, the hand-over, then the GPU's groups */
  await Anim.tween(1600, q => {
    const t = q * 1600;
    cores.forEach((c, i) => { c.g.style.opacity = Math.min(1, Math.max(0, (t - i * 30) / 300)).toFixed(2); });
    job.style.opacity = Math.min(1, Math.max(0, (t - 700) / 300)).toFixed(2);
    scheds.forEach((s, i) => { s.g.style.opacity = Math.min(1, Math.max(0, (t - 900 - i * 120) / 300)).toFixed(2); });
  }, q => q);

  /* then they work: each CPU core changes its own instruction on its own beat; every GPU
     lane flashes together on one beat. Stops when the panel goes. */
  let now = 0, beat = 0;
  cores.forEach(c => { c.next = 200 + rand() * 600; });
  const tick = () => {
    if (!root.isConnected) return;
    now += 100;
    cores.forEach(c => {
      if (now >= c.next){
        c.ins.textContent = INSTR[Math.floor(rand() * INSTR.length)];
        c.rect.setAttribute('stroke', 'var(--blue)');
        c.flash = now;
        c.next = now + 300 + rand() * 700;
      } else if (c.flash && now - c.flash >= 200){
        c.rect.setAttribute('stroke', 'var(--hairline-strong)');
        c.flash = 0;
      }
    });
    if (now % 900 === 0){
      beat++;
      const op = beat % 4 === 3 ? '×2' : '+3';
      scheds.forEach(s => { s.t.textContent = `SCHEDULER · ${op}`; });
      lanes.forEach(l => { l.setAttribute('fill', 'var(--blue)'); l.setAttribute('stroke', 'var(--blue)'); });
    } else if (now % 900 === 300){
      lanes.forEach(l => { l.setAttribute('fill', 'var(--paper-high)'); l.setAttribute('stroke', 'var(--ink-faint)'); });
    }
    setTimeout(tick, 100);
  };
  tick();
}
