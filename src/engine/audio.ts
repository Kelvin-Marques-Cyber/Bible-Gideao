/** Original procedural score and foley; no sampled or commercial recordings. */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private muted = false;
  private mode = 'ofra';
  private beat = 0;
  private listener = {x:0,z:0};
  setListener(x:number,z:number){this.listener={x,z};}
  private spatialTone(x:number,z:number,frequency:number){const distance=Math.hypot(x-this.listener.x,z-this.listener.z);this.tone(frequency,.28,Math.max(.003,.045/(1+distance*.45)),'triangle',Math.max(-1,Math.min(1,(x-this.listener.x)/12)));}
  async start() {
    this.ctx ??= new AudioContext();
    await this.ctx.resume();
    if (!this.timer) this.timer = setInterval(() => this.score(), 650);
  }
  setMode(mode: string) { this.mode = mode; }
  setMuted(muted: boolean) { this.muted = muted; if (muted) void this.ctx?.suspend(); else void this.ctx?.resume(); }
  private tone(f: number, length = .3, gain = .04, type: OscillatorType = 'sine', pan = 0) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime, osc = this.ctx.createOscillator(), env = this.ctx.createGain(), panner = this.ctx.createStereoPanner();
    osc.type = type; osc.frequency.value = f; panner.pan.value = pan;
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(gain, t + .015); env.gain.exponentialRampToValueAtTime(.0001, t + length);
    osc.connect(env).connect(panner).connect(this.ctx.destination); osc.start(t); osc.stop(t + length);
  }
  private noise(length: number, volume: number, cutoff: number) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const len = Math.floor(this.ctx.sampleRate * length), buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate), channel = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), env = this.ctx.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff; env.gain.value = volume;
    source.connect(filter).connect(env).connect(this.ctx.destination); source.start();
  }
  private score() {
    const night = this.mode !== 'ofra', battle = this.mode === 'battle';
    const scale = night ? [146.83, 164.81, 174.61, 220, 261.63, 293.66, 349.23, 329.63] : [146.83, 220, 261.63, 293.66, 329.63, 293.66, 220, 174.61];
    if (this.beat % 2 === 0) this.tone(scale[(this.beat / 2) % scale.length], 1.8, .022, 'triangle', Math.sin(this.beat) * .45);
    if (this.beat % 8 === 0) this.tone(73.42, 4.5, .018);
    if (battle || this.beat % 4 === 0) { this.tone(65, .19, battle ? .065 : .028); this.noise(.1, .012, 800); }
    if (this.beat % 7 === 0) this.noise(1.6, .01, 480);
    if(this.mode==='ofra'&&this.beat%19===7){this.spatialTone(-13,2,245);setTimeout(()=>this.spatialTone(-13,2,230),180);}
    if(this.mode==='midian'&&this.beat%13===4)this.noise(.22,.012,700);
    this.beat++;
  }
  play(kind: 'step'|'click'|'attack'|'guard'|'victory'|'horn'|'jar'|'level'|'danger') {
    if (kind === 'step') this.noise(.08, .025, 600);
    if (kind === 'click') this.tone(440, .06, .025, 'triangle');
    if (kind === 'attack') { this.noise(.15, .15, 4000); this.tone(110, .12, .07, 'triangle'); }
    if (kind === 'guard') this.tone(270, .22, .05, 'triangle');
    if (kind === 'jar') this.noise(.7, .22, 7000);
    if (kind === 'horn') [146.83, 220, 293.66].forEach((f, i) => setTimeout(() => this.tone(f, 2.8, .065, 'sawtooth', i * .4 - .4), i * 500));
    if (kind === 'victory' || kind === 'level') [293.66, 349.23, 440, 587.33].forEach((f, i) => setTimeout(() => this.tone(f, .9, .055, 'triangle'), i * 130));
    if (kind === 'danger') this.tone(82.41, .9, .045, 'triangle');
  }
  dispose() { if (this.timer) clearInterval(this.timer); void this.ctx?.close(); }
}
