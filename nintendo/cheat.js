(function () {
  function waitForNes(callback) {
    const interval = setInterval(() => {
      if (typeof nes !== 'undefined' && nes.rom && nes.rom.rom) {
        clearInterval(interval);
        callback();
      }
    }, 300);
  }

  waitForNes(() => {
    const btn = document.createElement("div");
    btn.id = "cheat-toggle-btn";
    btn.title = "Game Genie Cheat";

    btn.innerHTML = `
      <span>GG</span>
      <input type="text" id="ggcode" placeholder="Kod yazın" autocomplete="off" />
      <button class="ok-btn">OK</button>
    `;

    document.body.appendChild(btn);

    const input = btn.querySelector("#ggcode");
    const okBtn = btn.querySelector("button.ok-btn");

    btn.addEventListener("click", (e) => {
      if (e.target === input || e.target === okBtn) return;
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) input.focus();
    });

    okBtn.addEventListener("click", () => {
      const code = input.value.toUpperCase().trim();
      if (!code) return alert("Kod daxil edin!");

      if (code === "SXIOPO") {
        nes.rom.rom[0x075A] = 0xEA;
        alert("SXIOPO: Sonsuz can aktiv oldu!");
      } else if (code === "AATOZA") {
        nes.rom.rom[0x0770] = 0x08;
        alert("AATOZA: 9 canla başlama aktiv oldu!");
      } else {
        alert("Bu kod tanınmadı.");
      }

      input.value = "";
      btn.classList.remove("active");
    });
  });
})();