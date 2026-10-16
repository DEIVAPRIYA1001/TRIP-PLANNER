
const DESTINATIONS = [
  { id: "bali",      name: "Bali",             region: "Indonesia",     category: "beach",    price: 899,  rating: 4.8, blurb: "Rice terraces, temple sunsets and warm reef water.", img: "https://picsum.photos/seed/bali-trip/600/400" },
  { id: "swiss",     name: "Swiss Alps",       region: "Switzerland",   category: "mountain", price: 1450, rating: 4.9, blurb: "Cable cars, glacier trails and alpine villages.", img: "https://picsum.photos/seed/swiss-alps/600/400" },
  { id: "machu",     name: "Machu Picchu",     region: "Peru",          category: "heritage", price: 1120, rating: 4.9, blurb: "Inca citadel above the clouds in the Andes.", img: "https://picsum.photos/seed/machu-picchu/600/400" },
  { id: "serengeti", name: "Serengeti",        region: "Tanzania",      category: "wildlife", price: 1690, rating: 4.7, blurb: "The great migration across endless plains.", img: "https://picsum.photos/seed/serengeti-safari/600/400" },
  { id: "santorini", name: "Santorini",        region: "Greece",        category: "beach",    price: 1030, rating: 4.8, blurb: "Whitewashed cliffs over a caldera of blue.", img: "https://picsum.photos/seed/santorini-view/600/400" },
  { id: "kyoto",     name: "Kyoto",            region: "Japan",         category: "heritage", price: 1240, rating: 4.9, blurb: "Bamboo groves, temples and quiet tea houses.", img: "https://picsum.photos/seed/kyoto-temple/600/400" },
  { id: "patagonia", name: "Patagonia",        region: "Chile / Argentina", category: "mountain", price: 1580, rating: 4.7, blurb: "Granite towers and glacial lakes at the end of the world.", img: "https://picsum.photos/seed/patagonia-trek/600/400" },
  { id: "maldives",  name: "Maldives",         region: "Maldives",      category: "beach",    price: 1990, rating: 4.9, blurb: "Overwater villas above turquoise lagoons.", img: "https://picsum.photos/seed/maldives-water/600/400" },
];
const PACKAGES = [
  { id: "explorer", name: "Explorer",  price: 799,  desc: "A lean, flexible package for independent travellers who just need the essentials booked.",
    includes: [
      { icon: "🏨", label: "3-star stays" },
      { icon: "✈️", label: "Return flights" },
      { icon: "🗺️", label: "Self-guided map" },
    ] },
  { id: "comfort", name: "Comfort",  price: 1299, desc: "Our most popular package — guided days, breakfast included, airport transfers handled.",
    includes: [
      { icon: "🏨", label: "4-star stays" },
      { icon: "✈️", label: "Return flights" },
      { icon: "🍳", label: "Daily breakfast" },
      { icon: "🚐", label: "Airport transfers" },
    ] },
  { id: "signature", name: "Signature", price: 2199, desc: "Full-service travel: private guide, curated dining and premium stays throughout.",
    includes: [
      { icon: "🏨", label: "5-star stays" },
      { icon: "✈️", label: "Return flights" },
      { icon: "🧑‍✈️", label: "Private guide" },
      { icon: "🍽️", label: "All meals" },
      { icon: "🚐", label: "All transfers" },
    ] },
];
const WISHLIST_KEY = "tripmate_wishlist";
const VIEWED_KEY = "tripmate_viewed_session";
const THEME_KEY = "tripmate_theme";
const API_URL = "php/api.php";
let currentUser = null;
let serverWishlist = [];
async function apiRequest(action, method = "GET", payload = null, extra = "") {
  const options = { method, credentials: "same-origin", headers: { "Accept": "application/json" } };
  if (payload !== null) { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(payload); }
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}${extra}`, options);
  let result;
  try { result = await response.json(); } catch { throw new Error(`Invalid server response (HTTP ${response.status}). Check PHP/MySQL setup.`); }
  if (!response.ok || !result.ok) throw new Error(result.error || `Request failed (HTTP ${response.status}).`);
  return result;
}
// jQuery AJAX helper used by the wishlist to demonstrate asynchronous PHP/MySQL operations.
function jqueryApiRequest(action, method = "GET", payload = null, extra = "") {
  return new Promise((resolve, reject) => {
    if (!window.jQuery) {
      // Fallback keeps the application usable if the CDN is temporarily unavailable.
      const options = { method, credentials: "same-origin", headers: { Accept: "application/json" } };
      if (payload !== null) { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(payload); }
      fetch(`${API_URL}?action=${encodeURIComponent(action)}${extra}`, options)
        .then(async response => {
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || `Request failed (HTTP ${response.status}).`);
          resolve(result);
        }).catch(reject);
      return;
    }
    $.ajax({
      url: `${API_URL}?action=${encodeURIComponent(action)}${extra}`,
      type: method,
      data: payload === null ? undefined : JSON.stringify(payload),
      contentType: payload === null ? undefined : "application/json; charset=UTF-8",
      dataType: "json",
      headers: { Accept: "application/json" },
      xhrFields: { withCredentials: true },
      success: result => {
        if (result && result.ok) resolve(result);
        else reject(new Error(result?.error || "The server could not complete the request."));
      },
      error: xhr => reject(new Error(xhr.responseJSON?.error || `AJAX request failed (HTTP ${xhr.status || "network"}). Check PHP/MySQL setup.`))
    });
  });
}
function getWishlist() { return currentUser ? [...serverWishlist] : []; }
function saveWishlist(list) { serverWishlist = [...new Set(list)]; }
async function toggleWishlist(id) {
  if (!currentUser) { openAuthDialog(`Log in or create an account to save ${DESTINATIONS.find(d => d.id === id)?.name || "this destination"} to MySQL.`); return; }
  const wasSaved = serverWishlist.includes(id);
  try {
    if (wasSaved) {
      await jqueryApiRequest("wishlist", "DELETE", null, `&destination_id=${encodeURIComponent(id)}`);
      serverWishlist = serverWishlist.filter(item => item !== id);
      showToast("Removed from MySQL wishlist", "success");
    } else {
      await jqueryApiRequest("wishlist", "POST", { destination_id: id });
      if (!serverWishlist.includes(id)) serverWishlist.push(id);
      showToast("Wishlist saved to MySQL", "success");
    }
    renderWishlist(); 
renderGallery();
    const modalButton = document.getElementById("modalWishlistBtn");
    if (modalButton && activeModalDestId === id) modalButton.textContent = serverWishlist.includes(id) ? "Remove from wishlist" : "Save to wishlist";
  } catch (error) { showToast(error.message, "error"); if (error.message.toLowerCase().includes("log in")) openAuthDialog(error.message); }
}
function getViewed() {
  try { return JSON.parse(sessionStorage.getItem(VIEWED_KEY)) || []; }
  catch { return []; }
}
function markViewed(id) {
  const list = getViewed();
  if (!list.includes(id)) list.push(id);
  sessionStorage.setItem(VIEWED_KEY, JSON.stringify(list));
  renderViewed();
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.themeChoice === theme);
  });
  localStorage.setItem(THEME_KEY, theme);
}
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.themeChoice));
});
applyTheme(localStorage.getItem(THEME_KEY) || "beach");
const siteHeader = document.getElementById("siteHeader");
const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  const scrolled = window.scrollY > 20;
  siteHeader.classList.toggle("scrolled", scrolled);
  backToTop.classList.toggle("hidden", window.scrollY < 400);
});
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
const navLinks = document.querySelectorAll(".nav-link");
const navSections = ["home", "destinations", "about", "plan-trip", "packages", "help"]
  .map(id => document.getElementById(id)).filter(Boolean);
window.addEventListener("scroll", () => {
  let current = navSections[0]?.id;
  navSections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + current);
  });
});
const galleryGrid = document.getElementById("galleryGrid");
function renderGallery(filter = "all") {
  const wishlist = getWishlist();
  galleryGrid.innerHTML = "";
  DESTINATIONS.forEach(dest => {
    if (filter !== "all" && dest.category !== filter) return;
    const saved = wishlist.includes(dest.id);
    const card = document.createElement("article");
    card.className = "dest-card";
    card.draggable = true;
    card.dataset.id = dest.id;
    card.innerHTML = `
      <div class="dest-media">
        <img src="${dest.img}" alt="${dest.name}">
        <span class="dest-tag">${dest.category}</span>
        <button type="button" class="dest-wish ${saved ? "saved" : ""}" data-id="${dest.id}" aria-label="Save to wishlist">${saved ? "♥" : "♡"}</button>
      </div>
      <div class="dest-body">
        <h3>${dest.name}</h3>
        <p class="dest-region">${dest.region}</p>
        <div class="dest-meta">
          <span class="dest-price">$${dest.price}</span>
          <span class="dest-rating">★ ${dest.rating}</span>
        </div>
        <button type="button" class="dest-view" data-id="${dest.id}">View details</button>
      </div>`;
    galleryGrid.appendChild(card);
  });
  galleryGrid.querySelectorAll(".dest-card").forEach(card => {
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ source: "gallery", id: card.dataset.id }));
    });
  });
  galleryGrid.querySelectorAll(".dest-view").forEach(btn => {
    btn.addEventListener("click", () => openDestModal(btn.dataset.id));
  });
}
// Delegated jQuery event handling keeps wishlist buttons working after gallery re-rendering.
if (window.jQuery) {
  $(document).on("click", ".dest-wish", function (event) {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist($(this).data("id"));
  });
} else {
  document.addEventListener("click", event => {
    const button = event.target.closest(".dest-wish");
    if (button) { event.preventDefault(); event.stopPropagation(); toggleWishlist(button.dataset.id); }
  });
}

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    renderGallery(chip.dataset.filter);
  });
});
function renderWishlist() {
  const list = getWishlist();
  const wishlistList = document.getElementById("wishlistList");
  document.getElementById("wishlistCount").textContent = list.length;
  if (!list.length) {
    wishlistList.innerHTML = `<li class="muted-item">No destinations saved yet.</li>`;
    return;
  }
  wishlistList.innerHTML = list.map(id => {
    const d = DESTINATIONS.find(x => x.id === id);
    if (!d) return "";
    return `<li>${d.name} <button type="button" data-id="${id}">remove</button></li>`;
  }).join("");
  wishlistList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => toggleWishlist(btn.dataset.id));
  });
}
function renderViewed() {
  const viewed = getViewed();
  const el = document.getElementById("sessionViewedList");
  el.textContent = viewed.length
    ? viewed.map(id => DESTINATIONS.find(d => d.id === id)?.name).filter(Boolean).join(", ")
    : "none yet";
}
const liveSearch = document.getElementById("liveSearch");
const searchResults = document.getElementById("searchResults");
liveSearch.addEventListener("input", () => {
  const q = liveSearch.value.trim().toLowerCase();
  if (!q) { searchResults.classList.add("hidden"); searchResults.innerHTML = ""; return; }
  const destMatches = DESTINATIONS.filter(d => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q));
  const pkgMatches = PACKAGES.filter(p => p.name.toLowerCase().includes(q));
  if (!destMatches.length && !pkgMatches.length) {
    searchResults.innerHTML = `<span>No matches for "${liveSearch.value}"</span>`;
  } else {
    searchResults.innerHTML =
      destMatches.map(d => `<a href="#destinations" data-scroll-id="${d.id}">📍 ${d.name}</a>`).join("") +
      pkgMatches.map(p => `<a href="#packages">📦 ${p.name} package</a>`).join("");
  }
  searchResults.classList.remove("hidden");
  searchResults.querySelectorAll("a[data-scroll-id]").forEach(a => {
    a.addEventListener("click", () => {
      setTimeout(() => openDestModal(a.dataset.scrollId), 400);
    });
  });
});
const carouselTrack = document.getElementById("carouselTrack");
const carouselDots = document.getElementById("carouselDots");
let carouselIndex = 0;
const carouselSlides = DESTINATIONS.slice(0, 5);
function buildCarousel() {
  carouselTrack.innerHTML = carouselSlides.map(d => `
    <div class="carousel-slide" style="background-image:url('${d.img}')">
      <div class="carousel-caption">
        <h3>${d.name}</h3>
        <p>${d.blurb}</p>
      </div>
    </div>`).join("");
  carouselDots.innerHTML = carouselSlides.map((_, i) => `<span data-i="${i}" class="${i === 0 ? "active" : ""}"></span>`).join("");
  carouselDots.querySelectorAll("span").forEach(dot => {
    dot.addEventListener("click", () => goToSlide(Number(dot.dataset.i)));
  });
}
function goToSlide(i) {
  carouselIndex = (i + carouselSlides.length) % carouselSlides.length;
  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
  carouselDots.querySelectorAll("span").forEach((d, idx) => d.classList.toggle("active", idx === carouselIndex));
}
document.getElementById("carouselPrev").addEventListener("click", () => goToSlide(carouselIndex - 1));
document.getElementById("carouselNext").addEventListener("click", () => goToSlide(carouselIndex + 1));
buildCarousel();
let carouselTimer = setInterval(() => goToSlide(carouselIndex + 1), 5000);
const itineraryDrop = document.getElementById("itineraryDrop");
const itineraryList = document.getElementById("itineraryList");
const itineraryEmpty = document.getElementById("itineraryEmpty");
let itineraryStops = []; 
function renderItinerary() {
  itineraryList.querySelectorAll(".itinerary-item").forEach(el => el.remove());
  itineraryEmpty.classList.toggle("hidden", itineraryStops.length > 0);
  itineraryStops.forEach((id, index) => {
    const d = DESTINATIONS.find(x => x.id === id);
    if (!d) return;
    const day = Math.floor(index / 2) + 1; 
    const li = document.createElement("li");
    li.className = "itinerary-item";
    li.draggable = true;
    li.dataset.index = index;
    li.innerHTML = `
      <span class="itinerary-day">Day ${day}</span>
      <img src="${d.img}" alt="${d.name}">
      <div class="itinerary-info"><strong>${d.name}</strong><span>${d.region}</span></div>
      <button type="button" class="itinerary-remove" aria-label="Remove">&times;</button>`;
    itineraryList.appendChild(li);
    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ source: "itinerary", index }));
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.querySelector(".itinerary-remove").addEventListener("click", () => {
      itineraryStops.splice(index, 1);
      renderItinerary();
    });
  });
}
itineraryDrop.addEventListener("dragover", e => {
  e.preventDefault();
  itineraryDrop.classList.add("dragover");
});
itineraryDrop.addEventListener("dragleave", () => itineraryDrop.classList.remove("dragover"));
itineraryDrop.addEventListener("drop", e => {
  e.preventDefault();
  itineraryDrop.classList.remove("dragover");
  let data;
  try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
  if (data.source === "gallery") {
    itineraryStops.push(data.id);
    renderItinerary();
    showToast(`Added to itinerary`, "success");
    return;
  }
  if (data.source === "itinerary") {
    const targetLi = e.target.closest(".itinerary-item");
    const fromIndex = data.index;
    let toIndex = targetLi ? Number(targetLi.dataset.index) : itineraryStops.length - 1;
    const [moved] = itineraryStops.splice(fromIndex, 1);
    itineraryStops.splice(toIndex, 0, moved);
    renderItinerary();
  }
});
document.getElementById("timelineColor").addEventListener("input", e => {
  document.querySelectorAll(".itinerary-item").forEach(item => {
    item.style.borderLeftColor = e.target.value;
  });
  document.querySelectorAll(".itinerary-day").forEach(day => {
    day.style.background = e.target.value;
  });
});
const descSize = document.getElementById("descSize");
const descSizeSample = document.getElementById("descSizeSample");
descSize.addEventListener("input", () => {
  descSizeSample.style.fontSize = descSize.value + "px";
});
const destModalOverlay = document.getElementById("destModalOverlay");
let activeModalDestId = null;
function openDestModal(id) {
  const d = DESTINATIONS.find(x => x.id === id);
  if (!d) return;
  activeModalDestId = id;
  markViewed(id); 
  document.getElementById("modalImage").src = d.img;
  document.getElementById("modalImage").alt = d.name;
  document.getElementById("modalTitle").textContent = d.name;
  document.getElementById("modalRegion").textContent = d.region;
  document.getElementById("modalBlurb").textContent = d.blurb;
  const savedRating = Number(localStorage.getItem("tripmate_rating_" + id)) || 0;
  setStarDisplay(savedRating);
  const wishBtn = document.getElementById("modalWishlistBtn");
  wishBtn.textContent = getWishlist().includes(id) ? "Remove from wishlist" : "Save to wishlist";
  destModalOverlay.classList.remove("hidden");
}
function closeDestModal() { destModalOverlay.classList.add("hidden"); }
document.getElementById("modalClose").addEventListener("click", closeDestModal);
destModalOverlay.addEventListener("click", e => { if (e.target === destModalOverlay) closeDestModal(); });
document.getElementById("modalAddItinerary").addEventListener("click", () => {
  if (activeModalDestId) {
    itineraryStops.push(activeModalDestId);
    renderItinerary();
    showToast("Added to itinerary", "success");
    closeDestModal();
  }
});
document.getElementById("modalWishlistBtn").addEventListener("click", () => {
  if (activeModalDestId) {
    toggleWishlist(activeModalDestId);
    document.getElementById("modalWishlistBtn").textContent =
      getWishlist().includes(activeModalDestId) ? "Remove from wishlist" : "Save to wishlist";
  }
});
const starRatingEl = document.getElementById("modalStars");
const starLabel = document.getElementById("starLabel");
function setStarDisplay(rating) {
  starRatingEl.className = "star-rating" + (rating > 0 ? ` filled-${rating}` : "");
  starLabel.textContent = rating > 0 ? `You rated this ${rating} / 5` : "Rate this destination";
}
starRatingEl.querySelectorAll("span[data-star]").forEach(star => {
  star.addEventListener("click", () => {
    const val = Number(star.dataset.star);
    setStarDisplay(val);
    if (activeModalDestId) localStorage.setItem("tripmate_rating_" + activeModalDestId, val);
  });
});
document.querySelectorAll(".accordion-trigger").forEach(trigger => {
  trigger.addEventListener("click", () => {
    const panel = trigger.nextElementSibling;
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!expanded));
    panel.style.maxHeight = expanded ? "0px" : panel.scrollHeight + "px";
  });
});
const tripForm = document.getElementById("tripForm");
const progressBar = document.getElementById("formProgressBar");
const progressPct = document.getElementById("formProgressPct");
const trackedFields = ["t-name", "t-email", "t-phone", "t-date", "t-time", "t-travelers"];
function updateFormProgress() {
  let filled = 0;
  let total = trackedFields.length + 2; 
  trackedFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value.trim() !== "") filled++;
  });
  if (tripForm.querySelector('input[name="tripType"]:checked')) filled++;
  if (tripForm.querySelectorAll('input[name="interests"]:checked').length > 0) filled++;
  const pct = Math.round((filled / total) * 100);
  progressBar.style.width = pct + "%";
  progressPct.textContent = pct;
}
tripForm.addEventListener("input", updateFormProgress);
tripForm.addEventListener("change", updateFormProgress);
updateFormProgress();
const tNotes = document.getElementById("t-notes");
const notesCount = document.getElementById("notesCount");
tNotes.addEventListener("input", () => { notesCount.textContent = tNotes.value.length; });
const tPhone = document.getElementById("t-phone");
tPhone.addEventListener("input", () => {
  let digits = tPhone.value.replace(/\D/g, "").slice(0, 10);
  let formatted = digits;
  if (digits.length > 6) formatted = `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  else if (digits.length > 3) formatted = `${digits.slice(0,3)}-${digits.slice(3)}`;
  tPhone.value = formatted;
});
const tPassword = document.getElementById("t-password");
const pwMeterBar = document.getElementById("pwMeterBar");
const pwLabel = document.getElementById("pwLabel");
tPassword.addEventListener("input", () => {
  const val = tPassword.value;
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { pct: 0,   color: "#C24444", text: "—" },
    { pct: 25,  color: "#C24444", text: "Weak" },
    { pct: 55,  color: "#D4A24C", text: "Fair" },
    { pct: 80,  color: "#4FD18C", text: "Good" },
    { pct: 100, color: "#0F6E6A", text: "Strong" },
  ];
  const level = val.length === 0 ? levels[0] : levels[score];
  pwMeterBar.style.width = level.pct + "%";
  pwMeterBar.style.background = level.color;
  pwLabel.textContent = "Password strength: " + level.text;
});
tripForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (!tripForm.checkValidity()) { tripForm.reportValidity(); return; }
  const status = document.getElementById("tripFormStatus") || document.createElement("span");
  status.className = "status-msg"; status.id = "tripFormStatus";
  status.textContent = "Saving trip request…";
  document.getElementById("submitTripBtn").insertAdjacentElement("afterend", status);
  const payload = {
    name: document.getElementById("t-name").value.trim(),
    email: document.getElementById("t-email").value.trim(),
    phone: document.getElementById("t-phone").value.trim(),
    travel_date: document.getElementById("t-date").value,
    departure_time: document.getElementById("t-time").value,
    travellers: Number(document.getElementById("t-travelers").value),
    trip_type: tripForm.querySelector('input[name="tripType"]:checked')?.value || "Solo",
    interests: [...tripForm.querySelectorAll('input[name="interests"]:checked')].map(el => el.value),
    notes: tNotes.value.trim()
  };
  try {
    const response = await fetch("php/api.php?action=trip", {method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body:JSON.stringify(payload)});
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save trip request.");
    status.textContent = `${result.message} Reference: TM-${result.id}`;
    showToast("Trip request saved to database", "success");
  } catch (err) {
    status.textContent = location.protocol === "file:" || location.port === "8000"
      ? "Database save unavailable. Run this project through XAMPP Apache (http://localhost/TRIP-MATE/) and configure MySQL."
      : `Could not save request: ${err.message}`;
    showToast("Trip request was not saved", "error");
  }
});
document.getElementById("cancelTripBtn").addEventListener("click", () => {
  if (confirm("Cancel this trip request? All entered details will be cleared.")) {
    tripForm.reset();
    updateFormProgress();
    notesCount.textContent = "0";
    pwMeterBar.style.width = "0%";
    pwLabel.textContent = "Password strength: —";
    showToast("Trip request cancelled");
  }
});
const packagesGrid = document.getElementById("packagesGrid");
function renderPackages() {
  packagesGrid.innerHTML = PACKAGES.map(p => `
    <article class="package-card">
      <h3>${p.name}</h3>
      <p class="package-price">$${p.price} <span style="font-weight:400;font-size:.8rem;color:var(--ink-soft);">/ person</span></p>
      <p class="package-desc">${p.desc}</p>
      <div class="package-icons">
        ${p.includes.map(inc => `<span class="tooltip" data-tooltip="${inc.label}">${inc.icon}</span>`).join("")}
      </div>
      <button type="button" class="btn btn-primary package-book" data-id="${p.id}">Book this package</button>
    </article>`).join("");
  packagesGrid.querySelectorAll(".package-book").forEach(btn => {
    btn.addEventListener("click", () => startBooking(btn.dataset.id));
  });
}
function startBooking(packageId) {
  const pkg = PACKAGES.find(p => p.id === packageId);
  const spinner = document.getElementById("spinnerOverlay");
  spinner.classList.remove("hidden");
  setTimeout(() => {
    spinner.classList.add("hidden");
    showBookingConfirmation(pkg);
    showToast("Trip booked!", "success");
  }, 1300);
}
function showBookingConfirmation(pkg) {
  const ref = "TM-" + Math.floor(100000 + Math.random() * 900000);
  document.getElementById("bookingRef").textContent = ref;
  const travelerName = document.getElementById("t-name").value || "Traveler";
  const travelDate = document.getElementById("t-date").value || "date to be confirmed";
  const travelers = document.getElementById("t-travelers").value || "1";
  const stopsNames = itineraryStops.map(id => DESTINATIONS.find(d => d.id === id)?.name).filter(Boolean);
  document.getElementById("bookingSummary").innerHTML = `
    <p><strong>Traveler:</strong> ${travelerName}</p>
    <p><strong>Package:</strong> ${pkg.name} ($${pkg.price}/person)</p>
    <p><strong>Travel date:</strong> ${travelDate}</p>
    <p><strong>Travelers:</strong> ${travelers}</p>
    <p><strong>Itinerary stops:</strong> ${stopsNames.length ? stopsNames.join(" → ") : "Not yet built — visit the itinerary builder"}</p>
  `;
  document.getElementById("bookingModalOverlay").classList.remove("hidden");
}
document.getElementById("bookingModalClose").addEventListener("click", () => {
  document.getElementById("bookingModalOverlay").classList.add("hidden");
});
document.getElementById("bookingDoneBtn").addEventListener("click", () => {
  document.getElementById("bookingModalOverlay").classList.add("hidden");
});
document.getElementById("copyRefBtn").addEventListener("click", () => {
  const ref = document.getElementById("bookingRef").textContent;
  navigator.clipboard?.writeText(ref).then(() => {
    showToast("Booking code copied", "success");
  }).catch(() => {
    showToast("Could not copy — copy manually");
  });
});
document.getElementById("printSummaryBtn").addEventListener("click", () => window.print());
function showToast(message, type = "") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast" + (type ? " " + type : "");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
document.getElementById("footerYear").textContent = new Date().getFullYear();
renderGallery();
renderWishlist();
renderViewed();
renderItinerary();
renderPackages();

/* Roamly-inspired additions for TripMate. Existing TripMate features remain intact. */
(() => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getExistingWishlistCount = () => { try { return JSON.parse(localStorage.getItem('tripmateWishlist') || '[]').length; } catch { return document.querySelectorAll('#wishlistList li:not(.muted-item)').length; } };
  const updateDashboard = () => {
    const wish = document.querySelectorAll('#wishlistList li:not(.muted-item)').length;
    const stops = document.querySelectorAll('#itineraryList li:not(.itinerary-empty)').length;
    const checks = document.querySelectorAll('.tm-travel-check');
    const pct = checks.length ? Math.round([...checks].filter(x=>x.checked).length/checks.length*100) : 0;
    $('tmDashWishlist').textContent = Math.max(wish, getExistingWishlistCount()); $('tmDashStops').textContent = stops;
    $('tmDashChecks').textContent = pct+'%'; $('tmChecklistProgress').style.width = pct+'%'; $('tmChecklistLabel').textContent = pct+'% complete';
    write('tripmateTravelChecklist', [...checks].map(x=>x.checked));
  };
  const savedChecks = read('tripmateTravelChecklist', []); document.querySelectorAll('.tm-travel-check').forEach((x,i)=>{x.checked=!!savedChecks[i];x.addEventListener('change',updateDashboard)});
  document.querySelectorAll('.tm-enroll').forEach(btn=>btn.addEventListener('click',()=>{const lessons=btn.parentElement.querySelector('.tm-lessons');lessons.classList.toggle('hidden');btn.textContent=lessons.classList.contains('hidden')?'Start workshop':'Hide lessons';const enrolled=read('tripmateWorkshops',[]);if(!enrolled.includes(btn.dataset.course)){enrolled.push(btn.dataset.course);write('tripmateWorkshops',enrolled)}}));
  document.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>{const result=$('tmQuizResult');if(btn.dataset.answer==='Japan'){result.textContent='Correct! Kyoto is a historic city in Japan.';result.className='tm-correct';}else{result.textContent='Not quite — the answer is Japan.';result.className='tm-muted';}$('tmQuizStatus').textContent='Quiz answered.';document.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true)}));
  const renderNotes=()=>{const notes=read('tripmatePersonalTravelNotes',[]);const list=$('tmNotesList');list.replaceChildren();if(!notes.length){list.innerHTML='<p class="tm-muted">No notes saved yet.</p>';return}notes.forEach((n,i)=>{const card=document.createElement('article');card.className='tm-note-card';const h=document.createElement('h3');h.textContent=n.title;const p=document.createElement('p');p.textContent=n.text;const date=document.createElement('small');date.textContent=new Date(n.created).toLocaleString();const del=document.createElement('button');del.className='btn btn-ghost';del.textContent='Delete';del.addEventListener('click',()=>{const next=read('tripmatePersonalTravelNotes',[]);next.splice(i,1);write('tripmatePersonalTravelNotes',next);renderNotes()});card.append(h,p,date,del);list.append(card)})};
  $('tmNoteForm').addEventListener('submit',e=>{e.preventDefault();const notes=read('tripmatePersonalTravelNotes',[]);notes.unshift({title:$('tmNoteTitle').value.trim(),text:$('tmNoteText').value.trim(),created:new Date().toISOString()});write('tripmatePersonalTravelNotes',notes.slice(0,50));e.target.reset();renderNotes();if(typeof showToast==='function')showToast('Travel note saved','success')});renderNotes();
  $('tmAmbienceToggle').addEventListener('click',async()=>{const audio=$('tmAmbienceAudio');if(audio.paused){try{await audio.play();$('tmAmbienceToggle').textContent='Ⅱ Pause ambience';$('tmAmbienceStatus').textContent='Ambience is playing.'}catch{$('tmAmbienceStatus').textContent='Audio could not load. Check your internet connection.'}}else{audio.pause();$('tmAmbienceToggle').textContent='♫ Play ambience';$('tmAmbienceStatus').textContent='Ambience paused.'}});
  updateDashboard(); const observer=new MutationObserver(updateDashboard);['wishlistList','itineraryList'].forEach(id=>observer.observe($(id),{childList:true,subtree:true}));
})();



function ensureAuthUI() {
  if (document.getElementById("tmAuthOverlay")) return;
  const tools = document.querySelector(".nav-tools");
  const accountBtn = document.createElement("button");
  accountBtn.type = "button"; accountBtn.className = "wishlist-pill tm-account-button"; accountBtn.id = "tmAccountButton"; accountBtn.textContent = "Log in";
  accountBtn.addEventListener("click", () => currentUser ? logoutUser() : openAuthDialog());
  if (tools) tools.appendChild(accountBtn);
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden"; overlay.id = "tmAuthOverlay";
  overlay.innerHTML = `<div class="modal tm-auth-modal" role="dialog" aria-modal="true" aria-labelledby="tmAuthTitle">
    <button type="button" class="modal-close" id="tmAuthClose" aria-label="Close">&times;</button>
    <div class="modal-body"><h3 id="tmAuthTitle">Welcome back</h3><p id="tmAuthMessage">Log in to save your wishlist securely to MySQL.</p>
    <div class="tm-auth-tabs"><button type="button" class="btn btn-primary btn-small" id="tmLoginTab">Log in</button><button type="button" class="btn btn-ghost btn-small" id="tmRegisterTab">Create account</button></div>
    <form id="tmAuthForm"><div class="field" id="tmNameField" hidden><label for="tmAuthName">Full name</label><input id="tmAuthName" name="name" autocomplete="name" minlength="2"></div>
    <div class="field"><label for="tmAuthEmail">Email</label><input id="tmAuthEmail" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="tmAuthPassword">Password</label><input id="tmAuthPassword" name="password" type="password" minlength="8" autocomplete="current-password" required></div>
    <p id="tmAuthStatus" class="status-msg" role="status"></p><button type="submit" class="btn btn-primary" id="tmAuthSubmit">Log in</button></form></div></div>`;
  document.body.appendChild(overlay);
  let mode = "login";
  const setMode = next => {
    mode = next;
    document.getElementById("tmAuthTitle").textContent = next === "login" ? "Welcome back" : "Create your TripMate account";
    document.getElementById("tmNameField").hidden = next !== "register";
    document.getElementById("tmAuthName").required = next === "register";
    document.getElementById("tmAuthPassword").autocomplete = next === "login" ? "current-password" : "new-password";
    document.getElementById("tmAuthPassword").minLength = next === "register" ? 8 : 1;
    document.getElementById("tmAuthSubmit").textContent = next === "login" ? "Log in" : "Create account";
    document.getElementById("tmLoginTab").className = `btn btn-small ${next === "login" ? "btn-primary" : "btn-ghost"}`;
    document.getElementById("tmRegisterTab").className = `btn btn-small ${next === "register" ? "btn-primary" : "btn-ghost"}`;
    document.getElementById("tmAuthStatus").textContent = "";
  };
  document.getElementById("tmLoginTab").addEventListener("click", () => setMode("login"));
  document.getElementById("tmRegisterTab").addEventListener("click", () => setMode("register"));
  document.getElementById("tmAuthClose").addEventListener("click", closeAuthDialog);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeAuthDialog(); });
  document.getElementById("tmAuthForm").addEventListener("submit", async e => {
    e.preventDefault();
    const status = document.getElementById("tmAuthStatus"), submit = document.getElementById("tmAuthSubmit");
    status.textContent = "Connecting to server…"; submit.disabled = true;
    try {
      const payload = { email: document.getElementById("tmAuthEmail").value.trim(), password: document.getElementById("tmAuthPassword").value };
      if (mode === "register") payload.name = document.getElementById("tmAuthName").value.trim();
      const result = await apiRequest(mode === "login" ? "login" : "register", "POST", payload);
      currentUser = result.user;
      await loadServerWishlist();
      let legacy = []; try { legacy = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch {}
      for (const id of legacy) if (DESTINATIONS.some(d => d.id === id) && !serverWishlist.includes(id)) {
        await apiRequest("wishlist", "POST", { destination_id: id }); serverWishlist.push(id);
      }
      localStorage.removeItem(WISHLIST_KEY);
      updateAccountButton(); renderWishlist(); renderGallery(); closeAuthDialog();
      showToast(`Signed in as ${currentUser.name || currentUser.email}`, "success");
    } catch (error) { status.textContent = error.message; }
    finally { submit.disabled = false; }
  });
  setMode("login");
}
function openAuthDialog(message = "") {
  ensureAuthUI();
  if (message) document.getElementById("tmAuthMessage").textContent = message;
  document.getElementById("tmAuthOverlay").classList.remove("hidden");
}
function closeAuthDialog() { document.getElementById("tmAuthOverlay")?.classList.add("hidden"); }
function updateAccountButton() {
  const button = document.getElementById("tmAccountButton");
  if (button) button.textContent = currentUser ? `Log out (${currentUser.name || currentUser.email})` : "Log in";
}
async function loadServerWishlist() {
  const result = await jqueryApiRequest("wishlist");
  serverWishlist = result.items.map(item => item.destination_id).filter(id => DESTINATIONS.some(d => d.id === id));
  // jQuery selector updates the saved-item count without a page reload.
  $("#wishlistCount").text(serverWishlist.length);
}
async function logoutUser() {
  try {
    await apiRequest("logout", "POST", {});
    currentUser = null; serverWishlist = []; updateAccountButton(); renderWishlist(); renderGallery();
    showToast("You have logged out", "success");
  } catch (error) { showToast(error.message, "error"); }
}
async function initializeAccount() {
  ensureAuthUI();
  try { const result = await apiRequest("me"); currentUser = result.user; if (currentUser) await loadServerWishlist(); }
  catch (error) { console.error("TripMate account initialization:", error); }
  updateAccountButton(); renderWishlist(); renderGallery();
}
// Restore the PHP login session and load the MySQL wishlist on each page load.
initializeAccount();
