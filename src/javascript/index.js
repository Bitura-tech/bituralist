
const inputItem = document.getElementById("inputItem");
const inputQty = document.getElementById("inputQty");
const btnSubmit = document.getElementById("btnSubmit");
const divAlert = document.getElementById("divAlert");
const divList = document.getElementById("container-list");
const btnClearAll = document.getElementById("clearAll");
const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const importFile = document.getElementById("importFile");
const themeToggle = document.getElementById("themeToggle");

const soundAdd = document.getElementById("soundAdd");
const soundRemove = document.getElementById("soundRemove");
const soundCheck = document.getElementById("soundCheck");

const errorMsg = "<div id='alert' class='divAlert error'><span>Por favor, preencha o campo para adicionar um item!</span></div>";


btnSubmit.addEventListener("click", addItem);
btnClearAll.addEventListener("click", clearAll);
btnExport.addEventListener("click", exportTxt);
btnImport.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", importTxt);
window.addEventListener("DOMContentLoaded", () => {
  setupItems();
  initTheme();
  updateStats();
});


function addItem(e) {
  e.preventDefault();
  const name = inputItem.value.trim();
  const quantity = Number(inputQty.value) || 1;
  const id = new Date().getTime().toString();

  showMessage(name);
  if (name) {
    addLocalStorage({ id, name, quantity, comprado: false });
    createItem(id, name, quantity, false, true);
    playSound(soundAdd);
    updateStats();
    clearInput();
  }
}


function createItem(id, name, quantity, comprado, appendAnim = false) {
  const itemDiv = document.createElement("div");
  itemDiv.classList.add("item");
  if (appendAnim) itemDiv.classList.add("fade-in");
  itemDiv.dataset.id = id;

  itemDiv.innerHTML = `
    <div class="item-left">
      <input type="checkbox" class="checkItem" ${comprado ? "checked" : ""} aria-label="Marcar como comprado">
      <p class="${comprado ? "comprado" : ""}">${escapeHtml(name)} - <strong>x${quantity}</strong></p>
    </div>
    <div>
      <button class="clearBtn" aria-label="Remover item"><i class="fas fa-trash"></i></button>
    </div>
  `;

  const btnDelete = itemDiv.querySelector(".clearBtn");
  const checkbox = itemDiv.querySelector(".checkItem");
  const p = itemDiv.querySelector("p");

  btnDelete.addEventListener("click", deleteItem);
  checkbox.addEventListener("change", toggleComprado);
  p.addEventListener("click", () => enableEdit(p, id));

  divList.appendChild(itemDiv);
  
  if (appendAnim) {
    itemDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    setTimeout(() => itemDiv.classList.remove("fade-in"), 300);
  }
}


function enableEdit(p, id) {
  const oldText = p.textContent.split(" - ")[0];
  const container = p.parentElement; // .item-left
  const input = document.createElement("input");
  input.type = "text";
  input.value = oldText;
  input.className = "editing-input";

  p.replaceWith(input);
  input.focus();
  
  input.setSelectionRange(input.value.length, input.value.length);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      confirmEdit(input, id);
    } else if (e.key === "Escape") {
      cancelEdit(input, oldText, id);
    }
  });

  
  input.addEventListener("blur", () => confirmEdit(input, id));
}


function confirmEdit(input, id) {
  const newName = input.value.trim();
  let items = getLocalStorage();
  const item = items.find(i => i.id === id);


  const q = item ? item.quantity : 1;
  const c = item ? item.comprado : false;

  if (newName) {
    
    if (item) {
      item.name = newName;
      localStorage.setItem("list", JSON.stringify(items));
    } else {
      
      items.push({ id, name: newName, quantity: q, comprado: c });
      localStorage.setItem("list", JSON.stringify(items));
    }
    input.replaceWith(createItemText(newName, q, c, id));
    updateStats();
  } else {
    
    cancelEdit(input, item ? item.name : `Item`, id);
  }
}


function cancelEdit(input, oldText, id) {
  const items = getLocalStorage();
  const item = items.find(i => i.id === id);
  const q = item ? item.quantity : 1;
  const c = item ? item.comprado : false;
  input.replaceWith(createItemText(oldText, q, c, id));
}


function createItemText(name, quantity, comprado, id) {
  const p = document.createElement("p");
  p.textContent = `${name} - x${quantity}`;
  if (comprado) p.classList.add("comprado");
  p.addEventListener("click", () => enableEdit(p, id));
  return p;
}


function toggleComprado(e) {
  const itemDiv = e.target.closest(".item");
  if (!itemDiv) return;
  const id = itemDiv.dataset.id;
  const p = itemDiv.querySelector("p");
  const checked = e.target.checked;

  p.classList.toggle("comprado", checked);

  let items = getLocalStorage();
  items = items.map(i => {
    if (i.id === id) i.comprado = checked;
    return i;
  });
  localStorage.setItem("list", JSON.stringify(items));
  playSound(soundCheck);
  updateStats();
}

function deleteItem(e) {
  const el = e.currentTarget.closest(".item");
  if (!el) return;
  const id = el.dataset.id;

  el.classList.add("fade-out");
  setTimeout(() => {
    if (el.parentElement) el.parentElement.removeChild(el);
  }, 180);

  removeFromLocalStorage(id);
  playSound(soundRemove);
  updateStats();
}


function clearAll() {

  const children = Array.from(divList.children);
  children.forEach((c, idx) => {
    c.classList.add("fade-out");
    setTimeout(() => c.remove(), 180 + idx * 20);
  });

  btnClearAll.style.visibility = "hidden";
  localStorage.removeItem("list");
  updateStats();
}


function addLocalStorage(obj) {
  let items = getLocalStorage();
  items.push(obj);
  localStorage.setItem("list", JSON.stringify(items));
}

function getLocalStorage() {
  return localStorage.getItem("list") ? JSON.parse(localStorage.getItem("list")) : [];
}

function removeFromLocalStorage(id) {
  let items = getLocalStorage().filter(item => item.id !== id);
  localStorage.setItem("list", JSON.stringify(items));
}


function setupItems() {
  divList.innerHTML = "";
  let items = getLocalStorage();
  if (items.length > 0) {
    items.forEach(item => createItem(item.id, item.name, item.quantity, item.comprado, false));
    btnClearAll.style.visibility = "visible";
  } else {
    btnClearAll.style.visibility = "hidden";
  }
}

// atualiza contador (stats)
function updateStats() {
  const items = getLocalStorage();
  const total = items.length;
  const comprados = items.filter(i => i.comprado).length;
  const pendentes = total - comprados;
  const el = document.getElementById("stats");
  if (el) el.textContent = `Pendentes: ${pendentes} | Comprados: ${comprados} | Total: ${total}`;

  
  if (total > 0) btnClearAll.style.visibility = "visible";
  else btnClearAll.style.visibility = "hidden";
}


function playSound(sound) {
  if (!sound) return;
  try {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  } catch (err) {
    
  }
}
 
const btnAZ = document.getElementById("sortAZ");
const btnZA = document.getElementById("sortZA");
const btnComprados = document.getElementById("sortComprados");
const btnPendentes = document.getElementById("sortPendentes");

if (btnAZ) btnAZ.addEventListener("click", () => sortItems("az"));
if (btnZA) btnZA.addEventListener("click", () => sortItems("za"));
if (btnComprados) btnComprados.addEventListener("click", () => sortItems("comprados"));
if (btnPendentes) btnPendentes.addEventListener("click", () => sortItems("pendentes"));

function sortItems(type) {
  let items = getLocalStorage();

  if (type === "az") items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', {sensitivity: 'base'}));
  if (type === "za") items.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR', {sensitivity: 'base'}));
  if (type === "comprados") items.sort((a, b) => (b.comprado === a.comprado) ? a.name.localeCompare(b.name) : (b.comprado ? 1 : -1));
  if (type === "pendentes") items.sort((a, b) => (a.comprado === b.comprado) ? a.name.localeCompare(b.name) : (a.comprado ? 1 : -1));

  localStorage.setItem("list", JSON.stringify(items));
  setupItems();
  updateStats();
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const currentTheme = saved === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton(currentTheme);

  themeToggle.addEventListener("click", () => {
    const now = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", now);
    localStorage.setItem("theme", now);
    updateThemeButton(now);
  });
}

function updateThemeButton(theme) {
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.title = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
}

function showMessage(hasItem) {
  if (hasItem) {
    const successMsg = `<div id='alert' class='divAlert success'><span>${escapeHtml(hasItem)} adicionado com sucesso!</span></div>`;
    divAlert.innerHTML = successMsg;
    setTimeout(() => { if (divAlert) divAlert.innerHTML = ""; }, 2500);
  } else {
    divAlert.innerHTML = errorMsg;
    setTimeout(() => { if (divAlert) divAlert.innerHTML = ""; }, 2500);
  }
}

function clearInput() {
  inputItem.value = "";
  inputQty.value = 1;
  inputItem.focus();
}


function exportTxt() {
  const items = getLocalStorage();
  if (items.length === 0) {
    alert("Nenhum item para exportar!");
    return;
  }

  const content = items.map(i => `${i.name};${i.quantity};${i.comprado}`).join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const today = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  link.href = URL.createObjectURL(blob);
  link.download = `lista-compras-${today}.txt`;
  link.click();
}


function importTxt(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const lines = evt.target.result.split("\n").filter(l => l.trim() !== "");
    // limpa antes de importar
    localStorage.removeItem("list");
    const newItems = lines.map(line => {
      const [name, quantity, comprado] = line.split(";");
      return {
        id: new Date().getTime().toString() + Math.random().toString(36).slice(2, 8),
        name: (name || "").trim(),
        quantity: Number(quantity) || 1,
        comprado: String(comprado).trim() === "true"
      };
    });
    localStorage.setItem("list", JSON.stringify(newItems));
    setupItems();
    updateStats();
  };
  reader.readAsText(file);
}


function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}
