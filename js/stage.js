// Stage progress, saved in this browser.
// Stage pages: a [data-stage="N"] root with input[type=checkbox][data-task] boxes,
// an optional [data-stage-progress] .lc-progress bar, [data-stage-progress-text]
// and a [data-stage-reset] button.
// Roadmap page: .lc-stage[data-stage-summary="N"] gets "x of y done" in .lc-stage__meta.
// Storage: learncraft_stage_progress = { "N": { done: [taskId...], total: number } }

(function () {
    'use strict';

    const KEY = 'learncraft_stage_progress';

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(KEY) || '{}');
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function save(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            // storage blocked: progress lasts for this page view only
        }
    }

    function summary(entry) {
        if (!entry || !entry.done || !entry.done.length) return 'Not started';
        if (entry.total && entry.done.length >= entry.total) return 'Complete';
        return `${entry.done.length} of ${entry.total} done`;
    }

    function initStage(root) {
        const stage = root.dataset.stage;
        const boxes = [...root.querySelectorAll('input[type="checkbox"][data-task]')];
        if (!boxes.length) return;
        const bars = root.querySelectorAll('[data-stage-progress]');
        const texts = root.querySelectorAll('[data-stage-progress-text]');

        function render() {
            const done = boxes.filter((b) => b.checked).length;
            bars.forEach((bar) => {
                bar.setAttribute('aria-valuemax', String(boxes.length));
                bar.setAttribute('aria-valuenow', String(done));
                bar.style.setProperty('--value', String(done / boxes.length));
            });
            texts.forEach((t) => { t.textContent = `${done} of ${boxes.length} done`; });
        }

        function persist() {
            const data = load();
            data[stage] = { done: boxes.filter((b) => b.checked).map((b) => b.dataset.task), total: boxes.length };
            save(data);
            render();
        }

        const saved = new Set((load()[stage] || {}).done || []);
        boxes.forEach((b) => {
            b.checked = saved.has(b.dataset.task);
            b.addEventListener('change', persist);
        });

        root.querySelectorAll('[data-stage-reset]').forEach((btn) => btn.addEventListener('click', () => {
            if (!window.confirm('Clear your ticks for this stage?')) return;
            boxes.forEach((b) => { b.checked = false; });
            persist();
        }));

        render();
    }

    function initSummaries() {
        const data = load();
        document.querySelectorAll('.lc-stage[data-stage-summary]').forEach((card) => {
            const meta = card.querySelector('.lc-stage__meta');
            if (meta) meta.textContent = summary(data[card.dataset.stageSummary]);
            const bar = card.querySelector('.lc-progress');
            const entry = data[card.dataset.stageSummary];
            if (bar && entry && entry.total) {
                bar.setAttribute('aria-valuemax', String(entry.total));
                bar.setAttribute('aria-valuenow', String(entry.done.length));
                bar.style.setProperty('--value', String(entry.done.length / entry.total));
            }
        });
    }

    function init() {
        document.querySelectorAll('[data-stage]').forEach(initStage);
        initSummaries();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
