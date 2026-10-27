import { BPM } from "./paint";
import type { RealmKey } from "./realms";

type Place = RealmKey | "nexus";

/**
 * Ambient sound for each place, made on the spot with Web Audio (no files): drones, filtered noise, and a few events.
 * Starts only when the visitor turns it on. Moving between places crossfades over about two seconds.
 */
export class Ambience {
  private ctx: AudioContext;
  private master: GainNode;
  private layer: { gain: GainNode; stop: () => void } | null = null;
  private noise: AudioBuffer;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
      d[i] = last * 3.5;
    }
  }

  async on(place: Place) {
    await this.ctx.resume();
    this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.6);
    this.go(place);
  }

  off() {
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    setTimeout(() => this.ctx.suspend().catch(() => {}), 1200);
  }

  close() {
    this.layer?.stop();
    this.ctx.close().catch(() => {});
  }

  go(place: Place) {
    const old = this.layer;
    const now = this.ctx.currentTime;
    if (old) {
      old.gain.gain.setTargetAtTime(0, now, 0.6);
      setTimeout(old.stop, 3000);
    }
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, now, 0.8);
    gain.connect(this.master);
    this.layer = { gain, stop: this.build(place, gain) };
  }

  private tone(out: AudioNode, freq: number, type: OscillatorType, vol: number, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    o.connect(g).connect(out);
    o.start();
    return o;
  }

  private wind(out: AudioNode, type: BiquadFilterType, freq: number, q: number, vol: number, sweep = 0) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(out);
    src.start();
    let lfo: OscillatorNode | null = null;
    if (sweep) {
      lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lg = this.ctx.createGain();
      lg.gain.value = sweep;
      lfo.connect(lg).connect(f.frequency);
      lfo.start();
    }
    return { stop: () => [src, lfo].forEach((n) => n?.stop()) };
  }

  /** a short note with a fast attack and a long tail */
  private pluck(out: AudioNode, freq: number, at: number, vol: number, type: OscillatorType = "sine", len = 1.6) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + len + 0.1);
  }

  private build(place: Place, out: GainNode): () => void {
    const stops: (() => void)[] = [];
    const osc = (o: OscillatorNode) => stops.push(() => o.stop());
    const timers: number[] = [];
    const every = (ms: number, fn: () => void) => timers.push(window.setInterval(fn, ms));
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    lp.connect(out);
    if (place === "nexus") {
      for (const [f, d] of [
        [55, 0],
        [82.4, 4],
        [110, -6],
        [164.8, 7],
      ])
        osc(this.tone(lp, f, "triangle", 0.09, d));
      stops.push(this.wind(lp, "bandpass", 500, 0.8, 0.05, 300).stop);
      every(4200, () =>
        this.pluck(
          lp,
          [440, 523.3, 659.3, 784][Math.floor(Math.random() * 4)],
          this.ctx.currentTime,
          0.025,
          "sine",
          3.5,
        ),
      );
    }
    if (place === "exposure") {
      for (const f of [130.8, 196, 246.9, 329.6]) osc(this.tone(lp, f, "sine", 0.05, Math.random() * 6));
      stops.push(this.wind(lp, "highpass", 2500, 0.5, 0.02).stop);
      every(1700, () => {
        if (Math.random() < 0.55) return;
        const t0 = this.ctx.currentTime;
        for (let k = 0; k < 3; k++) this.pluck(out, 2600 + Math.random() * 1400, t0 + k * 0.09, 0.012, "sine", 0.12);
      });
    }
    if (place === "forge") {
      stops.push(this.wind(lp, "lowpass", 160, 0.7, 0.5).stop);
      osc(this.tone(lp, 41.2, "sawtooth", 0.05));
      osc(this.tone(lp, 61.7, "sawtooth", 0.03, 8));
      every(1150, () => this.pluck(out, 1900 + Math.random() * 300, this.ctx.currentTime, 0.03, "square", 0.25));
      every(
        130,
        () =>
          Math.random() < 0.3 &&
          this.pluck(out, 3000 + Math.random() * 3000, this.ctx.currentTime, 0.008, "square", 0.03),
      );
    }
    if (place === "resonance") {
      for (const [f, d] of [
        [73.4, 0],
        [110, 5],
        [146.8, -5],
        [220, 3],
      ])
        osc(this.tone(lp, f, "sine", 0.07, d));
      const scale = [293.7, 349.2, 392, 440, 523.3, 587.3];
      let step = 0;
      every(60000 / BPM, () => {
        const f = scale[(step * 3 + (step >> 2)) % scale.length];
        this.pluck(out, f, this.ctx.currentTime, 0.04, "triangle", 2.2);
        step++;
      });
    }
    if (place === "altitude") {
      stops.push(this.wind(lp, "bandpass", 700, 0.6, 0.2, 500).stop);
      stops.push(this.wind(lp, "highpass", 3000, 0.5, 0.03).stop);
      for (const f of [196, 293.7, 392]) osc(this.tone(lp, f, "sine", 0.025, Math.random() * 8));
    }
    return () => {
      for (const id of timers) clearInterval(id);
      for (const s of stops) s();
      lp.disconnect();
      out.disconnect();
    };
  }
}
