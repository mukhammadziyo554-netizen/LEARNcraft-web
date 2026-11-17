// In-scope learner pages (spec: "Pages in scope").
// `expect(page, ctx)` returns extra failure messages for that page; later plan tasks add them.

const page = (path, expect) => ({ path, name: path.replace(/\.html$/, ''), expect });

export const PAGES = [
  page('index.html'),

  page('pages/about.html'),
  page('pages/ask-ai.html'),
  page('pages/ai-usage.html'),
  page('pages/auth.html'),
  page('pages/login.html'),
  page('pages/registration.html'),
  page('pages/settings.html'),
  page('pages/support.html'),
  page('pages/community.html'),
  page('pages/debug-help.html'),

  page('courses/roadmap.html'),
  page('courses/civil-roadmap.html'),
  page('courses/civil-stage1.html'),
  page('courses/civil-stage2.html'),
  page('courses/civil-stage3.html'),
  page('courses/civil-stage4.html'),
  page('courses/civil-stage5.html'),
  page('courses/civil-stage6.html'),
  page('courses/choose-field.html'),
  page('courses/learn.html'),
  page('courses/practice.html'),

  page('learning/lesson.html'),
  page('study/civil-foundations.html'),

  ...[
    'aerospace-engineering', 'architectural-engineering', 'biomedical-engineering',
    'chemical-engineering', 'civil-engineering', 'computer-science',
    'electrical-engineering', 'environmental-engineering', 'industrial-engineering',
    'machine-learning', 'marine-engineering', 'materials-science',
    'mechanical-engineering', 'mechatronics', 'nuclear-engineering',
  ].map((slug) => page(`articles/${slug}.html`)),

  // Component fixture, added in Task 3. The runner skips it until the file exists.
  page('tests/fixtures/components.html'),
];
