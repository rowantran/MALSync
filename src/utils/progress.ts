import { releaseItemInterface, single as updateProgress } from '../background/releaseProgress';
import { timestampToShortTime } from './time';

export class Progress {
  protected logger;

  protected releaseItem: undefined | releaseItemInterface = undefined;

  constructor(protected cacheKey: string, protected type: 'anime' | 'manga') {
    this.logger = con.m('progress').m(cacheKey.toString());
    return this;
  }

  // Progress
  protected async initReleaseProgress(liveData) {
    if (liveData) await updateProgress(liveData, this.type, 'default');

    const releaseItem: undefined | releaseItemInterface = await api.storage.get(
      `release/${this.type}/${this.cacheKey}`,
    );

    this.logger.m('Init Release').log(releaseItem);
    if (!releaseItem) return;

    this.releaseItem = releaseItem;
  }

  protected getProgressCurrentEpisode() {
    const re = this.releaseItem;
    if (re && re.value && re.value.lastEp && re.value.lastEp.total) return re.value.lastEp.total;
    return null;
  }

  protected isProgressFinished() {
    const re = this.releaseItem;
    if (re && re.finished) return true;
    return false;
  }

  protected getProgressPrediction() {
    const re = this.releaseItem;
    if (re && re.value && re.value.predicition && re.value.predicition.timestamp) return re.value.predicition.timestamp;
    return null;
  }

  protected getProgressLastTimestamp() {
    const re = this.releaseItem;
    if (re && re.value && re.value.lastEp && re.value.lastEp.timestamp) return re.value.lastEp.timestamp;
    return null;
  }

  // General
  async init(
    live: { uid: number; malId: number | null; title: string; cacheKey: string; xhr?: object } | false = false,
  ) {
    await this.initReleaseProgress(live);
    return this;
  }

  getCurrentEpisode(): number {
    return this.getProgressCurrentEpisode();
  }

  isFinished(): boolean {
    return this.isProgressFinished();
  }

  getPredictionTimestamp(): number {
    return this.getProgressPrediction();
  }

  getPrediction(): string {
    return timestampToShortTime(this.getPredictionTimestamp());
  }

  getPredictionText(): string {
    const pre = this.getPrediction();
    if (pre) return api.storage.lang('prediction_Episode', [pre]);
    return '';
  }

  getLastTimestamp(): number {
    return this.getProgressLastTimestamp();
  }

  getLast(ago = true): string {
    return timestampToShortTime(this.getLastTimestamp(), ago);
  }

  getLastText(): string {
    const last = this.getLast(false);
    if (last) return api.storage.lang('prediction_Last', [last]);
    return '';
  }

  getAutoText(): string {
    const preT = this.getPredictionText();
    if (preT) return preT;
    const lastT = this.getLastText();
    if (lastT) return lastT;
    return '';
  }

  getBars(curEp, totalEp): { totalWidth: number; epWidth: number; predWidth: number } {
    const predEp = this.getCurrentEpisode();
    const res = {
      totalWidth: 100,
      epWidth: 0,
      predWidth: 0,
    };
    if (!totalEp) {
      res.totalWidth = 0;
      if (curEp && (!predEp || curEp >= predEp)) {
        totalEp = Math.ceil(curEp * 1.2);
      } else if (predEp && (!curEp || curEp < predEp)) {
        totalEp = Math.ceil(predEp * 1.2);
      } else {
        return res;
      }
    }
    if (curEp) {
      res.epWidth = (curEp / totalEp) * 100;
      if (res.epWidth > 100) res.epWidth = 100;
    }
    if (predEp) {
      res.predWidth = (predEp / totalEp) * 100;
      if (res.predWidth > 100) res.predWidth = 100;
    }
    return res;
  }
}
