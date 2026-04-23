function calculate() {

  let d = parseFloat(document.getElementById("lvot").value);
  let vti_lvot = parseFloat(document.getElementById("vti_lvot").value);
  let vti_ao = parseFloat(document.getElementById("vti_ao").value);
  let vmax = parseFloat(document.getElementById("vmax").value);
  let gradient = parseFloat(document.getElementById("gradient").value);
  let bsa = parseFloat(document.getElementById("bsa").value);

  let area = 3.14 * (d/2) * (d/2);
  let sv = area * vti_lvot;
  let ava = sv / vti_ao;
  let avai = ava / bsa;
  let di = vti_lvot / vti_ao;

  let severity = "";

  if (vmax >= 4 || gradient >= 40 || ava <= 1) {
    severity = "Severe Aortic Stenosis 🔴";
  } else {
    severity = "Non Severe 🟢";
  }

  document.getElementById("result").innerHTML = `
    AVA: ${ava.toFixed(2)} cm² <br>
    AVAi: ${avai.toFixed(2)} <br>
    DI: ${di.toFixed(2)} <br><br>
    <b>${severity}</b>
  `;
}
