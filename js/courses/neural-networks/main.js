import { $ } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { SFX } from '../../engine/sfx.js';
import { Music } from '../../engine/music.js';
import { LAB1, LAB2, LAB3, LAB4, LAB_SUMMARIES } from './course.js';
import { createAiPresenter } from './presenter.js';
import { showAiSummary } from './summary.js';
import { initAiLanding, teardownAiLanding } from './landing.js';
import { markCourseStarted, recordCourseActCompleted, recordCourseCompleted, recordCoursePosition, recordCourseStep } from '../../platform/profile-store.js';

guide.init(); initAiLanding(); Music.start();
const COURSE_ID='neural-networks', TOTAL_STEPS=16;
const LABS={
  1:{steps:LAB1,offset:0,next:2,start:'receives no signals yet'},
  2:{steps:LAB2,offset:4,next:3,start:'makes an untrained guess'},
  3:{steps:LAB3,offset:8,next:4,start:'has learned from small patterns'},
  4:{steps:LAB4,offset:12,next:null,start:'can represent images and features'},
};

function startLab(number){
  const lab=LABS[number]; if(!lab)return;
  markCourseStarted(COURSE_ID,{act:number,step:1,totalSteps:TOTAL_STEPS});
  flow.run(lab.steps,{
    actLabel:`LAB ${number}`, presenter:createAiPresenter(number,lab.start),
    onStepStart:({stepIndex})=>recordCoursePosition(COURSE_ID,{act:number,step:stepIndex+1,totalSteps:TOTAL_STEPS}),
    onStepComplete:({stepIndex})=>recordCourseStep(COURSE_ID,{act:number,step:stepIndex+1,globalStep:lab.offset+stepIndex+1,totalSteps:TOTAL_STEPS}),
    onComplete:()=>{ recordCourseActCompleted(COURSE_ID,number); if(!lab.next)recordCourseCompleted(COURSE_ID); showAiSummary(LAB_SUMMARIES[number],lab.next?()=>startLab(lab.next):null); },
  });
}
window.__techariumStartAiLab=startLab;

let started=false;
function startCourse(lab=1){
  if(started)return; started=true; SFX.init();SFX.click();teardownAiLanding();$('#ai-landing').style.display='none';$('#game').classList.add('active');scrollTo(0,0);Music.start();startLab(lab);
}
document.querySelectorAll('[data-ai-begin]').forEach(button=>button.addEventListener('click',()=>startCourse(+button.getAttribute('data-ai-begin')||1)));
const muteButtons=[...document.querySelectorAll('#mute,#lmute')];
function setMuted(value){SFX.init();SFX.muted=value;Music.setMuted(value);muteButtons.forEach(button=>{button.textContent=value?'∅':'♪';button.setAttribute('aria-label',value?'unmute':'mute');});}
muteButtons.forEach(button=>button.addEventListener('click',()=>{Music.start();setMuted(!SFX.muted);}));
const params=new URLSearchParams(location.search);
if(params.get('start')==='1')startCourse(Math.min(4,Math.max(1,+params.get('act')||1)));
