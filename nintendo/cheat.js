(function () {
  function waitForNes(callback) {
    const interval = setInterval(() => {
      if (typeof nes !== 'undefined' && nes.rom && nes.rom.rom) {
        clearInterval(interval);
        callback();
      }
    }, 500);
  }

  waitForNes(() => {
    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "20px";
    panel.style.right = "20px";
    panel.style.background = "rgba(0, 0, 0, 0.85)";
    panel.style.color = "#fff";
    panel.style.padding = "12px";
    panel.style.borderRadius = "8px";
    panel.style.border = "2px solid lime";
    panel.style.zIndex = "99999";
    panel.style.fontFamily = "monospace";
    panel.style.boxShadow = "0 0 10px lime";
    panel.style.width = "160px";
    panel.style.userSelect = "none";

    panel.innerHTML = `
      <label style="font-weight:bold; font-size:14px;">Game Genie kodu:</label><br>
      <input type="text" id="ggcode" style="width: 100%; margin-top:6px; margin-bottom:10px; padding:4px; font-size:14px;"><br>
      <button id="applyCheat" style="width: 100%; padding:6px; font-weight:bold; cursor:pointer;">Tətbiq et</button>
    `;

    document.body.appendChild(panel);

    document.getElementById("applyCheat").onclick = () => {
      const code = document.getElementById("ggcode").value.toUpperCase().trim();

      if (code === "SXIOPO") {
        nes.rom.rom[0x075A] = 0xEA;
        alert("SXIOPO: Sonsuz can aktiv oldu!");
      } else if (code === "AATOZA") {
        nes.rom.rom[0x0770] = 0x08;
        alert("AATOZA: 9 canla başlama aktiv oldu!");
      } else {
        alert("Bu kod tanınmadı.");
      }
    };
  });
})();