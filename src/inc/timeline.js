import Tween from '../actions/Tween';
import easing from '../actions/easing/preset-easing';
import { relativeValue } from './calc';
import { each } from './utils';

/*
    @param [array]
        Sequential array of tweens, each item can be a tween or definition obj:

        [
            new Tween(),
            stagger(),
            timeline(),
            {
                tween: new Tween(),
                at: 100,
                offset: "+=100"
            }
        ]
*/
const analyze = (defs) => {
    const timeline = [];
    const numDefs = defs.length;
    let currentPlayhead = 0;

    for (let i = 0; i < numDefs; i++) {
        const def = defs[i];
        const defIsObj = def.tween ? true : false;
        const tween = (defIsObj) ? def.tween : def;

        currentPlayhead += ((defIsObj && def.offset) ?
            def.at || relativeValue(currentPlayhead, def.offset) : 0);

        let duration = 0;
        for (let key in tween.values) {
            if (tween.values.hasOwnProperty(key)) {
                const value = tween.values[key];
                duration = Math.max(duration, value.duration);
            }
        }

        timeline.push({
            from: currentPlayhead,
            duration: duration,
            fire: (time) => tween.seekTime(time)
        });

        currentPlayhead += tween.duration;
    }

    return { totalTime: currentPlayhead, timeline };
};

const setTweens = ({ elapsed, timeline, timelineLength, state }) => {
    for (let i = 0; i < timelineLength; i++) {
        const tween = timeline[i];
        const tweenTime = elapsed - tween.from;

        if (tweenTime > 0 && tweenTime < tween.duration) {
            tween.fire(tweenTime);
        }
    }
};

export default function timeline(def, props = {}) {
    const { totalTime, timeline } = analyze(def);

    return new Tween({
        ...props,
        duration: totalTime,
        ease: easing.linear,
        values: {
            p: 1
        },
        timeline: timeline,
        timelineLength: timeline.length,
        onRender: setTweens
    });
}