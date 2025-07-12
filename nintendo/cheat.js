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
    panel.style.background = "#222";
    panel.style.color = "#fff";
    panel.style.padding = "10px";
    panel.style.border = "2px solid lime";
    panel.style.zIndex = "9999";
    panel.style.fontFamily = "monospace";

    panel.innerHTML = `
      <label>Game Genie kodu:</label><br>
      <input type="text" id="ggcode" style="width:120px;"><br>
      <button id="applyCheat">Tətbiq et</button>
    `;

    document.body.appendChild(panel);

    document.getElementById("applyCheat").onclick = () => {
      const code = document.getElementById("ggcode").value.toUpperCase();

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