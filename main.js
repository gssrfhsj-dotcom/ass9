let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
let editId = null;
let photoData = "";

const $ = (id) => document.getElementById(id);
function save() {
  localStorage.setItem("contacts", JSON.stringify(contacts));
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function showModal() {
  $("modal").classList.add("show");
}

function hideModal() {
  $("modal").classList.remove("show");
  $("contactForm").reset();
  clearErrors();
  editId = null;
  photoData = "";
  $("modalTitle").textContent = "Add New Contact";
  $("photoPreview").innerHTML = '<i class="fa-solid fa-user"></i>';
}

$("addBtn").addEventListener("click", showModal);
$("closeModal").addEventListener("click", hideModal);
$("cancelBtn").addEventListener("click", hideModal);
function avatarHtml(c) {
  return c.photo
    ? `<img src="${c.photo}" alt="">`
    : escapeHtml(c.name.trim()[0].toUpperCase());
}

function cardHtml(c) {
  return `
  <article class="contact-card">
    <div class="card-top">
      <div class="avatar">${avatarHtml(c)}</div>
      <div class="card-info">
        <h4>${escapeHtml(c.name)}
          ${c.emergency ? '<i class="fa-solid fa-heart-pulse pulse"></i>' : ""}
        </h4>
        ${c.group ? `<span class="group-tag">${c.group}</span>` : ""}
      </div>
      <button class="fav-btn ${c.favorite ? "active" : ""}" data-action="fav" data-id="${c.id}">
        <i class="fa-solid fa-star"></i>
      </button>
    </div>
    <ul class="card-details">
      <li><i class="fa-solid fa-phone"></i> ${escapeHtml(c.phone)}</li>
      ${c.email ? `<li><i class="fa-solid fa-envelope"></i> ${escapeHtml(c.email)}</li>` : ""}
      ${c.address ? `<li><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.address)}</li>` : ""}
    </ul>
    <div class="card-actions">
      <a class="act call" href="tel:${c.phone}"><i class="fa-solid fa-phone"></i></a>
      ${c.email ? `<a class="act mail" href="mailto:${c.email}"><i class="fa-solid fa-envelope"></i></a>` : ""}
      <button class="act edit" data-action="edit" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
      <button class="act del" data-action="delete" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
    </div>
  </article>`;
}

function miniCardHtml(c) {
  return `
  <div class="mini-card">
    <div class="avatar">${avatarHtml(c)}</div>
    <div>
      <h4>${escapeHtml(c.name)}</h4>
      <p>${escapeHtml(c.phone)}</p>
    </div>
    <a class="act call" href="tel:${c.phone}"><i class="fa-solid fa-phone"></i></a>
  </div>`;
}
function renderPanel(listId, emptyId, items) {
  $(listId).innerHTML = items.map(miniCardHtml).join("");
  $(emptyId).classList.toggle("hidden", items.length > 0);
}

function render() {
  const q = $("searchInput").value.trim().toLowerCase();

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
  );

  $("contactsList").innerHTML = filtered.map(cardHtml).join("");
  $("emptyState").classList.toggle("hidden", filtered.length > 0);

  const favs = contacts.filter((c) => c.favorite);
  const emergencies = contacts.filter((c) => c.emergency);

  $("totalCount").textContent = contacts.length;
  $("favCount").textContent = favs.length;
  $("emergencyCount").textContent = emergencies.length;
  $("subtitle").textContent = `Manage and organize your ${contacts.length} contacts`;

  renderPanel("favList", "favEmpty", favs);
  renderPanel("emergencyList", "emergencyEmpty", emergencies);
}
function clearErrors() {
  ["fullName", "phone", "email"].forEach((id) => $(id).classList.remove("invalid"));
  $("nameError").textContent = "";
  $("phoneError").textContent = "";
  $("emailError").textContent = "";
}

function setError(inputId, errorId, message) {
  $(inputId).classList.add("invalid");
  $(errorId).textContent = message;
}

function validate() {
  clearErrors();
  let valid = true;

  const name = $("fullName").value.trim();
  const phone = $("phone").value.trim();
  const email = $("email").value.trim();

  if (!/^[\p{L}][\p{L}\s.'-]{1,39}$/u.test(name)) {
    setError("fullName", "nameError", "Enter a name of 2–40 letters.");
    valid = false;
  }

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    setError("phone", "phoneError", "Enter a valid Egyptian number, like 01012345678.");
    valid = false;
  } else if (contacts.some((c) => c.phone === phone && c.id !== editId)) {
    setError("phone", "phoneError", "This phone number is already saved.");
    valid = false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    setError("email", "emailError", "Enter a valid email, like name@example.com.");
    valid = false;
  }

  return valid;
}
$("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;

  const data = {
    name: $("fullName").value.trim(),
    phone: $("phone").value.trim(),
    email: $("email").value.trim(),
    address: $("address").value.trim(),
    group: $("group").value,
    notes: $("notes").value.trim(),
    favorite: $("isFavorite").checked,
    emergency: $("isEmergency").checked,
    photo: photoData,
  };

  const isEdit = editId !== null;

  if (isEdit) {
    const index = contacts.findIndex((c) => c.id === editId);
    contacts[index] = { id: editId, ...data };
  } else {
    contacts.push({ id: Date.now(), ...data });
  }

  save();
  render();
  hideModal();
  Swal.fire({
    icon: "success",
    title: isEdit ? "Contact updated" : "Contact added",
    timer: 1400,
    showConfirmButton: false,
  });
});

function startEdit(id) {
  const c = contacts.find((c) => c.id === id);
  editId = id;
  photoData = c.photo || "";

  $("fullName").value = c.name;
  $("phone").value = c.phone;
  $("email").value = c.email;
  $("address").value = c.address;
  $("group").value = c.group;
  $("notes").value = c.notes;
  $("isFavorite").checked = c.favorite;
  $("isEmergency").checked = c.emergency;

  $("modalTitle").textContent = "Edit Contact";
  if (c.photo) $("photoPreview").innerHTML = `<img src="${c.photo}" alt="">`;
  showModal();
}

async function deleteContact(id) {
  const c = contacts.find((c) => c.id === id);
  const result = await Swal.fire({
    title: "Delete this contact?",
    text: `${c.name} will be removed permanently.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e5483b",
    confirmButtonText: "Delete",
  });
  if (!result.isConfirmed) return;

  contacts = contacts.filter((c) => c.id !== id);
  save();
  render();
  Swal.fire({ icon: "success", title: "Contact deleted", timer: 1200, showConfirmButton: false });
}

function toggleFavorite(id) {
  const c = contacts.find((c) => c.id === id);
  c.favorite = !c.favorite;
  save();
  render();
}

$("contactsList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "fav") toggleFavorite(id);
  if (action === "edit") startEdit(id);
  if (action === "delete") deleteContact(id);
});
$("photoInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 300 * 1024) {
    Swal.fire("Image too large", "Choose an image under 300KB.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    photoData = reader.result;
    $("photoPreview").innerHTML = `<img src="${photoData}" alt="">`;
  };
  reader.readAsDataURL(file);
});

$("searchInput").addEventListener("input", render);

render();