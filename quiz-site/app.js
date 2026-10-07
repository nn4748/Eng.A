/* =====================================================================
   GOOGLE FORM SETTINGS — results are sent to this form, and the form
   saves them in its linked Google Sheet.
   ===================================================================== */
const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSddsL43Fly4DV8QS67jb9dea8mX4XBxBEsB4c2pec_s4kEAGQ/formResponse";
const FORM_FIELDS = {
  name:      "entry.183529662",
  studentId: "entry.1212004947",
  q1:        "entry.1386237338",
  q2:        "entry.1789514073",
  q3:        "entry.662991097",
  score:     "entry.936423623"
};
/* ===================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "ce306-bending-quiz-v1";

  const QUESTIONS = [
    {
      q: "Which beam failed suddenly without any warning?",
      options: ["Steel beam", "Concrete beam", "Both failed the same way", "Neither failed"],
      correct: 1,
      why: "Concrete is brittle, so it cracks suddenly with no warning."
    },
    {
      q: "Concrete is much stronger in:",
      options: ["Tension", "Compression", "Both are equal"],
      correct: 1,
      why: "Concrete is weak in tension, so it cracked at the bottom (tension) face."
    },
    {
      q: "For the concrete test to be valid (ASTM C78), where must the crack happen?",
      options: [
        "At one of the supports",
        "Exactly under a load point",
        "Within the middle third of the span",
        "Anywhere along the beam"
      ],
      correct: 2,
      why: "The middle third has a constant moment, so the beam fails in pure bending."
    }
  ];

  const LETTERS = ["A", "B", "C", "D", "E"];

  /* ---------- storage (never let a blocked localStorage break the quiz) ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }
  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- elements ---------- */
  const $ = (id) => document.getElementById(id);
  const screens = { start: $("screen-start"), quiz: $("screen-quiz"), result: $("screen-result") };

  function show(name) {
    Object.keys(screens).forEach((k) => { screens[k].hidden = k !== name; });
    document.body.className = name === "quiz" ? "theme-white" : "theme-navy";
    document.querySelector('meta[name="theme-color"]')
      .setAttribute("content", name === "quiz" ? "#FFFFFF" : "#0B1F3A");
    window.scrollTo(0, 0);
  }

  /* ---------- state ---------- */
  let student = { name: "", id: "" };
  let index = 0;
  let selected = null;
  let answered = false;
  let answers = [];
  let finishing = false;

  /* ---------- start screen ---------- */
  const nameInput = $("name");
  const sidInput = $("sid");

  sidInput.addEventListener("input", () => {
    const digits = sidInput.value.replace(/\D/g, "");
    if (digits !== sidInput.value) sidInput.value = digits;
    setError(sidInput, $("sid-error"), false);
  });
  nameInput.addEventListener("input", () => setError(nameInput, $("name-error"), false));

  function setError(input, msg, on) {
    msg.hidden = !on;
    if (on) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const id = sidInput.value.trim();
    const badName = name.length < 2;
    const badId = !/^\d+$/.test(id);
    setError(nameInput, $("name-error"), badName);
    setError(sidInput, $("sid-error"), badId);
    if (badName) { nameInput.focus(); return; }
    if (badId) { sidInput.focus(); return; }

    student = { name: name, id: id };
    index = 0;
    answers = [];
    renderQuestion();
    show("quiz");
  });

  /* ---------- quiz screen ---------- */
  const optionsEl = $("options");
  const mainBtn = $("btn-main");
  const feedbackEl = $("feedback");

  function renderQuestion() {
    const item = QUESTIONS[index];
    selected = null;
    answered = false;

    $("step").textContent = (index + 1) + " / " + QUESTIONS.length;
    $("q-num").textContent = "Q" + (index + 1);
    $("q-text").textContent = item.q;

    document.querySelectorAll(".progress span").forEach((bar, i) => {
      bar.className = i < index ? "done" : i === index ? "current" : "";
    });

    optionsEl.className = "options";
    optionsEl.innerHTML = "";
    item.options.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.dataset.index = String(i);
      btn.innerHTML = '<span class="letter"></span><span class="label"></span><span class="mark"></span>';
      btn.querySelector(".letter").textContent = LETTERS[i];
      btn.querySelector(".label").textContent = text;
      btn.addEventListener("click", () => choose(i));
      optionsEl.appendChild(btn);
    });

    feedbackEl.hidden = true;
    feedbackEl.className = "feedback";
    mainBtn.textContent = "Check answer";
    mainBtn.disabled = true;
  }

  function choose(i) {
    if (answered) return;
    selected = i;
    optionsEl.querySelectorAll(".option").forEach((b) => {
      b.setAttribute("aria-checked", String(Number(b.dataset.index) === i));
    });
    mainBtn.disabled = false;
  }

  function reveal() {
    const item = QUESTIONS[index];
    const isRight = selected === item.correct;
    answered = true;
    answers.push(selected);

    optionsEl.classList.add("locked");
    optionsEl.querySelectorAll(".option").forEach((b) => {
      const i = Number(b.dataset.index);
      b.disabled = true;
      if (i === item.correct) {
        b.classList.add("is-correct");
        b.querySelector(".mark").textContent = "✓";
      } else if (i === selected) {
        b.classList.add("is-wrong");
        b.querySelector(".mark").textContent = "✕";
      }
    });

    feedbackEl.className = "feedback " + (isRight ? "correct" : "wrong");
    $("fb-kicker").textContent = isRight ? "Correct" : "Not quite";
    $("fb-text").textContent = (isRight ? "" : "The answer is “" + item.options[item.correct] + ".” ") + item.why;
    feedbackEl.hidden = false;

    const last = index === QUESTIONS.length - 1;
    mainBtn.textContent = last ? "See my result" : "Next";
    mainBtn.disabled = false;
    mainBtn.focus({ preventScroll: true });
    feedbackEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  mainBtn.addEventListener("click", () => {
    if (mainBtn.disabled) return;
    if (!answered) {
      if (selected === null) return;
      reveal();
      return;
    }
    if (index < QUESTIONS.length - 1) {
      index += 1;
      renderQuestion();
      window.scrollTo(0, 0);
    } else {
      finish();
    }
  });

  /* ---------- finish & submit ---------- */
  function finish() {
    if (finishing) return;          // guard against double taps
    finishing = true;
    mainBtn.disabled = true;

    const score = answers.reduce((s, a, i) => s + (a === QUESTIONS[i].correct ? 1 : 0), 0);
    const record = {
      name: student.name,
      id: student.id,
      answers: answers,
      score: score,
      finishedAt: new Date().toISOString(),
      sent: false
    };
    save(record);                   // saved BEFORE sending, so a refresh can never resubmit a new attempt
    renderResult(record, false);
    show("result");
    send(record);
  }

  function send(record) {
    const status = $("save-status");
    status.textContent = "Saving your result…";

    const values = {
      name: record.name,
      studentId: record.id,
      q1: answerText(0, record.answers[0]),
      q2: answerText(1, record.answers[1]),
      q3: answerText(2, record.answers[2]),
      score: String(record.score)
    };
    const body = new URLSearchParams();
    Object.keys(FORM_FIELDS).forEach((key) => {
      if (FORM_FIELDS[key]) body.append(FORM_FIELDS[key], values[key]);
    });

    // Google Forms doesn't allow reading the reply (no-cors), but a form-encoded
    // POST is a "simple" request, so the browser sends it without a preflight.
    fetch(FORM_URL, { method: "POST", mode: "no-cors", body: body })
      .then(() => {
        record.sent = true;
        save(record);
        status.textContent = "✓ Your result has been submitted.";
      })
      .catch(() => {
        status.textContent = "We couldn’t reach the results sheet. Your score is shown above — please show this screen to your instructor.";
      });
  }

  function answerText(q, a) {
    return a === null || a === undefined ? "" : QUESTIONS[q].options[a];
  }

  /* ---------- result screen ---------- */
  const MESSAGES = [
    "Keep going — the explanations below will help.",
    "Good effort — review the key ideas below.",
    "Great job — nearly perfect!",
    "Excellent — full marks!"
  ];

  function renderResult(record, returning) {
    $("score").textContent = String(record.score);
    $("score-msg").textContent = MESSAGES[record.score] || "";
    $("who").textContent = record.name + "  ·  " + record.id;

    const list = $("review");
    list.innerHTML = "";
    QUESTIONS.forEach((item, i) => {
      const a = record.answers[i];
      const ok = a === item.correct;
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="r-num"></span>' +
        '<div><p class="r-q"></p>' +
        '<p class="r-line">Your answer: <strong class="r-yours"></strong><span class="r-tag"></span></p>' +
        (ok ? "" : '<p class="r-line">Correct answer: <strong class="r-correct"></strong></p>') +
        "</div>";
      li.querySelector(".r-num").textContent = "Q" + (i + 1);
      li.querySelector(".r-q").textContent = item.q;
      li.querySelector(".r-yours").textContent = answerText(i, a) || "—";
      const tag = li.querySelector(".r-tag");
      tag.textContent = ok ? "Correct" : "Wrong";
      tag.classList.add(ok ? "ok" : "no");
      if (!ok) li.querySelector(".r-correct").textContent = item.options[item.correct];
      list.appendChild(li);
    });

    if (returning) {
      $("save-status").textContent = record.sent
        ? "✓ You have already submitted this quiz."
        : "";
    }
  }

  /* ---------- boot ---------- */
  // Organisers can open the site with ?reset to clear this phone's saved attempt (for testing).
  if (/[?&]reset\b/.test(location.search)) {
    clear();
    history.replaceState(null, "", location.pathname);
  }

  const previous = load();
  if (previous && Array.isArray(previous.answers) && previous.answers.length === QUESTIONS.length) {
    finishing = true;
    renderResult(previous, true);
    show("result");
    if (!previous.sent) send(previous);   // retry only if the earlier attempt never left the phone
  } else {
    show("start");
  }
})();
