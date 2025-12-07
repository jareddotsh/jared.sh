// Terminal-style typewriter with clickable links (v2)
// This version appends anchors to the DOM first, then types into them character-by-character
// so links visibly type like normal text.

document.addEventListener('DOMContentLoaded', () => {
  const outputEl = document.getElementById('output');
  const rerunBtn = document.getElementById('rerun');

  const lines = [
    '$ ./jared.sh',
    'running jared.sh — displaying contact info...',
    '',
    'Name: Jared Frank',
    'Profession: Cybersecurity Consultant',
    'Email: hi@jared.sh',
    'GitHub: https://github.com/jareddotsh',
    'Location: Nashville, TN',
    '',
    'Thanks for stopping by. Feel free to reach out!',
  ];

  let stopping = false;
  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  function clearCursor(){
    const c = outputEl.querySelector('.cursor');
    if (c) c.remove();
  }
  function showCursor(){
    clearCursor();
    const span = document.createElement('span');
    span.className = 'cursor';
    span.setAttribute('aria-hidden','true');
    outputEl.appendChild(span);
  }

  function tokenizeLine(text){
    const re = /(https?:\/\/[^\s]+|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)/g;
    const parts = [];
    let lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null){
      if (m.index > lastIndex) parts.push({type:'text', value: text.slice(lastIndex, m.index)});
      parts.push({type:'link', value: m[0]});
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) parts.push({type:'text', value: text.slice(lastIndex)});
    return parts;
  }

  async function typeLines(){
    outputEl.innerHTML = '';
    for (let i = 0; i < lines.length; i++){
      await typeLine(lines[i]);
      if (i < lines.length - 1) outputEl.appendChild(document.createTextNode('\n'));
      if (stopping) break;
    }
    outputEl.appendChild(document.createTextNode('\n$ '));
    showCursor();
  }

  // Type a line where links are typed visibly.
  async function typeLine(text){
    const tokens = tokenizeLine(text);
    for (const token of tokens){
      if (token.type === 'text'){
        for (let i = 0; i < token.value.length; i++){
          outputEl.appendChild(document.createTextNode(token.value[i]));
          await sleep(20 + Math.random() * 60);
          if (stopping) return;
        }
      } else if (token.type === 'link'){
        const a = document.createElement('a');
        const isEmail = token.value.includes('@') && !token.value.startsWith('http');
        a.href = isEmail ? ('mailto:' + token.value) : token.value;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // append the anchor immediately so users see the element
        outputEl.appendChild(a);
        // type into the anchor character by character
        for (let i = 0; i < token.value.length; i++){
          a.appendChild(document.createTextNode(token.value[i]));
          await sleep(20 + Math.random() * 60);
          if (stopping) return;
        }
      }
    }
  }

  rerunBtn?.addEventListener('click', ()=>{
    stopping = false;
    typeLines();
  });

  typeLines();
});
