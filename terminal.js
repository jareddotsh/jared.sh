// Interactive terminal-style typewriter with commands + executable rerun

document.addEventListener('DOMContentLoaded', () => {
  const outputEl = document.getElementById('output');
  const rerunBtn = document.getElementById('rerun');

  const bootLines = [
    '$ ./jared.sh',
    'running jared.sh — displaying contact info...',
    '',
    'Name: Jared Frank',
    'Profession: Creative Technologist',
    'Email: hi@jared.sh',
    'GitHub: https://github.com/jareddotsh',
    'Location: Nashville, TN',
    '',
    'Type "help" to see available commands.',
  ];

  let inputEnabled = false;
  let currentInput = '';
  let isTypingOutput = false;
  let runId = 0; // used to cancel in-flight typing

  /* ---------------- utilities ---------------- */

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function clearCursor() {
    const c = outputEl.querySelector('.cursor');
    if (c) c.remove();
  }

  function moveCursorToEnd(mode = 'idle') {
    clearCursor();
    const cursor = document.createElement('span');
    cursor.className = `cursor ${mode}`;
    cursor.setAttribute('aria-hidden', 'true');
    outputEl.appendChild(cursor);
  }

  /* ---------------- link parsing ---------------- */

  function tokenizeLine(text) {
    const re =
      /(https?:\/\/[^\s]+|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)/g;

    const parts = [];
    let lastIndex = 0;
    let m;

    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIndex)
        parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
      parts.push({ type: 'link', value: m[0] });
      lastIndex = re.lastIndex;
    }

    if (lastIndex < text.length)
      parts.push({ type: 'text', value: text.slice(lastIndex) });

    return parts;
  }

  /* ---------------- typing output ---------------- */

  async function typeLine(text, myRunId) {
    isTypingOutput = true;
    const tokens = tokenizeLine(text);

    for (const token of tokens) {
      if (myRunId !== runId) return;

      if (token.type === 'text') {
        for (const ch of token.value) {
          if (myRunId !== runId) return;
          clearCursor();
          outputEl.appendChild(document.createTextNode(ch));
          moveCursorToEnd('typing');
          await sleep(20 + Math.random() * 50);
        }
      } else {
        const a = document.createElement('a');
        const isEmail = token.value.includes('@') && !token.value.startsWith('http');
        a.href = isEmail ? `mailto:${token.value}` : token.value;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        clearCursor();
        outputEl.appendChild(a);
        moveCursorToEnd('typing');

        for (const ch of token.value) {
          if (myRunId !== runId) return;
          a.appendChild(document.createTextNode(ch));
          moveCursorToEnd('typing');
          await sleep(20 + Math.random() * 50);
        }
      }
    }

    isTypingOutput = false;
  }

  async function runBootSequence() {
    runId++; // invalidate any in-flight output
    const myRunId = runId;

    outputEl.innerHTML = '';
    inputEnabled = false;
    currentInput = '';

    for (let i = 0; i < bootLines.length; i++) {
      await typeLine(bootLines[i], myRunId);
      if (i < bootLines.length - 1)
        outputEl.appendChild(document.createTextNode('\n'));
      if (myRunId !== runId) return;
    }

    outputEl.appendChild(document.createTextNode('\n\n$ '));
    inputEnabled = true;
    moveCursorToEnd('idle');
  }

  /* ---------------- commands ---------------- */

  const commands = {
    help: async myRunId => {
      await typeLine('Available commands:', myRunId);
      outputEl.appendChild(document.createTextNode('\n'));
      await typeLine('  help        Show this message', myRunId);
      outputEl.appendChild(document.createTextNode('\n'));
      await typeLine('  about       About Jared', myRunId);
      outputEl.appendChild(document.createTextNode('\n'));
      await typeLine('  contact     Contact information', myRunId);
      outputEl.appendChild(document.createTextNode('\n'));
      await typeLine('  clear       Clear the terminal', myRunId);
    },

    about: async myRunId => {
      await typeLine(
        'Jared Frank is a Creative Technologist focused on consulting and cybersecurity, coming up with creative solutions to complex problems.',
        myRunId
      );
    },

    contact: async myRunId => {
      await typeLine('Email: hi@jared.sh', myRunId);
      outputEl.appendChild(document.createTextNode('\n'));
      await typeLine('GitHub: https://github.com/jareddotsh', myRunId);
    },

    clear: async () => {
      outputEl.innerHTML = '';
    },

    './jared.sh': async () => {
      await runBootSequence();
    },

    'ls' : async myRunId => {
      await typeLine('jared.sh', myRunId);
    }
  };

  async function runCommand(cmd) {
    if (!cmd) return;

    const myRunId = runId;
    const command = commands[cmd.toLowerCase()];

    if (command) {
      await command(myRunId);
    } else {
      await typeLine(`command not found: ${cmd}`, myRunId);
    }
  }

  /* ---------------- keyboard input ---------------- */

  document.addEventListener('keydown', async e => {
    if (!inputEnabled || isTypingOutput) return;

    if (e.key === 'Enter') {
      inputEnabled = false;
      clearCursor();
      outputEl.appendChild(document.createTextNode('\n'));

      await runCommand(currentInput.trim());
      currentInput = '';

      if (!isTypingOutput) {
        outputEl.appendChild(document.createTextNode('\n$ '));
        inputEnabled = true;
        moveCursorToEnd('idle');
      }
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
        // Find and remove the last text node (not the cursor)
        for (let i = outputEl.childNodes.length - 1; i >= 0; i--) {
          const node = outputEl.childNodes[i];
          if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('cursor'))) {
            outputEl.removeChild(node);
            break;
          }
        }
        moveCursorToEnd('typing');
      }
      return;
    }

    if (e.key.length !== 1) return;

    currentInput += e.key;
    clearCursor();
    outputEl.appendChild(document.createTextNode(e.key));
    moveCursorToEnd('typing');
  });

  /* ---------------- rerun button ---------------- */

  rerunBtn?.addEventListener('click', runBootSequence);

  /* ---------------- start ---------------- */

  runBootSequence();
});
