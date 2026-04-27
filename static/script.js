document.addEventListener("DOMContentLoaded", () => {
	const loadingEl = document.getElementById("loading");
	const errorEl = document.getElementById("error");
	const wrapEl = document.getElementById("standings-wrap");
	const tbody = document.getElementById("standings-body");

	async function fetchStandings() {
		try {
			const res = await fetch("/standings");
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			renderStandings(data);
		} catch (err) {
			showError(err.message || "Failed to load standings");
		} finally {
			loadingEl.hidden = true;
		}
	}

	function showError(msg) {
		errorEl.textContent = msg;
		errorEl.hidden = false;
	}

	function renderStandings(list) {
		if (!Array.isArray(list) || list.length === 0) {
			showError("No standings available");
			return;
		}

		wrapEl.hidden = false;
		tbody.innerHTML = "";

		list.forEach((row, idx) => {
			const tr = document.createElement("tr");

			const rank = document.createElement("td");
			rank.textContent = idx + 1;
			tr.appendChild(rank);

			const driver = document.createElement("td");
			const dlink = document.createElement("button");
			dlink.className = "link name-link";
			dlink.type = "button";
			dlink.textContent = row.driver_name || "—";
			dlink.dataset.type = "driver";
			dlink.dataset.name = row.driver_name || "";
			driver.appendChild(dlink);
			tr.appendChild(driver);

			const nat = document.createElement("td");
			nat.textContent = row.nationality || "—";
			tr.appendChild(nat);

			const team = document.createElement("td");
			const tlink = document.createElement("button");
			tlink.className = "link name-link";
			tlink.type = "button";
			tlink.textContent = row.team_name || "—";
			tlink.dataset.type = "team";
			tlink.dataset.name = row.team_name || "";
			team.appendChild(tlink);
			tr.appendChild(team);

			const pts = document.createElement("td");
			pts.textContent = (row.points != null) ? row.points : "0";
			tr.appendChild(pts);

			tbody.appendChild(tr);
		});
	}

	// DETAILS UI (floating)
	const detailsSection = document.getElementById("details");
	const detailsContainer = document.getElementById("details-container");

	// Create floating container appended to body for mouse-following cards
	const floatingEl = document.createElement("div");
	floatingEl.id = "floating-details";
	floatingEl.className = "floating-details";
	floatingEl.hidden = true;
	document.body.appendChild(floatingEl);

		async function fetchAndShowDriver(name, x, y) {
			try {
				renderLoading(`Loading driver: ${name}`);
				const res = await fetch(`/drivers?name=${encodeURIComponent(name)}`);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				if (!Array.isArray(data) || data.length === 0) throw new Error("Driver not found");
				renderFloatingDriverCard(data[0], x, y);
			} catch (err) {
				renderDetailsError(err.message || "Failed to load driver");
				showError(err.message || "Failed to load driver");
			}
		}

	async function fetchAndShowTeam(name, x, y) {
		try {
			renderLoading(`Loading team: ${name}`);
			const res = await fetch(`/teams?name=${encodeURIComponent(name)}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			if (!Array.isArray(data) || data.length === 0) throw new Error("Team not found");
			renderFloatingTeamCard(data[0], x, y);
		} catch (err) {
			renderDetailsError(err.message || "Failed to load team");
			showError(err.message || "Failed to load team");
		}
	}

	function clearDetails() {
		detailsContainer.innerHTML = "";
		detailsSection.hidden = true;
		floatingEl.innerHTML = "";
		floatingEl.hidden = true;
	}

	function renderFloatingDriverCard(d, x = 0, y = 0) {
		floatingEl.innerHTML = "";
		const card = document.createElement("div");
		card.className = "card";
		const close = document.createElement("button");
		close.className = "card-close";
		close.textContent = "×";
		close.onclick = clearDetails;
		const title = document.createElement("h3");
		title.textContent = d.driver_name || "Driver";
		const list = document.createElement("ul");
		list.innerHTML = `
			<li><strong>Number:</strong> ${d.number ?? "—"}</li>
			<li><strong>Nationality:</strong> ${d.nationality ?? "—"}</li>
			<li><strong>Team:</strong> ${d.team_name ?? "—"}</li>
			<li><strong>Grand Prixs:</strong> ${d.grand_prixs ?? "—"}</li>
			<li><strong>Career points:</strong> ${d.career_points ?? "—"}</li>
			<li><strong>Podiums:</strong> ${d.podiums ?? "—"}</li>
			<li><strong>World Championships:</strong> ${d.world_championships ?? "—"}</li>
		`;
		card.appendChild(close);
		card.appendChild(title);
		card.appendChild(list);
		floatingEl.appendChild(card);
		floatingEl.hidden = false;
		// position after appending so we can measure size
		positionFloatingAt(x, y, floatingEl);
	}

	function renderLoading(msg) {
		detailsContainer.innerHTML = "";
		const card = document.createElement("div");
		card.className = "card";
		const p = document.createElement("div");
		p.textContent = msg;
		p.style.color = "var(--muted)";
		card.appendChild(p);
		detailsContainer.appendChild(card);
		detailsSection.hidden = false;
	}

	function renderDetailsError(msg) {
		detailsContainer.innerHTML = "";
		const card = document.createElement("div");
		card.className = "card";
		const p = document.createElement("div");
		p.textContent = msg;
		p.style.color = "#ffd2d2";
		card.appendChild(p);
		detailsContainer.appendChild(card);
		detailsSection.hidden = false;
	}

	function renderFloatingTeamCard(t, x = 0, y = 0) {
		floatingEl.innerHTML = "";
		const card = document.createElement("div");
		card.className = "card";
		const close = document.createElement("button");
		close.className = "card-close";
		close.textContent = "×";
		close.onclick = clearDetails;
		const title = document.createElement("h3");
		title.textContent = t.team_name || "Team";
		const list = document.createElement("ul");
		list.innerHTML = `
			<li><strong>Driver 1:</strong> ${t.driver1 ?? "—"}</li>
			<li><strong>Driver 2:</strong> ${t.driver2 ?? "—"}</li>
			<li><strong>Grand Prixs:</strong> ${t.grand_prixs ?? "—"}</li>
			<li><strong>Total points:</strong> ${t.total_points ?? "—"}</li>
			<li><strong>Podiums:</strong> ${t.podiums ?? "—"}</li>
			<li><strong>World Championships:</strong> ${t.world_championships ?? "—"}</li>
		`;
		card.appendChild(close);
		card.appendChild(title);
		card.appendChild(list);
		floatingEl.appendChild(card);
		floatingEl.hidden = false;
		positionFloatingAt(x, y, floatingEl);
	}

	function positionFloatingAt(mouseX, mouseY, el) {
		// default offsets
		const offset = 12;
		// temporarily place offscreen to measure
		el.style.left = `-9999px`;
		el.style.top = `-9999px`;
		// allow browser to render
		requestAnimationFrame(() => {
			const rectW = el.offsetWidth;
			const rectH = el.offsetHeight;
			let left = mouseX + offset;
			let top = mouseY + offset;
			// clamp to viewport
			const maxLeft = window.innerWidth - rectW - 8;
			const maxTop = window.innerHeight - rectH - 8;
			if (left > maxLeft) left = Math.max(8, mouseX - rectW - offset);
			if (top > maxTop) top = Math.max(8, mouseY - rectH - offset);
			el.style.left = `${left}px`;
			el.style.top = `${top}px`;
		});
	}

	// Delegate clicks for dynamically created name links
	document.body.addEventListener("click", (ev) => {
		const el = ev.target;
		if (el && el.classList && el.classList.contains("name-link")) {
			const type = el.dataset.type;
			const name = el.dataset.name;
			const x = ev.clientX;
			const y = ev.clientY;
			console.log("name-link clicked", { type, name, x, y });
			if (!name) return;
			if (type === "driver") fetchAndShowDriver(name, x, y);
			else if (type === "team") fetchAndShowTeam(name, x, y);
		}
	});

	fetchStandings();
});
