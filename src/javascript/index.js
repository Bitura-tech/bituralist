const inputItem = document.getElementById("inputItem");
const inputQty = document.getElementById("inputQty");
const btnSubmit = document.getElementById("btnSubmit");
const divAlert = document.getElementById("divAlert");
const divList = document.getElementById("container-list");
const btnClearAll = document.getElementById("clearAll");
const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const importFile = document.getElementById("importFile");

const errorMsg = "<div id='alert' class='divAlert error'><span>Por favor, preencha o campo para adicionar um item!</span></div>";

btnSubmit.addEventListener("click", addItem);
btnClearAll.addEventListener("click", clearAll);
btnExport.addEventListener("click", exportTxt);
btnImport.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", importTxt);

function addItem(e) {
  e.preventDefault();
  const name = inputItem.value.trim();
  const quantity = inputQty.value || 1;
  const id = new Date().getTime().toString();

  showMessage(name);
  if (name) {
    createItem(id, name, quantity, false);
    addLocalStorage({ id, name, quantity, comprado: false });
    btnClearAll.style.visibility = "visible";
    clearInput();
  }
}

function createItem(id, name, quantity, comprado) {
  const itemDiv = document.createElement("div");
  itemDiv.classList.add("item");
  itemDiv.dataset.id = id;

  itemDiv.innerHTML = `
    <input type="checkbox" class="checkItem" ${comprado ? "checked" : ""}>
    <p class="${comprado ? "comprado" : ""}">${name} - <strong>x${quantity}</strong></p>
    <div><button class="clearBtn"><i class="fas fa-trash"></i></button></div>
  `;

  const btnDelete = itemDiv.querySelector(".clearBtn");
  const checkbox = itemDiv.querySelector(".checkItem");

  btnDelete.addEventListener("click", deleteItem);
  checkbox.addEventListener("change", toggleComprado);

  divList.appendChild(itemDiv);
}

function toggleComprado(e) {
  const itemDiv = e.target.closest(".item");
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
}

function showMessage(hasItem) {
  if (hasItem) {
    const successMsg = `<div id='alert' class='divAlert success'><span>${hasItem} adicionado com sucesso!</span></div>`;
    divAlert.innerHTML = successMsg;
    setTimeout(() => divAlert.innerHTML = "", 3000);
  } else {
    divAlert.innerHTML = errorMsg;
    setTimeout(() => divAlert.innerHTML = "", 3000);
  }
}

function clearInput() {
  inputItem.value = "";
  inputQty.value = 1;
}

function deleteItem(e) {
  const el = e.currentTarget.closest(".item");
  const id = el.dataset.id;
  divList.removeChild(el);
  removeFromLocalStorage(id);
}

function clearAll() {
  divList.innerHTML = "";
  btnClearAll.style.visibility = "hidden";
  localStorage.removeItem("list");
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
  let items = getLocalStorage();
  if (items.length > 0) {
    items.forEach(item => {
      createItem(item.id, item.name, item.quantity, item.comprado);
    });
    btnClearAll.style.visibility = "visible";
  }
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
    clearAll();
    const newItems = lines.map(line => {
      const [name, quantity, comprado] = line.split(";");
      return {
        id: new Date().getTime().toString() + Math.random(),
        name: name.trim(),
        quantity: quantity || 1,
        comprado: comprado === "true"
      };
    });
    newItems.forEach(i => createItem(i.id, i.name, i.quantity, i.comprado));
    localStorage.setItem("list", JSON.stringify(newItems));
    btnClearAll.style.visibility = "visible";
  };
  reader.readAsText(file);
}

window.addEventListener("DOMContentLoaded", setupItems);
