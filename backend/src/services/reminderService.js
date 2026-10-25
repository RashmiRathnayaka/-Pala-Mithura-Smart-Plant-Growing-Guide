/**
 * Crop-specific schedules (spec §5): watering, fertilizer and harvest reminders are derived
 * from each crop's own data (watering interval, fertilizer timings, harvest window), not one
 * generic schedule. Users may override the watering interval per plant.
 */
const DAY = 24 * 60 * 60 * 1000;

const addDays = (date, days) => new Date(new Date(date).getTime() + days * DAY);
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const diffDays = (a, b) => Math.floor((startOfDay(a) - startOfDay(b)) / DAY);

function applyTime(date, hhmm = '07:00') {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function estimateStage(plant, daysSincePlanting) {
  const stages = plant.growthStages || [];
  const found = stages.find(
    (s) => daysSincePlanting >= s.startDay && (s.endDay == null || daysSincePlanting <= s.endDay)
  );
  return found ? found.stage : null;
}

function computeSchedule(userPlant, plant, now = new Date()) {
  const planted = new Date(userPlant.plantingDate);
  const reminders = userPlant.reminders || {};
  const time = reminders.time || '07:00';
  const daysSincePlanting = Math.max(0, diffDays(now, planted));

  // ── Watering ─────────────────────────────────────────────
  const cropInterval = plant.watering?.intervalDays || null;
  const userInterval = reminders.wateringIntervalDays || null;
  const intervalDays = userInterval || cropInterval;
  const lastWatered = userPlant.lastWateredAt ? new Date(userPlant.lastWateredAt) : null;
  let wateringNext = null;
  if (intervalDays) {
    wateringNext = lastWatered ? addDays(lastWatered, intervalDays) : startOfDay(now);
  }
  const watering = {
    enabled: reminders.watering !== false && !!intervalDays,
    intervalDays,
    intervalSource: userInterval ? 'user' : cropInterval ? 'crop' : 'none',
    intervalIsEstimate: userInterval ? false : plant.watering?.intervalIsEstimate !== false,
    lastWateredAt: lastWatered,
    nextDueAt: wateringNext ? applyTime(wateringNext, time) : null,
    overdue: wateringNext ? startOfDay(wateringNext) < startOfDay(now) : false,
  };

  // ── Fertilizer (from the crop's application timings) ─────
  const logs = (userPlant.fertilizerLog || []).map((l) => new Date(l.date));
  const applications = (plant.fertilizer?.applications || [])
    .filter((a) => typeof a.daysAfterPlanting === 'number')
    .map((a) => {
      const dueAt = applyTime(addDays(planted, a.daysAfterPlanting), time);
      const done = logs.some((d) => d >= addDays(dueAt, -7) && d <= addDays(dueAt, 14));
      return {
        timing: a.timing,
        daysAfterPlanting: a.daysAfterPlanting,
        products: a.products,
        dueAt,
        done,
        overdue: !done && startOfDay(dueAt) < startOfDay(now),
      };
    });
  const nextFert = applications.find((a) => !a.done && startOfDay(a.dueAt) >= startOfDay(now)) || null;
  const fertilizer = {
    enabled: reminders.fertilizer !== false && applications.length > 0,
    applications,
    nextDueAt: nextFert ? nextFert.dueAt : null,
  };

  // ── Harvest window ───────────────────────────────────────
  const h = plant.harvest || {};
  let harvest = { enabled: false, startAt: null, endAt: null, status: 'unknown' };
  if (typeof h.startDays === 'number') {
    const startAt = applyTime(addDays(planted, h.startDays), time);
    const endAt = typeof h.endDays === 'number' ? addDays(planted, h.endDays) : null;
    let status = 'upcoming';
    if (startOfDay(now) >= startOfDay(startAt)) status = endAt && startOfDay(now) > startOfDay(endAt) ? 'passed' : 'in_window';
    harvest = { enabled: reminders.harvest !== false, startAt, endAt, intervalDays: h.intervalDays || null, status };
  }

  // ── Flat list of upcoming reminders (next 60 days) for the app to schedule locally ──
  const horizon = addDays(now, 60);
  const upcoming = [];
  if (watering.enabled && watering.nextDueAt) {
    let d = new Date(watering.nextDueAt);
    if (d < now) {
      // Overdue: remind at the next reminder time (today if still ahead, otherwise tomorrow).
      const today = applyTime(now, time);
      d = today > now ? today : applyTime(addDays(now, 1), time);
    }
    for (let i = 0; i < 20 && d <= horizon; i += 1) {
      upcoming.push({ type: 'watering', dueAt: new Date(d) });
      d = addDays(d, intervalDays);
    }
  }
  if (fertilizer.enabled) {
    applications
      .filter((a) => !a.done && a.dueAt >= now && a.dueAt <= horizon)
      .forEach((a) => upcoming.push({ type: 'fertilizer', dueAt: a.dueAt, timing: a.timing }));
  }
  if (harvest.enabled && harvest.startAt && harvest.startAt >= now && harvest.startAt <= horizon) {
    upcoming.push({ type: 'harvest', dueAt: harvest.startAt });
  }
  upcoming.sort((a, b) => a.dueAt - b.dueAt);

  return {
    daysSincePlanting,
    estimatedStage: estimateStage(plant, daysSincePlanting),
    watering,
    fertilizer,
    harvest,
    upcoming,
  };
}

/** Growth timeline: estimated stage windows + everything the user has logged. */
function buildTimeline(userPlant, plant) {
  const planted = new Date(userPlant.plantingDate);
  const stages = (plant.growthStages || []).map((s) => ({
    stage: s.stage,
    startAt: addDays(planted, s.startDay),
    endAt: s.endDay != null ? addDays(planted, s.endDay) : null,
  }));
  const events = [
    { type: 'planted', date: planted },
    ...(userPlant.wateringLog || []).map((w) => ({ type: 'watering', date: w.date, detail: w.amount, note: w.note, id: w._id })),
    ...(userPlant.fertilizerLog || []).map((f) => ({ type: 'fertilizer', date: f.date, detail: `${f.type} ${f.quantity || ''}`.trim(), note: f.note, id: f._id })),
    ...(userPlant.photos || []).map((p) => ({ type: 'photo', date: p.uploadedAt, url: p.url, note: p.caption, id: p._id })),
    ...(userPlant.notes || []).map((n) => ({ type: n.isProblem ? 'problem' : 'note', date: n.date, note: n.text, id: n._id })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { stages, events };
}

module.exports = { computeSchedule, buildTimeline, estimateStage };
