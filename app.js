function formatNumber(value, digits = 2) {
  if (!isFinite(value)) return "—";
  return Number(value).toFixed(digits);
}

function getValue(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const val = parseFloat(el.value);
  return isNaN(val) ? null : val;
}

function resetPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  panel.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = false;
    } else {
      el.value = '';
    }
  });

  panel.querySelectorAll('.result, .results, .result-grid, .alerts, .summary-box, .status-box, [id$="_result"], [id$="_results"]').forEach(el => {
    el.innerHTML = '';
    el.textContent = '';
  });
}

function metricCard(label, value, unit = "") {
  return `
    <div class="metric">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="unit">${unit}</div>
    </div>
  `;
}

function addAlert(type, text) {
  return `<div class="alert-item ${type}">${text}</div>`;
}

function resetForm() {
 [
  "lvot",
  "vti_lvot",
  "vti_ao",
  "vmax",
  "gradient",
  "height",
  "weight",
  "ef",
  "eovere",
  "lavi",
  "gls",
  "eprime",
  "trv"
].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById("resultCards").innerHTML = "";
  document.getElementById("alerts").innerHTML = "";
  document.getElementById("severityBox").className = "status-box neutral";
  document.getElementById("severityBox").innerHTML = "Awaiting data...";
  document.getElementById("conclusion").innerHTML =
    'Fill in the fields and click <strong>Calculate RAo</strong>.';
}

function calculateRAo() {
  const lvot = getValue("lvot");
  const vtiLVOT = getValue("vti_lvot");
  const vtiAo = getValue("vti_ao");
  const vmax = getValue("vmax");
  const gradient = getValue("gradient");
  const height = getValue("height");
  const weight = getValue("weight");
  const ef = getValue("ef");
  const gls = getValue("gls");
const eprime = getValue("eprime");
const trv = getValue("trv");
  const eovere = getValue("eovere");
  const lavi = getValue("lavi");

  const severityBox = document.getElementById("severityBox");
  const alertsBox = document.getElementById("alerts");
  const resultsBox = document.getElementById("resultCards");
  const conclusionBox = document.getElementById("conclusion");

  if (
    lvot === null ||
    vtiLVOT === null ||
    vtiAo === null ||
    vmax === null ||
    gradient === null ||
    height === null ||
    weight === null ||
    ef === null
  ) {
    severityBox.className = "status-box warning";
    severityBox.innerHTML =
      "Please fill all required fields: LVOT, VTI LVOT, VTI Ao, Vmax, Mean Gradient, Height, Weight, and LVEF.";
    alertsBox.innerHTML = "";
    resultsBox.innerHTML = "";
    conclusionBox.innerHTML =
      "Calculation cannot be performed until all required fields are completed.";
    return;
  }

  const alerts = [];

  if (lvot < 1.4 || lvot > 3.0) {
    alerts.push(
      addAlert(
        "warning",
        "LVOT diameter outside common adult range. Recheck units and measurement."
      )
    );
  }

  if (height < 120 || height > 230) {
    alerts.push(
      addAlert(
        "warning",
        "Height outside usual adult range. Verify entered value in cm."
      )
    );
  }

  if (weight < 25 || weight > 250) {
    alerts.push(
      addAlert(
        "warning",
        "Weight outside usual adult range. Verify entered value in kg."
      )
    );
  }

  if (vmax < 1 || vmax > 6.5) {
    alerts.push(
      addAlert(
        "warning",
        "Vmax appears unusual. Verify CW alignment and data entry."
      )
    );
  }

  if (gradient < 0 || gradient > 100) {
    alerts.push(
      addAlert(
        "warning",
        "Mean gradient appears unusual. Verify measurement and units."
      )
    );
  }

  const bsa = Math.sqrt((height * weight) / 3600);
  const lvotArea = Math.PI * Math.pow(lvot / 2, 2);
  const sv = lvotArea * vtiLVOT;
  const ava = sv / vtiAo;
  const avai = ava / bsa;
  const di = vtiLVOT / vtiAo;
  const svi = sv / bsa;

  const severeByValveCriteria = ava <= 1 || avai <= 0.6 || di < 0.25;
  const severeByHemodynamics = vmax >= 4 || gradient >= 40;
  const discordant = ava <= 1 && gradient < 40 && vmax < 4;
  let diastolicScore = 0;

if (eovere !== null && eovere > 14) diastolicScore++;
if (eprime !== null && eprime < 7) diastolicScore++;
if (lavi !== null && lavi > 34) diastolicScore++;
if (trv !== null && trv > 2.8) diastolicScore++;

let diastolicStatus = "Normal or indeterminate";

if (diastolicScore >= 2) {
  diastolicStatus = "Diastolic dysfunction likely";
}

let glsStatus = "Not entered";

if (gls !== null) {
  if (gls > -16) {
    glsStatus = "Reduced longitudinal function";
  } else {
    glsStatus = "Normal GLS";
  }
}

  let severityText = "";
  let severityClass = "neutral";
  let conclusion = "";
  const flowState = svi < 35 ? "Low-flow" : "Normal-flow";

  if (severeByValveCriteria && severeByHemodynamics) {
    severityText = "Severe aortic stenosis - high gradient profile.";
    severityClass = "danger";
    conclusion =
      `Findings are compatible with severe aortic stenosis with concordant high-gradient hemodynamics: ` +
      `AVA ${formatNumber(ava)} cm², AVAi ${formatNumber(avai)} cm²/m², DI ${formatNumber(di)}, ` +
      `Vmax ${formatNumber(vmax, 1)} m/s, mean gradient ${formatNumber(gradient, 0)} mmHg, ` +
      `SVI ${formatNumber(svi, 1)} mL/m².`;
    alerts.push(
      addAlert(
        "danger",
        "Severe AS profile. Integrate symptoms, valve morphology, and treatment indication."
      )
    );
  } else if (ava <= 1 && svi < 35 && ef < 50 && gradient < 40) {
    severityText = "Classical low-flow low-gradient severe AS possible.";
    severityClass = "warning";
    conclusion =
      `Profile suggests possible classical low-flow low-gradient severe aortic stenosis: ` +
      `AVA ${formatNumber(ava)} cm², SVI ${formatNumber(svi, 1)} mL/m², LVEF ${formatNumber(ef, 0)}%, ` +
      `mean gradient ${formatNumber(gradient, 0)} mmHg. Reassessment of measurements and integrated evaluation are recommended.`;
    alerts.push(
      addAlert(
        "warning",
        "Low-flow low-gradient pattern with reduced EF. Consider integrated reassessment."
      )
    );
  } else if (ava <= 1 && svi < 35 && ef >= 50 && gradient < 40) {
    severityText = "Paradoxical low-flow low-gradient severe AS possible.";
    severityClass = "warning";
    conclusion =
      `Profile suggests possible paradoxical low-flow low-gradient severe aortic stenosis: ` +
      `AVA ${formatNumber(ava)} cm² with preserved LVEF ${formatNumber(ef, 0)}%, ` +
      `but low SVI ${formatNumber(svi, 1)} mL/m² and low gradient ${formatNumber(gradient, 0)} mmHg.`;
    alerts.push(
      addAlert(
        "warning",
        "Discordant severe AS pattern with preserved EF. Check LVOT measurement and Doppler alignment."
      )
    );
  } else if (discordant) {
    severityText = "Discordant AS grading.";
    severityClass = "warning";
    conclusion =
      `Discordant aortic stenosis grading: AVA ${formatNumber(ava)} cm² suggests severe stenosis, ` +
      `whereas Vmax ${formatNumber(vmax, 1)} m/s and mean gradient ${formatNumber(gradient, 0)} mmHg are not in the severe range. ` +
      `Re-evaluate LVOT diameter, LVOT VTI, CW alignment, and flow state before final grading.`;
    alerts.push(
      addAlert(
        "warning",
        "Discordance between valve area and gradient/velocity."
      )
    );
  } else {
    severityText = "Likely non-severe or not hemodynamically severe profile.";
    severityClass = "success";
    conclusion =
      `Current data do not support a concordant severe high-gradient aortic stenosis profile. ` +
      `AVA ${formatNumber(ava)} cm², AVAi ${formatNumber(avai)} cm²/m², DI ${formatNumber(di)}, ` +
      `Vmax ${formatNumber(vmax, 1)} m/s, mean gradient ${formatNumber(gradient, 0)} mmHg, ` +
      `SVI ${formatNumber(svi, 1)} mL/m². Interpret together with valve morphology and clinical presentation.`;
    alerts.push(
      addAlert(
        "success",
        "No concordant severe high-gradient AS pattern detected from entered data."
      )
    );
  }

  if (di < 0.25) {
    alerts.push(
      addAlert(
        "warning",
        "Dimensionless index < 0.25 supports severe stenosis if measurements are reliable."
      )
    );
  }

  if (svi < 35) {
    alerts.push(
      addAlert(
        "warning",
        `Low-flow state detected (SVI ${formatNumber(svi, 1)} mL/m²).`
      )
    );
  }

  if (ef < 50) {
    alerts.push(
      addAlert(
        "warning",
        `Reduced LVEF (${formatNumber(ef, 0)}%) may affect gradient interpretation.`
      )
    );
  }

  if (eovere !== null && eovere > 14) {
    alerts.push(
      addAlert(
        "warning",
        `Elevated filling pressure likely (E/e′ ${formatNumber(eovere, 1)}).`
      )
    );
  }

  if (lavi !== null && lavi > 34) {
    alerts.push(
      addAlert(
        "warning",
        `Left atrial volume index enlarged (LAVI ${formatNumber(lavi, 0)} mL/m²).`
      )
    );
  }

  resultsBox.innerHTML =
    metricCard("Calculated BSA", formatNumber(bsa), "m²") +
    metricCard("LVOT Area", formatNumber(lvotArea), "cm²") +
    metricCard("Stroke Volume", formatNumber(sv), "mL") +
    metricCard("SVI", formatNumber(svi, 1), "mL/m²") +
    metricCard("AVA", formatNumber(ava), "cm²") +
    metricCard("AVAi", formatNumber(avai), "cm²/m²") +
    metricCard("Dimensionless Index", formatNumber(di), "") +
    metricCard("Flow State", flowState, "") +
metricCard("LVEF", formatNumber(ef, 0), "%") +
metricCard("Diastolic Function", diastolicStatus, "") +
metricCard("GLS Interpretation", glsStatus, "");

  severityBox.className = `status-box ${severityClass}`;
  severityBox.innerHTML = severityText;
  alertsBox.innerHTML = alerts.join("");
  conclusionBox.innerHTML = conclusion;
}
function calculateSD() {
  const ef = g('sd_ef');
  const mapse = g('sd_mapse');
  const sprime = g('sd_sprime');
  const tapse = g('sd_tapse');
  const ee = g('sd_ee');
  const eprime = g('sd_eprime');
  const lavi = g('sd_lavi');
  const trv = g('sd_trv');

  let result = '';
  let interp = '';

  let lv = 'Normal';
  if (ef !== null && ef < 50) lv = 'Reduced';
  if (ef !== null && ef >= 40 && ef < 50) lv = 'Mildly reduced';

  let longitudinal = 'Normal';
  if ((mapse !== null && mapse < 10) || (sprime !== null && sprime < 7)) {
    longitudinal = 'Reduced longitudinal function';
  }

  let rv = 'Normal';
  if (tapse !== null && tapse < 17) {
    rv = 'RV systolic dysfunction';
  }

  let diastolicScore = 0;
  if (ee !== null && ee > 14) diastolicScore++;
  if (eprime !== null && eprime < 7) diastolicScore++;
  if (lavi !== null && lavi > 34) diastolicScore++;
  if (trv !== null && trv > 2.8) diastolicScore++;

  let diastolic = 'Normal filling pressure likely';
  if (diastolicScore === 1) diastolic = 'Indeterminate';
  if (diastolicScore >= 2) diastolic = 'Elevated filling pressure likely';

  result =
    metricCard('LVEF', formatNumber(ef, 0), '%') +
    metricCard('MAPSE', formatNumber(mapse, 1), 'mm') +
    metricCard('S′ mitral', formatNumber(sprime, 1), 'cm/s') +
    metricCard('TAPSE', formatNumber(tapse, 1), 'mm') +
    metricCard('E/e′', formatNumber(ee, 1), '') +
    metricCard('LAVI', formatNumber(lavi, 0), 'mL/m²') +
    metricCard('TR velocity', formatNumber(trv, 1), 'm/s');

  interp =
    `<div class="status-box warning">
      <b>LV systolic function:</b> ${lv}<br>
      <b>Longitudinal LV function:</b> ${longitudinal}<br>
      <b>RV systolic function:</b> ${rv}<br>
      <b>Diastolic function:</b> ${diastolic}
    </div>`;

  document.getElementById('sd_results').innerHTML = result;
  document.getElementById('sd_interpretation').innerHTML = interp;
}
