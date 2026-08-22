/**
 * backend/lib/scorePage.ts
 *
 * The "Score a Story" tool. A visitor pastes any headline or link, drags
 * sliders across the four D1-4LS indices, and gets a scorecard they can share.
 * The share lands back here, on the tool itself, so whoever receives it can
 * score their own story in the same motion. The framework is the front door.
 *
 * Two depths, toggled: four index sliders for anyone, or the full twenty
 * indicators for people who want the real rubric. The scorecard reads the same
 * either way.
 *
 * Client logic is inline vanilla JS. No build step, no framework, works with a
 * cold tap. The page is served server-side with the site chrome so it feels
 * native to the edition, and a scored card is its own OG-tagged URL.
 */

import { C, esc, page, header, footer, APP_STORE } from './chrome';

// The rubric, mirrored from constants/d1-4ls-rubric.ts so the page is
// self-contained. Kept in the same order and wording as the app.
const RUBRIC = [
  {
    key: 'BAI', name: 'Biblical Alignment', color: '#B81616',
    blurb: 'Worldview coherence with biblical ontology, ethics, and anthropology.',
    indicators: [
      'Scriptural Consistency', 'Doctrinal Integrity', 'Moral Framework',
      'Anthropology', 'Teleology',
    ],
  },
  {
    key: 'PSI', name: 'Prophetic Significance', color: '#8A6A17',
    blurb: 'Prophetic relevance without date-setting or speculation.',
    indicators: [
      'Textual Linkage', 'Eschatological Category Fit', 'Historical Pattern Continuity',
      'Spiritual Discernment Impact', 'Theological Restraint',
    ],
  },
  {
    key: 'SCI', name: 'Source Credibility', color: '#1B6B5A',
    blurb: 'Journalistic rigor: verifiable, transparent sourcing.',
    indicators: [
      'Primary Source Access', 'Verification & Corroboration', 'Transparency & Accountability',
      'Track Record Accuracy', 'Editorial Standards',
    ],
  },
  {
    key: 'HII', name: 'Humanities Impact', color: '#2A4A7F',
    blurb: 'Human consequence: dignity, compassion, Christ-modeled care.',
    indicators: [
      'Human Dignity Recognition', 'Compassion & Empathy', 'Societal Impact Scope',
      'Justice & Responsibility', 'Christ-Modeled Care Orientation',
    ],
  },
];

const CSS = `
.hero{max-width:760px;margin:0 auto;padding:40px 0 6px;}
.hero .kicker{margin-bottom:14px;}
.hero h1{margin:0 0 16px;font-size:40px;line-height:1.12;letter-spacing:-.6px;color:${C.ink};}
.hero p{margin:0;font-size:17px;line-height:1.68;color:${C.body};}
.tool{max-width:760px;margin:0 auto;padding:8px 0 20px;}
.field{margin:26px 0 20px;}
.field label{display:block;font-size:11px;letter-spacing:2px;text-transform:uppercase;
  color:${C.goldText};font-weight:bold;margin-bottom:9px;}
.field input{width:100%;font-family:Georgia,serif;font-size:16px;color:${C.ink};
  background:${C.paper};border:1px solid ${C.rule};padding:14px 15px;border-radius:8px;}
.field input:focus{outline:none;border-color:${C.red};}

.modebar{display:flex;gap:8px;margin:0 0 8px;}
.modebtn{flex:1;font-family:Georgia,serif;font-size:13.5px;font-weight:bold;
  padding:11px 12px;border-radius:8px;border:1px solid ${C.rule};background:${C.paper};
  color:${C.body};cursor:pointer;}
.modebtn.on{background:${C.ink};color:${C.paper};border-color:${C.ink};}
.modehint{font-size:13px;color:${C.muted};font-style:italic;margin:0 0 22px;}

.idx{border-top:1px solid ${C.hair};padding:22px 0;}
.idx .head{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:4px;}
.idx .name{font-size:19px;font-weight:bold;color:${C.ink};letter-spacing:-.2px;}
.idx .val{font-variant-numeric:tabular-nums;font-size:15px;font-weight:bold;}
.idx .blurb{font-size:14px;line-height:1.55;color:${C.muted};margin:0 0 16px;}

.slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;
  background:${C.hair};outline:none;margin:8px 0 4px;}
.slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:24px;height:24px;
  border-radius:50%;background:${C.red};cursor:pointer;border:3px solid ${C.paper};
  box-shadow:0 1px 4px rgba(0,0,0,.28);}
.slider::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:${C.red};
  cursor:pointer;border:3px solid ${C.paper};box-shadow:0 1px 4px rgba(0,0,0,.28);}
.scale{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.5px;
  text-transform:uppercase;color:${C.muted};margin-top:2px;}

.detail{display:none;}
.detail.show{display:block;}
.ind{padding:13px 0;border-top:1px dashed ${C.hair};}
.ind:first-child{border-top:none;}
.ind .lab{display:flex;justify-content:space-between;gap:12px;font-size:14.5px;color:${C.body};margin-bottom:2px;}
.ind .lab b{font-variant-numeric:tabular-nums;font-weight:bold;color:${C.ink};}
.ind .miniscale{display:flex;justify-content:space-between;font-size:10.5px;
  text-transform:uppercase;letter-spacing:.4px;color:${C.muted};margin-top:1px;}
.ind .slider{height:5px;}
.ind .slider::-webkit-slider-thumb{width:20px;height:20px;}

.result{margin:8px 0 0;border:1px solid ${C.rule};background:${C.page};padding:28px 30px;}
.result .top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:16px;}
.result h2{margin:0;font-size:22px;color:${C.ink};letter-spacing:-.2px;}
.result .composite{font-variant-numeric:tabular-nums;font-size:34px;font-weight:bold;color:${C.red};line-height:1;}
.bars{margin:14px 0 20px;}
.bar{margin:11px 0;}
.bar .lab{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;color:${C.body};}
.bar .lab b{font-variant-numeric:tabular-nums;}
.bar .track{height:9px;border-radius:5px;background:${C.hair};overflow:hidden;}
.bar .fill{height:100%;border-radius:5px;transition:width .25s ease;}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;}
.btn{font-family:Georgia,serif;font-size:15px;font-weight:bold;padding:14px 22px;border-radius:8px;
  border:none;cursor:pointer;text-decoration:none;display:inline-block;}
.btn.red{background:${C.red};color:#fff;}
.btn.ghost{background:${C.paper};color:${C.ink};border:1px solid ${C.rule};}
.copied{font-size:13px;color:${C.goldText};font-style:italic;margin-left:4px;align-self:center;}

.submit{margin-top:22px;}
.submit-rule{height:1px;background:${C.hair};margin:0 0 20px;}
.submit h3{margin:0 0 8px;font-size:18px;color:${C.ink};letter-spacing:-.2px;}
.submit p{margin:0 0 14px;font-size:14px;line-height:1.6;color:${C.muted};}
.submit-field{margin:0 0 12px;}
.submit-field label{display:block;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.goldText};font-weight:bold;margin-bottom:8px;}
.submit-field input{width:100%;font-family:Georgia,serif;font-size:15px;color:${C.ink};background:${C.paper};border:1px solid ${C.rule};padding:12px 14px;border-radius:8px;}
.submit-field input:focus{outline:none;border-color:${C.red};}
.submit-msg{font-size:14px;line-height:1.5;font-style:italic;margin-top:12px !important;}
.submit-msg.ok{color:${C.goldText};}
.submit-msg.err{color:${C.red};}
.explain{max-width:760px;margin:36px auto 0;border-top:1px solid ${C.hair};padding-top:26px;}
.explain h3{font-size:12px;letter-spacing:2.6px;text-transform:uppercase;color:${C.goldText};margin:0 0 14px;}
.explain p{font-size:15px;line-height:1.7;color:${C.body};margin:0 0 12px;}
.explain .idxrow{display:grid;grid-template-columns:auto 1fr;gap:12px;margin:10px 0;align-items:baseline;}
.explain .idxrow .tag{font-size:11px;font-weight:bold;letter-spacing:1px;color:#fff;
  padding:3px 8px;border-radius:4px;white-space:nowrap;}
.explain .idxrow .t{font-size:14px;line-height:1.5;color:${C.body};}
.appcta{max-width:760px;margin:32px auto 0;border:1px solid ${C.rule};background:${C.page};
  padding:28px 30px;text-align:center;}
.appcta h3{margin:0 0 9px;font-size:23px;color:${C.ink};letter-spacing:-.3px;}
.appcta p{margin:0 auto 20px;font-size:15px;line-height:1.65;color:${C.body};max-width:520px;}

@media(max-width:640px){
  .hero h1{font-size:30px;}
  .result,.appcta,.explain{padding-left:20px;padding-right:20px;}
  .result{padding:22px 20px;}
}`;

export function renderScorePage(opts: {
  url: string;
  prefillTitle?: string;
  prefillScores?: Record<string, number[]>;
}): string {
  const rubricJson = JSON.stringify(RUBRIC);
  const prefill = opts.prefillScores ? JSON.stringify(opts.prefillScores) : 'null';
  const prefillTitle = opts.prefillTitle ? esc(opts.prefillTitle) : '';

  const explainRows = RUBRIC.map((r) =>
    `<div class="idxrow"><span class="tag" style="background:${r.color}">${r.key}</span><span class="t"><strong>${r.name}.</strong> ${esc(r.blurb)}</span></div>`
  ).join('');

  const inner = `${header()}
    <main class="shell">
      <section class="hero">
        <div class="kicker">Score a Story</div>
        <h1>Read the news the way we do.</h1>
        <p>Paste any headline you have seen today and score it yourself across the four measures behind Dot 1 News. It takes a minute, the math is yours, and you can share the result. This is the same lens our editors use, in your hands.</p>
      </section>

      <section class="tool">
        <div class="field">
          <label for="storyTitle">The story</label>
          <input id="storyTitle" type="text" placeholder="Paste a headline or a link" value="${prefillTitle}" maxlength="180">
        </div>

        <div class="modebar">
          <button class="modebtn on" id="modeQuick" type="button">Quick score &middot; 4 measures</button>
          <button class="modebtn" id="modeFull" type="button">Full rubric &middot; 20 indicators</button>
        </div>
        <p class="modehint" id="modeHint">One slider per measure. Switch to the full rubric for the complete framework.</p>

        <div id="indices"></div>

        <div class="result" id="result" style="display:none;">
          <div class="top">
            <h2>Your scorecard</h2>
            <div class="composite" id="composite">0.0</div>
          </div>
          <div class="bars" id="bars"></div>
          <div class="actions">
            <button class="btn red" id="shareBtn" type="button">Share this scorecard</button>
            <button class="btn ghost" id="copyBtn" type="button">Copy link</button>
            <span class="copied" id="copied" style="display:none;">Link copied</span>
          </div>

          <div class="submit">
            <div class="submit-rule"></div>
            <h3>Send this to the newsroom</h3>
            <p>Think this belongs in the edition? Send the story and your score to our editors as a candidate. Paste the link so we can check it. An editor reads and re-scores every submission, so this is a suggestion, not a promise it will run.</p>
            <div class="submit-field">
              <label for="submitUrl">Link to the story</label>
              <input id="submitUrl" type="url" placeholder="https://..." maxlength="500">
            </div>
            <input id="submitHoneypot" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;">
            <button class="btn red" id="submitBtn" type="button">Send to the newsroom</button>
            <p class="submit-msg" id="submitMsg" style="display:none;"></p>
          </div>
        </div>
      </section>

      <section class="explain">
        <h3>What the four measures mean</h3>
        <p>Dot 1 News scores every story it runs across four indices, each built from five indicators rated zero, one, or two. It is not a verdict on whether a story is good. It is a way of making the reasoning visible instead of hidden.</p>
        ${explainRows}
        <p style="margin-top:16px;">A high composite does not mean a story is true, and a low one does not mean it is false. The number is a starting point for thinking, not a substitute for it.</p>
      </section>

      <section class="appcta">
        <h3>See it done by an editor.</h3>
        <p>In the app, every story arrives already scored across these four measures, with the reason it ran. Score along, or just read what a person chose for you today.</p>
        <a class="btn red" href="${esc(APP_STORE)}">Get Dot 1 News free &rsaquo;</a>
      </section>
    </main>
    ${footer()}

    <script>
      var APP_BACKEND = 'https://dot-1-news-final.vercel.app';
    (function(){
      var RUBRIC = ${rubricJson};
      var PREFILL = ${prefill};
      var mode = 'quick';

      // state[key] = array of 5 indicator values (0..2). Quick mode drives all
      // five from one 0..10 slider so the composite is identical either way.
      var state = {};
      RUBRIC.forEach(function(r){ state[r.key] = [0,0,0,0,0]; });
      if (PREFILL) { RUBRIC.forEach(function(r){ if (PREFILL[r.key]) state[r.key] = PREFILL[r.key].slice(0,5); }); }

      var elIndices = document.getElementById('indices');
      var elResult = document.getElementById('result');
      var elBars = document.getElementById('bars');
      var elComposite = document.getElementById('composite');
      var elHint = document.getElementById('modeHint');
      var bQuick = document.getElementById('modeQuick');
      var bFull = document.getElementById('modeFull');

      function idxRaw(key){ // 0..10 for one index
        var a = state[key]; return a.reduce(function(s,v){return s+v;},0); // 5 indicators x0..2 = 0..10
      }
      function idxTen(key){ return idxRaw(key); }               // already 0..10
      function composite(){
        var t = RUBRIC.reduce(function(s,r){ return s + idxTen(r.key); },0);
        return (t / RUBRIC.length); // average of four 0..10 => 0..10
      }

      function render(){
        elIndices.innerHTML = '';
        RUBRIC.forEach(function(r){
          var wrap = document.createElement('div');
          wrap.className = 'idx';
          var ten = idxTen(r.key);
          if (mode === 'quick'){
            wrap.innerHTML =
              '<div class="head"><span class="name">'+r.name+'</span>'+
              '<span class="val" style="color:'+r.color+'">'+ten.toFixed(0)+' / 10</span></div>'+
              '<div class="blurb">'+r.blurb+'</div>'+
              '<input class="slider" type="range" min="0" max="10" step="1" value="'+ten+'" '+
              'data-key="'+r.key+'" style="accent-color:'+r.color+'">'+
              '<div class="scale"><span>Absent</span><span>Mixed</span><span>Strong</span></div>';
          } else {
            var inds = r.indicators.map(function(nm, i){
              var v = state[r.key][i];
              return '<div class="ind">'+
                '<div class="lab"><span>'+nm+'</span><b>'+v+'</b></div>'+
                '<input class="slider" type="range" min="0" max="2" step="1" value="'+v+'" '+
                'data-key="'+r.key+'" data-i="'+i+'" style="accent-color:'+r.color+'">'+
                '<div class="miniscale"><span>0</span><span>1</span><span>2</span></div>'+
                '</div>';
            }).join('');
            wrap.innerHTML =
              '<div class="head"><span class="name">'+r.name+'</span>'+
              '<span class="val" style="color:'+r.color+'">'+ten.toFixed(0)+' / 10</span></div>'+
              '<div class="blurb">'+r.blurb+'</div>'+ inds;
          }
          elIndices.appendChild(wrap);
        });
        bindSliders();
        renderResult();
      }

      function bindSliders(){
        var sl = elIndices.querySelectorAll('input.slider');
        sl.forEach(function(s){
          s.addEventListener('input', function(){
            var key = s.getAttribute('data-key');
            if (mode === 'quick'){
              // spread a 0..10 value across five 0..2 indicators as evenly as possible
              var total = parseInt(s.value,10);
              var base = Math.floor(total/5), rem = total - base*5;
              var arr = [0,0,0,0,0].map(function(_,i){ return base + (i<rem?1:0); });
              state[key] = arr;
            } else {
              var i = parseInt(s.getAttribute('data-i'),10);
              state[key][i] = parseInt(s.value,10);
            }
            render();
          });
        });
      }

      function renderResult(){
        var any = RUBRIC.some(function(r){ return idxRaw(r.key) > 0; });
        elResult.style.display = any ? 'block' : 'none';
        if (!any) return;
        elComposite.textContent = composite().toFixed(1);
        elBars.innerHTML = RUBRIC.map(function(r){
          var ten = idxTen(r.key), pct = (ten/10*100);
          return '<div class="bar"><div class="lab"><span>'+r.name+'</span>'+
            '<b>'+ten.toFixed(0)+' / 10</b></div>'+
            '<div class="track"><div class="fill" style="width:'+pct+'%;background:'+r.color+'"></div></div></div>';
        }).join('');
      }

      function setMode(m){
        mode = m;
        bQuick.classList.toggle('on', m==='quick');
        bFull.classList.toggle('on', m==='full');
        elHint.textContent = m==='quick'
          ? 'One slider per measure. Switch to the full rubric for the complete framework.'
          : 'The complete rubric: five indicators per measure, each scored 0, 1, or 2.';
        render();
      }
      bQuick.addEventListener('click', function(){ setMode('quick'); });
      bFull.addEventListener('click', function(){ setMode('full'); });

      // ---- share ----
      function buildShareUrl(){
        var title = document.getElementById('storyTitle').value.trim();
        var parts = RUBRIC.map(function(r){ return state[r.key].join(''); }).join('.');
        var u = new URL(window.location.href.split('?')[0]);
        u.searchParams.set('s', parts);
        if (title) u.searchParams.set('t', title);
        return u.toString();
      }
      function flashCopied(){
        var c = document.getElementById('copied');
        c.style.display = 'inline'; setTimeout(function(){ c.style.display='none'; }, 2200);
      }
      document.getElementById('copyBtn').addEventListener('click', function(){
        var url = buildShareUrl();
        if (navigator.clipboard) { navigator.clipboard.writeText(url).then(flashCopied, function(){ prompt('Copy this link:', url); }); }
        else { prompt('Copy this link:', url); }
      });
      document.getElementById('shareBtn').addEventListener('click', function(){
        var url = buildShareUrl();
        var title = document.getElementById('storyTitle').value.trim();
        var text = (title ? 'I scored "'+title+'" ' : 'I scored a story ') + 'on Dot 1 News: '+composite().toFixed(1)+'/10';
        if (navigator.share) { navigator.share({ title:'My Dot 1 News scorecard', text:text, url:url }).catch(function(){}); }
        else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(flashCopied); }
        else { prompt('Copy this link:', url); }
      });

      // ---- submit to the newsroom review queue ----
      var submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.addEventListener('click', function(){
          var msg = document.getElementById('submitMsg');
          var title = document.getElementById('storyTitle').value.trim();
          var url = document.getElementById('submitUrl').value.trim();
          var honey = document.getElementById('submitHoneypot').value;
          function show(text, cls){ msg.textContent = text; msg.className = 'submit-msg ' + cls; msg.style.display = 'block'; }

          if (title.length < 8) { show('Add the story headline above first.', 'err'); return; }
          if (!/^https?:\\/\\/.+/.test(url)) { show('Please paste a valid link to the story.', 'err'); return; }
          var any = RUBRIC.some(function(r){ return idxRaw(r.key) > 0; });
          if (!any) { show('Score the story on at least one measure first.', 'err'); return; }

          submitBtn.disabled = true;
          show('Sending\\u2026', 'ok');

          fetch(APP_BACKEND + '/api/trpc/content.submitReaderScore?batch=1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "0": { "json": {
              title: title,
              sourceUrl: url,
              scores: {
                BAI: state.BAI, PSI: state.PSI, SCI: state.SCI, HII: state.HII
              },
              website: honey
            }}})
          }).then(function(r){
            if (!r.ok) throw new Error('bad status ' + r.status);
            return r.json();
          }).then(function(){
            show('Thank you. Your suggestion is with our editors, who will read and re-score it before deciding. This does not guarantee it will run.', 'ok');
            submitBtn.textContent = 'Sent';
          }).catch(function(){
            submitBtn.disabled = false;
            show('Something went wrong sending that. Please try again in a moment.', 'err');
          });
        });
      }

      setMode('quick');
    })();
    </script>`;

  return page({
    title: 'Score a Story \u00b7 Dot 1 News',
    desc: 'Paste any headline and score it yourself across the four measures behind Dot 1 News. The same lens our editors use, in your hands.',
    url: opts.url,
    ogType: 'website',
    extraCss: CSS,
    inner,
  });
}

/**
 * A shared scorecard renders as its own page with an OG description carrying the
 * composite, so the preview card says something real, then the live tool loads
 * below it pre-filled. Whoever opens it can adjust and re-share their own.
 */
export function renderSharedScorecard(opts: {
  url: string;
  title: string;
  scores: Record<string, number[]>;
  composite: number;
}): string {
  // Reuse the full tool, prefilled. The distinct OG description is set here.
  const base = renderScorePage({ url: opts.url, prefillTitle: opts.title, prefillScores: opts.scores });
  const desc = (opts.title ? `"${clipLocal(opts.title, 90)}" scored ` : 'A story scored ')
    + `${opts.composite.toFixed(1)}/10 on Dot 1 News. Score your own.`;
  // swap the default description/title metas for the scorecard-specific ones
  return base
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${esc(desc)}">`
    )
    .replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${esc(desc)}">`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*">/,
      `<meta name="twitter:description" content="${esc(desc)}">`
    );
}

function clipLocal(s: string, n: number): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '\u2026' : t;
}
