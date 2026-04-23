function formatNumber(value, digits = 2) {
  if (!isFinite(value)) return "—";
  return Number(value).toFixed(digits);
}

function getValue(id) {
  const val = parseFloat(document.getElementById(id).value);
  return isNaN(val) ? null : val;
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
  ["lvot", "vti_lvot", "vti_ao", "vmax", "gradient", "bsa", "ef", "eovere", "lavi"]
    .forEach(id => document.getElementById(id).value = "");

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
  const bsa = getValue("bsa");
  const ef = getValue("ef");
  const eovere = getValue("eovere");
  const lavi = getValue("lavi");

  if (
    lvot === null || vtiLVOT === null || vtiAo === null ||
    vmax === null || gradient === null || bsa === null || ef === null
  ) {
    document.getElementById("severityBox").className = "status-box warning";
    document.getElementById("severityBox").innerHTML =
      "Please fill all required fields: LVOT, VTI LVOT, VTI Ao, Vmax, Mean Gradient, BSA, and LVEF.";
    return;
  }

  const alerts = [];

  if (lvot < 1.4 || lvot > 3.0) {
    alerts.push(addAlert("warning", "LVOT diameter outside common adult range. Recheck units and measurement (PLAX, inner-edge to inner-edge, mid-systole)."));
  }

  if (vmax < 1 || vmax > 6.5) {
    alerts.push(addAlert("warning", "Vmax appears unusual. Verify CW alignment and data entry."));
  }

  if (gradient < 0 || gradient > 100) {
    alerts.push(addAlert("warning", "Mean gradient appears unusual. Verify measurement and units."));
  }

  if (bsa < 1.2 || bsa > 2.5) {
    alerts.push(addAlert("warning", "BSA outside usual range. Verify entered value."));
  }

  const lvotArea = Math.PI * Math.pow(lvot / 2, 2);
  const sv = lvotArea * vtiLVOT;                // mL approximately from cm² × cm
  const ava = sv / vtiAo;                       // cm²
  const avai = ava / bsa;                       // cm²/m²
  const di = vtiLVOT / vtiAo;
  const svi = sv / bsa;

  let severityText = "";
  let severityClass = "neutral";
  let conclusion = "";
  let flowState = svi < 35 ? "Low-flow" : "Normal-flow";
  let discordant = ava <= 1 && gradient < 40 && vmax < 4;

  const severeByValveCriteria =
    ava <= 1 || avai <= 0.6 || di < 0.25;

  const severeByHemodynamics =
    vmax >= 4 || gradient >= 40;

  if (severeByValveCriteria && severeByHemodynamics) {
    severityText = "Severe aortic stenosis - high gradient profile.";
    severityClass = "danger";
    conclusion =
      `Findings are compatible with severe aortic stenosis with concordant high-gradient hemodynamics: AVA ${formatNumber(ava)} cm², AVAi ${formatNumber(avai)} cm²/m², DI ${formatNumber(di)}, Vmax ${formatNumber(vmax, 1)} m/s, mean gradient ${formatNumber(gradient, 0)} mmHg.`;
    alerts.push(addAlert("danger", "Severe AS profile. Integrate symptoms, valve morphology, and treatment indication."));
  } else if (ava <= 1 && svi < 35 && ef < 50 && gradient < 40) {
    severityText = "Classical low-flow low-gradient severe AS possible.";
    severityClass = "warning";
    conclusion =
      `Profile suggests possible classical low-flow low-gradient severe aortic stenosis: AVA ${formatNumber(ava)} cm² with low SVI ${formatNumber(svi, 1)} mL/m², reduced LVEF ${formatNumber(ef, 0)}%, and mean gradient ${formatNumber(gradient, 0)} mmHg. Reassessment of measurements and integrated evaluation are recommended.`;
    alerts.push(addAlert("warning", "Low-flow low-gradient pattern with reduced EF. Consider integrated reassessment and advanced confirmation according to clinical context."));
  } else if (ava <= 1 && svi < 35 && ef >= 50 && gradient < 40) {
    severityText = "Paradoxical low-flow low-gradient severe AS possible.";
    severityClass = "warning";
    conclusion =
      `Profile suggests possible paradoxical low-flow low-gradient severe aortic stenosis: AVA ${formatNumber(ava)} cm² with preserved LVEF ${formatNumber(ef, 0)}% but low SVI ${formatNumber(svi, 1)} mL/m² and low gradient. Integrated interpretation is required.`;
    alerts.push(addAlert("warning", "Discordant severe AS pattern with preserved EF. Check LVOT measurement, Doppler alignment, and overall flow state."));
  } else if (discordant) {
    severityText = "Discordant AS grading.";
    severityClass = "warning";
    conclusion =
      `Discordant aortic stenosis grading: AVA ${formatNumber(ava)} cm² suggests severe stenosis, whereas Vmax ${formatNumber(vmax, 1)} m/s and mean gradient ${formatNumber(gradient, 0)} mmHg are not in the severe range. Re-evaluate LVOT diameter, LVOT VTI, CW alignment, and flow state before final grading.`;
    alerts.push(addAlert("warning", "Discordance between valve area and gradient/velocity."));
  } else {
    severityText = "Likely non-severe or not hemodynamically severe profile.";
    severityClass = "success";
    conclusion =
      `Current data do not support a concordant severe high-gradient aortic stenosis profile. AVA ${formatNumber(ava)} cm², AVAi ${formatNumber(avai)} cm²/m², DI ${formatNumber(di)}, Vmax ${formatNumber(vmax, 1)} m/s, mean gradient ${formatNumber(gradient, 0)} mmHg, SVI ${formatNumber(svi, 1)} mL/m². Interpret together with valve morphology and clinical presentation.`;
    alerts.push(addAlert("success", "No concordant severe high-gradient AS pattern detected from entered data."));
  }

  if (di < 0.25) {
    alerts.push(addAlert("warning", "Dimensionless index < 0.25 supports severe stenosis if measurements are reliable."));
  }

  if (svi < 35) {
    alerts.push(addAlert("warning", `Low-flow state detected (SVI ${formatNumber(svi, 1)} mL/m²).`));
  }

  if (ef < 50) {
    alerts.push(addAlert("warning", `Reduced LVEF (${formatNumber(ef, 0)}%) may affect gradient interpretation.`));
  }

  if (eovere !== null && eovere > 14) {
    alerts.push(addAlert("warning", `Elevated filling pressure likely (E/e′ ${formatNumber(eovere, 1)}).`));
  }

  if (lavi !== null && lavi > 34) {
    alerts.push(addAlert("warning", `Left atrial volume index enlarged (LAVI ${formatNumber(lavi, 0)} mL/m²).`));
  }

  document.getElementById("resultCards").innerHTML =
    metricCard("LVOT Area", formatNumber(lvotArea), "cm²") +
    metricCard("Stroke Volume", formatNumber(sv), "mL") +
    metricCard("SVI", formatNumber(svi, 1), "mL/m²") +
    metricCard("AVA", formatNumber(ava), "cm²") +
    metricCard("AVAi", formatNumber(avai), "cm²/m²") +
    metricCard("Dimensionless Index", formatNumber(di), "") +
    metricCard("Flow State", flowState, "") +
    metricCard("LVEF", formatNumber(ef, 0), "%");

  const severityBox = document.getElementById("severityBox");
  severityBox.className = `status-box ${severityClass}`;
  severityBox.innerHTML = severityText;

  document.getElementById("alerts").innerHTML = alerts.join("");
  document.getElementById("conclusion").innerHTML = conclusion;
}
