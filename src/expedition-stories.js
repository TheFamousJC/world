import {EXPEDITION_DATA} from './expedition-data.js';
import {buildExpeditionStory} from './alpine-story.js';
export const buildExpeditionStories=base=>Object.freeze(EXPEDITION_DATA.map(r=>buildExpeditionStory(base,r)));
