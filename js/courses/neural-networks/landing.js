import { $, el, RM, clamp } from '../../engine/util.js';

const PHASES = [
  { eyebrow: '01 · DATA', title: 'Everything starts as <em>a signal.</em>', body: 'Brightness, position, sound, words — a model can only work with what reaches its inputs. First you will turn observations into signals it can compare.' },
  { eyebrow: '02 · NEURON', title: 'One small <em>decision.</em>', body: 'A neuron listens to several signals, gives some more influence than others, and decides whether enough evidence has arrived.' },
  { eyebrow: '03 · NETWORK', title: 'Decisions become <em>representations.</em>', body: 'One layer notices simple patterns. Later layers combine them into edges, shapes, objects, and eventually meaning.' },
  { eyebrow: '04 · TRANSFORMER', title: 'Context chooses <em>what matters.</em>', body: 'Attention lets every token look back at the others and gather the context it needs before the model predicts what should come next.' },
];

let raf = 0, cleanup = [];

function artifact(){
  const canvas = $('#ai-artifact'), ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1, target = 0, current = 0;
  function fit(){
    width = innerWidth; height = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function stages(progress){
    const cx = width * (width < 850 ? .5 : .69), cy = height * .5;
    const sets = [
      [{ x: cx - 150, y: cy - 90 }, { x: cx - 95, y: cy + 40 }, { x: cx - 190, y: cy + 120 }],
      [{ x: cx - 170, y: cy - 100 }, { x: cx - 170, y: cy + 100 }, { x: cx + 10, y: cy }],
      [{ x: cx - 210, y: cy - 100 }, { x: cx - 210, y: cy + 100 }, { x: cx, y: cy - 130 }, { x: cx, y: cy }, { x: cx, y: cy + 130 }, { x: cx + 210, y: cy }],
      Array.from({ length: 9 }, (_, i) => ({ x: cx - 240 + (i % 3) * 240, y: cy - 170 + Math.floor(i / 3) * 170 })),
    ];
    const a = Math.min(2, Math.floor(progress)), b = Math.min(3, a + 1), t = progress - a;
    const count = Math.max(sets[a].length, sets[b].length), out = [];
    for (let i = 0; i < count; i++){
      const p = sets[a][i % sets[a].length], q = sets[b][i % sets[b].length];
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
    return out;
  }
  function draw(){
    ctx.clearRect(0, 0, width, height);
    const pts = stages(current); ctx.lineWidth = 1;
    pts.forEach((a, i) => pts.forEach((b, j) => {
      if (j <= i || Math.abs(i - j) > (current > 2.2 ? 4 : 2)) return;
      ctx.strokeStyle = `rgba(74,54,160,${.08 + ((i + j) % 3) * .04})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }));
    pts.forEach((point, index) => {
      ctx.fillStyle = index % 3 === 0 ? '#267f78' : '#4a36a0';
      ctx.beginPath(); ctx.arc(point.x, point.y, 6 + (index % 2) * 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(29,33,23,.22)'; ctx.beginPath(); ctx.arc(point.x, point.y, 19, 0, Math.PI * 2); ctx.stroke();
    });
  }
  function frame(){ current += (target - current) * .09; if (Math.abs(target - current) < .002) current = target; draw(); raf = requestAnimationFrame(frame); }
  fit(); addEventListener('resize', fit); cleanup.push(() => removeEventListener('resize', fit));
  if (!RM) raf = requestAnimationFrame(frame); else { current = target = 3; draw(); }
  return { set(value){ target = clamp(value, 0, 3); if (RM){ current = target; draw(); } } };
}

export function initAiLanding(){
  const copy = $('.ai-journey-copy');
  PHASES.forEach(phase => copy.appendChild(el('article', { class: 'ai-phase' }, `<p class="microlabel">${phase.eyebrow}</p><h2>${phase.title}</h2><p>${phase.body}</p>`)));
  const art = artifact();
  if (RM || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.fromTo('.ai-reveal', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: .1, ease: 'power3.out' });
  const phases = [...document.querySelectorAll('.ai-phase')]; gsap.set(phases[0], { opacity: 1 });
  ScrollTrigger.create({
    trigger: '#ai-journey', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate(self){
      const p = self.progress * 3; art.set(p);
      phases.forEach((phase, index) => { const d = Math.abs(p - index); phase.style.opacity = String(clamp(1 - d * 1.25, 0, 1)); phase.style.transform = `translateY(${(index - p) * 24}px)`; });
    },
  });
}

export function teardownAiLanding(){
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  cancelAnimationFrame(raf); cleanup.forEach(fn => fn()); cleanup = [];
}
