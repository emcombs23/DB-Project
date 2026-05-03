document.addEventListener("DOMContentLoaded", () => {
	// Keep a cached list of drivers (names) for the Add Race Weekend UI
	let driversList = [];

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

		// populate driversList with driver names in order
		driversList = list.map(r => r.driver_name || "");

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

	// --- Add Race Weekend UI (no backend calls) ---

	const addBtn = document.getElementById("add-weekend-btn");
	const modal = document.getElementById("add-weekend-modal");
	const modalOverlay = document.getElementById("add-weekend-overlay");
	const modalClose = document.getElementById("add-weekend-close");
	const modalBody = document.getElementById("add-weekend-body");
	const modalError = document.getElementById("add-weekend-error");
	const modalSubmit = document.getElementById("add-weekend-submit");

	function openAddWeekend() {
		if (!driversList || driversList.length === 0) {
			modalError.textContent = "Driver list not loaded yet.";
			modalError.hidden = false;
			return;
		}
		modalError.hidden = true;
		buildAddWeekendBody();
		modal.classList.add('open');
		document.body.style.overflow = 'hidden';
	}

	function closeAddWeekend() {
		modal.classList.remove('open');
		modalBody.innerHTML = '';
		modalError.hidden = true;
		document.body.style.overflow = '';
	}

	addBtn && addBtn.addEventListener('click', openAddWeekend);
	modalClose && modalClose.addEventListener('click', closeAddWeekend);
	modalOverlay && modalOverlay.addEventListener('click', closeAddWeekend);

	function createSelect(options, name, includeEmpty = false) {
		const sel = document.createElement('select');
		sel.name = name;
		sel.className = 'compact-select';
		if (includeEmpty) {
			const opt = document.createElement('option');
			opt.value = '';
			opt.textContent = '';
			sel.appendChild(opt);
		}
		options.forEach(o => {
			const opt = document.createElement('option');
			opt.value = o;
			opt.textContent = o;
			sel.appendChild(opt);
		});
		return sel;
	}

	function buildAddWeekendBody() {
		modalBody.innerHTML = '';

		// grid header
		const headerRow = document.createElement('div');
		headerRow.className = 'aw-row header';
		headerRow.innerHTML = '<div>Driver</div><div>Qualifying</div><div>Race</div>';
		modalBody.appendChild(headerRow);

		// options 1..22
		const posOptions = Array.from({length:22}, (_,i)=>String(i+1));
		const raceOptions = posOptions.concat(['DNF']);

		driversList.forEach((name, idx) => {
			const row = document.createElement('div');
			row.className = 'aw-row';

			const colName = document.createElement('div');
			colName.className = 'aw-col name-col';
			colName.textContent = name || `Driver ${idx+1}`;

			const colQual = document.createElement('div');
			colQual.className = 'aw-col';
			const qualSel = createSelect(posOptions, `qual_${idx}`, true);
			colQual.appendChild(qualSel);

			const colRace = document.createElement('div');
			colRace.className = 'aw-col';
			const raceSel = createSelect(raceOptions, `race_${idx}`, true);
			colRace.appendChild(raceSel);

			row.appendChild(colName);
			row.appendChild(colQual);
			row.appendChild(colRace);
			modalBody.appendChild(row);
		});
	}

	function showModalError(msg) {
		modalError.textContent = msg;
		modalError.hidden = false;
	}

	function clearModalError() {
		modalError.hidden = true;
		modalError.textContent = '';
	}

	modalSubmit && modalSubmit.addEventListener('click', async () => {
		clearModalError();
		// collect qualifying and race selections
		const qualSelects = Array.from(modalBody.querySelectorAll('select[name^="qual_"]'));
		const raceSelects = Array.from(modalBody.querySelectorAll('select[name^="race_"]'));

		// require all fields to be filled
		if (qualSelects.some(s => s.value.trim() === '')) {
			showModalError('Please choose a qualifying position for every driver.');
			return;
		}
		if (raceSelects.some(s => s.value.trim() === '')) {
			showModalError('Please choose a race result for every driver (DNF allowed).');
			return;
		}

		const qualValues = qualSelects.map(s => s.value.trim());
		const raceValues = raceSelects.map(s => s.value.trim());

		// check duplicates in qualifying
		const qualSet = new Set(qualValues);
		if (qualValues.length !== qualSet.size) {
			showModalError('Duplicate qualifying positions found. Each driver must have a unique qualifying position.');
			return;
		}

		// check duplicates in race results excluding DNF
		const allRaceVals = Array.from(modalBody.querySelectorAll('select[name^="race_"]'))
			.map(s => s.value.trim());
		const dnfsCount = allRaceVals.filter(v => v === 'DNF').length;
		const raceNonDNF = allRaceVals.filter(v => v !== '' && v !== 'DNF');
		// validate duplicates among non-DNF
		const raceSet = new Set(raceNonDNF);
		if (raceNonDNF.length !== raceSet.size) {
			showModalError('Duplicate race finishing positions found (excluding DNF). Each non-DNF finishing position must be unique.');
			return;
		}

		// ensure highest finishing position does not exceed allowed maximum
		const maxAllowed = 22 - dnfsCount;
		const nonDNFNums = raceNonDNF.map(v => Number(v));
		const invalidPos = nonDNFNums.find(n => Number.isNaN(n) || n < 1 || n > maxAllowed);
		if (invalidPos !== undefined) {
			showModalError(`Invalid finishing positions: non-DNF results must be between 1 and ${maxAllowed} given ${dnfsCount} DNFs.`);
			return;
		}

		// Passed validation. Build dictionaries and POST to backend, then refresh standings
		const qualDict = {};
		const raceDict = {};
		driversList.forEach((name, i) => {
			const q = (modalBody.querySelector(`select[name=\"qual_${i}\"]`)||{}).value || '';
			const r = (modalBody.querySelector(`select[name=\"race_${i}\"]`)||{}).value || '';
			// store numbers for positions, keep 'DNF' as string for race
			qualDict[name] = q === '' ? null : Number(q);
			raceDict[name] = (r === '') ? null : (r === 'DNF' ? 'DNF' : Number(r));
		});

		try {
			modalSubmit.disabled = true;
			const res = await fetch('/new_race', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ quali_results: qualDict, race_results: raceDict })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			// refresh standings from backend and close modal
			await fetchStandings();
			closeAddWeekend();
		} catch (err) {
			showModalError('Failed to submit race: ' + (err.message || 'unknown error'));
		} finally {
			modalSubmit.disabled = false;
		}
	});

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
			<li><strong>DNFs:</strong> ${d.dnfs ?? "—"}</li>
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
