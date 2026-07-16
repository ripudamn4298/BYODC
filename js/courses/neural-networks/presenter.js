import { $ } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { Music } from '../../engine/music.js';

export function createAiPresenter(labNumber, startingCapability){
  let capability = startingCapability;
  return {
    enterStep({ step, stepIndex, totalSteps }){
      $('#stepmark').innerHTML = `LAB ${labNumber} · STEP <b>${stepIndex + 1} / ${totalSteps}</b>`;
      $('#money').textContent = `MODEL · ${step.model}`;
      $('#inv').innerHTML = `CAPABILITY: <b>${capability}</b>`;
      Music.setIntensity(totalSteps > 1 ? stepIndex / (totalSteps - 1) : 0);
    },
    completeStep({ step }){
      capability = step.capability;
      $('#inv').innerHTML = `CAPABILITY: <b>${capability}</b>`;
      guide.milestone(step.labNote);
    },
  };
}
